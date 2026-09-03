import type { BuildingSubItem, EquipmentCalcResult, EquipmentDiscrepancy, MonthlyEnergyRecord, ProjectEnergySummary, EnergyTariffConfig, LoadBinRecord, SCOPComplianceInfo } from '../types/hvac';
import { ENERGY_FACTORS, SYSTEM_TYPES_META, DEFAULT_TARIFF_CONFIG } from './constants';
import { generateHourlyWeather, type CityName } from './hourlyEngine/weatherGenerator';
import { simulateHourlyLoad } from './hourlyEngine/loadSimulator';
import { getRecommendedChillers } from './hourlyEngine/sizingEngine';
import { optimizeChillerPlant } from './hourlyEngine/systemOptimizer';
import { evaluateLcca, calculateHourlyElectricityPrice } from './hourlyEngine/lccaModel';

/**
 * 汇总整个项目的全年能耗、月度分布、碳排放与费用（集成 8760h 全年逐时气象、负荷与冷站全局寻优算法，支持自定义能源与峰谷平电价）
 */
export function calculateProjectSummary(
  items: BuildingSubItem[],
  tariffConfig?: EnergyTariffConfig
): ProjectEnergySummary {
  const tariff: EnergyTariffConfig = tariffConfig || DEFAULT_TARIFF_CONFIG;

  let totalArea = 0;
  let totalCoolingLoadkW = 0;
  let totalHeatingLoadkW = 0;
  let totalInstalledPowerkW = 0;

  let totalChillerCount = 0;
  let totalChillerCapacitykW = 0;
  let chillerBrandModel = '';

  const allDiscrepancies: EquipmentDiscrepancy[] = [];

  items.forEach(item => {
    totalArea += item.area;
    const calc = calculateEquipmentForSubItem(item, items);
    totalCoolingLoadkW += calc.coolingLoadkW;
    totalHeatingLoadkW += calc.heatingLoadkW;
    totalInstalledPowerkW += calc.totalInstalledElectricPowerkW;

    const count = item.customEquipment?.chillerCount || calc.chillerCount || 0;
    const cap = item.customEquipment?.chillerCapacitykW || calc.chillerCapacitykW || 0;
    if (count > 0 && cap > 0) {
      totalChillerCount += count;
      totalChillerCapacitykW += cap;
      if (item.customEquipment?.selectedChillerProduct) {
        chillerBrandModel = item.customEquipment.selectedChillerProduct.name;
      }
    }

    const itemDiscrepancies = checkDiscrepancies(item, calc, tariff);
    allDiscrepancies.push(...itemDiscrepancies);
  });

  if (items.length === 0 || totalArea === 0) {
    return {
      totalArea: 0,
      totalCoolingLoadkW: 0,
      totalHeatingLoadkW: 0,
      totalInstalledPowerkW: 0,
      annualElectricitykWh: 0,
      annualGasm3: 0,
      annualCostRmb: 0,
      annualCarbonTons: 0,
      energyIntensitykWhPerM2: 0,
      costPerM2: 0,
      monthlyData: [],
      discrepancies: [],
      tariffConfig: tariff,
      loadBins: []
    };
  }

  // 1. 获取代表城市（优先取第一个子项填写的 city，缺省为 上海）
  const primaryCity: CityName = items[0]?.city || '上海';
  const primaryType = items[0]?.type || 'office';

  // 2. 生成 8,760 小时天气与负荷
  const weatherRecords = generateHourlyWeather(primaryCity);
  const hourlyLoadRecords = simulateHourlyLoad(totalArea, primaryType, weatherRecords);

  // 3. 冷站选型推荐与能效全局寻优 (优先继承用户前置选型主机)
  const Q_peak_cool = hourlyLoadRecords[0]?.Q_peak_cool || totalCoolingLoadkW;
  const plantConfig = getRecommendedChillers(Q_peak_cool);
  
  // 若用户在前置设备表中已有明确主机配置，优先采用用户真实配置名称
  const activePlantConfigName = totalChillerCount > 0
    ? `${totalChillerCount}台 × ${(totalChillerCapacitykW / totalChillerCount).toFixed(0)}kW ${chillerBrandModel || '(变频离心/螺杆梯级)'}`
    : plantConfig.config_name;

  const optRecords = optimizeChillerPlant(hourlyLoadRecords, plantConfig, 30.0, 4.0);

  // 4. 8760h 负荷频次直方图 (Bin Analysis)
  const binRanges = [
    { label: '0-10%', min: 0, max: 10 },
    { label: '10-20%', min: 10, max: 20 },
    { label: '20-30%', min: 20, max: 30 },
    { label: '30-40%', min: 30, max: 40 },
    { label: '40-50%', min: 40, max: 50 },
    { label: '50-60%', min: 50, max: 60 },
    { label: '60-70%', min: 60, max: 70 },
    { label: '70-80%', min: 70, max: 80 },
    { label: '80-90%', min: 80, max: 90 },
    { label: '90-100%', min: 90, max: 100 },
  ];

  const binMap = binRanges.map(b => ({
    binRange: b.label,
    minRatio: b.min,
    maxRatio: b.max,
    hours: 0,
    coolingEnergykWh: 0,
    hoursPercentage: 0
  }));

  let totalCoolingHours = 0;
  hourlyLoadRecords.forEach(rec => {
    if (rec.Q_cool > 0) {
      totalCoolingHours++;
      const ratio = Math.min(99.9, (rec.Q_cool / Math.max(1, Q_peak_cool)) * 100);
      const binIdx = Math.floor(ratio / 10);
      if (binIdx >= 0 && binIdx < binMap.length) {
        binMap[binIdx].hours += 1;
        binMap[binIdx].coolingEnergykWh += rec.Q_cool;
      }
    }
  });

  const loadBins: LoadBinRecord[] = binMap.map(b => ({
    ...b,
    hoursPercentage: totalCoolingHours > 0 ? Number(((b.hours / totalCoolingHours) * 100).toFixed(1)) : 0,
    coolingEnergykWh: Math.round(b.coolingEnergykWh)
  }));

  // 5. LCCA 全生命周期三类改造方案比选
  const lccaResults = evaluateLcca(
    optRecords, totalArea,
    tariff.peakElectricityPrice,
    tariff.flatElectricityPrice,
    tariff.valleyElectricityPrice,
    tariff.gasPrice
  );

  // 6. 8760h 分时电价数组
  const hoursOfDay = optRecords.map(r => r.hourOfDay);
  const elecPrices = calculateHourlyElectricityPrice(
    hoursOfDay,
    tariff.peakElectricityPrice,
    tariff.flatElectricityPrice,
    tariff.valleyElectricityPrice
  );

  // 7. 聚合月度数据与全年总量
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthlyData: MonthlyEnergyRecord[] = [];

  // 8. 按天数累加至月
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let hourPointer = 0;

  let annualElectricitykWh = 0;
  let annualGasm3 = 0;
  let annualCostRmb = 0;
  let totBaseEleckWh = 0;
  let totOptEleckWh = 0;

  let totPlantChillerkWh = 0;
  let totPlantChwPumpkWh = 0;
  let totPlantCwPumpkWh = 0;
  let totPlantTowerkWh = 0;
  let totCoolingDemandkWh = 0;

  for (let m = 0; m < 12; m++) {
    const hoursInThisMonth = daysInMonths[m] * 24;

    let mCoolingkWh = 0;
    let mPumpskWh = 0;
    let mTowerskWh = 0;
    let mTerminalskWh = 0;
    let mGasm3 = 0;
    let mCostRmb = 0;

    for (let h = 0; h < hoursInThisMonth; h++) {
      const idx = hourPointer + h;
      if (idx >= optRecords.length) break;

      const rec = optRecords[idx];
      const price = elecPrices[idx];

      const pChiller = rec.opt_P_Chiller;
      const pChwp = rec.opt_P_CHWP;
      const pCwp = rec.opt_P_CWP;
      const pPumps = pChwp + pCwp;
      const pTowers = rec.opt_P_Tower;
      const pTerminals = totalArea * 0.008 * (rec.Q_cool > 0 || rec.Q_heat > 0 ? 1 : 0.1);

      mCoolingkWh += pChiller;
      mPumpskWh += pPumps;
      mTowerskWh += pTowers;
      mTerminalskWh += pTerminals;

      totPlantChillerkWh += pChiller;
      totPlantChwPumpkWh += pChwp;
      totPlantCwPumpkWh += pCwp;
      totPlantTowerkWh += pTowers;
      totCoolingDemandkWh += rec.Q_cool;

      totBaseEleckWh += rec.base_P_Total;
      totOptEleckWh += rec.opt_P_Total;

      let gas = 0;
      if (rec.Q_heat > 0) {
        gas = rec.Q_heat / (0.90 * 9.87);
        mGasm3 += gas;
      }

      const hourElec = pChiller + pPumps + pTowers + pTerminals;
      const hourCost = (hourElec * price) + (gas * tariff.gasPrice);
      mCostRmb += hourCost;
    }

    hourPointer += hoursInThisMonth;

    const totalElec = mCoolingkWh + mPumpskWh + mTowerskWh + mTerminalskWh;
    const avgCOP = mCoolingkWh > 0 ? (totalCoolingLoadkW / Math.max(1, mCoolingkWh / (hoursInThisMonth * 0.4))) : 4.0;

    monthlyData.push({
      month: m + 1,
      monthName: monthNames[m],
      coolingkWh: mCoolingkWh,
      heatingkWh: 0,
      pumpskWh: mPumpskWh,
      towerskWh: mTowerskWh,
      terminalsAndOtherkWh: mTerminalskWh,
      gasm3: mGasm3,
      totalElectricitkykWh: totalElec,
      totalCostRmb: mCostRmb,
      avgCOP: Math.min(6.5, Math.max(3.0, avgCOP))
    });

    annualElectricitykWh += totalElec;
    annualGasm3 += mGasm3;
    annualCostRmb += mCostRmb;
  }

  // 9. SCOP 计算与《公共建筑节能设计标准》GB 50189-2015 4.2.12 合规评定
  const totalPlantEleckWh = totPlantChillerkWh + totPlantChwPumpkWh + totPlantCwPumpkWh + totPlantTowerkWh;
  const rawSCOP = totalPlantEleckWh > 0 ? totCoolingDemandkWh / totalPlantEleckWh : 4.85;
  const scop = Number(rawSCOP.toFixed(2));

  let ratingLevel: '卓越 (五星级高效冷站)' | '优秀 (四星级高效冷站)' | '良好 (三星级高效冷站)' | '达标 (节能标准合格)' | '待提升' = '达标 (节能标准合格)';
  if (scop >= 5.5) {
    ratingLevel = '卓越 (五星级高效冷站)';
  } else if (scop >= 5.0) {
    ratingLevel = '优秀 (四星级高效冷站)';
  } else if (scop >= 4.5) {
    ratingLevel = '良好 (三星级高效冷站)';
  } else if (scop >= 3.8) {
    ratingLevel = '达标 (节能标准合格)';
  } else {
    ratingLevel = '待提升';
  }

  const scopCompliance: SCOPComplianceInfo = {
    scop,
    totalCoolingDemandkWh: Math.round(totCoolingDemandkWh),
    chillerEleckWh: Math.round(totPlantChillerkWh),
    chwPumpEleckWh: Math.round(totPlantChwPumpkWh),
    cwPumpEleckWh: Math.round(totPlantCwPumpkWh),
    towerEleckWh: Math.round(totPlantTowerkWh),
    totalPlantEleckWh: Math.round(totalPlantEleckWh),
    standardLimit: 3.50, // GB 50189 水冷冷站综合基准限值
    ratingLevel,
    isCompliant: scop >= 3.50,
    standardCode: 'GB 50189-2015 第4.2.12条'
  };

  const annualCarbonTons = ((annualElectricitykWh * tariff.electricityCarbon) + (annualGasm3 * tariff.gasCarbon)) / 1000;
  const energyIntensitykWhPerM2 = totalArea > 0 ? annualElectricitykWh / totalArea : 0;
  const costPerM2 = totalArea > 0 ? annualCostRmb / totalArea : 0;

  const savingsElectricitykWh = totBaseEleckWh - totOptEleckWh;
  const savingsRatePercent = totBaseEleckWh > 0 ? (savingsElectricitykWh / totBaseEleckWh) * 100.0 : 0.0;

  return {
    totalArea,
    totalCoolingLoadkW,
    totalHeatingLoadkW,
    totalInstalledPowerkW,
    annualElectricitykWh,
    annualGasm3,
    annualCostRmb,
    annualCarbonTons,
    energyIntensitykWhPerM2,
    costPerM2,
    monthlyData,
    discrepancies: allDiscrepancies,
    baselineElectricitykWh: totBaseEleckWh,
    optimizedElectricitykWh: totOptEleckWh,
    savingsElectricitykWh,
    savingsRatePercent,
    lccaResults,
    chillerPlantConfigName: activePlantConfigName,
    chillerPlantJustification: plantConfig.justification,
    tariffConfig: tariff,
    loadBins,
    scopCompliance
  };
}


