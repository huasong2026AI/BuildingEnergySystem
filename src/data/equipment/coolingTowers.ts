import type { CatalogEquipmentItem } from './types';

/**
 * 冷却塔设备产品库
 * 仅保留单一大品牌：金日 (King Sun) 全系列 13 款机型（精确匹配 100RT~1500RT 冷水机组散热）
 */
export const COOLING_TOWERS: CatalogEquipmentItem[] = [
  {
    id: 'tower-kingsun-100',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-100',
    name: '金日 超低噪声方形横流冷却塔 100m³/h (100~120RT)',
    ratedCapacitykW: 100,
    ratedPowerkW: 2.2,
    copOrEff: 92.5,
    ratedFlowm3h: 100,
    priceRmbTenThousand: 2.2,
    description: '金日超低噪声方形横流式冷却塔，匹配100~120RT冷水机组散热需求，额定水量100m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-150',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-150',
    name: '金日 超低噪声方形横流冷却塔 150m³/h (150~180RT)',
    ratedCapacitykW: 150,
    ratedPowerkW: 3.0,
    copOrEff: 92.5,
    ratedFlowm3h: 150,
    priceRmbTenThousand: 2.8,
    description: '金日超低噪声方形横流式冷却塔，匹配150~180RT冷水机组散热需求，额定水量150m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-200',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-200',
    name: '金日 超低噪声方形横流冷却塔 200m³/h (200~250RT)',
    ratedCapacitykW: 200,
    ratedPowerkW: 4.0,
    copOrEff: 92.5,
    ratedFlowm3h: 200,
    priceRmbTenThousand: 3.6,
    description: '金日超低噪声方形横流式冷却塔，匹配200~250RT冷水机组散热需求，额定水量200m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-250',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-250',
    name: '金日 超低噪声方形横流冷却塔 250m³/h (250~300RT)',
    ratedCapacitykW: 250,
    ratedPowerkW: 5.5,
    copOrEff: 92.5,
    ratedFlowm3h: 250,
    priceRmbTenThousand: 4.2,
    description: '金日超低噪声方形横流式冷却塔，匹配250~300RT冷水机组散热需求，额定水量250m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-300',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-300',
    name: '金日 超低噪声方形横流冷却塔 300m³/h (300~350RT)',
    ratedCapacitykW: 300,
    ratedPowerkW: 7.5,
    copOrEff: 92.5,
    ratedFlowm3h: 300,
    priceRmbTenThousand: 4.8,
    description: '金日超低噪声方形横流式冷却塔，匹配300~350RT冷水机组散热需求，额定水量300m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-400',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-400',
    name: '金日 超低噪声方形横流冷却塔 400m³/h (400~450RT)',
    ratedCapacitykW: 400,
    ratedPowerkW: 11.0,
    copOrEff: 92.5,
    ratedFlowm3h: 400,
    priceRmbTenThousand: 6.5,
    description: '金日超低噪声方形横流式冷却塔，匹配400~450RT冷水机组散热需求，额定水量400m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-500',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-500',
    name: '金日 超低噪声方形横流冷却塔 500m³/h (500~550RT)',
    ratedCapacitykW: 500,
    ratedPowerkW: 11.0,
    copOrEff: 92.5,
    ratedFlowm3h: 500,
    priceRmbTenThousand: 7.8,
    description: '金日超低噪声方形横流式冷却塔，匹配500~550RT冷水机组散热需求，额定水量500m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-600',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-600',
    name: '金日 超低噪声方形横流冷却塔 600m³/h (600~650RT)',
    ratedCapacitykW: 600,
    ratedPowerkW: 15.0,
    copOrEff: 92.5,
    ratedFlowm3h: 600,
    priceRmbTenThousand: 9.2,
    description: '金日超低噪声方形横流式冷却塔，匹配600~650RT冷水机组散热需求，额定水量600m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-700',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-700',
    name: '金日 超低噪声方形横流冷却塔 700m³/h (700~750RT)',
    ratedCapacitykW: 700,
    ratedPowerkW: 15.0,
    copOrEff: 92.5,
    ratedFlowm3h: 700,
    priceRmbTenThousand: 10.5,
    description: '金日超低噪声方形横流式冷却塔，匹配700~750RT冷水机组散热需求，额定水量700m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-800',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-800',
    name: '金日 超低噪声方形横流冷却塔 800m³/h (800~900RT)',
    ratedCapacitykW: 800,
    ratedPowerkW: 18.5,
    copOrEff: 92.5,
    ratedFlowm3h: 800,
    priceRmbTenThousand: 11.8,
    description: '金日超低噪声方形横流式冷却塔，匹配800~900RT冷水机组散热需求，额定水量800m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-1000',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-1000',
    name: '金日 超低噪声方形横流冷却塔 1000m³/h (1000~1100RT)',
    ratedCapacitykW: 1000,
    ratedPowerkW: 22.0,
    copOrEff: 92.5,
    ratedFlowm3h: 1000,
    priceRmbTenThousand: 14.5,
    description: '金日超低噪声方形横流式冷却塔，匹配1000~1100RT冷水机组散热需求，额定水量1000m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-1200',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-1200',
    name: '金日 超低噪声方形横流冷却塔 1200m³/h (1200~1300RT)',
    ratedCapacitykW: 1200,
    ratedPowerkW: 30.0,
    copOrEff: 92.5,
    ratedFlowm3h: 1200,
    priceRmbTenThousand: 17.5,
    description: '金日超低噪声方形横流式冷却塔，匹配1200~1300RT冷水机组散热需求，额定水量1200m³/h，低能耗直连风机，漂水率低于0.001%'
  },
  {
    id: 'tower-kingsun-1500',
    category: 'cooling_tower',
    brand: '金日 (King Sun)',
    model: 'KST-1500',
    name: '金日 超低噪声方形横流冷却塔 1500m³/h (1400~1500RT)',
    ratedCapacitykW: 1500,
    ratedPowerkW: 37.0,
    copOrEff: 92.5,
    ratedFlowm3h: 1500,
    priceRmbTenThousand: 21.0,
    description: '金日超低噪声方形横流式冷却塔，匹配1400~1500RT冷水机组散热需求，额定水量1500m³/h，低能耗直连风机，漂水率低于0.001%'
  }
];
