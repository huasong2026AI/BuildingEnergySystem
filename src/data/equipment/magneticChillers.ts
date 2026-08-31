import type { CatalogEquipmentItem } from './types';

export const MAGNETIC_CHILLERS: CatalogEquipmentItem[] = [
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
  }
];
