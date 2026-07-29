export type BuildingType = 
  | 'hotel'        // 酒店
  | 'office'       // 办公楼
  | 'mall'         // 商业Mall
  | 'supermarket'  // 大型超市
  | 'restaurant'   // 餐饮
  | 'hospital'     // 医院
  | 'other';       // 其他

export interface BuildingTypeMeta {
  id: BuildingType;
  name: string;
  defaultCoolingIndex: number; // W/m²
  defaultHeatingIndex: number; // W/m²
  defaultOperatingHours: number; // h/year
  icon: string;
}

export type SystemType =
  | 'chiller_boiler'     // 1. 冷水机组 + 锅炉系统
  | 'air_heat_pump'      // 2. 风冷热泵系统
  | 'vrf'                 // 3. 多联机系统 (VRF/VRV)
  | 'district_energy'    // 4. 区域能源站系统
  | 'split_ac'           // 5. 分体空调系统
  | 'ground_heat_pump'   // 6. 地源热泵系统
  | 'hybrid';            // 7. 复合空调系统 (由上述2种或以上系统组合)

export interface SystemTypeMeta {
  id: SystemType;
  name: string;
  description: string;
  primaryEquipment: string[];
  hasCoolingTower: boolean;
  hasChilledWaterPump: boolean;
  hasHotWaterPump: boolean;
  hasCoolingWaterPump: boolean;
}

// 复合系统的子系统分配配置
export interface HybridSubSystemConfig {
  systemType: SystemType;
  ratioPercent: number; // 承担负荷比例 % (例如 40%)
  allocatedCoolingkW?: number; // 分配的具体冷量 kW
  allocatedHeatingkW?: number; // 分配的具体热量 kW
}

// 共享集中冷热源机房配置
export interface SharedEnergyPlant {
  id: string;
  name: string;
  systemType: SystemType;
  linkedSubItemIds: string[];
}

export interface BuildingSubItem {
  id: string;
  name: string;
  type: BuildingType;
  area: number; // m²
  coolingIndex: number; // W/m²
  heatingIndex: number; // W/m²
  operatingHours: number; // h/year
  systemType: SystemType;
  
  // 复合空调系统子系统配置（仅在 systemType === 'hybrid' 时生效）
  hybridSubSystems?: HybridSubSystemConfig[];

  // 共享冷热源关联
  useSharedPlant?: boolean;
  sharedPlantId?: string;

  // 水温工况参数（用户可自定义填写）
  chwSupplyTemp: number; // 冷冻水供水温度 °C (默认 7)
  chwReturnTemp: number; // 冷冻水回水温度 °C (默认 12)
  hwSupplyTemp: number;  // 热水供水温度 °C (默认 60)
  hwReturnTemp: number;  // 热水回水温度 °C (默认 50)
  cwSupplyTemp: number;  // 冷却水进水温度 °C (默认 32)
  cwReturnTemp: number;  // 冷却水出水温度 °C (默认 37)

  customEquipment?: UserEquipmentOverrides;
}

// 设备配置及计算结果
export interface EquipmentCalcResult {
  // 温差计算结果
  deltaTchw: number; // 冷冻水温差 °C
  deltaThw: number;  // 热水温差 °C
  deltaTcw: number;  // 冷却水温差 °C

  // 冷负荷 & 热负荷
  coolingLoadkW: number;
  heatingLoadkW: number;

  // 冷水机组
  chillerCapacitykW: number;
  chillerPowerkW: number;
  chillerCount: number;
  chillerCOP: number;

  // 锅炉
  boilerCapacitykW: number;
  boilerGasFlow: number; // m³/h
  boilerCount: number;
  boilerEfficiency: number;

  // 冷水水泵 (夏季冷水泵)
  chwPumpFlow: number; // m³/h
  chwPumpHead: number; // m
  chwPumpPowerkW: number; // kW
  chwPumpCount: number;

  // 热水水泵 (冬季热水泵/锅炉独立热水泵)
  hwPumpFlow: number; // m³/h
  hwPumpHead: number; // m
  hwPumpPowerkW: number; // kW
  hwPumpCount: number;

  // 冷却水水泵
  cwPumpFlow: number; // m³/h
  cwPumpHead: number; // m
  cwPumpPowerkW: number; // kW
  cwPumpCount: number;

  // 冷却塔
  coolingTowerFlow: number; // m³/h
  coolingTowerFanPowerkW: number; // kW
  coolingTowerCount: number;

  // 风冷热泵
  achpCoolingkW: number;
  achpHeatingkW: number;
  achpPowerkW: number;
  achpCount: number;
  achpSummerPumpPowerkW: number; // 夏季冷水泵功率 kW
  achpWinterPumpPowerkW: number; // 冬季热水泵功率 kW

  // VRF多联机
  vrfCoolingkW: number;
  vrfPowerkW: number;
  vrfCount: number;