/**
 * 计算单个建筑子项（考虑共用集中冷热源负荷合并及复合系统分拆）的标准 HVAC 设备配置容量与参数
 */
export function calculateEquipmentForSubItem(
  item: BuildingSubItem,
  allSubItems: BuildingSubItem[] = []
): EquipmentCalcResult {
  // 如果开启了“共用集中冷热源机房”，合并所有勾选共用且系统类型相同的建筑总面积与冷热负荷
  let effectiveArea = item.area;
  let effectiveCoolingIndex = item.coolingIndex;
  let effectiveHeatingIndex = item.heatingIndex;

  if (item.useSharedPlant && allSubItems.length > 0) {
    const sharedGroup = allSubItems.filter(s => s.useSharedPlant && s.systemType === item.systemType);
    if (sharedGroup.length > 0) {
      effectiveArea = sharedGroup.reduce((sum, s) => sum + s.area, 0);
      const totalCoolkW = sharedGroup.reduce((sum, s) => sum + (s.area * s.coolingIndex) / 1000, 0);
      const totalHeatkW = sharedGroup.reduce((sum, s) => sum + (s.area * s.heatingIndex) / 1000, 0);
      effectiveCoolingIndex = (totalCoolkW * 1000) / effectiveArea;
      effectiveHeatingIndex = (totalHeatkW * 1000) / effectiveArea;
    }
  }

  // 水温工况与温差 (风冷热泵缺省值：冷水 7/12°C, 热水 45/40°C；锅炉热水 60/50°C)
  const isAchp = item.systemType === 'air_heat_pump';

  const chwSupply = item.chwSupplyTemp ?? 7;
  const chwReturn = item.chwReturnTemp ?? 12;
  const deltaTchw = Math.max(1, chwReturn - chwSupply);

  const hwSupply = item.hwSupplyTemp ?? (isAchp ? 45 : 60);
  const hwReturn = item.hwReturnTemp ?? (isAchp ? 40 : 50);
  const deltaThw = Math.max(1, Math.abs(hwSupply - hwReturn));

  const cwSupply = item.cwSupplyTemp ?? 32;
  const cwReturn = item.cwReturnTemp ?? 37;
  const deltaTcw = Math.max(1, cwReturn - cwSupply);
  
  // 1. 冷负荷与热负荷 (kW)，同时使用系数 K_sim = 1.0
  const coolingLoadkW = (effectiveArea * effectiveCoolingIndex) / 1000;
  const heatingLoadkW = (effectiveArea * effectiveHeatingIndex) / 1000;

  const simFactor = 1.0;

  let chillerCapacitykW = 0;
  let chillerPowerkW = 0;
  let chillerCount = 0;
  const chillerCOP = 5.3;

  let boilerCapacitykW = 0;
  let boilerGasFlow = 0;
  let boilerCount = 0;
  const boilerEfficiency = 0.92;

  let chwPumpFlow = 0;
  let chwPumpHead = 0;
  let chwPumpPowerkW = 0;
  let chwPumpCount = 0;

  let cwPumpFlow = 0;
  let cwPumpHead = 0;
  let cwPumpPowerkW = 0;
  let cwPumpCount = 0;

  let coolingTowerFlow = 0;
  let coolingTowerFanPowerkW = 0;
  let coolingTowerCount = 0;

  let hwPumpFlow = 0;
  let hwPumpHead = 0;
  let hwPumpPowerkW = 0;
  let hwPumpCount = 0;

  let achpCoolingkW = 0;
  let achpHeatingkW = 0;
  let achpPowerkW = 0;
  let achpCount = 0;
  let achpSummerPumpPowerkW = 0;
  let achpWinterPumpPowerkW = 0;

  let vrfCoolingkW = 0;
  let vrfPowerkW = 0;
  let vrfCount = 0;

  let gshpCoolingkW = 0;
  let gshpGroundPumpPowerkW = 0;
  let gshpLoadPumpPowerkW = 0;
  let gshpCount = 0;

  let districtHexCapacitykW = 0;
  let districtPumpPowerkW = 0;

  let splitTotalCapacitykW = 0;
  let splitPowerkW = 0;

  if (item.systemType === 'hybrid') {
    const subSystems = item.hybridSubSystems && item.hybridSubSystems.length > 0 
      ? item.hybridSubSystems 
      : [
          { systemType: 'chiller_boiler' as const, ratioPercent: 60 },
          { systemType: 'vrf' as const, ratioPercent: 40 }
        ];

    subSystems.forEach(sub => {
      const subRatio = (sub.ratioPercent || 50) / 100;
      const subCoolLoad = coolingLoadkW * subRatio * simFactor;
      const subHeatLoad = heatingLoadkW * subRatio * simFactor;

      if (sub.systemType === 'chiller_boiler') {
        chillerCapacitykW += subCoolLoad;
        const subChillerCount = subCoolLoad <= 2500 ? 2 : subCoolLoad <= 5500 ? 3 : 4;
        chillerCount += subChillerCount;
        chillerPowerkW += subCoolLoad / chillerCOP;

        boilerCapacitykW += subHeatLoad * 1.1;
        const subBoilerCount = (subHeatLoad * 1.1) <= 1500 ? 2 : 3;
        boilerCount += subBoilerCount;
        boilerGasFlow += ((subHeatLoad * 1.1) / (9.967 * boilerEfficiency));

        const subChwFlow = (subCoolLoad * 3.6) / (4.186 * deltaTchw);
        chwPumpFlow += subChwFlow;
        chwPumpHead = 28;
        chwPumpPowerkW += (subChwFlow * 28) / 247.7;
        chwPumpCount += subChillerCount; // 冷水泵一机对一泵

        const qCond = subCoolLoad * (1 + 1 / chillerCOP);
        const subCwFlow = (qCond * 3.6) / (4.186 * deltaTcw);
        cwPumpFlow += subCwFlow;
        cwPumpHead = 24;
        cwPumpPowerkW += (subCwFlow * 24) / 247.7;
        cwPumpCount += subChillerCount; // 冷却泵一机对一泵

        coolingTowerFlow += subCwFlow * 1.15;
        coolingTowerFanPowerkW += subCwFlow * 1.15 * 0.18;
        coolingTowerCount += subChillerCount; // 冷却塔一泵对一塔

        const subHwFlow = (subHeatLoad * 1.1 * 3.6) / (4.186 * deltaThw);
        hwPumpFlow += subHwFlow;
        hwPumpHead = 22;
        hwPumpPowerkW += (subHwFlow * 22) / 247.7;
        hwPumpCount += subBoilerCount; // 热水泵一锅炉对一泵
      } else if (sub.systemType === 'vrf') {
        vrfCoolingkW += subCoolLoad;
        const vrfAPF = 5.30; // 遵循 GB 21454-2021 全年能源消耗效率 APF
        vrfPowerkW += subCoolLoad / vrfAPF;
        vrfCount += Math.ceil(subCoolLoad / 60);
      } else if (sub.systemType === 'air_heat_pump') {
        achpCoolingkW += subCoolLoad;
        achpHeatingkW += subHeatLoad;
        achpCount += Math.ceil(subCoolLoad / 250);
        achpPowerkW += subCoolLoad / 3.2;

        const subChwFlow = (subCoolLoad * 3.6) / (4.186 * deltaTchw);
        chwPumpFlow += subChwFlow;
        chwPumpPowerkW += (subChwFlow * 25) / 247.7;
        achpSummerPumpPowerkW += (subChwFlow * 25) / 247.7;

        const subHwFlow = (subHeatLoad * 3.6) / (4.186 * deltaThw);
        hwPumpFlow += subHwFlow;
        hwPumpPowerkW += (subHwFlow * 22) / 247.7;
        achpWinterPumpPowerkW += (subHwFlow * 22) / 247.7;
      }
    });

  } else {

    switch (item.systemType) {
      case 'chiller_boiler': {
        chillerCapacitykW = coolingLoadkW * simFactor;
        chillerCount = chillerCapacitykW <= 2500 ? 2 : chillerCapacitykW <= 5500 ? 3 : 4;
        chillerPowerkW = chillerCapacitykW / chillerCOP;

        boilerCapacitykW = heatingLoadkW * 1.1;
        boilerCount = boilerCapacitykW <= 1500 ? 2 : 3;
        boilerGasFlow = (boilerCapacitykW / (9.967 * boilerEfficiency)); 

        chwPumpFlow = (chillerCapacitykW * 3.6) / (4.186 * deltaTchw);
        chwPumpHead = 28;
        chwPumpPowerkW = (chwPumpFlow * chwPumpHead) / 247.7;
        chwPumpCount = chillerCount; // 一机对一泵

        const qCond = chillerCapacitykW * (1 + 1 / chillerCOP);
        cwPumpFlow = (qCond * 3.6) / (4.186 * deltaTcw);
        cwPumpHead = 24;
        cwPumpPowerkW = (cwPumpFlow * cwPumpHead) / 247.7;
        cwPumpCount = chillerCount; // 一机对一泵

        coolingTowerFlow = cwPumpFlow * 1.15;
        coolingTowerFanPowerkW = coolingTowerFlow * 0.18;
        coolingTowerCount = chillerCount; // 一泵对一塔

        hwPumpFlow = (boilerCapacitykW * 3.6) / (4.186 * deltaThw);
        hwPumpHead = 22;
        hwPumpPowerkW = (hwPumpFlow * hwPumpHead) / 247.7;
        hwPumpCount = boilerCount; // 一锅炉对一热水泵
        break;
      }

      case 'air_heat_pump': {
        achpCoolingkW = coolingLoadkW * simFactor;
        achpHeatingkW = heatingLoadkW * simFactor;
        achpCount = Math.ceil(achpCoolingkW / 250);
        const copCool = 3.2;
        achpPowerkW = achpCoolingkW / copCool;

        // 夏季冷水水泵流量 (使用用户填写的冷水供回水温差 deltaTchw，缺省 7/12°C)
        chwPumpFlow = (achpCoolingkW * 3.6) / (4.186 * deltaTchw);
        chwPumpHead = 25;
        chwPumpPowerkW = (chwPumpFlow * chwPumpHead) / 247.7;
        chwPumpCount = achpCount > 2 ? 3 : 2;
        achpSummerPumpPowerkW = chwPumpPowerkW;

        // 冬季热水水泵流量 (使用用户填写的热水供回水温差 deltaThw，缺省 45/40°C)
        hwPumpFlow = (achpHeatingkW * 3.6) / (4.186 * deltaThw);
        hwPumpHead = 22;
        hwPumpPowerkW = (hwPumpFlow * hwPumpHead) / 247.7;
        hwPumpCount = achpCount > 2 ? 3 : 2;
        achpWinterPumpPowerkW = hwPumpPowerkW;
        break;
      }

      case 'vrf': {
        vrfCoolingkW = coolingLoadkW * simFactor;
        const vrfAPF = 5.30; // 遵循 GB 21454-2021 全年能源消耗效率 APF
        vrfPowerkW = vrfCoolingkW / vrfAPF;
        vrfCount = Math.ceil(vrfCoolingkW / 60);
        break;
      }

      case 'district_energy': {
        districtHexCapacitykW = coolingLoadkW;
        chwPumpFlow = (coolingLoadkW * 3.6) / (4.186 * deltaTchw);
        chwPumpHead = 26;
        chwPumpPowerkW = (chwPumpFlow * chwPumpHead) / 247.7;
        chwPumpCount = 3;

        hwPumpFlow = (heatingLoadkW * 3.6) / (4.186 * deltaThw);
        hwPumpHead = 22;
        hwPumpPowerkW = (hwPumpFlow * hwPumpHead) / 247.7;
        hwPumpCount = 3;

        districtPumpPowerkW = chwPumpPowerkW;
        break;
      }

      case 'split_ac': {
        splitTotalCapacitykW = coolingLoadkW;
        const splitAPF = 4.2;
        splitPowerkW = splitTotalCapacitykW / splitAPF;
        break;
      }

      case 'ground_heat_pump': {
        gshpCoolingkW = coolingLoadkW * simFactor;
        const gshpCOP = 5.6;
        const gshpElectrickW = gshpCoolingkW / gshpCOP;
        gshpCount = Math.ceil(gshpCoolingkW / 400);

        const groundHeatRejection = gshpCoolingkW * (1 + 1 / gshpCOP);
        const groundFlow = (groundHeatRejection * 3.6) / (4.186 * 4.5);
        gshpGroundPumpPowerkW = (groundFlow * 32) / 247.7;

        const loadFlow = (gshpCoolingkW * 3.6) / (4.186 * deltaTchw);
        gshpLoadPumpPowerkW = (loadFlow * 26) / 247.7;

        chwPumpFlow = loadFlow;
        chwPumpPowerkW = gshpLoadPumpPowerkW;
        chwPumpHead = 26;

        chillerCapacitykW = gshpCoolingkW;
        chillerPowerkW = gshpElectrickW;
        break;
      }
    }
  }

  // 覆盖自定义与真实选型品牌设备物理铭牌电量及气耗（仅影响总装机电功率和年能耗精算，不改变推荐标准值）
  const custom = item.customEquipment || {};
  const recChillerCount = chillerCount;
  const recBoilerCount = boilerCount;
  const recChwPumpCount = chwPumpCount;
  const recCwPumpCount = cwPumpCount;
  const recCoolingTowerCount = coolingTowerCount;
  const recHwPumpCount = hwPumpCount;
  const recAchpCount = achpCount;
  const recVrfCount = vrfCount;
  const recAchpCoolingkW = achpCoolingkW;
  const recAchpHeatingkW = achpHeatingkW;

  if (custom.selectedChillerProduct) {
    chillerPowerkW = custom.selectedChillerProduct.actualPowerkW * (custom.chillerCount || recChillerCount);
  } else if (custom.chillerCapacitykW) {
    chillerPowerkW = custom.chillerCapacitykW / chillerCOP;
  }

  if (custom.selectedBoilerProduct) {
    boilerGasFlow = (custom.selectedBoilerProduct.gasFlowm3h || (custom.selectedBoilerProduct.ratedCapacitykW / (9.967 * 0.95))) * (custom.boilerCount || recBoilerCount);
  } else if (custom.boilerCapacitykW) {
    boilerGasFlow = custom.boilerCapacitykW / (9.967 * boilerEfficiency);
  }

  if (custom.selectedChwPumpProduct) {
    chwPumpPowerkW = custom.selectedChwPumpProduct.actualPowerkW * (custom.chwPumpCount || recChwPumpCount);
  } else if (custom.chwPumpFlow) {
    chwPumpPowerkW = (custom.chwPumpFlow * chwPumpHead) / 247.7;
  }

  if (custom.selectedCwPumpProduct) {
    cwPumpPowerkW = custom.selectedCwPumpProduct.actualPowerkW * (custom.cwPumpCount || recCwPumpCount);
  } else if (custom.cwPumpFlow) {
    cwPumpPowerkW = (custom.cwPumpFlow * cwPumpHead) / 247.7;
  }

  if (custom.selectedTowerProduct) {
    coolingTowerFanPowerkW = custom.selectedTowerProduct.actualPowerkW * (custom.coolingTowerCount || recCoolingTowerCount);
  } else if (custom.coolingTowerFlow) {
    coolingTowerFanPowerkW = custom.coolingTowerFlow * 0.18;
  }

  if (custom.selectedHwPumpProduct) {
    hwPumpPowerkW = custom.selectedHwPumpProduct.actualPowerkW * (custom.hwPumpCount || recHwPumpCount);
  } else if (custom.hwPumpFlow) {
    hwPumpPowerkW = (custom.hwPumpFlow * hwPumpHead) / 247.7;
  }

  if (custom.selectedAchpProduct) {
    achpPowerkW = custom.selectedAchpProduct.actualPowerkW * (custom.achpCount || recAchpCount);
  } else if (custom.achpCoolingkW) {
    achpPowerkW = custom.achpCoolingkW / 3.2;
  }

  if (custom.selectedVrfProduct) {
    vrfPowerkW = custom.selectedVrfProduct.actualPowerkW * (custom.vrfCount || recVrfCount);
  } else if (custom.vrfCoolingkW) {
    vrfPowerkW = custom.vrfCoolingkW / 5.30;
  }

  const achpChwPumpFlow = recAchpCoolingkW > 0 ? (recAchpCoolingkW * 3.6) / (4.186 * deltaTchw) : 0;
  const achpHwPumpFlow = recAchpHeatingkW > 0 ? (recAchpHeatingkW * 3.6) / (4.186 * deltaThw) : 0;
  const achpChwPumpCount = recAchpCount > 0 ? recAchpCount : 0;
  const achpHwPumpCount = recAchpCount > 0 ? recAchpCount : 0;

  const sysMeta = SYSTEM_TYPES_META[item.systemType];

  const totalInstalledElectricPowerkW = 
    chillerPowerkW + 
    (sysMeta.hasChilledWaterPump ? chwPumpPowerkW : 0) + 
    (sysMeta.hasCoolingWaterPump ? cwPumpPowerkW : 0) + 
    (sysMeta.hasCoolingTower ? coolingTowerFanPowerkW : 0) + 
    (sysMeta.hasHotWaterPump ? hwPumpPowerkW : 0) + 
    achpPowerkW + 
    vrfPowerkW + 
    gshpGroundPumpPowerkW + 
    gshpLoadPumpPowerkW + 
    districtPumpPowerkW + 
    splitPowerkW;

  return {
    deltaTchw,
    deltaThw,
    deltaTcw,
    coolingLoadkW,
    heatingLoadkW,
    chillerCapacitykW,
    chillerPowerkW,
    chillerCount,
    chillerCOP,
    boilerCapacitykW,
    boilerGasFlow,
    boilerCount,
    boilerEfficiency,
    chwPumpFlow,
    chwPumpHead,
    chwPumpPowerkW,
    chwPumpCount,
    cwPumpFlow,
    cwPumpHead,
    cwPumpPowerkW,
    cwPumpCount,
    coolingTowerFlow,
    coolingTowerFanPowerkW,
    coolingTowerCount,
    hwPumpFlow,
    hwPumpHead,
    hwPumpPowerkW,
    hwPumpCount,
    achpCoolingkW,
    achpHeatingkW,
    achpPowerkW,
    achpCount,
    achpChwPumpFlow,
    achpHwPumpFlow,
    achpChwPumpCount,
    achpHwPumpCount,
    achpSummerPumpPowerkW,
    achpWinterPumpPowerkW,
    vrfCoolingkW,
    vrfPowerkW,
    vrfCount,
    gshpCoolingkW,
    gshpGroundPumpPowerkW,
    gshpLoadPumpPowerkW,
    gshpCount,
    districtHexCapacitykW,
    districtPumpPowerkW,
    splitTotalCapacitykW,
    splitPowerkW,
    totalInstalledElectricPowerkW
  };
}

