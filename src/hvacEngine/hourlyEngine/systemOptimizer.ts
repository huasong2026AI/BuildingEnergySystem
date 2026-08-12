import type { HourlyLoadRecord } from './loadSimulator';
import type { RecommendedPlantConfig, ChillerItemConfig } from './sizingEngine';

export interface ActiveChillerState {
  type: string;
  capacity: number;
  load: number;
  cop_rated: number;
  plr: number;
}

export interface OptimizedHourlyRecord extends HourlyLoadRecord {
  base_P_Chiller: number;
  base_P_CHWP: number;
  base_P_CWP: number;
  base_P_Tower: number;
  base_P_Total: number;
  base_T_cws: number;
  base_f_fan: number;

  opt_P_Chiller: number;
  opt_P_CHWP: number;
  opt_P_CWP: number;
  opt_P_Tower: number;
  opt_P_Total: number;
  opt_T_cws: number;
  opt_f_cwp: number;
  opt_f_fan: number;

  opt_Savings_kW: number;
}

export function getPlrModifier(chillerType: string, plr: number): number {
  if (chillerType.includes('磁悬浮')) {
    return 0.5 + 2.6 * plr - 2.1 * (plr * plr);
  } else if (chillerType.includes('离心')) {
    return 0.4 + 2.4 * plr - 1.8 * (plr * plr);
  } else {
    return 0.35 + 2.2 * plr - 1.55 * (plr * plr);
  }
}

export function stageChillers(Q: number, chillersList: ChillerItemConfig[]): ActiveChillerState[] {
  if (Q <= 0.0) return [];

  const hasSmall = chillersList.some(c => c.type.includes('磁悬浮')) && chillersList.length > 1;
  let active: { type: string; capacity: number; load: number; cop_rated: number }[] = [];

  if (hasSmall) {
    const smallChiller = chillersList.find(c => c.type.includes('磁悬浮'))!;
    const largeChiller = chillersList.find(c => !c.type.includes('磁悬浮'))!;

    const S = smallChiller.capacity;
    const L = largeChiller.capacity;

    if (Q <= S) {
      active = [{ type: smallChiller.type, capacity: S, load: Q, cop_rated: smallChiller.cop_rated }];
    } else if (Q <= L) {
      active = [{ type: largeChiller.type, capacity: L, load: Q, cop_rated: largeChiller.cop_rated }];
    } else if (Q <= L + S) {
      const ratio_s = S / (L + S);
      const ratio_l = L / (L + S);
      active = [
        { type: smallChiller.type, capacity: S, load: Q * ratio_s, cop_rated: smallChiller.cop_rated },
        { type: largeChiller.type, capacity: L, load: Q * ratio_l, cop_rated: largeChiller.cop_rated }
      ];
    } else if (Q <= 2 * L) {
      active = [
        { type: largeChiller.type, capacity: L, load: Q / 2.0, cop_rated: largeChiller.cop_rated },
        { type: largeChiller.type, capacity: L, load: Q / 2.0, cop_rated: largeChiller.cop_rated }
      ];
    } else if (Q <= 2 * L + S) {
      const ratio_s = S / (2 * L + S);
      const ratio_l = L / (2 * L + S);
      active = [
        { type: smallChiller.type, capacity: S, load: Q * ratio_s, cop_rated: smallChiller.cop_rated },
        { type: largeChiller.type, capacity: L, load: Q * ratio_l, cop_rated: largeChiller.cop_rated },
        { type: largeChiller.type, capacity: L, load: Q * ratio_l, cop_rated: largeChiller.cop_rated }
      ];
    } else if (Q <= 3 * L) {
      active = Array.from({ length: 3 }, () => ({
        type: largeChiller.type, capacity: L, load: Q / 3.0, cop_rated: largeChiller.cop_rated
      }));
    } else {
      const cap_total = 3 * L + S;
      const ratio_s = S / cap_total;
      const ratio_l = L / cap_total;
      const Q_cap = Math.min(Q, cap_total);
      active = [{ type: smallChiller.type, capacity: S, load: Q_cap * ratio_s, cop_rated: smallChiller.cop_rated }];
      for (let i = 0; i < 3; i++) {
        active.push({ type: largeChiller.type, capacity: L, load: Q_cap * ratio_l, cop_rated: largeChiller.cop_rated });
      }
    }
  } else {
    const item = chillersList[0];
    const C = item.capacity;
    const n_max = item.count;
    let count = Math.ceil(Q / C);
    count = Math.max(1, Math.min(count, n_max));
    const Q_cap = Math.min(Q, count * C);

    active = Array.from({ length: count }, () => ({
      type: item.type,
      capacity: C,
      load: Q_cap / count,
      cop_rated: item.cop_rated
    }));
  }

  return active.map(ch => ({
    ...ch,
    plr: Math.max(0.1, Math.min(1.0, ch.load / ch.capacity))
  }));
}

