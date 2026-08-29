export type EquipmentCategory = 
  | 'magnetic_chiller'  // 磁悬浮冷水机组
  | 'chiller'           // 变频螺杆/离心冷水机组
  | 'vacuum_boiler'     // 全预混冷凝真空热水锅炉
  | 'boiler'            // 常压燃气热水锅炉
  | 'plate_hex'         // 板式换热器 (HEX)
  | 'pump'              // 循环水泵 (冷水/热水/冷却)
  | 'cooling_tower'     // 冷却塔
  | 'achp'              // 风冷热泵模块
  | 'vrf';              // VRF 变频多联机

export interface CatalogEquipmentItem {
  id: string;
  category: EquipmentCategory;
  brand: string;            // 品牌 (每类严格保留最多两个主流顶级品牌)
  model: string;            // 型号
  name: string;             // 产品中文全称
  ratedCapacitykW: number;  // 额定制冷/制热容量 kW (水泵/冷却塔则表示额定流量 m³/h)
  ratedPowerkW: number;     // 真实额定输入电功率 kW (物理铭牌电功率)
  copOrEff: number;         // COP / EER / 效率 (%)
  iplvOrPartLoadCop?: number;// IPLV / 部分负荷最高 COP
  ratedFlowm3h?: number;    // 水流量 m³/h
  gasFlowm3h?: number;      // 燃气消耗量 m³/h
  priceRmbTenThousand?: number; // 参考单价 (万元)
  description?: string;     // 产品特色说明
  isCustom?: boolean;       // 是否为用户自定义新增或修改
}

export const CATEGORY_BRANDS: Record<EquipmentCategory, string> = {
  magnetic_chiller: '海尔 (Haier) / 格力 (Gree)',
  chiller: '约克 (York) / 开利 (Carrier)',
  vacuum_boiler: '方快 (Fangkuai) / 双良 (Shuangliang)',
  boiler: '方快 (Fangkuai) / 双良 (Shuangliang)',
  plate_hex: '阿法拉伐 (Alfa Laval) / 双良 (Shuangliang)',
  pump: '威乐 (Wilo) / 凯泉 (Kaiquan)',
  cooling_tower: '金日 (King Sun) / 良机 (Liangchi)',
  achp: '麦克维尔 (McQuay) / 约克 (York)',
  vrf: '大金 (Daikin) / 日立 (Hitachi)'
};

