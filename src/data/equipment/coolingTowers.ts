import type { CatalogEquipmentItem } from './types';

export const COOLING_TOWERS: CatalogEquipmentItem[] = [
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
  }
];
