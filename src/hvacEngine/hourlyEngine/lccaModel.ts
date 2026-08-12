import type { OptimizedHourlyRecord } from './systemOptimizer';

export interface LccaSystemResult {
  name: string;
  capex: number;
  opex: number;
  elec_cost: number;
  gas_cost: number;
  lcc: number;
  scop: number;
  payback: string;
  roi: string;
  hourly_elec_kw: number[];
  hourly_gas_m3: number[];
}

export interface LccaEvaluationResult {
  A: LccaSystemResult;
  B: LccaSystemResult;
  C: LccaSystemResult;
  baseline_info: {
    name: string;
    capex: number;
    opex: number;
  };
}

export function calculateHourlyElectricityPrice(
  hoursOfDay: number[],
  peakRate = 1.2,
  flatRate = 0.7,
  valleyRate = 0.3
): number[] {
  const prices = new Array(hoursOfDay.length);
  for (let t = 0; t < hoursOfDay.length; t++) {
    const h = hoursOfDay[t];
    if ((h >= 8 && h < 11) || (h >= 18 && h < 22)) {
      prices[t] = peakRate;
    } else if (h >= 23 || h < 7) {
      prices[t] = valleyRate;
    } else {
      prices[t] = flatRate;
    }
  }
  return prices;
}

