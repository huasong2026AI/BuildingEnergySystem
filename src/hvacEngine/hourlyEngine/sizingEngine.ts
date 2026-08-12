export interface ChillerItemConfig {
  type: string;
  capacity: number; // kW per unit
  count: number;
  cop_rated: number;
}

export interface RecommendedPlantConfig {
  config_name: string;
  chillers: ChillerItemConfig[];
  justification: string;
}

const DEFAULT_COPS: Record<string, number> = {
  变频螺杆机: 5.8,
  高效变频螺杆机: 6.0,
  变频磁悬浮机组: 6.8,
  变频离心机组: 6.4
};

/**
 * Returns automatic recommended chiller plant configuration based on peak cooling load.
 */
export function getRecommendedChillers(Q_peak_cool: number): RecommendedPlantConfig {
  if (Q_peak_cool <= 2500.0) {
    const cap = Q_peak_cool / 2.0;
    const chillers = [{ type: '变频螺杆机', capacity: cap, count: 2, cop_rated: 5.8 }];
    const name = '2台等分变频螺杆机';
    const justification = `小型冷站（当前设计负荷 ${Q_peak_cool.toFixed(1)} kW <= 2500 kW）推荐配置 ${name} (单台 ${cap.toFixed(1)} kW)。兼顾部分负荷效率与投资经济性，且双机互为备用，系统冗余度高。`;
    return { config_name: name, chillers, justification };
  } else if (Q_peak_cool <= 5500.0) {
    const cap = Q_peak_cool / 3.0;
    const chillers = [{ type: '高效变频螺杆机', capacity: cap, count: 3, cop_rated: 6.0 }];
    const name = '3台等分变频螺杆机';
    const justification = `中型冷站（当前设计负荷 ${Q_peak_cool.toFixed(1)} kW 在 2500~5500 kW 之间）推荐配置 ${name} (单台 ${cap.toFixed(1)} kW)。可灵活组合开机数量，能有效应对过渡季和昼夜负荷波动。`;
    return { config_name: name, chillers, justification };
  } else {
    const q_small = Q_peak_cool / 7.0;
    const q_large = 2.0 * q_small;
    const chillers = [
      { type: '变频磁悬浮机组', capacity: q_small, count: 1, cop_rated: 6.8 },
      { type: '变频离心机组', capacity: q_large, count: 3, cop_rated: 6.4 }
    ];
    const name = '3大1小 异构梯级配置';
    const justification = `大型冷站（当前设计负荷 ${Q_peak_cool.toFixed(1)} kW > 5500 kW）推荐 ${name} (1:2 黄金容量比例)。\n• 小机为1台变频磁悬浮 (${q_small.toFixed(1)} kW)，专为夜间/过渡季极低负荷设计，避免喘振；\n• 大机为3台变频离心机 (${q_large.toFixed(1)} kW)，满足白天及峰值负荷。磁悬浮与离心机组合可实现全工况高效运行。`;
    return { config_name: name, chillers, justification };
  }
}

/**
 * Returns specific chiller configuration based on user selection or override.
 */
export function getChillersByType(configName: string, Q_peak_cool: number, copOverride?: number): RecommendedPlantConfig {
  const getCop = (type: string) => copOverride ?? (DEFAULT_COPS[type] || 6.0);

  if (configName === '2台等分变频螺杆机') {
    const cap = Q_peak_cool / 2.0;
    const t = '变频螺杆机';
    return {
      config_name: configName,
      chillers: [{ type: t, capacity: cap, count: 2, cop_rated: getCop(t) }],
      justification: `覆写配置：2台等分变频螺杆机，单台容量 ${cap.toFixed(1)} kW。`
    };
  } else if (configName === '3台等分变频螺杆机') {
    const cap = Q_peak_cool / 3.0;
    const t = '高效变频螺杆机';
    return {
      config_name: configName,
      chillers: [{ type: t, capacity: cap, count: 3, cop_rated: getCop(t) }],
      justification: `覆写配置：3台等分高效变频螺杆机，单台容量 ${cap.toFixed(1)} kW。`
    };
  } else if (configName === '3大1小 异构梯级配置') {
    const q_small = Q_peak_cool / 7.0;
    const q_large = 2.0 * q_small;
    const t_small = '变频磁悬浮机组';
    const t_large = '变频离心机组';
    return {
      config_name: configName,
      chillers: [
        { type: t_small, capacity: q_small, count: 1, cop_rated: getCop(t_small) },
        { type: t_large, capacity: q_large, count: 3, cop_rated: getCop(t_large) }
      ],
      justification: `覆写配置：3大1小异构梯级配置，大机为变频离心机 (${q_large.toFixed(1)} kW * 3)，小机为变频磁悬浮 (${q_small.toFixed(1)} kW * 1)。`
    };
  } else if (configName === '全变频磁悬浮(2台等分)') {
    const cap = Q_peak_cool / 2.0;
    const t = '变频磁悬浮机组';
    return {
      config_name: configName,
      chillers: [{ type: t, capacity: cap, count: 2, cop_rated: getCop(t) }],
      justification: `覆写配置：全变频磁悬浮机组（2台等分），单台容量 ${cap.toFixed(1)} kW。极高满载及部分负荷能效。`
    };
  } else if (configName === '全变频离心机(2台等分)') {
    const cap = Q_peak_cool / 2.0;
    const t = '变频离心机组';
    return {
      config_name: configName,
      chillers: [{ type: t, capacity: cap, count: 2, cop_rated: getCop(t) }],
      justification: `覆写配置：全变频离心机组（2台等分），单台容量 ${cap.toFixed(1)} kW。`
    };
  } else {
    return getRecommendedChillers(Q_peak_cool);
  }
}