export const DEFAULT_EQUIPMENT_CATALOG: CatalogEquipmentItem[] = [
  // ----------------------------------------------------
  // 1. 磁悬浮冷水机组 (2个品牌：海尔、格力)
  // ----------------------------------------------------
  {
    id: 'mag-haier-600',
    category: 'magnetic_chiller',
    brand: '海尔 (Haier)',
    model: 'MX-0600-MagLev',
    name: '海尔 磁气悬浮无油变频离心冷水机组 600kW',
    ratedCapacitykW: 600,
    ratedPowerkW: 89.5,
    copOrEff: 6.7,
    iplvOrPartLoadCop: 10.8,
    ratedFlowm3h: 103.2,
    priceRmbTenThousand: 58,
    description: '磁悬浮无油轴承，零机械摩擦，50%负荷下 COP 突破 10.8，使用寿命长达30年'
  },
  {
    id: 'mag-haier-1200',
    category: 'magnetic_chiller',
    brand: '海尔 (Haier)',
    model: 'MX-1200-MagLev',
    name: '海尔 磁悬浮高效变频离心冷水机组 1200kW (340RT)',
    ratedCapacitykW: 1200,
    ratedPowerkW: 176.5,
    copOrEff: 6.8,
    iplvOrPartLoadCop: 11.2,
    ratedFlowm3h: 206.4,
    priceRmbTenThousand: 98,
    description: '双压缩机无油磁悬浮，部分负荷综合 IPLV 11.2，低噪音低震动'
  },
  {
    id: 'mag-gree-1000',
    category: 'magnetic_chiller',
    brand: '格力 (Gree)',
    model: 'LH-1000-MagLev',
    name: '格力 磁悬浮变频离心式冷水机组 1000kW (285RT)',
    ratedCapacitykW: 1000,
    ratedPowerkW: 147.0,
    copOrEff: 6.8,
    iplvOrPartLoadCop: 11.0,
    ratedFlowm3h: 172.0,
    priceRmbTenThousand: 88,
    description: '自主永磁同步电机与磁悬浮轴承，全工况自适应寻优'
  },
  {
    id: 'mag-gree-2000',
    category: 'magnetic_chiller',
    brand: '格力 (Gree)',
    model: 'LH-2000-MagLev',
    name: '格力 磁悬浮变频离心式冷水机组 2000kW (570RT)',
    ratedCapacitykW: 2000,
    ratedPowerkW: 289.8,
    copOrEff: 6.9,
    iplvOrPartLoadCop: 11.5,
    ratedFlowm3h: 344.0,
    priceRmbTenThousand: 165,
    description: '大型集中冷站专用，四压缩机智能轮换，10%~100% 宽负荷高效运行'
  },

  // ----------------------------------------------------
  // 2. 变频螺杆/离心冷水机组 (2个品牌：约克、开利)
  // ----------------------------------------------------
  {
    id: 'chiller-york-300',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YVAA-0300-Screw',
    name: '约克 YVAA 变频螺杆式冷水机组 300kW',
    ratedCapacitykW: 300,
    ratedPowerkW: 51.7,
    copOrEff: 5.8,
    iplvOrPartLoadCop: 7.8,
    ratedFlowm3h: 51.6,
    priceRmbTenThousand: 26,
    description: '商用变频螺杆机组，双机头配置，部分负荷性能卓越'
  },
  {
    id: 'chiller-york-1200',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YZ-1200-Centrifugal',
    name: '约克 YZ 变频离心冷水机组 1200kW (340RT)',
    ratedCapacitykW: 1200,
    ratedPowerkW: 193.5,
    copOrEff: 6.2,
    iplvOrPartLoadCop: 9.2,
    ratedFlowm3h: 206.4,
    priceRmbTenThousand: 82,
    description: '全变频传动离心机，满负荷 COP 6.2，综合 IPLV 9.2'
  },
  {
    id: 'chiller-york-2400',
    category: 'chiller',
    brand: '约克 (York)',
    model: 'YK-2400-Centrifugal',
    name: '约克 YK 高效变频离心式冷水机组 2400kW (680RT)',
    ratedCapacitykW: 2400,
    ratedPowerkW: 381.0,
    copOrEff: 6.3,
    iplvOrPartLoadCop: 9.6,
    ratedFlowm3h: 412.8,
    priceRmbTenThousand: 148,
    description: '大型商业综合体主力机组，开式电机与降膜蒸发器'
  },
  {
    id: 'chiller-carrier-600',
    category: 'chiller',
    brand: '开利 (Carrier)',
    model: '19DV-0600-Centrifugal',
    name: '开利 19DV 变频双级离心冷水机组 600kW (170RT)',
    ratedCapacitykW: 600,
    ratedPowerkW: 98.4,
    copOrEff: 6.1,
    iplvOrPartLoadCop: 8.9,
    ratedFlowm3h: 103.2,
    priceRmbTenThousand: 48,
    description: '采用超低 GWP 环保冷媒 R1233zd(E)，双级背对背变频压缩机，COP 6.1'
  },
  {
    id: 'chiller-carrier-1800',
    category: 'chiller',
    brand: '开利 (Carrier)',
    model: '19DV-1800-Centrifugal',
    name: '开利 19DV 变频双级离心冷水机组 1800kW (510RT)',
    ratedCapacitykW: 1800,
    ratedPowerkW: 288.0,
    copOrEff: 6.25,
    iplvOrPartLoadCop: 9.4,
    ratedFlowm3h: 309.6,
    priceRmbTenThousand: 118,
    description: '绿色低碳认证产品，陶瓷动压轴承无需机油润滑'
  },

  // ----------------------------------------------------
  // 3. 全预混冷凝真空热水锅炉 (2个品牌：方快、双良)
  // ----------------------------------------------------
  {
    id: 'boiler-fangkuai-vacuum-600',
    category: 'vacuum_boiler',
    brand: '方快 (Fangkuai)',
    model: 'ZWNS-0.6-Vacuum',
    name: '方快 全预混冷凝真空热水锅炉 600kW (0.86蒸吨)',
    ratedCapacitykW: 600,
    ratedPowerkW: 4.5,
    copOrEff: 98.0,
    gasFlowm3h: 61.4,
    priceRmbTenThousand: 22,
    description: '全预混表面燃烧+低氮冷凝真空技术，热效率高达 98%，超低氮排放 <30mg/m³'
  },
  {
    id: 'boiler-fangkuai-vacuum-2800',
    category: 'vacuum_boiler',
    brand: '方快 (Fangkuai)',
    model: 'ZWNS-2.8-Vacuum',
    name: '方快 全预混冷凝真空热水锅炉 2800kW (4.0蒸吨)',
    ratedCapacitykW: 2800,
    ratedPowerkW: 15.0,
    copOrEff: 98.5,
    gasFlowm3h: 285.2,
    priceRmbTenThousand: 85,
    description: '大型集中供热首选，全自动比例调节，部分负荷热效率更佳'
  },
  {
    id: 'boiler-shuangliang-vacuum-1400',
    category: 'vacuum_boiler',
    brand: '双良 (Shuangliang)',
    model: 'SL-1.4-Vacuum',
    name: '双良 全预混冷凝真空热水锅炉 1400kW (2.0蒸吨)',
    ratedCapacitykW: 1400,
    ratedPowerkW: 7.5,
    copOrEff: 98.5,
    gasFlowm3h: 142.6,
    priceRmbTenThousand: 46,
    description: '真空相变换热负压运行，免报检免年审，冷凝潜热深度回收'
  },
  {
    id: 'boiler-shuangliang-vacuum-3500',
    category: 'vacuum_boiler',
    brand: '双良 (Shuangliang)',
    model: 'SL-3.5-Vacuum',
    name: '双良 全预混冷凝真空热水锅炉 3500kW (5.0蒸吨)',
    ratedCapacitykW: 3500,
    ratedPowerkW: 18.5,
    copOrEff: 98.6,
    gasFlowm3h: 356.0,
    priceRmbTenThousand: 108,
    description: '特大型商用低氮节能真空热水机组，超高换热热效'
  },

  // ----------------------------------------------------
  // 4. 常压燃气热水锅炉 (2个品牌：方快、双良)
  // ----------------------------------------------------
  {
    id: 'boiler-fangkuai-atm-1400',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'CLHS-1.4-Atmospheric',
    name: '方快 常压燃气热水锅炉 1400kW (2.0蒸吨)',
    ratedCapacitykW: 1400,
    ratedPowerkW: 8.5,
    copOrEff: 90.0,
    gasFlowm3h: 156.1,
    priceRmbTenThousand: 32,
    description: '标准常压燃气热水锅炉，结构紧凑，热效率 90%'
  },
  {
    id: 'boiler-shuangliang-atm-2800',
    category: 'boiler',
    brand: '双良 (Shuangliang)',
    model: 'SL-2.8-Atmospheric',
    name: '双良 常压低氮燃气热水锅炉 2800kW (4.0蒸吨)',
    ratedCapacitykW: 2800,
    ratedPowerkW: 16.0,
    copOrEff: 91.0,
    gasFlowm3h: 308.0,
    priceRmbTenThousand: 65,
    description: '常压水暖供热机组，低阻力烟道设计，安全可靠'
  },

  // ----------------------------------------------------
  // 5. 板式换热器 (HEX) (2个品牌：阿法拉伐、双良)
  // ----------------------------------------------------
  {
    id: 'hex-alfalaval-1000',
    category: 'plate_hex',
    brand: '阿法拉伐 (Alfa Laval)',
    model: 'T10-1000kW-HEX',
    name: '阿法拉伐 高效板式换热器 1000kW',
    ratedCapacitykW: 1000,
    ratedPowerkW: 0,
    copOrEff: 98.5,
    ratedFlowm3h: 172.0,
    priceRmbTenThousand: 12,
    description: '316L 不锈钢板片，对流换热系数高达 6500W/(m²·K)，换热温差仅 1.0°C'
  },
  {
    id: 'hex-alfalaval-2500',
    category: 'plate_hex',
    brand: '阿法拉伐 (Alfa Laval)',
    model: 'T20-2500kW-HEX',
    name: '阿法拉伐 集中冷源换热机组 2500kW',
    ratedCapacitykW: 2500,
    ratedPowerkW: 0,
    copOrEff: 99.0,
    ratedFlowm3h: 430.0,
    priceRmbTenThousand: 25,
    description: '集中冷热源宽流道板换，过渡季自然冷却 Free Cooling 核心设备'
  },
  {
    id: 'hex-shuangliang-2000',
    category: 'plate_hex',
    brand: '双良 (Shuangliang)',
    model: 'SL-HEX-2000kW',
    name: '双良 高效可拆式板式换热器 2000kW',
    ratedCapacitykW: 2000,
    ratedPowerkW: 0,
    copOrEff: 98.8,
    ratedFlowm3h: 344.0,
    priceRmbTenThousand: 19,
    description: '高传热效率人字形波纹板，拆卸维护极其便捷'
  },

  // ----------------------------------------------------
  // 6. 循环水泵 (2个品牌：威乐、凯泉)
  // ----------------------------------------------------
  {
    id: 'pump-wilo-100',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'NL-80/200-100m3',
    name: '威乐 NL 高效单级端吸离心水泵 100m³/h (扬程30m)',
    ratedCapacitykW: 100, // 流量 m³/h
    ratedPowerkW: 15.0,
    copOrEff: 72.0,
    ratedFlowm3h: 100,
    priceRmbTenThousand: 1.8,
    description: 'IE4 超高能效电机，单级端吸，最高水泵水力效率 72%'
  },
  {
    id: 'pump-wilo-300',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'SCP-150/300-300m3',
    name: '威乐 SCP 高效双吸离心水泵 300m³/h (扬程28m)',
    ratedCapacitykW: 300,
    ratedPowerkW: 37.0,
    copOrEff: 78.5,
    ratedFlowm3h: 300,
    priceRmbTenThousand: 4.6,
    description: '冷水/冷却水循环主力泵，精密激光焊接叶轮，支持 30~50Hz 变频'
  },
  {
    id: 'pump-wilo-600',
    category: 'pump',
    brand: '威乐 (Wilo)',
    model: 'SCP-200/400-600m3',
    name: '威乐 SCP 高效双吸中开离心水泵 600m³/h (扬程28m)',
    ratedCapacitykW: 600,
    ratedPowerkW: 65.0,
    copOrEff: 83.0,
    ratedFlowm3h: 600,
    priceRmbTenThousand: 8.5,
    description: '大型双吸中开泵，水力效率高达 83%，运行平稳振动极低'
  },
  {
    id: 'pump-kaiquan-250',
    category: 'pump',
    brand: '凯泉 (Kaiquan)',
    model: 'KQW-125/250-250m3',
    name: '凯泉 KQW 高效立式单级离心水泵 250m³/h (扬程30m)',
    ratedCapacitykW: 250,
    ratedPowerkW: 30.0,
    copOrEff: 76.0,
    ratedFlowm3h: 250,
    priceRmbTenThousand: 3.2,
    description: '立式管道泵，占地面积小，水力模型优化，效率 76%'
  },
  {
    id: 'pump-kaiquan-500',
    category: 'pump',
    brand: '凯泉 (Kaiquan)',
    model: 'KOS-200/350-500m3',
    name: '凯泉 KOS 高效双吸中开离心泵 500m³/h (扬程28m)',
    ratedCapacitykW: 500,
    ratedPowerkW: 55.0,
    copOrEff: 81.5,
    ratedFlowm3h: 500,
    priceRmbTenThousand: 6.8,
    description: '国家节能认证产品，双向进水，抗汽蚀性能优异'
  },

  // ----------------------------------------------------
  // 7. 冷却塔 (2个品牌：金日、良机)
  // ----------------------------------------------------
  {
    id: 'tower-kingsun-300',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-300-LowNoise',
    name: '金日 超低噪声圆形逆流式冷却塔 300m³/h',
    ratedCapacitykW: 300,
    ratedPowerkW: 7.5,
    copOrEff: 90.0,
    ratedFlowm3h: 300,
    priceRmbTenThousand: 4.8,
    description: '静音风机与宽流道布水器，冷却水逼近度 2.5°C'
  },
  {
    id: 'tower-kingsun-800',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-800-LowNoise',
    name: '金日 方型横流式超低噪声冷却塔 800m³/h',
    ratedCapacitykW: 800,
    ratedPowerkW: 18.5,
    copOrEff: 92.5,
    ratedFlowm3h: 800,
    priceRmbTenThousand: 11.2,
    description: '低阻力阻燃填料，直连变频电机，飘水损失率低于 0.001%'
  },
  {
    id: 'tower-liangchi-500',
    category: 'cooling_tower',
    brand: '良机 (Liangchi)',
    model: 'LBC-500-Eco',
    name: '良机 LBC 节能方型横流冷却塔 500m³/h',
    ratedCapacitykW: 500,
    ratedPowerkW: 11.0,
    copOrEff: 91.0,
    ratedFlowm3h: 500,
    priceRmbTenThousand: 7.5,
    description: '高强度玻璃钢外壳，耐腐蚀寿命长，气水比高'
  },
  {
    id: 'tower-liangchi-1200',
    category: 'cooling_tower',
    brand: '良机 (Liangchi)',
    model: 'LBC-1200-Eco',
    name: '良机 LBC 集中冷站超大型冷却塔 1200m³/h',
    ratedCapacitykW: 1200,
    ratedPowerkW: 22.0,
    copOrEff: 93.0,
    ratedFlowm3h: 1200,
    priceRmbTenThousand: 16.8,
    description: '特大型商用冷站专用，宽叶片低速变频风机，电耗极低'
  },

  // ----------------------------------------------------
  // 8. 风冷热泵 (ACHP) (2个品牌：麦克维尔、约克)
  // ----------------------------------------------------
  {
    id: 'achp-mcquay-130',
    category: 'achp',
    brand: '麦克维尔 (McQuay)',
    model: 'MAC-130-VFD',
    name: '麦克维尔 MAC 变频风冷热泵模块机 130kW',
    ratedCapacitykW: 130,
    ratedPowerkW: 39.4,
    copOrEff: 3.3,
    iplvOrPartLoadCop: 4.8,
    priceRmbTenThousand: 12,
    description: '全直流变频 EVI 喷气增焓技术，-25°C 极寒制热，夏季制冷 COP 3.3'
  },
  {
    id: 'achp-mcquay-250',
    category: 'achp',
    brand: '麦克维尔 (McQuay)',
    model: 'MAC-250-VFD',
    name: '麦克维尔 MAC 高效变频风冷热泵机组 250kW',
    ratedCapacitykW: 250,
    ratedPowerkW: 73.5,
    copOrEff: 3.4,
    iplvOrPartLoadCop: 5.1,
    priceRmbTenThousand: 22,
    description: '双独立冷媒回路变频螺杆，夏供冷/冬供热一体化，免机房设计'
  },
  {
    id: 'achp-york-150',
    category: 'achp',
    brand: '约克 (York)',
    model: 'YCAE-150-Eco',
    name: '约克 YCAE 模块式高效风冷热泵 150kW',
    ratedCapacitykW: 150,
    ratedPowerkW: 44.5,
    copOrEff: 3.37,
    iplvOrPartLoadCop: 4.9,
    priceRmbTenThousand: 14,
    description: '高效全密闭涡旋压缩机，微电脑全自动除霜寻优'
  },

  // ----------------------------------------------------
  // 9. VRF 变频多联机 (2个品牌：大金、日立)
  // ----------------------------------------------------
  {
    id: 'vrf-daikin-28',
    category: 'vrf',
    brand: '大金 (Daikin)',
    model: 'VRV-X7-28kW-10HP',
    name: '大金 VRV-X7 全直流变频多联外机 28kW (10匹)',
    ratedCapacitykW: 28,
    ratedPowerkW: 6.8,
    copOrEff: 4.12,
    iplvOrPartLoadCop: 7.2,
    priceRmbTenThousand: 3.2,
    description: '大金第七代变频压缩机，超高 APF/IPLV，高回油可靠性'
  },
  {
    id: 'vrf-daikin-56',
    category: 'vrf',
    brand: '大金 (Daikin)',
    model: 'VRV-X7-56kW-20HP',
    name: '大金 VRV-X7 全直流变频多联外机 56kW (20匹)',
    ratedCapacitykW: 56,
    ratedPowerkW: 13.6,
    copOrEff: 4.10,
    iplvOrPartLoadCop: 7.5,
    priceRmbTenThousand: 5.8,
    description: '大容量单模块外机，VRT 冷媒温度自适应调节，部分负荷极其省电'
  },
  {
    id: 'vrf-hitachi-45',
    category: 'vrf',
    brand: '日立 (Hitachi)',
    model: 'SET-FREE-45kW-16HP',
    name: '日立 SET-FREE 变频多联机室外机 45kW (16匹)',
    ratedCapacitykW: 45,
    ratedPowerkW: 10.9,
    copOrEff: 4.13,
    iplvOrPartLoadCop: 7.6,
    priceRmbTenThousand: 4.8,
    description: '日立自研高压腔涡旋压缩机，智能无级变频驱动'
  },
  {
    id: 'vrf-hitachi-80',
    category: 'vrf',
    brand: '日立 (Hitachi)',
    model: 'SET-FREE-80kW-28HP',
    name: '日立 SET-FREE 组合式变频多联机组 80kW (28匹)',
    ratedCapacitykW: 80,
    ratedPowerkW: 19.5,
    copOrEff: 4.10,
    iplvOrPartLoadCop: 7.7,
    priceRmbTenThousand: 8.5,
    description: '双机组合模块，配管最长达190米，适应大型办公楼及酒店'
  }
];

