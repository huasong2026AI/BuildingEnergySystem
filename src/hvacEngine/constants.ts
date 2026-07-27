import type { BuildingTypeMeta, SystemTypeMeta, BuildingType, SystemType } from '../types/hvac';

export const BUILDING_TYPES_META: Record<BuildingType, BuildingTypeMeta> = {
  hotel: {
    id: 'hotel',
    name: '星级酒店',
    defaultCoolingIndex: 130, // W/m²
    defaultHeatingIndex: 80,  // W/m²
    defaultOperatingHours: 365 * 18,
    icon: 'Hotel'
  },
  office: {
    id: 'office',
    name: '甲级办公楼',
    defaultCoolingIndex: 110, // W/m²
    defaultHeatingIndex: 70,  // W/m²
    defaultOperatingHours: 260 * 10,
    icon: 'Building2'
  },
  mall: {
    id: 'mall',
    name: '商业综合体/Mall',
    defaultCoolingIndex: 145, // W/m²
    defaultHeatingIndex: 90,  // W/m²
    defaultOperatingHours: 365 * 13,
    icon: 'ShoppingBag'
  },
  supermarket: {
    id: 'supermarket',
    name: '大型超市',
    defaultCoolingIndex: 155, // W/m²
    defaultHeatingIndex: 85,  // W/m²
    defaultOperatingHours: 365 * 14,
    icon: 'ShoppingCart'
  },
  restaurant: {
    id: 'restaurant',
    name: '餐饮酒楼',
    defaultCoolingIndex: 180, // W/m²
    defaultHeatingIndex: 100, // W/m²
    defaultOperatingHours: 365 * 12,
    icon: 'Utensils'
  },
  hospital: {
    id: 'hospital',
    name: '医院建筑',
    defaultCoolingIndex: 125, // W/m²
    defaultHeatingIndex: 80,  // W/m²
    defaultOperatingHours: 365 * 24,
    icon: 'Cross'
  },
  other: {
    id: 'other',
    name: '通用公共建筑',
    defaultCoolingIndex: 100, // W/m²
    defaultHeatingIndex: 65,  // W/m²
    defaultOperatingHours: 2500,
    icon: 'Building'
  }
};

export const SYSTEM_TYPES_META: Record<SystemType, SystemTypeMeta> = {
  chiller_boiler: {
    id: 'chiller_boiler',
    name: '1. 冷水机组 + 锅炉系统',
    description: '经典的冷热源分设系统。冷水机组配冷水泵及冷却塔冷却水回路；燃气锅炉配独立热水泵循环，直接连接空调末端供热。',
    primaryEquipment: ['冷水机组', '燃气锅炉', '冷水水泵', '独立热水水泵', '冷却水水泵', '冷却塔', '末端AHU/FCU'],
    hasCoolingTower: true,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: true
  },
  air_heat_pump: {
    id: 'air_heat_pump',
    name: '2. 风冷热泵系统',
    description: '风冷式冷热源机组，无需冷却塔。机组配备夏季冷水循环泵和冬季热水循环泵两套独立水泵，分别在夏/冬两季与末端连接。',
    primaryEquipment: ['风冷热泵机组', '夏季冷水循环泵', '冬季热水循环泵', '末端风机盘管(FCU)'],
    hasCoolingTower: false,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: false
  },
  vrf: {
    id: 'vrf',
    name: '3. 多联机系统 (VRF/VRV)',
    description: '直接蒸发式变频制冷剂系统 (DX系统)，无冷/热水泵，无冷却塔及水管路系统，通过氟利昂铜管连接室外机与室内机。',
    primaryEquipment: ['VRF室外机组', 'VRF室内机', '制冷剂管网', '新风换气机'],
    hasCoolingTower: false,
    hasChilledWaterPump: false,
    hasHotWaterPump: false,
    hasCoolingWaterPump: false
  },
  district_energy: {
    id: 'district_energy',
    name: '4. 区域能源站系统',
    description: '由园区/城市集中能源站输送一级冷/热源，建筑内设板式换热器及二次冷/热水循环泵。',
    primaryEquipment: ['板式换热器', '二次冷水循环泵', '二次热水循环泵', '能量计量表', '末端系统'],
    hasCoolingTower: false,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: false
  },
  split_ac: {
    id: 'split_ac',
    name: '5. 分体空调系统',
    description: '直接蒸发分体式空调，独立控制，无水循环泵与冷却塔。',
    primaryEquipment: ['分体空调室内外机', '机械排风机'],
    hasCoolingTower: false,
    hasChilledWaterPump: false,
    hasHotWaterPump: false,
    hasCoolingWaterPump: false
  },
  ground_heat_pump: {
    id: 'ground_heat_pump',
    name: '6. 地源热泵系统',
    description: '利用土壤常温换热，配地埋管侧循环泵与负荷侧水泵，高效绿色。',
    primaryEquipment: ['地源热泵主机', '地埋管侧循环泵', '负荷侧冷/热水泵', '地埋管换热器', '末端AHU'],
    hasCoolingTower: false,
    hasChilledWaterPump: true,
    hasHotWaterPump: true,
    hasCoolingWaterPump: false
  }
};

export const ENERGY_FACTORS = {
  electricityPrice: 0.92, // 元/kWh
  gasPrice: 3.50,         // 元/m³
  electricityCarbon: 0.5703, // kgCO₂/kWh
  gasCarbon: 2.162,         // kgCO₂/m³
};
