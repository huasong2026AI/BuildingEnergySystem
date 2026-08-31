import type { CatalogEquipmentItem } from './types';

export const ATMOSPHERIC_BOILERS: CatalogEquipmentItem[] = [
  {
    id: 'boiler-fangkuai-atm-1400',
    category: 'boiler',
    brand: '方快 (Fangkuai)',
    model: 'WNS-1400kW-Atmospheric',
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
  }
];