export function evaluateLcca(
  optRecords: OptimizedHourlyRecord[],
  buildingArea: number,
  peakElec = 1.2, flatElec = 0.7, valleyElec = 0.3, gasPrice = 3.5,
  costWaterChillerKw = 1000.0, costBoilerKw = 300.0,
  costAchpKw = 1200.0, costVrvM2 = 350.0,
  boilerEff = 0.90,
  copAchpCool = 3.2, copAchpHeat = 3.0,
  copVrvCool = 4.0, copVrvHeat = 3.6,
  fPumpMin = 30.0
): LccaEvaluationResult {
  const hoursOfDay = optRecords.map(r => r.hourOfDay);
  const elecPrices = calculateHourlyElectricityPrice(hoursOfDay, peakElec, flatElec, valleyElec);

  const Q_cool = optRecords.map(r => r.Q_cool);
  const Q_heat = optRecords.map(r => r.Q_heat);
  const T_db = optRecords.map(r => r.T_db);

  const Q_peak_cool = optRecords[0]?.Q_peak_cool || 1000;
  const Q_peak_heat = optRecords[0]?.Q_peak_heat || 600;

  // SYSTEM A: Water-cooled + Boiler (Optimized)
  const P_A_cool = optRecords.map(r => r.opt_P_Total);
  const gas_A = new Array(8760).fill(0);
  const P_A_heat = new Array(8760).fill(0);
  const P_hwp_rated_A = 0.008 * Q_peak_heat;

  for (let t = 0; t < 8760; t++) {
    if (Q_heat[t] > 0) {
      gas_A[t] = Q_heat[t] / (boilerEff * 9.87);
      const flow_ratio = Q_heat[t] / Q_peak_heat;
      const f_hwp = Math.max(fPumpMin, 50.0 * flow_ratio);
      P_A_heat[t] = P_hwp_rated_A * (0.85 * Math.pow(f_hwp / 50.0, 3) + 0.15 * Math.pow(f_hwp / 50.0, 2));
    }
  }

  let elec_cost_A = 0;
  let gas_cost_A = 0;
  for (let t = 0; t < 8760; t++) {
    elec_cost_A += (P_A_cool[t] + P_A_heat[t]) * elecPrices[t];
    gas_cost_A += gas_A[t] * gasPrice;
  }

  // SYSTEM B: Air-cooled Heat Pump
  const P_B_cool = new Array(8760).fill(0);
  const P_B_heat = new Array(8760).fill(0);
  const P_chwp_rated_B = 0.015 * Q_peak_cool;
  const P_hwp_rated_B = 0.008 * Q_peak_heat;

  for (let t = 0; t < 8760; t++) {
    if (Q_cool[t] > 0) {
      const plr = Math.max(0.1, Math.min(1.0, Q_cool[t] / Q_peak_cool));
      const f_plr = 0.6 + 0.8 * plr - 0.4 * (plr * plr);
      const f_temp = 1.0 - 0.015 * (T_db[t] - 35.0);
      const cop_act = Math.max(1.5, copAchpCool * f_temp * f_plr);
      const p_comp = Q_cool[t] / cop_act;
      const f_chwp = Math.max(fPumpMin, 50.0 * plr);
      const p_pump = P_chwp_rated_B * (0.85 * Math.pow(f_chwp / 50.0, 3) + 0.15 * Math.pow(f_chwp / 50.0, 2));
      P_B_cool[t] = p_comp + p_pump;
    }

    if (Q_heat[t] > 0) {
      const cap_degrad = Math.max(0.4, 1.0 + 0.03 * (T_db[t] - 7.0));
      const cap_act = Q_peak_heat * cap_degrad;
      const f_frost = (T_db[t] >= 0.0 && T_db[t] <= 5.0) ? 0.90 : 1.0;
      const cop_degrad = Math.max(0.5, 1.0 + 0.025 * (T_db[t] - 7.0));
      const cop_act = Math.max(1.0, copAchpHeat * cop_degrad * f_frost);

      const q_comp = Math.min(Q_heat[t], cap_act);
      const q_aux = Math.max(0.0, Q_heat[t] - cap_act);
      const p_comp = (q_comp / cop_act) + q_aux;

      const flow_ratio = Q_heat[t] / Q_peak_heat;
      const f_hwp = Math.max(fPumpMin, 50.0 * flow_ratio);
      const p_pump = P_hwp_rated_B * (0.85 * Math.pow(f_hwp / 50.0, 3) + 0.15 * Math.pow(f_hwp / 50.0, 2));
      P_B_heat[t] = p_comp + p_pump;
    }
  }

  let elec_cost_B = 0;
  for (let t = 0; t < 8760; t++) {
    elec_cost_B += (P_B_cool[t] + P_B_heat[t]) * elecPrices[t];
  }

  // SYSTEM C: VRV System
  const P_C_cool = new Array(8760).fill(0);
  const P_C_heat = new Array(8760).fill(0);

  for (let t = 0; t < 8760; t++) {
    if (Q_cool[t] > 0) {
      const plr = Math.max(0.1, Math.min(1.0, Q_cool[t] / Q_peak_cool));
      const f_plr = 0.4 + 1.8 * plr - 1.2 * (plr * plr);
      const f_temp = 1.0 - 0.012 * (T_db[t] - 35.0);
      const cop_act = Math.max(1.8, copVrvCool * f_temp * f_plr);
      P_C_cool[t] = Q_cool[t] / cop_act;
    }

    if (Q_heat[t] > 0) {
      const cap_degrad = Math.max(0.5, 1.0 + 0.025 * (T_db[t] - 7.0));
      const cap_act = Q_peak_heat * cap_degrad;
      const f_frost = (T_db[t] >= 0.0 && T_db[t] <= 5.0) ? 0.92 : 1.0;
      const cop_degrad = Math.max(0.5, 1.0 + 0.02 * (T_db[t] - 7.0));
      const cop_act = Math.max(1.1, copVrvHeat * cop_degrad * f_frost);

      const q_comp = Math.min(Q_heat[t], cap_act);
      const q_aux = Math.max(0.0, Q_heat[t] - cap_act);
      P_C_heat[t] = (q_comp / cop_act) + q_aux;
    }
  }

  let elec_cost_C = 0;
  for (let t = 0; t < 8760; t++) {
    elec_cost_C += (P_C_cool[t] + P_C_heat[t]) * elecPrices[t];
  }

  // CAPEX & OPEX
  const capex_A = (Q_peak_cool * costWaterChillerKw) + (Q_peak_heat * costBoilerKw);
  const capex_B = Q_peak_cool * costAchpKw;
  const capex_C = buildingArea * costVrvM2;

  const opex_A = elec_cost_A + gas_cost_A;
  const opex_B = elec_cost_B;
  const opex_C = elec_cost_C;

  const r = 0.06;
  const years = 20;
  const pvf = (1.0 - Math.pow(1.0 + r, -years)) / r; // 11.4699

  const lcc_A = capex_A + opex_A * pvf;
  const lcc_B = capex_B + opex_B * pvf;
  const lcc_C = capex_C + opex_C * pvf;

  const total_load_kwh = Q_cool.reduce((a, b) => a + b, 0) + Q_heat.reduce((a, b) => a + b, 0);
  const energy_A_kwh = P_A_cool.reduce((a, b) => a + b, 0) + P_A_heat.reduce((a, b) => a + b, 0) + gas_A.reduce((a, b) => a + b, 0) * 9.87;
  const energy_B_kwh = P_B_cool.reduce((a, b) => a + b, 0) + P_B_heat.reduce((a, b) => a + b, 0);
  const energy_C_kwh = P_C_cool.reduce((a, b) => a + b, 0) + P_C_heat.reduce((a, b) => a + b, 0);

  const scop_A = energy_A_kwh > 0 ? total_load_kwh / energy_A_kwh : 0;
  const scop_B = energy_B_kwh > 0 ? total_load_kwh / energy_B_kwh : 0;
  const scop_C = energy_C_kwh > 0 ? total_load_kwh / energy_C_kwh : 0;

  const capex_list = [
    { name: '方案A: 水冷+锅炉', capex: capex_A, opex: opex_A },
    { name: '方案B: 风冷热泵', capex: capex_B, opex: opex_B },
    { name: '方案C: VRV多联机', capex: capex_C, opex: opex_C }
  ].sort((a, b) => a.capex - b.capex);

  const base_name = capex_list[0].name;
  const base_capex = capex_list[0].capex;
  const base_opex = capex_list[0].opex;

  const paybacks: Record<string, string> = {};
  const rois: Record<string, string> = {};

  const allSystems = [
    { key: '方案A: 水冷+锅炉', capex: capex_A, opex: opex_A },
    { key: '方案B: 风冷热泵', capex: capex_B, opex: opex_B },
    { key: '方案C: VRV多联机', capex: capex_C, opex: opex_C }
  ];

  for (const sys of allSystems) {
    if (sys.key === base_name) {
      paybacks[sys.key] = '基准方案';
      rois[sys.key] = '基准方案';
    } else {
      const delta_capex = sys.capex - base_capex;
      const delta_opex = base_opex - sys.opex;
      if (delta_opex <= 0) {
        paybacks[sys.key] = '无法收回投资';
        rois[sys.key] = '负收益';
      } else {
        const y = delta_capex / delta_opex;
        paybacks[sys.key] = `${y.toFixed(1)} 年`;
        rois[sys.key] = `${((delta_opex / delta_capex) * 100.0).toFixed(1)}%`;
      }
    }
  }

  const P_A_hourly = P_A_cool.map((c, i) => c + P_A_heat[i]);
  const P_B_hourly = P_B_cool.map((c, i) => c + P_B_heat[i]);
  const P_C_hourly = P_C_cool.map((c, i) => c + P_C_heat[i]);

  return {
    A: {
      name: '水冷冷机 + 燃气锅炉 (System A)',
      capex: capex_A, opex: opex_A, elec_cost: elec_cost_A, gas_cost: gas_cost_A,
      lcc: lcc_A, scop: scop_A, payback: paybacks['方案A: 水冷+锅炉'], roi: rois['方案A: 水冷+锅炉'],
      hourly_elec_kw: P_A_hourly, hourly_gas_m3: gas_A
    },
    B: {
      name: '风冷热泵水系统 (System B)',
      capex: capex_B, opex: opex_B, elec_cost: elec_cost_B, gas_cost: 0,
      lcc: lcc_B, scop: scop_B, payback: paybacks['方案B: 风冷热泵'], roi: rois['方案B: 风冷热泵'],
      hourly_elec_kw: P_B_hourly, hourly_gas_m3: new Array(8760).fill(0)
    },
    C: {
      name: 'VRV变频多联机系统 (System C)',
      capex: capex_C, opex: opex_C, elec_cost: elec_cost_C, gas_cost: 0,
      lcc: lcc_C, scop: scop_C, payback: paybacks['方案C: VRV多联机'], roi: rois['方案C: VRV多联机'],
      hourly_elec_kw: P_C_hourly, hourly_gas_m3: new Array(8760).fill(0)
    },
    baseline_info: {
      name: base_name,
      capex: base_capex,
      opex: base_opex
    }
  };
}
