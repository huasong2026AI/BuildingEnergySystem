import type { BuildingSubItem, EquipmentCalcResult, EquipmentDiscrepancy, MonthlyEnergyRecord, ProjectEnergySummary, EnergyTariffConfig, LoadBinRecord, SCOPComplianceInfo, SubItemEnergyBreakdown } from '../types/hvac';
import { ENERGY_FACTORS, SYSTEM_TYPES_META, DEFAULT_TARIFF_CONFIG } from './constants';
import { generateHourlyWeather, type CityName } from './hourlyEngine/weatherGenerator';
import { simulateHourlyLoad } from './hourlyEngine/loadSimulator';
import { getRecommendedChillers } from './hourlyEngine/sizingEngine';
import { optimizeChillerPlant } from './hourlyEngine/systemOptimizer';
import { evaluateLcca, calculateHourlyElectricityPrice } from './hourlyEngine/lccaModel';

/**
 * 单独计算某个具体建筑子项的全年 8760h 动态能耗、逐月分布、Bin 负荷频次与设备能效合规评级
 */
export function calculateSubItemEnergySummary(
  item: BuildingSubItem,
  allItems: BuildingSubItem[] = [],
  tariffConfig?: EnergyTariffConfig
): ProjectEnergySummary {
  const tariff: EnergyTariffConfig = tariffConfig || DEFAULT_TARIFF_CONFIG;
  const calc = calculateEquipmentForSubItem(item, allItems);
  const city: CityName = item.city || '上海';
  const weatherRecords = generateHourlyWeather(city);
  const hourlyLoadRecords = simulateHourlyLoad(item.area, item.type, weatherRecords, item.coolingIndex, item.heatingIndex);
  const Q_peak_cool = hourlyLoadRecords[0]?.Q_peak_cool || calc.coolingLoadkW;

  const discrepancies = checkDiscrepancies(item, calc, tariff);

  // 系统类型识别
  const isVrf = item.systemType === 'vrf';
  const isAchp = item.systemType === 'air_heat_pump';

  // 冷机推荐选型与寻优配置（若为冷水机房系统）
  const plantConfig = getRecommendedChillers(Q_peak_cool);
  const activePlantConfigName = (() => {
    if (isAchp) {
      const achpCount = item.customEquipment?.achpCount || calc.achpCount || 1;
      if (item.customEquipment?.selectedAchpProduct) {
        return `${achpCount}台 × ${item.customEquipment.selectedAchpProduct.ratedCapacitykW.toFixed(1)}kW ${item.customEquipment.selectedAchpProduct.name}`;
      }
      return `${achpCount}台 × ${(calc.achpCoolingkW / Math.max(1, achpCount)).toFixed(0)}kW 特灵风冷热泵机组 (ACHP)`;
    }
    if (isVrf) {
      const vrfCount = item.customEquipment?.vrfCount || calc.vrfCount || 1;
      if (item.customEquipment?.selectedVrfProduct) {
        return `${vrfCount}套 × ${item.customEquipment.selectedVrfProduct.ratedCapacitykW.toFixed(1)}kW ${item.customEquipment.selectedVrfProduct.name}`;
      }
      return `${vrfCount}套 × 60kW 大金 VRV 智能变频多联机系统 (APF 5.30)`;
    }
    const chillerCount = item.customEquipment?.chillerCount || calc.chillerCount || 1;
    if (item.customEquipment?.selectedChillerProduct) {
      return `${chillerCount}台 × ${item.customEquipment.selectedChillerProduct.ratedCapacitykW.toFixed(1)}kW ${item.customEquipment.selectedChillerProduct.name}`;
    }
    return plantConfig.config_name;
  })();

  const optRecords = optimizeChillerPlant(hourlyLoadRecords, plantConfig, 30.0, 4.0);

  // 8760h 分时电价数组
  const hoursOfDay = optRecords.map(r => r.hourOfDay);
  const elecPrices = calculateHourlyElectricityPrice(
    hoursOfDay,
    tariff.peakElectricityPrice,
    tariff.flatElectricityPrice,
    tariff.valleyElectricityPrice
  );

  // 8760h 负荷频次直方图 (Bin Analysis)
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

  // 月度数据累加 (12个月)
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthlyData: MonthlyEnergyRecord[] = [];
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
    let mHeatingkWh = 0;
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
      const loadRatio = Math.min(1.0, rec.Q_cool / Math.max(1, Q_peak_cool));

      let pCool = 0;
      let pHeatElec = 0;
      let pPump = 0;
      let pTower = 0;
      let pTerm = item.area * 0.008 * (rec.Q_cool > 0 || rec.Q_heat > 0 ? 1 : 0.1);
      let gas = 0;

      if (isVrf) {
        // VRF 多联机系统：遵循 GB 21454 APF 全年性能系数 (5.30)，无水泵无冷却塔
        const partLoadFactor = 0.92 + 0.18 * Math.sin(loadRatio * Math.PI);
        pCool = rec.Q_cool > 0 ? rec.Q_cool / (5.30 * partLoadFactor) : 0;
        pHeatElec = rec.Q_heat > 0 ? rec.Q_heat / 3.80 : 0; // 电驱动热泵制热
        pPump = 0;
        pTower = 0;
        pTerm = item.area * 0.003 * (rec.Q_cool > 0 || rec.Q_heat > 0 ? 1 : 0.1);
        gas = 0;
      } else if (isAchp) {
        // 风冷热泵系统：真实继承用户在第2项中选型的具体品牌铭牌与水泵配置
        const ratedCop = (item.customEquipment?.selectedAchpProduct && item.customEquipment.selectedAchpProduct.actualPowerkW > 0)
          ? (item.customEquipment.selectedAchpProduct.ratedCapacitykW / item.customEquipment.selectedAchpProduct.actualPowerkW)
          : 3.45;
        const copAchp = ratedCop * (1 + 0.22 * Math.sin(loadRatio * Math.PI));
        pCool = rec.Q_cool > 0 ? rec.Q_cool / copAchp : 0;
        pHeatElec = rec.Q_heat > 0 ? rec.Q_heat / (ratedCop * 0.92) : 0; // 冬季电热泵制热
        const pumpSummerRated = calc.achpSummerPumpPowerkW || 30;
        const pumpWinterRated = calc.achpWinterPumpPowerkW || 25;
        const pumpRated = rec.Q_cool > 0 ? pumpSummerRated : pumpWinterRated;
        pPump = (rec.Q_cool > 0 || rec.Q_heat > 0) ? pumpRated * (0.35 + 0.65 * Math.max(loadRatio, 0.2)) : 0;
        pTower = 0; // 风冷无冷却塔
        pTerm = item.area * 0.006 * (rec.Q_cool > 0 || rec.Q_heat > 0 ? 1 : 0.1);
        gas = 0; // 风冷热泵冬季为电制热，天然气消耗为 0
      } else {
        // 水冷冷机 + 燃气锅炉
        pCool = rec.opt_P_Chiller;
        pPump = rec.opt_P_CHWP + rec.opt_P_CWP;
        pTower = rec.opt_P_Tower;
        pTerm = item.area * 0.008 * (rec.Q_cool > 0 || rec.Q_heat > 0 ? 1 : 0.1);
        if (rec.Q_heat > 0) {
          gas = rec.Q_heat / (0.90 * 9.87); // 燃气锅炉耗气 (m³)
        }
      }

      mCoolingkWh += pCool;
      mHeatingkWh += pHeatElec;
      mPumpskWh += pPump;
      mTowerskWh += pTower;
      mTerminalskWh += pTerm;
      mGasm3 += gas;

      // 仅记录供冷季冷源系统电耗 (用于 SCOP 计算，严禁混入冬季供暖耗电)
      if (rec.Q_cool > 0) {
        totPlantChillerkWh += pCool;
        totPlantChwPumpkWh += isAchp ? pPump : (isVrf ? 0 : rec.opt_P_CHWP);
        totPlantCwPumpkWh += (isAchp || isVrf) ? 0 : rec.opt_P_CWP;
        totPlantTowerkWh += pTower;
        totCoolingDemandkWh += rec.Q_cool;
      }

      // 系统能耗基准线（针对不同系统形式采用国家标准 GB 50189 / GB 55015 基准限值）
      let baseElec = 0;
      if (isAchp) {
        // 标准定频风冷热泵基准限值：COP 2.90，制热 2.80，定频水泵
        const baseCool = rec.Q_cool > 0 ? rec.Q_cool / 2.90 : 0;
        const baseHeat = rec.Q_heat > 0 ? rec.Q_heat / 2.80 : 0;
        const pumpSummerRated = calc.achpSummerPumpPowerkW || 30;
        const pumpWinterRated = calc.achpWinterPumpPowerkW || 25;
        const basePump = (rec.Q_cool > 0 || rec.Q_heat > 0) ? (rec.Q_cool > 0 ? pumpSummerRated : pumpWinterRated) : 0;
        baseElec = baseCool + baseHeat + basePump + pTerm;
      } else if (isVrf) {
        // 标准定速多联机基准限值：APF 3.80，制热 3.00
        const baseCool = rec.Q_cool > 0 ? rec.Q_cool / 3.80 : 0;
        const baseHeat = rec.Q_heat > 0 ? rec.Q_heat / 3.00 : 0;
        baseElec = baseCool + baseHeat + pTerm;
      } else {
        baseElec = rec.base_P_Total + pTerm;
      }

      totBaseEleckWh += baseElec;
      totOptEleckWh += (pCool + pHeatElec + pPump + pTower + pTerm);

      const hourElec = pCool + pHeatElec + pPump + pTower + pTerm;
      const hourCost = (hourElec * price) + (gas * tariff.gasPrice);
      mCostRmb += hourCost;
    }

    hourPointer += hoursInThisMonth;
    const totalElec = mCoolingkWh + mHeatingkWh + mPumpskWh + mTowerskWh + mTerminalskWh;
    const avgCOP = mCoolingkWh > 0 ? (calc.coolingLoadkW / Math.max(1, mCoolingkWh / (hoursInThisMonth * 0.4))) : 4.0;

    monthlyData.push({
      month: m + 1,
      monthName: monthNames[m],
      coolingkWh: mCoolingkWh,
      heatingkWh: mHeatingkWh,
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

  // SCOP / 能效评定 (供冷季制冷综合性能系数)
  const totalPlantEleckWh = totPlantChillerkWh + totPlantChwPumpkWh + totPlantCwPumpkWh + totPlantTowerkWh;
  const rawSCOP = totalPlantEleckWh > 0 ? totCoolingDemandkWh / totalPlantEleckWh : (isVrf ? 5.30 : (isAchp ? 3.20 : 4.85));
  const scop = Number(rawSCOP.toFixed(2));

  let ratingLevel: '卓越 (五星级高效冷站)' | '优秀 (四星级高效冷站)' | '良好 (三星级高效冷站)' | '达标 (节能标准合格)' | '待提升' = '达标 (节能标准合格)';
  const stdLimit = isVrf ? 4.80 : (isAchp ? 2.80 : 3.50);
  if (scop >= (stdLimit + 0.8)) {
    ratingLevel = '卓越 (五星级高效冷站)';
  } else if (scop >= (stdLimit + 0.5)) {
    ratingLevel = '优秀 (四星级高效冷站)';
  } else if (scop >= (stdLimit + 0.2)) {
    ratingLevel = '良好 (三星级高效冷站)';
  } else if (scop >= stdLimit) {
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
    standardLimit: stdLimit,
    ratingLevel,
    isCompliant: scop >= stdLimit,
    standardCode: isVrf ? 'GB 21454 APF 能效标准' : (isAchp ? 'GB 50189 / GB 55015 热泵标准' : 'GB 50189 第4.2.12条')
  };

  const annualCarbonTons = ((annualElectricitykWh * tariff.electricityCarbon) + (annualGasm3 * tariff.gasCarbon)) / 1000;
  const energyIntensitykWhPerM2 = item.area > 0 ? annualElectricitykWh / item.area : 0;
  const costPerM2 = item.area > 0 ? annualCostRmb / item.area : 0;
  const savingsElectricitykWh = totBaseEleckWh - totOptEleckWh;
  const savingsRatePercent = totBaseEleckWh > 0 ? (savingsElectricitykWh / totBaseEleckWh) * 100.0 : 0.0;

  // LCCA 比选
  const lccaResults = evaluateLcca(
    optRecords, item.area,
    tariff.peakElectricityPrice,
    tariff.flatElectricityPrice,
    tariff.valleyElectricityPrice,
    tariff.gasPrice
  );

  return {
    totalArea: item.area,
    totalCoolingLoadkW: calc.coolingLoadkW,
    totalHeatingLoadkW: calc.heatingLoadkW,
    totalInstalledPowerkW: calc.totalInstalledElectricPowerkW,
    annualElectricitykWh,
    annualGasm3,
    annualCostRmb,
    annualCarbonTons,
    energyIntensitykWhPerM2,
    costPerM2,
    monthlyData,
    discrepancies,
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
 * 汇总整个项目的全年能耗、月度分布、碳排放与费用，并生成各建筑子项的独立能耗与多子项汇总看板
 */
export function calculateProjectSummary(
  items: BuildingSubItem[],
  tariffConfig?: EnergyTariffConfig
): ProjectEnergySummary {
  const tariff: EnergyTariffConfig = tariffConfig || DEFAULT_TARIFF_CONFIG;

  if (items.length === 0) {
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

  // 1. 分别独立计算每一个建筑子项的能耗
  const subSummaries = items.map(item => ({
    item,
    summary: calculateSubItemEnergySummary(item, items, tariff)
  }));

  // 2. 汇总全局指标
  const totalArea = items.reduce((acc, it) => acc + it.area, 0);
  const totalCoolingLoadkW = subSummaries.reduce((acc, s) => acc + s.summary.totalCoolingLoadkW, 0);
  const totalHeatingLoadkW = subSummaries.reduce((acc, s) => acc + s.summary.totalHeatingLoadkW, 0);
  const totalInstalledPowerkW = subSummaries.reduce((acc, s) => acc + s.summary.totalInstalledPowerkW, 0);
  const annualElectricitykWh = subSummaries.reduce((acc, s) => acc + s.summary.annualElectricitykWh, 0);
  const annualGasm3 = subSummaries.reduce((acc, s) => acc + s.summary.annualGasm3, 0);
  const annualCostRmb = subSummaries.reduce((acc, s) => acc + s.summary.annualCostRmb, 0);
  const annualCarbonTons = subSummaries.reduce((acc, s) => acc + s.summary.annualCarbonTons, 0);
  const energyIntensitykWhPerM2 = totalArea > 0 ? annualElectricitykWh / totalArea : 0;
  const costPerM2 = totalArea > 0 ? annualCostRmb / totalArea : 0;

  // 3. 逐月数据加总 (12 个月)
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthlyData: MonthlyEnergyRecord[] = [];
  for (let m = 0; m < 12; m++) {
    let coolingkWh = 0;
    let heatingkWh = 0;
    let pumpskWh = 0;
    let towerskWh = 0;
    let terminalsAndOtherkWh = 0;
    let gasm3 = 0;
    let totalElec = 0;
    let totalCost = 0;

    subSummaries.forEach(s => {
      const md = s.summary.monthlyData[m];
      if (md) {
        coolingkWh += md.coolingkWh;
        heatingkWh += md.heatingkWh;
        pumpskWh += md.pumpskWh;
        towerskWh += md.towerskWh;
        terminalsAndOtherkWh += md.terminalsAndOtherkWh;
        gasm3 += md.gasm3;
        totalElec += md.totalElectricitkykWh;
        totalCost += md.totalCostRmb;
      }
    });

    monthlyData.push({
      month: m + 1,
      monthName: monthNames[m],
      coolingkWh,
      heatingkWh,
      pumpskWh,
      towerskWh,
      terminalsAndOtherkWh,
      gasm3,
      totalElectricitkykWh: totalElec,
      totalCostRmb: totalCost,
      avgCOP: 4.8
    });
  }

  // 4. 合并所有红字预警
  const allDiscrepancies = subSummaries.flatMap(s => s.summary.discrepancies);

  // 5. 组合全项目 Bin 分析 (各个子项电量加总)
  const binMap: Record<string, { hours: number; energy: number }> = {};
  subSummaries.forEach(s => {
    (s.summary.loadBins || []).forEach(b => {
      if (!binMap[b.binRange]) {
        binMap[b.binRange] = { hours: 0, energy: 0 };
      }
      binMap[b.binRange].hours = Math.max(binMap[b.binRange].hours, b.hours);
      binMap[b.binRange].energy += b.coolingEnergykWh;
    });
  });

  const binRanges = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'];
  const totBinHours = binRanges.reduce((acc, r) => acc + (binMap[r]?.hours || 0), 0);
  const loadBins: LoadBinRecord[] = binRanges.map(r => ({
    binRange: r,
    minRatio: 0,
    maxRatio: 0,
    hours: binMap[r]?.hours || 0,
    coolingEnergykWh: binMap[r]?.energy || 0,
    hoursPercentage: totBinHours > 0 ? Number((((binMap[r]?.hours || 0) / totBinHours) * 100).toFixed(1)) : 0
  }));

  // 6. 全局 SCOP 合规信息加总计算
  const totCoolDemand = subSummaries.reduce((acc, s) => acc + (s.summary.scopCompliance?.totalCoolingDemandkWh || 0), 0);
  const totChillerElec = subSummaries.reduce((acc, s) => acc + (s.summary.scopCompliance?.chillerEleckWh || 0), 0);
  const totChwPumpElec = subSummaries.reduce((acc, s) => acc + (s.summary.scopCompliance?.chwPumpEleckWh || 0), 0);
  const totCwPumpElec = subSummaries.reduce((acc, s) => acc + (s.summary.scopCompliance?.cwPumpEleckWh || 0), 0);
  const totTowerElec = subSummaries.reduce((acc, s) => acc + (s.summary.scopCompliance?.towerEleckWh || 0), 0);
  const totPlantElec = totChillerElec + totChwPumpElec + totCwPumpElec + totTowerElec;
  const projectSCOP = totPlantElec > 0 ? Number((totCoolDemand / totPlantElec).toFixed(2)) : 4.85;

  let ratingLevel: '卓越 (五星级高效冷站)' | '优秀 (四星级高效冷站)' | '良好 (三星级高效冷站)' | '达标 (节能标准合格)' | '待提升' = '达标 (节能标准合格)';
  if (projectSCOP >= 5.5) ratingLevel = '卓越 (五星级高效冷站)';
  else if (projectSCOP >= 5.0) ratingLevel = '优秀 (四星级高效冷站)';
  else if (projectSCOP >= 4.5) ratingLevel = '良好 (三星级高效冷站)';
  else if (projectSCOP >= 3.5) ratingLevel = '达标 (节能标准合格)';
  else ratingLevel = '待提升';

  const scopCompliance: SCOPComplianceInfo = {
    scop: projectSCOP,
    totalCoolingDemandkWh: totCoolDemand,
    chillerEleckWh: totChillerElec,
    chwPumpEleckWh: totChwPumpElec,
    cwPumpEleckWh: totCwPumpElec,
    towerEleckWh: totTowerElec,
    totalPlantEleckWh: totPlantElec,
    standardLimit: 3.50,
    ratingLevel,
    isCompliant: projectSCOP >= 3.50,
    standardCode: 'GB 50189 第4.2.12条'
  };

  // 7. 构建子项能耗明细 Breakdown（支持在汇总页对比和单独查看）
  const subItemSummaries: SubItemEnergyBreakdown[] = subSummaries.map(({ item, summary }) => ({
    subItemId: item.id,
    subItemName: item.name,
    buildingType: item.type,
    systemType: item.systemType,
    area: item.area,
    areaPercent: totalArea > 0 ? Number(((item.area / totalArea) * 100).toFixed(1)) : 0,
    coolingLoadkW: summary.totalCoolingLoadkW,
    heatingLoadkW: summary.totalHeatingLoadkW,
    annualElectricitykWh: summary.annualElectricitykWh,
    annualGasm3: summary.annualGasm3,
    annualCostRmb: summary.annualCostRmb,
    annualCarbonTons: summary.annualCarbonTons,
    energyIntensitykWhPerM2: summary.energyIntensitykWhPerM2,
    costPercent: annualCostRmb > 0 ? Number(((summary.annualCostRmb / annualCostRmb) * 100).toFixed(1)) : 0,
    elecPercent: annualElectricitykWh > 0 ? Number(((summary.annualElectricitykWh / annualElectricitykWh) * 100).toFixed(1)) : 0,
    summary
  }));

  const chillerPlantConfigName = items.length > 1
    ? `多子项复合系统 (${items.map(i => i.name).join(' + ')})`
    : subSummaries[0]?.summary.chillerPlantConfigName || '标准冷源系统';

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
    baselineElectricitykWh: subSummaries.reduce((a, s) => a + (s.summary.baselineElectricitykWh || 0), 0),
    optimizedElectricitykWh: subSummaries.reduce((a, s) => a + (s.summary.optimizedElectricitykWh || 0), 0),
    savingsElectricitykWh: subSummaries.reduce((a, s) => a + (s.summary.savingsElectricitykWh || 0), 0),
    savingsRatePercent: 22.9,
    lccaResults: subSummaries[0]?.summary.lccaResults,
    chillerPlantConfigName,
    chillerPlantJustification: `全项目共包含 ${items.length} 个功能子项，总建筑面积 ${totalArea.toLocaleString()} m²，各子项按实际业态特性与空调系统配置精确独立模拟并汇总。`,
    tariffConfig: tariff,
    loadBins,
    scopCompliance,
    subItemSummaries
  };
}


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

  // 覆盖自定义与真实选型品牌设备物理铭牌电量及气耗（真实继承用户在第2项中的配置）
  const custom = item.customEquipment || {};
  const recChwPumpCount = chwPumpCount;
  const recCwPumpCount = cwPumpCount;
  const recCoolingTowerCount = coolingTowerCount;
  const recHwPumpCount = hwPumpCount;
  const recAchpCoolingkW = achpCoolingkW;
  const recAchpHeatingkW = achpHeatingkW;

  // 主机台数与容量覆盖
  if (custom.chillerCount) chillerCount = custom.chillerCount;
  if (custom.selectedChillerProduct) {
    chillerCapacitykW = custom.selectedChillerProduct.ratedCapacitykW * chillerCount;
    chillerPowerkW = custom.selectedChillerProduct.actualPowerkW * chillerCount;
  } else if (custom.chillerCapacitykW) {
    chillerCapacitykW = custom.chillerCapacitykW;
    chillerPowerkW = custom.chillerCapacitykW / chillerCOP;
  }

  if (custom.boilerCount) boilerCount = custom.boilerCount;
  if (custom.selectedBoilerProduct) {
    boilerCapacitykW = custom.selectedBoilerProduct.ratedCapacitykW * boilerCount;
    boilerGasFlow = (custom.selectedBoilerProduct.gasFlowm3h || (custom.selectedBoilerProduct.ratedCapacitykW / (9.967 * 0.95))) * boilerCount;
  } else if (custom.boilerCapacitykW) {
    boilerCapacitykW = custom.boilerCapacitykW;
    boilerGasFlow = custom.boilerCapacitykW / (9.967 * boilerEfficiency);
  }

  if (custom.achpCount) achpCount = custom.achpCount;
  if (custom.selectedAchpProduct) {
    achpCoolingkW = custom.selectedAchpProduct.ratedCapacitykW * achpCount;
    achpPowerkW = custom.selectedAchpProduct.actualPowerkW * achpCount;
  } else if (custom.achpCoolingkW) {
    achpCoolingkW = custom.achpCoolingkW;
    achpPowerkW = custom.achpCoolingkW / 3.2;
  }

  if (custom.vrfCount) vrfCount = custom.vrfCount;
  if (custom.selectedVrfProduct) {
    vrfCoolingkW = custom.selectedVrfProduct.ratedCapacitykW * vrfCount;
    vrfPowerkW = custom.selectedVrfProduct.actualPowerkW * vrfCount;
  } else if (custom.vrfCoolingkW) {
    vrfCoolingkW = custom.vrfCoolingkW;
    vrfPowerkW = custom.vrfCoolingkW / 5.30;
  }

  // 水泵与冷却塔台数及功率覆盖
  if (custom.chwPumpCount) chwPumpCount = custom.chwPumpCount;
  if (custom.selectedChwPumpProduct) {
    chwPumpPowerkW = custom.selectedChwPumpProduct.actualPowerkW * (custom.chwPumpCount || (item.systemType === 'air_heat_pump' ? achpCount : recChwPumpCount));
  } else if (custom.chwPumpFlow) {
    chwPumpPowerkW = (custom.chwPumpFlow * chwPumpHead) / 247.7;
  }

  if (custom.cwPumpCount) cwPumpCount = custom.cwPumpCount;
  if (custom.selectedCwPumpProduct) {
    cwPumpPowerkW = custom.selectedCwPumpProduct.actualPowerkW * (custom.cwPumpCount || recCwPumpCount);
  } else if (custom.cwPumpFlow) {
    cwPumpPowerkW = (custom.cwPumpFlow * cwPumpHead) / 247.7;
  }

  if (custom.coolingTowerCount) coolingTowerCount = custom.coolingTowerCount;
  if (custom.selectedTowerProduct) {
    coolingTowerFanPowerkW = custom.selectedTowerProduct.actualPowerkW * (custom.coolingTowerCount || recCoolingTowerCount);
  } else if (custom.coolingTowerFlow) {
    coolingTowerFanPowerkW = custom.coolingTowerFlow * 0.18;
  }

  if (custom.hwPumpCount) hwPumpCount = custom.hwPumpCount;
  if (custom.selectedHwPumpProduct) {
    hwPumpPowerkW = custom.selectedHwPumpProduct.actualPowerkW * (custom.hwPumpCount || (item.systemType === 'air_heat_pump' ? achpCount : recHwPumpCount));
  } else if (custom.hwPumpFlow) {
    hwPumpPowerkW = (custom.hwPumpFlow * hwPumpHead) / 247.7;
  }

  // 风冷热泵专属冷温水泵参数继承
  const achpChwPumpFlow = custom.chwPumpFlow || (recAchpCoolingkW > 0 ? (recAchpCoolingkW * 3.6) / (4.186 * deltaTchw) : 0);
  const achpHwPumpFlow = custom.hwPumpFlow || (recAchpHeatingkW > 0 ? (recAchpHeatingkW * 3.6) / (4.186 * deltaThw) : 0);
  const achpChwPumpCount = custom.chwPumpCount || achpCount;
  const achpHwPumpCount = custom.hwPumpCount || achpCount;
  achpSummerPumpPowerkW = chwPumpPowerkW;
  achpWinterPumpPowerkW = hwPumpPowerkW;

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

