import type { BuildingSubItem } from '../types/hvac';

export const INITIAL_SUB_ITEMS: BuildingSubItem[] = [
  {
    id: 'sub-1',
    name: '五星级豪华酒店',
    type: 'hotel',
    area: 25000,
    coolingIndex: 130,
    heatingIndex: 80,
    operatingHours: 6500,
    systemType: 'chiller_boiler',
    chwSupplyTemp: 7,
    chwReturnTemp: 12,
    hwSupplyTemp: 60,
    hwReturnTemp: 50,
    cwSupplyTemp: 32,
    cwReturnTemp: 37,
    city: '上海',
    customEquipment: {}
  },
  {
    id: 'sub-2',
    name: '甲级双子塔办公楼',
    type: 'office',
    area: 42000,
    coolingIndex: 110,
    heatingIndex: 70,
    operatingHours: 2800,
    systemType: 'chiller_boiler',
    chwSupplyTemp: 7,
    chwReturnTemp: 12,
    hwSupplyTemp: 60,
    hwReturnTemp: 50,
    cwSupplyTemp: 32,
    cwReturnTemp: 37,
    city: '北京',
    customEquipment: {}
  },
  {
    id: 'sub-3',
    name: '大型商业购物中心 Mall',
    type: 'mall',
    area: 38000,
    coolingIndex: 145,
    heatingIndex: 90,
    operatingHours: 4700,
    systemType: 'chiller_boiler',
    chwSupplyTemp: 7,
    chwReturnTemp: 12,
    hwSupplyTemp: 60,
    hwReturnTemp: 50,
    cwSupplyTemp: 32,
    cwReturnTemp: 37,
    city: '广州',
    customEquipment: {}
  }
];
