export type EquipmentCategory = 
  | 'chiller'        // 冷水机组
  | 'boiler'         // 燃气热水锅炉
  | 'achp'           // 风冷热泵模块
  | 'vrf'            // VRF 多联机室外机
  | 'pump'           // 循环水泵 (冷水/热水/冷却)
  | 'cooling_tower'; // 冷却塔

export interface CatalogEquipmentItem {
  id: string;
  category: EquipmentCategory;
  brand: string;            // 行业单品类专属顶级品牌
  model: string;            // 型号
  name: string;             // 产品中文全称
  ratedCapacitykW: number;  // 额定制冷/制热容量 kW (水泵/冷却塔则表示额定流量 m³/h)
  ratedPowerkW: number;     // 真实额定输入电功率 kW (物理铭牌电功率)
  copOrEff: number;         // COP / EER / 效率 (%)
  ratedFlowm3h?: number;    // 水流量 m³/h
  gasFlowm3h?: number;      // 燃气消耗量 m³/h
  priceRmbTenThousand?: number; // 参考单价 (万元)
  description?: string;     // 产品特色说明
}

export const CATEGORY_BRANDS: Record<EquipmentCategory, string> = {
  chiller: '约克 (York)',
  boiler: '方快 (Fangkuai)',
  achp: '麦克维尔 (McQuay)',
  vrf: '大金 (Daikin)',
  pump: '威乐 (Wilo)',
  cooling_tower: '金日 (King Sun)'
};

