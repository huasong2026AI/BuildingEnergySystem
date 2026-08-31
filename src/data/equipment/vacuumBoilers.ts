import type { CatalogEquipmentItem } from './types';

export const VACUUM_BOILERS: CatalogEquipmentItem[] = [
  {
    id: 'boiler-fangkuai-vacuum-600',
    category: 'vacuum_boiler',
    brand: '方快 (Fangkuai)',
    model: 'FGR-600kW-Vacuum',
    name: '方快 全预混冷凝超低氮真空热水锅炉 600kW',
    ratedCapacitykW: 600,
    ratedPowerkW: 3.5,
    copOrEff: 98.5,
    gasFlowm3h: 63.5,
    priceRmbTenThousand: 22,
    description: '全预混表面燃烧技术，NOx 排放 < 30mg/m³，深度回收烟气冷凝潜热，热效率 98.5%'
  },
  {
    id: 'boiler-fangkuai-vacuum-1400',
    category: 'vacuum_boiler',
    brand: '方快 (Fangkuai)',
    model: 'FGR-1400kW-Vacuum',
    name: '方快 全预混冷凝超低氮真空热水锅炉 1400kW (2.0蒸吨)',
    ratedCapacitykW: 1400,
    ratedPowerkW: 5.5,
    copOrEff: 98.8,
    gasFlowm3h: 147.8,
    priceRmbTenThousand: 38,
    description: '超低氮冷凝真空技术，真空相变换热，绝无爆炸风险，无需报检'
  },
  {
    id: 'boiler-shuangliang-vacuum-2100',
    category: 'vacuum_boiler',
    brand: '双良 (Shuangliang)',
    model: 'SL-2.1-Vacuum',
    name: '双良 高效超低氮冷凝真空热水机组 2100kW (3.0蒸吨)',
    ratedCapacitykW: 2100,
    ratedPowerkW: 7.5,
    copOrEff: 99.0,
    gasFlowm3h: 221.0,
    priceRmbTenThousand: 52,
    description: '全自动智能氧含量调节，烟气冷凝深度回收，综合热效率达 99.0%'
  }
];
