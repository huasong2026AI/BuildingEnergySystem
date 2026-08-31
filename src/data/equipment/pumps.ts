import type { CatalogEquipmentItem } from './types';

export const WATER_PUMPS: CatalogEquipmentItem[] = [
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
  }
];