const STORAGE_KEY = 'hvac_active_equipment_catalog_v2';

/**
 * 获取全局生效的设备品牌库（支持用户自由增删改查）
 */
export function getMergedEquipmentCatalog(): CatalogEquipmentItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const items: CatalogEquipmentItem[] = JSON.parse(saved);
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    }
  } catch (e) {
    console.error('Failed to load equipment catalog', e);
  }
  // 初始化默认库
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
  return DEFAULT_EQUIPMENT_CATALOG;
}

/**
 * 保存整个设备库
 */
export function saveActiveEquipmentCatalog(items: CatalogEquipmentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save equipment catalog', e);
  }
}

/**
 * 补充录入新的设备型号
 */
export function addCustomCatalogEquipment(item: CatalogEquipmentItem): void {
  const current = getMergedEquipmentCatalog();
  const updated = [item, ...current];
  saveActiveEquipmentCatalog(updated);
}

/**
 * 修改现有设备型号
 */
export function updateCatalogEquipment(item: CatalogEquipmentItem): void {
  const current = getMergedEquipmentCatalog();
  const updated = current.map(i => i.id === item.id ? { ...item, isCustom: true } : i);
  saveActiveEquipmentCatalog(updated);
}

/**
 * 删除设备型号
 */
export function deleteCustomCatalogEquipment(id: string): void {
  const current = getMergedEquipmentCatalog();
  const updated = current.filter(i => i.id !== id);
  saveActiveEquipmentCatalog(updated);
}

/**
 * 重置恢复至默认出厂品牌库
 */
export function resetCatalogToDefault(): CatalogEquipmentItem[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EQUIPMENT_CATALOG));
  return DEFAULT_EQUIPMENT_CATALOG;
}

/**
 * 自动在品牌设备库中寻找最匹配的设备
 */
export function autoMatchCatalogEquipment(
  category: EquipmentCategory,
  targetSingleCapacityOrFlow: number
): CatalogEquipmentItem | null {
  const allItems = getMergedEquipmentCatalog();
  const categoryItems = allItems.filter(item => item.category === category);
  if (categoryItems.length === 0) return null;

  const sorted = [...categoryItems].sort((a, b) => a.ratedCapacitykW - b.ratedCapacitykW);
  const match = sorted.find(item => item.ratedCapacitykW >= targetSingleCapacityOrFlow);
  if (match) return match;

  return sorted[sorted.length - 1];
}
