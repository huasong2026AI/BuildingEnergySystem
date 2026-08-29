import type { BuildingType, BuildingTypeMeta, SystemType, SystemTypeMeta, EnergyTariffConfig } from '../types/hvac';

export const BUILDING_TYPES_META: Record<BuildingType, BuildingTypeMeta> = {
  hotel: {
    id: 'hotel',
    name: '星级酒店 (Hotel)',
    defaultCoolingIndex: 110, // W/m²
    defaultHeatingIndex: 70,  // W/m²
    defaultOperatingHours: 3500, // h/year
    icon: 'Hotel'
  },
  office: {
    id: 'office',
    name: '甲级办公楼 (Office)',
    defaultCoolingIndex: 110, // W/m²
    defaultHeatingIndex: 70,  // W/m²
    defaultOperatingHours: 2800, // h/year
    icon: 'Building2'
  },
  mall: {
    id: 'mall',
    name: '商业综合体/Mall',
    defaultCoolingIndex: 145, // W/m²
    defaultHeatingIndex: 90,  // W/m²
    defaultOperatingHours: 3600, // h/year
    icon: 'ShoppingBag'
  },
  supermarket: {
    id: 'supermarket',
    name: '大型卖场/超市',
    defaultCoolingIndex: 130, // W/m²
    defaultHeatingIndex: 85,  // W/m²
    defaultOperatingHours: 3400, // h/year
    icon: 'ShoppingCart'
  },
  restaurant: {
    id: 'restaurant',
    name: '餐饮酒楼',
    defaultCoolingIndex: 180, // W/m²
    defaultHeatingIndex: 110, // W/m²
    defaultOperatingHours: 3000, // h/year
    icon: 'Utensils'
  },
  hospital: {
    id: 'hospital',
    name: '综合医院',
    defaultCoolingIndex: 125, // W/m²
    defaultHeatingIndex: 95,  // W/m²
    defaultOperatingHours: 4200, // h/year
    icon: 'Cross'
  },
  other: {
    id: 'other',
    name: '其他公共建筑',
    defaultCoolingIndex: 100, // W/m²
    defaultHeatingIndex: 65,  // W/m²
    defaultOperatingHours: 2500, // h/year
    icon: 'Building'
  }
};

export const SYSTEM_TYPES_META: Record<SystemType, SystemTypeMeta> = {
  chiller_boiler: {
    id: 'chiller_boiler',
    name: '1. 冷水机组 + 燃气锅炉系统',
    description: '标准中央空调冷热源，螺杆/离心机组提供夏季冷水，燃气锅炉配独立热水泵提供冬季热水，适用于大中型商业建筑。',
    primaryEquipment: ['螺杆/离心冷水机组', '燃气热水锅炉', '冷水水泵', '独立热水水泵', '冷却水水泵', '冷却塔'],
    hasCoolingTower: true,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: true
  },
  air_heat_pump: {
    id: 'air_heat_pump',
    name: '2. 风冷热泵系统 (Air Cooled Heat Pump)',
    description: '夏供冷/冬供热一体化室外机组，无冷却塔与冷却水系统。配备夏季冷水泵与冬季热水泵两套独立循环水泵。',
    primaryEquipment: ['风冷热泵模块机组', '夏季冷水泵', '冬季热水泵'],
    hasCoolingTower: false,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: false
  },
  vrf: {
    id: 'vrf',
    name: '3. 多联机系统 (VRF / VRV)',
    description: '变频氟利昂直接蒸发式系统 (DX系统)，无水泵与水管路，室外主机通过主管与分流歧管连接多台室内机。',
    primaryEquipment: ['VRF变频多联室外机', '分支管分流器', '风机盘管/天井室内机'],
    hasCoolingTower: false,
    hasChilledWaterPump: false,
    hasHotWaterPump: false,
    hasCoolingWaterPump: false
  },
  district_energy: {
    id: 'district_energy',
    name: '4. 区域能源站系统',
    description: '利用市政或园区集中冷热源，建筑内部设置板式换热器 (HEX) 及二次水泵进行换热与供冷/供热。',
    primaryEquipment: ['板式换热器 (HEX)', '二次冷/热水循环泵'],
    hasCoolingTower: false,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: false
  },
  split_ac: {
    id: 'split_ac',
    name: '5. 分体空调系统',
    description: '小型分体式房间空调器，投资低、独立控制，适用于小面积或特殊功能房间。',
    primaryEquipment: ['分体挂机/柜机'],
    hasCoolingTower: false,
    hasChilledWaterPump: false,
    hasHotWaterPump: false,
    hasCoolingWaterPump: false
  },
  ground_heat_pump: {
    id: 'ground_heat_pump',
    name: '6. 地源热泵系统',
    description: '利用土壤浅层地热能换热，能效比 (COP) 极高，配备地埋管地源水泵与负荷侧水泵。',
    primaryEquipment: ['地源热泵主机', '地埋管循环水泵', '负荷侧水泵'],
    hasCoolingTower: false,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: false
  },
  hybrid: {
    id: 'hybrid',
    name: '7. 复合空调系统',
    description: '结合2种或以上系统形式（如冷水机组承担基底冷负荷，多联机承担峰值冷负荷与冬季采暖等）的复合冷热源系统。',
    primaryEquipment: ['冷水机组/多联机/热泵组合', '循环水泵/直蒸系统组合'],
    hasCoolingTower: true,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: true
  }
};

export const DEFAULT_TARIFF_CONFIG: EnergyTariffConfig = {
  electricityMode: 'weighted_tou',
  peakElectricityPrice: 1.20,
  flatElectricityPrice: 0.75,
  valleyElectricityPrice: 0.35,
  peakRatio: 35,
  flatRatio: 45,
  valleyRatio: 20,
  averageElectricityPrice: 0.85, // (1.20*0.35 + 0.75*0.45 + 0.35*0.20) = 0.42 + 0.3375 + 0.07 = 0.8275 ~ 0.85
  gasPrice: 3.50,
  electricityCarbon: 0.581,
  gasCarbon: 2.162
};

export const ENERGY_FACTORS = {
  electricityPrice: 0.85, // 平均元/kWh
  peakElectricityPrice: 1.2, // 峰电价 元/kWh
  flatElectricityPrice: 0.75, // 平电价 元/kWh
  valleyElectricityPrice: 0.35, // 谷电价 元/kWh
  gasPrice: 3.5,          // 元/m³
  electricityCarbon: 0.581, // kg CO2 / kWh
  gasCarbon: 2.162        // kg CO2 / m³
};