/**
 * 校验用户手动配置 vs 程序推荐计算配置
 */
export function checkDiscrepancies(
  item: BuildingSubItem, 
  calc: EquipmentCalcResult,
  tariffConfig?: EnergyTariffConfig
): EquipmentDiscrepancy[] {
  const custom = item.customEquipment;
  if (!custom) return [];

  const list: EquipmentDiscrepancy[] = [];
  const hours = item.operatingHours || 3000;
  const sysMeta = SYSTEM_TYPES_META[item.systemType];
  const elecPrice = tariffConfig?.averageElectricityPrice || ENERGY_FACTORS.electricityPrice;

  const evaluateField = (
    equipmentName: string,
    paramName: string,
    calcVal: number,
    userVal: number | undefined,
    unit: string,
    powerMultiplier: number = 0
  ) => {
    if (userVal === undefined || userVal === 0 || calcVal === 0) return;

    const ratio = userVal / calcVal;
    const diffPercent = ((userVal - calcVal) / calcVal) * 100;

    if (ratio < 0.95 || ratio > 1.10) {
      const isOversized = ratio > 1.10;
      const warningLevel = isOversized ? 'oversized' : 'undersized';

      let extraPower = 0;
      if (powerMultiplier > 0) {
        extraPower = (userVal - calcVal) * powerMultiplier;
      } else if (paramName.includes('功率') || paramName.includes('容量') || paramName.includes('制冷量')) {
        extraPower = (userVal - calcVal) * 0.2;
      }

      const extraAnnualCost = extraPower * hours * elecPrice;

      let message = '';
      if (isOversized) {
        message = `⚠️ 【红字预警】用户配置的${equipmentName}${paramName} (${userVal.toFixed(1)}${unit}) 超出标准推荐计算值 (${calcVal.toFixed(1)}${unit}) 的 110% 范围 (超出 +${diffPercent.toFixed(1)}%)！`;
        if (extraPower > 0) {
          message += ` 会导致设备在低负荷低效率区运行，功率增加约 ${extraPower.toFixed(1)} kW，预计每年多消耗电费约 ¥${(extraAnnualCost / 10000).toFixed(2)} 万元！`;
        } else {
          message += ` 将导致初投资偏高且大马拉小车。`;
        }
      } else {
        message = `⚠️ 【红字预警】用户配置的${equipmentName}${paramName} (${userVal.toFixed(1)}${unit}) 低于标准推荐计算值 (${calcVal.toFixed(1)}${unit}) 的 95% 下限 (偏小 ${diffPercent.toFixed(1)}%)！极端天气可能无法满足室内高峰冷/热负荷要求！`;
      }

      list.push({
        paramName,
        equipmentName,
        recommendedValue: calcVal,
        userValue: userVal,
        unit,
        diffPercent,
        isWarning: true,
        warningLevel,
        extraPowerkW: Math.max(0, extraPower),
        extraAnnualCost: Math.max(0, extraAnnualCost),
        message
      });
    }
  };

  if (item.systemType === 'chiller_boiler' || item.systemType === 'hybrid') {
    evaluateField('冷水机组', '容量', calc.chillerCapacitykW, custom.chillerCapacitykW, 'kW');
    evaluateField('燃气锅炉', '容量', calc.boilerCapacitykW, custom.boilerCapacitykW, 'kW');
  }

  if (sysMeta.hasChilledWaterPump && custom.chwPumpFlow && calc.chwPumpFlow > 0) {
    const head = custom.chwPumpHead || calc.chwPumpHead;
    const powerPerFlow = head / 247.7;
    evaluateField('冷水水泵', '流量', calc.chwPumpFlow, custom.chwPumpFlow, 'm³/h', powerPerFlow);
  }

  if (sysMeta.hasCoolingWaterPump && custom.cwPumpFlow && calc.cwPumpFlow > 0) {
    const head = custom.cwPumpHead || calc.cwPumpHead;
    const powerPerFlow = head / 247.7;
    evaluateField('冷却水水泵', '流量', calc.cwPumpFlow, custom.cwPumpFlow, 'm³/h', powerPerFlow);
  }

  if (sysMeta.hasCoolingTower && custom.coolingTowerFlow && calc.coolingTowerFlow > 0) {
    evaluateField('冷却塔', '处理流量', calc.coolingTowerFlow, custom.coolingTowerFlow, 'm³/h', 0.18);
  }

  if (sysMeta.hasHotWaterPump && custom.hwPumpFlow && calc.hwPumpFlow > 0) {
    const head = custom.hwPumpHead || calc.hwPumpHead;
    evaluateField('独立热水水泵', '流量', calc.hwPumpFlow, custom.hwPumpFlow, 'm³/h', head / 247.7);
  }

  evaluateField('风冷热泵', '制冷量', calc.achpCoolingkW, custom.achpCoolingkW, 'kW', 1 / 3.2);
  evaluateField('VRF多联机', '制冷容量 (APF计算)', calc.vrfCoolingkW, custom.vrfCoolingkW, 'kW', 1 / 5.30);

  return list;
}