export const EQUIPMENT_CATALOG: CatalogEquipmentItem[] = [
  // ----------------------------------------------------
  // 1. 冷水机组 (Chillers) - 品牌：约克 (York) [规格覆盖 150 kW ~ 3200 kW]
  // ----------------------------------------------------
  {
    id: 'chiller-york-150',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YVAA-0150-Screw',
    name: '约克 YVAA 变频螺杆式冷水机组 150kW',
    ratedCapacitykW: 150,
    ratedPowerkW: 25.8,
    copOrEff: 5.8,
    ratedFlowm3h: 25.8,
    priceRmbTenThousand: 15,
    description: '小型变频螺杆，双回路降膜式蒸发器，满载 COP 5.8'
  },
  {
    id: 'chiller-york-300',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YVAA-0300-Screw',
    name: '约克 YVAA 变频螺杆式冷水机组 300kW',
    ratedCapacitykW: 300,
    ratedPowerkW: 51.7,
    copOrEff: 5.8,
    ratedFlowm3h: 51.6,
    priceRmbTenThousand: 26,
    description: '无级变频调节，低负荷能效优秀，防降速喘振'
  },
  {
    id: 'chiller-york-500',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YVAA-0500-Screw',
    name: '约克 YVAA 变频螺杆式冷水机组 500kW',
    ratedCapacitykW: 500,
    ratedPowerkW: 86.2,
    copOrEff: 5.8,
    ratedFlowm3h: 86.0,
    priceRmbTenThousand: 38,
    description: '中小型商场/办公楼通用变频螺杆主机'
  },
  {
    id: 'chiller-york-800',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-0800-Mag',
    name: '约克 YK 变频磁悬浮离心式冷水机组 800kW',
    ratedCapacitykW: 800,
    ratedPowerkW: 117.6,
    copOrEff: 6.8,
    ratedFlowm3h: 137.6,
    priceRmbTenThousand: 65,
    description: '无油磁悬浮轴承，全变频驱动，低负荷超高 COP 6.8'
  },
  {
    id: 'chiller-york-1000',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-1000-Mag',
    name: '约克 YK 变频磁悬浮离心式冷水机组 1000kW',
    ratedCapacitykW: 1000,
    ratedPowerkW: 147.0,
    copOrEff: 6.8,
    ratedFlowm3h: 172.0,
    priceRmbTenThousand: 78,
    description: '极低负荷专用的高效磁悬浮主机，免润滑油系统维护'
  },
  {
    id: 'chiller-york-1200',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-1200-Cent',
    name: '约克 YK 变频离心式冷水机组 1200kW',
    ratedCapacitykW: 1200,
    ratedPowerkW: 187.5,
    copOrEff: 6.4,
    ratedFlowm3h: 206.4,
    priceRmbTenThousand: 88,
    description: '经典高可靠变频离心式主机，配合 OptiSpeed 驱动器'
  },
  {
    id: 'chiller-york-1600',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-1600-Cent',
    name: '约克 YK 变频离心式冷水机组 1600kW',
    ratedCapacitykW: 1600,
    ratedPowerkW: 250.0,
    copOrEff: 6.4,
    ratedFlowm3h: 275.2,
    priceRmbTenThousand: 110,
    description: '大型商业/写字楼首选，高低压双重保护，超低运行噪音'
  },
  {
    id: 'chiller-york-2000',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-2000-Cent',
    name: '约克 YK 变频离心式冷水机组 2000kW',
    ratedCapacitykW: 2000,
    ratedPowerkW: 312.5,
    copOrEff: 6.4,
    ratedFlowm3h: 344.0,
    priceRmbTenThousand: 135,
    description: '大容量变频离心机组，高压变频控制，宽稳定运行范围'
  },
  {
    id: 'chiller-york-2500',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-2500-Cent',
    name: '约克 YK 变频离心式冷水机组 2500kW',
    ratedCapacitykW: 2500,
    ratedPowerkW: 390.6,
    copOrEff: 6.4,
    ratedFlowm3h: 430.0,
    priceRmbTenThousand: 160,
    description: '特大型冷站主力核心大机，高可靠性双级压缩'
  },
  {
    id: 'chiller-york-3200',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-3200-Cent',
    name: '约克 YK 变频离心式冷水机组 3200kW',
    ratedCapacitykW: 3200,
    ratedPowerkW: 500.0,
    copOrEff: 6.4,
    ratedFlowm3h: 550.4,
    priceRmbTenThousand: 195,
    description: '超大制冷量机组，配合智能云端监控与自动群控'
  },

  // ----------------------------------------------------
  // 2. 燃气热水锅炉 (Boilers) - 品牌：方快 (Fangkuai) [规格覆盖 200 kW ~ 3000 kW]
  // ----------------------------------------------------
  {
    id: 'boiler-fangkuai-200',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-0200-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 200kW',
    ratedCapacitykW: 200,
    ratedPowerkW: 1.8,
    copOrEff: 96.0,
    gasFlowm3h: 20.8,
    priceRmbTenThousand: 11,
    description: 'NOx < 30mg/m³，羽翼管高效冷凝技术，热效率 96%'
  },
  {
    id: 'boiler-fangkuai-500',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-0500-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 500kW',
    ratedCapacitykW: 500,
    ratedPowerkW: 4.0,
    copOrEff: 96.0,
    gasFlowm3h: 51.8,
    priceRmbTenThousand: 19,
    description: '全自动变频比例燃烧，超低排烟温度'
  },
  {
    id: 'boiler-fangkuai-700',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-0700-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 700kW',
    ratedCapacitykW: 700,
    ratedPowerkW: 5.5,
    copOrEff: 96.0,
    gasFlowm3h: 72.5,
    priceRmbTenThousand: 23,
    description: 'PLC 触控控制，模块化精细化供热调节'
  },
  {
    id: 'boiler-fangkuai-1400',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-1400-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 1400kW',
    ratedCapacitykW: 1400,
    ratedPowerkW: 11.0,
    copOrEff: 96.0,
    gasFlowm3h: 145.0,
    priceRmbTenThousand: 39,
    description: '大型酒店/商业供热首选，水效与气效双高'
  },
  {
    id: 'boiler-fangkuai-2100',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-2100-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 2100kW',
    ratedCapacitykW: 2100,
    ratedPowerkW: 15.0,
    copOrEff: 96.0,
    gasFlowm3h: 217.5,
    priceRmbTenThousand: 54,
    description: '大容量集中采暖热源，精准控温 ±0.5°C'
  },
  {
    id: 'boiler-fangkuai-3000',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-3000-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 3000kW',
    ratedCapacitykW: 3000,
    ratedPowerkW: 22.0,
    copOrEff: 96.0,
    gasFlowm3h: 310.8,
    priceRmbTenThousand: 72,
    description: '特大型商业综合体热源主机，超低氮环保设计'
  },

  // ----------------------------------------------------
  // 3. 风冷热泵主机模块 (ACHP) - 品牌：麦克维尔 (McQuay) [规格覆盖 65 kW ~ 300 kW]
  // ----------------------------------------------------
  {
    id: 'achp-mcquay-65',
    category: 'achp',
    brand: '麦克维尔 (McQuay)',
    model: 'MAC-065-ER',
    name: '麦克维尔 MAC 模块式风冷热泵 65kW',
    ratedCapacitykW: 65,
    ratedPowerkW: 19.1,
    copOrEff: 3.4,
    ratedFlowm3h: 11.2,
    priceRmbTenThousand: 4.8,
    description: 'V 型翅片换热器，独立双系统，超低温 -15°C 制热'
  },
  {
    id: 'achp-mcquay-130',
    category: 'achp',
    brand: '麦克维尔 (McQuay)',
    model: 'MAC-130-ER',
    name: '麦克维尔 MAC 模块式风冷热泵 130kW',
    ratedCapacitykW: 130,
    ratedPowerkW: 38.2,
    copOrEff: 3.4,
    ratedFlowm3h: 22.4,
    priceRmbTenThousand: 8.5,
    description: '经典通用模块机，多模块自由串并联组合'
  },
  {
    id: 'achp-mcquay-260',
    category: 'achp',
    brand: '麦克维尔 (McQuay)',
    model: 'MAC-260-ER',
    name: '麦克维尔 MAC 模块式风冷热泵 260kW',
    ratedCapacitykW: 260,
    ratedPowerkW: 76.4,
    copOrEff: 3.4,
    ratedFlowm3h: 44.8,
    priceRmbTenThousand: 16.0,
    description: '多模块组合（最高 16 台组合），智能化轮换防结霜'
  },

  // ----------------------------------------------------
  // 4. VRF 多联机室外主机 (VRF) - 品牌：大金 (Daikin) [规格覆盖 28 kW ~ 85 kW]
  // ----------------------------------------------------
  {
    id: 'vrf-daikin-28',
    category: 'vrf',
    brand: '大金 (Daikin)',
    model: 'VRV-X7-280',
    name: '大金 VRV X7 代变频多联机室外机 28kW (10HP)',
    ratedCapacitykW: 28,
    ratedPowerkW: 6.5,
    copOrEff: 4.3,
    priceRmbTenThousand: 2.5,
    description: '大金自研全变频涡旋压缩机，VRT 冷媒温度自适应调节'
  },
  {
    id: 'vrf-daikin-45',
    category: 'vrf',
    brand: '大金 (Daikin)',
    model: 'VRV-X7-450',
    name: '大金 VRV X7 代变频多联机室外机 45kW (16HP)',
    ratedCapacitykW: 45,
    ratedPowerkW: 10.4,
    copOrEff: 4.3,
    priceRmbTenThousand: 3.8,
    description: '标准楼层多联主机单元，全隔离风道'
  },
  {
    id: 'vrf-daikin-61',
    category: 'vrf',
    brand: '大金 (Daikin)',
    model: 'VRV-X7-615',
    name: '大金 VRV X7 代变频多联机室外机 61.5kW (22HP)',
    ratedCapacitykW: 61.5,
    ratedPowerkW: 14.3,
    copOrEff: 4.3,
    priceRmbTenThousand: 5.2,
    description: '超长管长设计，静音模式，高端办公/酒店首选'
  },
  {
    id: 'vrf-daikin-85',
    category: 'vrf',
    brand: '大金 (Daikin)',
    model: 'VRV-X7-850',
    name: '大金 VRV X7 代变频多联机室外机 85kW (30HP)',
    ratedCapacitykW: 85,
    ratedPowerkW: 19.7,
    copOrEff: 4.3,
    priceRmbTenThousand: 7.0,
    description: '大容量集中多联主机，支持云端智能集中控制'
  },

  // ----------------------------------------------------
  // 5. 循环水泵 (Pumps) - 品牌：威乐 (Wilo) [规格覆盖 30 m³/h ~ 1200 m³/h]
  // ----------------------------------------------------
  {
    id: 'pump-wilo-40',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-40-200-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 40m³/h',
    ratedCapacitykW: 40,
    ratedPowerkW: 4.6,
    copOrEff: 83.0,
    ratedFlowm3h: 40,
    priceRmbTenThousand: 1.1,
    description: '德国威乐 IE5 永磁变频高效电机，扬程 28m'
  },
  {
    id: 'pump-wilo-80',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-80-200-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 80m³/h',
    ratedCapacitykW: 80,
    ratedPowerkW: 9.2,
    copOrEff: 83.0,
    ratedFlowm3h: 80,
    priceRmbTenThousand: 1.8,
    description: '支持 30Hz ~ 50Hz 无级调频，扬程 28m'
  },
  {
    id: 'pump-wilo-150',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-150-250-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 150m³/h',
    ratedCapacitykW: 150,
    ratedPowerkW: 18.0,
    copOrEff: 83.0,
    ratedFlowm3h: 150,
    priceRmbTenThousand: 2.8,
    description: '三维流体叶轮优化，超耐磨机械密封，扬程 30m'
  },
  {
    id: 'pump-wilo-250',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-250-250-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 250m³/h',
    ratedCapacitykW: 250,
    ratedPowerkW: 30.0,
    copOrEff: 83.0,
    ratedFlowm3h: 250,
    priceRmbTenThousand: 4.2,
    description: '通用冷水/冷却/热水循环泵，高抗汽蚀，扬程 30m'
  },
  {
    id: 'pump-wilo-400',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-400-300-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 400m³/h',
    ratedCapacitykW: 400,
    ratedPowerkW: 48.1,
    copOrEff: 83.0,
    ratedFlowm3h: 400,
    priceRmbTenThousand: 6.2,
    description: '大中型水机房主水泵，高效抗震防噪基座，扬程 32m'
  },
  {
    id: 'pump-wilo-650',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-650-300-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 650m³/h',
    ratedCapacitykW: 650,
    ratedPowerkW: 78.2,
    copOrEff: 83.0,
    ratedFlowm3h: 650,
    priceRmbTenThousand: 8.5,
    description: '大型冷却泵/冷水泵，高强度立式结构，扬程 32m'
  },
  {
    id: 'pump-wilo-1000',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-1000-350-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 1000m³/h',
    ratedCapacitykW: 1000,
    ratedPowerkW: 120.3,
    copOrEff: 83.0,
    ratedFlowm3h: 1000,
    priceRmbTenThousand: 12.0,
    description: '特大型集中冷站水泵，低噪音防水锤，扬程 35m'
  },

  // ----------------------------------------------------
  // 6. 冷却塔 (Cooling Towers) - 品牌：金日 (King Sun) [规格覆盖 100 m³/h ~ 1500 m³/h]
  // ----------------------------------------------------
  {
    id: 'tower-kingsun-100',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-100-LowNoise',
    name: '金日 超低噪声圆形逆流式冷却塔 100m³/h',
    ratedCapacitykW: 100,
    ratedPowerkW: 2.8,
    copOrEff: 90.0,
    ratedFlowm3h: 100,
    priceRmbTenThousand: 2.1,
    description: '小型冷却塔，优质玻璃钢外壳，逼近度 3.0°C'
  },
  {
    id: 'tower-kingsun-200',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-200-LowNoise',
    name: '金日 超低噪声圆形逆流式冷却塔 200m³/h',
    ratedCapacitykW: 200,
    ratedPowerkW: 5.5,
    copOrEff: 90.0,
    ratedFlowm3h: 200,
    priceRmbTenThousand: 3.5,
    description: '高效阻燃填料，水滴飘逸率 < 0.001%'
  },
  {
    id: 'tower-kingsun-400',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-400-LowNoise',
    name: '金日 超低噪声圆形逆流式冷却塔 400m³/h',
    ratedCapacitykW: 400,
    ratedPowerkW: 11.0,
    copOrEff: 90.0,
    ratedFlowm3h: 400,
    priceRmbTenThousand: 6.2,
    description: '静音风机与宽流道布水器，冷却水逼近度 2.5°C'
  },
  {
    id: 'tower-kingsun-700',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-700-LowNoise',
    name: '金日 超低噪声圆形逆流式冷却塔 700m³/h',
    ratedCapacitykW: 700,
    ratedPowerkW: 18.5,
    copOrEff: 90.0,
    ratedFlowm3h: 700,
    priceRmbTenThousand: 9.8,
    description: '大型冷却水循环塔，风机带皮带减速机双防震'
  },
  {
    id: 'tower-kingsun-1200',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-1200-LowNoise',
    name: '金日 超低噪声圆形逆流式冷却塔 1200m³/h',
    ratedCapacitykW: 1200,
    ratedPowerkW: 30.0,
    copOrEff: 90.0,
    ratedFlowm3h: 1200,
    priceRmbTenThousand: 15.0,
    description: '特大型集中冷站冷却塔，高耐久玻璃钢框架与高热效填料'
  }
];

/**
 * 自动在品牌设备库中寻找最匹配的设备
 * (优先匹配容量在 100% ~ 110% 范围内的型号，若无则取最接近的大一级型号)
 */
export function autoMatchCatalogEquipment(
  category: EquipmentCategory,
  targetSingleCapacityOrFlow: number
): CatalogEquipmentItem | null {
  const categoryItems = EQUIPMENT_CATALOG.filter(item => item.category === category);
  if (categoryItems.length === 0) return null;

  // 排序
  const sorted = [...categoryItems].sort((a, b) => a.ratedCapacitykW - b.ratedCapacitykW);

  // 寻找大于等于目标容量且最接近的
  const match = sorted.find(item => item.ratedCapacitykW >= targetSingleCapacityOrFlow);
  if (match) return match;

  // 如果目标容量极大，超过库中最大型号，则返回库中最大型号
  return sorted[sorted.length - 1];
}
