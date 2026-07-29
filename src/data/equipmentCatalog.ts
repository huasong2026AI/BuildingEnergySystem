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
  brand: string;            // 品牌 (约克, 开利, 特灵, 麦克维尔, 格力, 美的, 海尔, 威乐, 凯泉, 方快, 双良, 金日, 大金, 日立)
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

export const EQUIPMENT_CATALOG: CatalogEquipmentItem[] = [
  // ----------------------------------------------------
  // 1. 冷水机组 (Chillers)
  // ----------------------------------------------------
  {
    id: 'chiller-york-yk800',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-0800-Mag',
    name: '约克 YK 变频磁悬浮离心式冷水机组 800kW',
    ratedCapacitykW: 800,
    ratedPowerkW: 114.2,
    copOrEff: 7.0,
    ratedFlowm3h: 137.6,
    priceRmbTenThousand: 65,
    description: '无油磁悬浮轴承，全变频驱动，满负荷 COP 高达 7.0，IPLV 10.2'
  },
  {
    id: 'chiller-york-yk1200',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-1200-Mag',
    name: '约克 YK 变频磁悬浮离心式冷水机组 1200kW',
    ratedCapacitykW: 1200,
    ratedPowerkW: 171.4,
    copOrEff: 7.0,
    ratedFlowm3h: 206.4,
    priceRmbTenThousand: 92,
    description: '双压缩机独立回路，超高效磁悬浮离心，超长使用寿命'
  },
  {
    id: 'chiller-york-yk1600',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-1600-Mag',
    name: '约克 YK 变频磁悬浮离心式冷水机组 1600kW',
    ratedCapacitykW: 1600,
    ratedPowerkW: 228.5,
    copOrEff: 7.0,
    ratedFlowm3h: 275.2,
    priceRmbTenThousand: 118,
    description: '大型商业/写字楼首选，高低压双重保护，超低运行噪音'
  },
  {
    id: 'chiller-york-yk2200',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-2200-Mag',
    name: '约克 YK 变频磁悬浮离心式冷水机组 2200kW',
    ratedCapacitykW: 2200,
    ratedPowerkW: 314.2,
    copOrEff: 7.0,
    ratedFlowm3h: 378.4,
    priceRmbTenThousand: 155,
    description: '超大制冷量机组，配合 SmartClient 智能云端监控'
  },
  {
    id: 'chiller-carrier-19xr1000',
    category: 'chiller',
    brand: '开利 (Carrier)',
    model: '19XR-1000-High',
    name: '开利 19XR 高效双级离心式冷水机组 1000kW',
    ratedCapacitykW: 1000,
    ratedPowerkW: 153.8,
    copOrEff: 6.5,
    ratedFlowm3h: 172.0,
    priceRmbTenThousand: 72,
    description: '开利专利双级压缩离心技术，R134a 环保制冷剂，运行极其稳定'
  },
  {
    id: 'chiller-carrier-19xr1500',
    category: 'chiller',
    brand: '开利 (Carrier)',
    model: '19XR-1500-High',
    name: '开利 19XR 高效双级离心式冷水机组 1500kW',
    ratedCapacitykW: 1500,
    ratedPowerkW: 230.7,
    copOrEff: 6.5,
    ratedFlowm3h: 258.0,
    priceRmbTenThousand: 105,
    description: '高效强化换热铜管，耐高压设计，工业级高耐久度'
  },
  {
    id: 'chiller-carrier-19xr2200',
    category: 'chiller',
    brand: '开利 (Carrier)',
    model: '19XR-2200-High',
    name: '开利 19XR 高效双级离心式冷水机组 2200kW',
    ratedCapacitykW: 2200,
    ratedPowerkW: 338.4,
    copOrEff: 6.5,
    ratedFlowm3h: 378.4,
    priceRmbTenThousand: 148,
    description: '超大型公共建筑/三甲医院首选高可靠性主机'
  },
  {
    id: 'chiller-trane-cvhe1200',
    category: 'chiller',
    brand: '特灵 (Trane)',
    model: 'CVHE-1200-Tri',
    name: '特灵 CVHE 三级压缩高效离心冷水机组 1200kW',
    ratedCapacitykW: 1200,
    ratedPowerkW: 184.6,
    copOrEff: 6.5,
    ratedFlowm3h: 206.4,
    priceRmbTenThousand: 88,
    description: '特灵经典三级压缩，防喘振区间极宽，适应恶劣工况'
  },
  {
    id: 'chiller-gree-cve1000',
    category: 'chiller',
    brand: '格力 (Gree)',
    model: 'CVE-1000-Mag',
    name: '格力 CVE 变频磁悬浮离心式冷水机组 1000kW',
    ratedCapacitykW: 1000,
    ratedPowerkW: 140.8,
    copOrEff: 7.1,
    ratedFlowm3h: 172.0,
    priceRmbTenThousand: 68,
    description: '国产品牌之光，自主研制磁悬浮轴承，电机能效级别 IE5'
  },
  {
    id: 'chiller-gree-cve1500',
    category: 'chiller',
    brand: '格力 (Gree)',
    model: 'CVE-1500-Mag',
    name: '格力 CVE 变频磁悬浮离心式冷水机组 1500kW',
    ratedCapacitykW: 1500,
    ratedPowerkW: 211.2,
    copOrEff: 7.1,
    ratedFlowm3h: 258.0,
    priceRmbTenThousand: 98,
    description: '高效三维叶轮设计，零摩擦运行，维护成本降低 70%'
  },
  {
    id: 'chiller-midea-ccse1200',
    category: 'chiller',
    brand: '美的 (Midea)',
    model: 'CCSE-1200-Mag',
    name: '美的 CCSE 高效变频离心式冷水机组 1200kW',
    ratedCapacitykW: 1200,
    ratedPowerkW: 176.4,
    copOrEff: 6.8,
    ratedFlowm3h: 206.4,
    priceRmbTenThousand: 82,
    description: '美的零碳机房核心主机，集成自研 AI 节电群控接口'
  },
  {
    id: 'chiller-haier-mag1000',
    category: 'chiller',
    brand: '海尔 (Haier)',
    model: 'Haier-Mag-1000',
    name: '海尔 磁悬浮无油离心式冷水机组 1000kW',
    ratedCapacitykW: 1000,
    ratedPowerkW: 138.8,
    copOrEff: 7.2,
    ratedFlowm3h: 172.0,
    priceRmbTenThousand: 70,
    description: '海尔全球首创磁悬浮中央空调，连续 18 年国内市占率第一'
  },

  // ----------------------------------------------------
  // 2. 燃气热水锅炉 (Boilers)
  // ----------------------------------------------------
  {
    id: 'boiler-fangkuai-700',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'T6-700-Cold',
    name: '方快 胜雪超低氮全冷凝热水锅炉 700kW',
    ratedCapacitykW: 700,
    ratedPowerkW: 5.5,
    copOrEff: 96.0,
    gasFlowm3h: 72.5,
    priceRmbTenThousand: 22,
    description: 'NOx < 30mg/m³，羽翼管高效冷凝技术，热效率高达 96%'
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
    priceRmbTenThousand: 38,
    description: 'PLC 触控全自动控制，变频给风与比例燃烧'
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
    priceRmbTenThousand: 52,
    description: '大型酒店/医院供热首选，出水温度精度 ±0.5°C'
  },
  {
    id: 'boiler-shuangliang-1000',
    category: 'boiler',
    brand: '双良 (Shuangliang)',
    model: 'SL-Vac-1000',
    name: '双良 真空相变燃气热水锅炉 1000kW',
    ratedCapacitykW: 1000,
    ratedPowerkW: 7.5,
    copOrEff: 95.0,
    gasFlowm3h: 103.8,
    priceRmbTenThousand: 32,
    description: '常压真空运行，永无爆炸危险，无需年检，寿命长达 20 年'
  },
  {
    id: 'boiler-shuangliang-2000',
    category: 'boiler',
    brand: '双良 (Shuangliang)',
    model: 'SL-Vac-2000',
    name: '双良 真空相变燃气热水锅炉 2000kW',
    ratedCapacitykW: 2000,
    ratedPowerkW: 15.0,
    copOrEff: 95.0,
    gasFlowm3h: 207.6,
    priceRmbTenThousand: 58,
    description: '内置高效率换热器，支持多回路独立供暖/卫生热水'
  },

  // ----------------------------------------------------
  // 3. 风冷热泵主机模块 (Air Cooled Heat Pumps)
  // ----------------------------------------------------
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
    description: 'V 型翅片换热器，独立双系统，超低温 -15°C 制热'
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
    description: '多模块自由组合（最多 16 台组合），智能化轮换防结霜'
  },
  {
    id: 'achp-gree-130',
    category: 'achp',
    brand: '格力 (Gree)',
    model: 'LHE-130-V',
    name: '格力 LHE 全变频风冷热泵模块机 130kW',
    ratedCapacitykW: 130,
    ratedPowerkW: 36.1,
    copOrEff: 3.6,
    ratedFlowm3h: 22.4,
    priceRmbTenThousand: 9.0,
    description: '全变频喷气增焓技术，超低温 -26°C 强劲供热，APF 4.8'
  },
  {
    id: 'achp-midea-130',
    category: 'achp',
    brand: '美的 (Midea)',
    model: 'MD-130-Flame',
    name: '美的 烈焰高能效风冷热泵模块机 130kW',
    ratedCapacitykW: 130,
    ratedPowerkW: 36.6,
    copOrEff: 3.55,
    ratedFlowm3h: 22.4,
    priceRmbTenThousand: 8.8,
    description: '智能融霜算法，电子膨胀阀精细调节，节能环保'
  },

  // ----------------------------------------------------
  // 4. VRF 多联机室外主机 (VRF Outdoor Units)
  // ----------------------------------------------------
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
    description: '大金自研全变频涡旋压缩机，VRT 冷媒温度自适应调节'
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
    id: 'vrf-midea-mdv8-45',
    category: 'vrf',
    brand: '美的 (Midea)',
    model: 'MDV8-450-Pro',
    name: '美的 MDV8 全直流变频多联机室外机 45kW (16HP)',
    ratedCapacitykW: 45,
    ratedPowerkW: 10.2,
    copOrEff: 4.41,
    priceRmbTenThousand: 3.2,
    description: '全隔离风道无惧风雪，AI 能效感知，云端远程诊断'
  },
  {
    id: 'vrf-gree-gmv6-45',
    category: 'vrf',
    brand: '格力 (Gree)',
    model: 'GMV6-450-Ultra',
    name: '格力 GMV6 人工智能多联机室外机 45kW (16HP)',
    ratedCapacitykW: 45,
    ratedPowerkW: 10.3,
    copOrEff: 4.35,
    priceRmbTenThousand: 3.3,
    description: 'CAN 通信总线，G-Learn 自学习算法，待机功耗低至 1W'
  },

  // ----------------------------------------------------
  // 5. 循环水泵 (Pumps)
  // ----------------------------------------------------
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
    description: '德国威乐 IE5 最高等级永磁变频电机，扬程 28m'
  },
  {
    id: 'pump-wilo-180',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-180-250-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 180m³/h',
    ratedCapacitykW: 180,
    ratedPowerkW: 21.6,
    copOrEff: 83.0,
    ratedFlowm3h: 180,
    priceRmbTenThousand: 3.2,
    description: '三维流体叶轮优化，超耐磨机械密封，扬程 30m'
  },
  {
    id: 'pump-wilo-350',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'IL-350-300-Var',
    name: '威乐 Wilo 高效变频立式管道水泵 350m³/h',
    ratedCapacitykW: 350,
    ratedPowerkW: 42.1,
    copOrEff: 83.0,
    ratedFlowm3h: 350,
    priceRmbTenThousand: 5.5,
    description: '大型空调水机房主循环水泵，高抗汽蚀设计，扬程 32m'
  },
  {
    id: 'pump-kaiquan-200',
    category: 'pump',
    brand: '凯泉 (Kaiquan)',
    model: 'KQL-200-250-V',
    name: '凯泉 KQL 高效单级单吸管道离心泵 200m³/h',
    ratedCapacitykW: 200,
    ratedPowerkW: 24.2,
    copOrEff: 82.0,
    ratedFlowm3h: 200,
    priceRmbTenThousand: 2.6,
    description: '国产优质水泵，全水力模型 CAD 精雕，扬程 30m'
  },
  {
    id: 'pump-kaiquan-500',
    category: 'pump',
    brand: '凯泉 (Kaiquan)',
    model: 'KQL-500-300-V',
    name: '凯泉 KQL 高效单级单吸管道离心泵 500m³/h',
    ratedCapacitykW: 500,
    ratedPowerkW: 60.5,
    copOrEff: 82.0,
    ratedFlowm3h: 500,
    priceRmbTenThousand: 6.0,
    description: '大流量冷水泵/冷却泵，配置高品质防震基座'
  },

  // ----------------------------------------------------
  // 6. 冷却塔 (Cooling Towers)
  // ----------------------------------------------------
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
    description: '优质玻璃钢外壳，高效阻燃填料，水滴飘逸率 < 0.001%'
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
    description: '静音风机与宽流道布水器，冷却水逼近度升至 2.5°C'
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