/**
 * Performs 8760h hourly optimization for the water-cooled chiller plant.
 */
export function optimizeChillerPlant(
  loadRecords: HourlyLoadRecord[],
  chillerConfig: RecommendedPlantConfig,
  f_pump_min = 30.0,
  approach_rated = 4.0
): OptimizedHourlyRecord[] {
  const chillers = chillerConfig.chillers;
  const Q_plant_rated = chillers.reduce((sum, c) => sum + c.capacity * c.count, 0);

  const P_chwp_rated = 0.015 * Q_plant_rated;
  const P_cwp_rated = 0.018 * Q_plant_rated;
  const P_tower_rated = 0.008 * Q_plant_rated;
  const Q_rej_rated = Q_plant_rated * (1.0 + 1.0 / 6.0);

  const f_fan_min = 20.0;

  const output: OptimizedHourlyRecord[] = new Array(loadRecords.length);

  for (let t = 0; t < loadRecords.length; t++) {
    const rec = loadRecords[t];
    const q = rec.Q_cool;
    const twb = rec.T_wb;
    const active = stageChillers(q, chillers);

    if (q <= 0.0 || active.length === 0) {
      output[t] = {
        ...rec,
        base_P_Chiller: 0, base_P_CHWP: 0, base_P_CWP: 0, base_P_Tower: 0, base_P_Total: 0, base_T_cws: 30, base_f_fan: 0,
        opt_P_Chiller: 0, opt_P_CHWP: 0, opt_P_CWP: 0, opt_P_Tower: 0, opt_P_Total: 0, opt_T_cws: 30, opt_f_cwp: 0, opt_f_fan: 0,
        opt_Savings_kW: 0
      };
      continue;
    }

    const cop_avg = active.reduce((acc, ch) => acc + ch.cop_rated, 0) / active.length;
    const q_rej = q * (1.0 + 1.0 / cop_avg);
    const c_ratio = q_rej / Q_rej_rated;

    // --- BASELINE SIMULATION ---
    const app_req_base = 30.0 - twb;
    let f_fan_base = 50.0;
    if (app_req_base > 0.0) {
      f_fan_base = 50.0 * Math.pow((approach_rated * c_ratio) / app_req_base, 1.0 / 0.6);
    }
    f_fan_base = Math.max(f_fan_min, Math.min(50.0, f_fan_base));
    const t_cws_base = twb + approach_rated * c_ratio * Math.pow(50.0 / f_fan_base, 0.6);

    const base_P_chwp = P_chwp_rated;
    const base_P_cwp = P_cwp_rated;
    const base_P_tower = P_tower_rated * Math.pow(f_fan_base / 50.0, 2.8);

    const dt_cond_base = 5.0 * c_ratio;
    const t_cond_avg_base = t_cws_base + 0.5 * dt_cond_base;
    const f_cap_base = 1.0 + 0.025 * (32.5 - t_cond_avg_base);

    let base_P_chiller = 0;
    for (const ch of active) {
      const f_plr = getPlrModifier(ch.type, ch.plr);
      const cop_actual = ch.cop_rated * f_cap_base * f_plr;
      base_P_chiller += ch.load / cop_actual;
    }
    const base_P_Total = base_P_chiller + base_P_chwp + base_P_cwp + base_P_tower;

    // --- OPTIMIZED CONTROL (Grid Search) ---
    const f_chwp_opt = Math.max(f_pump_min, 50.0 * (q / Q_plant_rated));
    const p_chwp_opt = P_chwp_rated * (0.85 * Math.pow(f_chwp_opt / 50.0, 3) + 0.15 * Math.pow(f_chwp_opt / 50.0, 2));

    const t_cws_floor = Math.max(18.0, twb + approach_rated * c_ratio);
    const t_cws_ceil = Math.min(35.0, twb + approach_rated * c_ratio * Math.pow(50.0 / f_fan_min, 0.6));

    let best_p_total = Infinity;
    let best_t_cws = t_cws_base;
    let best_f_cwp = 50.0;
    let best_f_fan = f_fan_base;
    let best_p_chiller = base_P_chiller;
    let best_p_cwp = base_P_cwp;
    let best_p_tower = base_P_tower;

    const tc_steps = 10;
    const fc_steps = 5;

    for (let i = 0; i <= tc_steps; i++) {
      const tc = t_cws_floor + (i / tc_steps) * (t_cws_ceil - t_cws_floor);
      const app_req = tc - twb;
      let ff = 50.0;
      if (app_req > 0.0) {
        ff = 50.0 * Math.pow((approach_rated * c_ratio) / app_req, 1.0 / 0.6);
      }
      if (ff > 50.05) continue;
      ff = Math.max(f_fan_min, ff);
      const ptow = P_tower_rated * Math.pow(ff / 50.0, 2.8);

      for (let j = 0; j <= fc_steps; j++) {
        const fc = f_pump_min + (j / fc_steps) * (50.0 - f_pump_min);
        const pcwp = P_cwp_rated * (0.85 * Math.pow(fc / 50.0, 3) + 0.15 * Math.pow(fc / 50.0, 2));

        const dt_cond = 5.0 * c_ratio * (50.0 / fc);
        const t_cond_avg = tc + 0.5 * dt_cond;
        const f_cap = 1.0 + 0.025 * (32.5 - t_cond_avg);

        let ch_p_sum = 0;
        for (const ch of active) {
          const f_plr = getPlrModifier(ch.type, ch.plr);
          const cop_actual = ch.cop_rated * f_cap * f_plr;
          ch_p_sum += ch.load / cop_actual;
        }

        const p_tot = ch_p_sum + p_chwp_opt + pcwp + ptow;
        if (p_tot < best_p_total) {
          best_p_total = p_tot;
          best_t_cws = tc;
          best_f_cwp = fc;
          best_f_fan = ff;
          best_p_chiller = ch_p_sum;
          best_p_cwp = pcwp;
          best_p_tower = ptow;
        }
      }
    }

    const opt_P_Total = best_p_chiller + p_chwp_opt + best_p_cwp + best_p_tower;

    output[t] = {
      ...rec,
      base_P_Chiller: base_P_chiller,
      base_P_CHWP: base_P_chwp,
      base_P_CWP: base_P_cwp,
      base_P_Tower: base_P_tower,
      base_P_Total,
      base_T_cws: t_cws_base,
      base_f_fan: f_fan_base,

      opt_P_Chiller: best_p_chiller,
      opt_P_CHWP: p_chwp_opt,
      opt_P_CWP: best_p_cwp,
      opt_P_Tower: best_p_tower,
      opt_P_Total,
      opt_T_cws: best_t_cws,
      opt_f_cwp: best_f_cwp,
      opt_f_fan: best_f_fan,

      opt_Savings_kW: base_P_Total - opt_P_Total
    };
  }

  return output;
}