  // 地源热泵
  gshpCoolingkW: number;
  gshpGroundPumpPowerkW: number;
  gshpLoadPumpPowerkW: number;
  gshpCount: number;

  // 区域能源站
  districtHexCapacitykW: number;
  districtPumpPowerkW: number;

  // 分体空调
  splitTotalCapacitykW: number;
  splitPowerkW: number;

  // 总装机功率
  totalInstalledElectricPowerkW: number;
}

export interface SelectedBrandProduct {
  catalogId: string;
  brand: string;
  model: string;
  name: string;
  ratedCapacitykW: number;
  actualPowerkW: number; // 实际选型电量参数 (非计算公式算得)
  gasFlowm3h?: number;
}

export interface UserEquipmentOverrides {
  chillerCapacitykW?: number;
  chillerCount?: number;
  selectedChillerProduct?: SelectedBrandProduct;

  boilerCapacitykW?: number;
  boilerCount?: number;
  selectedBoilerProduct?: SelectedBrandProduct;
  
  chwPumpFlow?: number;
  chwPumpHead?: number;
  chwPumpCount?: number;
  selectedChwPumpProduct?: SelectedBrandProduct;
  
  cwPumpFlow?: number;
  cwPumpHead?: number;
  cwPumpCount?: number;
  selectedCwPumpProduct?: SelectedBrandProduct;

  coolingTowerFlow?: number;
  coolingTowerCount?: number;
  selectedTowerProduct?: SelectedBrandProduct;

  hwPumpFlow?: number;
  hwPumpHead?: number;
  hwPumpCount?: number;
  selectedHwPumpProduct?: SelectedBrandProduct;

  achpCoolingkW?: number;
  achpCount?: number;
  selectedAchpProduct?: SelectedBrandProduct;

  vrfCoolingkW?: number;
  vrfCount?: number;
  selectedVrfProduct?: SelectedBrandProduct;
  
  gshpCoolingkW?: number;
  gshpCount?: number;
}

export interface EquipmentDiscrepancy {
  paramName: string;
  equipmentName: string;
  recommendedValue: number;
  userValue: number;
  unit: string;
  diffPercent: number;
  isWarning: boolean;
  warningLevel: 'oversized' | 'undersized' | 'optimal';
  extraPowerkW: number;
  extraAnnualCost: number;
  message: string;
}

export interface MonthlyEnergyRecord {
  month: number;
  monthName: string;
  coolingkWh: number;
  heatingkWh: number;
  pumpskWh: number;
  towerskWh: number;
  terminalsAndOtherkWh: number;
  gasm3: number;
  totalElectricitkykWh: number;
  totalCostRmb: number;
  avgCOP: number;
}

export interface ProjectEnergySummary {
  totalArea: number; // m²
  totalCoolingLoadkW: number;
  totalHeatingLoadkW: number;
  totalInstalledPowerkW: number;
  
  annualElectricitykWh: number;
  annualGasm3: number;
  annualCostRmb: number;
  annualCarbonTons: number;
  
  energyIntensitykWhPerM2: number;
  costPerM2: number;
  
  monthlyData: MonthlyEnergyRecord[];
  discrepancies: EquipmentDiscrepancy[];
}

// ----------------------------------------------------
// 既有建筑系统明细设备数据类型（改造模块专属）
// ----------------------------------------------------
export interface ExistingChillerDetail {
  id: string;
  modelName: string;
  capacitykW: number;
  powerkW: number;
  cop: number;
  count: number;
}

export interface ExistingBoilerDetail {
  id: string;
  modelName: string;
  capacitykW: number;
  powerkW: number;
  gasFlowm3h: number;
  efficiencyPercent: number;
  count: number;
}

export interface ExistingPumpDetail {
  id: string;
  modelName: string;
  type: 'chw' | 'cw' | 'hw';
  flowm3h: number;
  headm: number;
  powerkW: number;
  efficiencyPercent: number;
  count: number;
}

export interface ExistingAchpDetail {
  id: string;
  modelName: string;
  coolingkW: number;
  heatingkW: number;
  powerkW: number;
  cop: number;
  count: number;
}

export interface ExistingVrfDetail {
  id: string;
  modelName: string;
  coolingkW: number;
  powerkW: number;
  eer: number;
  count: number;
}

export interface ExistingDistrictDetail {
  id: string;
  modelName: string;
  capacitykW: number;
  pumpFlowm3h: number;
  pumpPowerkW: number;
  count: number;
}

export interface ExistingGshpDetail {
  id: string;
  modelName: string;
  coolingkW: number;
  powerkW: number;
  cop: number;
  groundFlowm3h: number;
  groundPumpPowerkW: number;
  loadFlowm3h: number;
  loadPumpPowerkW: number;
  count: number;
}

export interface ExistingSplitDetail {
  id: string;
  modelName: string;
  capacitykW: number;
  powerkW: number;
  apf: number;
  count: number;
}
