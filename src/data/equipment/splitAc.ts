import type { CatalogEquipmentItem } from './types';

/**
 * 商用高效分体空调机组产品库
 * 选用国内空调龙头品牌：格力 (Gree) 商用新一级能效分体空调全系列 8 款机型（3.5kW ~ 25kW）
 */
export const SPLIT_ACS: CatalogEquipmentItem[] = [
  {
    id: 'split-gree-35',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-35GW/NhAa1Bg (1.5匹)',
    name: '格力 新一级能效变频壁挂式分体空调 (1.5匹 / 3.5kW)',
    ratedCapacitykW: 3.5,
    ratedPowerkW: 0.74,
    copOrEff: 5.28,
    priceRmbTenThousand: 0.32,
    description: '格力新一级能效变频冷暖挂机，额定制冷量 3.5kW，APF高达 5.28，适用于独立办公室/门卫室/弱电机房'
  },
  {
    id: 'split-gree-50',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-50LW/NhAe1Bg (2.0匹)',
    name: '格力 新一级能效变频立柜式空调 (2.0匹 / 5.0kW)',
    ratedCapacitykW: 5.0,
    ratedPowerkW: 1.15,
    copOrEff: 4.85,
    priceRmbTenThousand: 0.55,
    description: '格力新一级能效商用立柜机，额定制冷量 5.0kW，APF 4.85，强劲风量，适用于小型会议室/接待室'
  },
  {
    id: 'split-gree-72-fcu',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-72TW/(7256T)NhAa-1 (3.0匹天花机)',
    name: '格力 新一级能效商用天井四面出风天花机 (3.0匹 / 7.2kW)',
    ratedCapacitykW: 7.2,
    ratedPowerkW: 1.62,
    copOrEff: 4.75,
    priceRmbTenThousand: 0.72,
    description: '格力商用四出风天花卡式嵌入机，额定制冷量 7.2kW (3匹)，APF 4.75，360°立体环绕送风，商用写字楼最主流配置'
  },
  {
    id: 'split-gree-72-cab',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-72LW/NhAc1Bg (3.0匹柜机)',
    name: '格力 新一级能效商用变频立柜式空调 (3.0匹 / 7.2kW)',
    ratedCapacitykW: 7.2,
    ratedPowerkW: 1.65,
    copOrEff: 4.65,
    priceRmbTenThousand: 0.68,
    description: '格力商用变频柜机，额定制冷量 7.2kW，APF 4.65，远距离宽角度送风，适用于沿街商铺/餐厅大厅'
  },
  {
    id: 'split-gree-100-fcu',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-100TW/(1056T)NhAa-1 (4.0匹天花机)',
    name: '格力 新一级能效商用天井四面出风天花机 (4.0匹 / 10.0kW)',
    ratedCapacitykW: 10.0,
    ratedPowerkW: 2.30,
    copOrEff: 4.60,
    priceRmbTenThousand: 0.95,
    description: '格力商用天井卡式嵌入机，额定制冷量 10.0kW (4匹)，APF 4.60，大冷量紧凑嵌入吊顶'
  },
  {
    id: 'split-gree-120-fcu',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-120TW/(1256T)NhAa-1 (5.0匹天花机)',
    name: '格力 新一级能效商用天井四面出风天花机 (5.0匹 / 12.0kW)',
    ratedCapacitykW: 12.0,
    ratedPowerkW: 2.80,
    copOrEff: 4.55,
    priceRmbTenThousand: 1.15,
    description: '格力商用旗舰级五匹四面出风天花机，额定制冷量 12.0kW (5匹)，APF 4.55，大开间办公区/多功能会议厅首选'
  },
  {
    id: 'split-gree-125-cab',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-125LW/(1253S)NhBa-1 (5.0匹强劲柜机)',
    name: '格力 新一级能效商用动力立柜式空调 (5.0匹 / 12.5kW)',
    ratedCapacitykW: 12.5,
    ratedPowerkW: 2.95,
    copOrEff: 4.50,
    priceRmbTenThousand: 1.08,
    description: '格力大风量商用动力立柜机，额定制冷量 12.5kW，APF 4.50，满足高大空间急冷急热需求'
  },
  {
    id: 'split-gree-250-cab',
    category: 'split_ac',
    brand: '格力 (Gree)',
    model: 'KFR-250LW/(2553S)NhBa-1 (10.0匹特大型柜机)',
    name: '格力 大型商用柜式分体空调机组 (10.0匹 / 25.0kW)',
    ratedCapacitykW: 25.0,
    ratedPowerkW: 6.20,
    copOrEff: 4.30,
    priceRmbTenThousand: 2.20,
    description: '格力特大型十匹商用柜机，额定制冷量 25.0kW (10匹)，APF 4.30，适合展厅、车间或大跨度商业空间'
  }
];
