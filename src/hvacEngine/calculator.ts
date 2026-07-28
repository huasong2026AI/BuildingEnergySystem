import type { BuildingSubItem, EquipmentCalcResult, EquipmentDiscrepancy, MonthlyEnergyRecord, ProjectEnergySummary } from '../types/hvac';
import { ENERGY_FACTORS, SYSTEM_TYPES_META } from './constants';

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
        chillerCount += subCoolLoad > 600 ? 2 : 1;
        chillerPowerkW += subCoolLoad / chillerCOP;

        boilerCapacitykW += subHeatLoad * 1.1;
        boilerCount += (subHeatLoad * 1.1) > 500 ? 2 : 1;
        boilerGasFlow += ((subHeatLoad * 1.1) / (9.967 * boilerEfficiency));

        const subChwFlow = (subCoolLoad * 3.6) / (4.186 * deltaTchw);
        chwPumpFlow += subChwFlow;
        chwPumpHead = 28;
        chwPumpPowerkW += (subChwFlow * 28) / 247.7;
        chwPumpCount += 2;

        const qCond = subCoolLoad * (1 + 1 / chillerCOP);
        const subCwFlow = (qCond * 3.6) / (4.186 * deltaTcw);
        cwPumpFlow += subCwFlow;
        cwPumpHead = 24;
        cwPumpPowerkW += (subCwFlow * 24) / 247.7;
        cwPumpCount += 2;

        coolingTowerFlow += subCwFlow * 1.15;
        coolingTowerFanPowerkW += subCwFlow * 1.15 * 0.18;
        coolingTowerCount += 1;

        const subHwFlow = (subHeatLoad * 1.1 * 3.6) / (4.186 * deltaThw);
        hwPumpFlow += subHwFlow;
        hwPumpHead = 22;
        hwPumpPowerkW += (subHwFlow * 22) / 247.7;
        hwPumpCount += 2;
      } else if (sub.systemType === 'vrf') {
        vrfCoolingkW += subCoolLoad;
        const vrfEER = 3.85;
        vrfPowerkW += subCoolLoad / vrfEER;
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
        chillerCount = chillerCapacitykW > 600 ? 2 : 1;
        chillerPowerkW = chillerCapacitykW / chillerCOP;

        boilerCapacitykW = heatingLoadkW * 1.1;
        boilerCount = boilerCapacitykW > 500 ? 2 : 1;
        boilerGasFlow = (boilerCapacitykW / (9.967 * boilerEfficiency)); 

        chwPumpFlow = (chillerCapacitykW * 3.6) / (4.186 * deltaTchw);
        chwPumpHead = 28;
        chwPumpPowerkW = (chwPumpFlow * chwPumpHead) / 247.7;
        chwPumpCount = chillerCount + 1;

        const qCond = chillerCapacitykW * (1 + 1 / chillerCOP);
        cwPumpFlow = (qCond * 3.6) / (4.186 * deltaTcw);
        cwPumpHead = 24;
        cwPumpPowerkW = (cwPumpFlow * cwPumpHead) / 247.7;
        cwPumpCount = chillerCount + 1;

        coolingTowerFlow = cwPumpFlow * 1.15;
        coolingTowerFanPowerkW = coolingTowerFlow * 0.18;
        coolingTowerCount = chillerCount;

        hwPumpFlow = (boilerCapacitykW * 3.6) / (4.186 * deltaThw);
        hwPumpHead = 22;
        hwPumpPowerkW = (hwPumpFlow * hwPumpHead) / 247.7;
        hwPumpCount = boilerCount + 1;
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
        const vrfEER = 3.85;
        vrfPowerkW = vrfCoolingkW / vrfEER;
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
  calc: EquipmentCalcResult
): EquipmentDiscrepancy[] {
  const custom = item.customEquipment;
  if (!custom) return [];

  const list: EquipmentDiscrepancy[] = [];
  const hours = item.operatingHours || 3000;
  const sysMeta = SYSTEM_TYPES_META[item.systemType];

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

      const extraAnnualCost = extraPower * hours * ENERGY_FACTORS.electricityPrice;

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
  evaluateField('VRF多联机', '制冷量', calc.vrfCoolingkW, custom.vrfCoolingkW, 'kW', 1 / 3.85);

  return list;
}

/**
 * 汇总整个项目的全年能耗、月度分布、碳排放与费用
 */
export function calculateProjectSummary(items: BuildingSubItem[]): ProjectEnergySummary {
  let totalArea = 0;
  let totalCoolingLoadkW = 0;
  let totalHeatingLoadkW = 0;
  let totalInstalledPowerkW = 0;

  const allDiscrepancies: EquipmentDiscrepancy[] = [];

  let sumChillerPower = 0;
  let sumBoilerGasFlow = 0;
  let sumPumpsPower = 0;
  let sumTowersPower = 0;
  let sumTerminalsPower = 0;

  items.forEach(item => {
    totalArea += item.area;
    const calc = calculateEquipmentForSubItem(item, items);
    totalCoolingLoadkW += calc.coolingLoadkW;
    totalHeatingLoadkW += calc.heatingLoadkW;

    const itemDiscrepancies = checkDiscrepancies(item, calc);
    allDiscrepancies.push(...itemDiscrepancies);

    const custom = item.customEquipment;
    const sysMeta = SYSTEM_TYPES_META[item.systemType];
    
    let effectiveChillerPower = calc.chillerPowerkW;
    if (custom?.chillerCapacitykW && calc.chillerCapacitykW > 0) {
      effectiveChillerPower = custom.chillerCapacitykW / calc.chillerCOP;
    }

    let effectiveBoilerGasFlow = calc.boilerGasFlow;
    if (custom?.boilerCapacitykW && calc.boilerCapacitykW > 0) {
      effectiveBoilerGasFlow = custom.boilerCapacitykW / (9.967 * calc.boilerEfficiency);
    }

    let effectiveChwPumpPower = sysMeta.hasChilledWaterPump ? calc.chwPumpPowerkW : 0;
    if (sysMeta.hasChilledWaterPump && custom?.chwPumpFlow) {
      const h = custom.chwPumpHead || calc.chwPumpHead;
      effectiveChwPumpPower = (custom.chwPumpFlow * h) / 247.7;
    }

    let effectiveCwPumpPower = sysMeta.hasCoolingWaterPump ? calc.cwPumpPowerkW : 0;
    if (sysMeta.hasCoolingWaterPump && custom?.cwPumpFlow) {
      const h = custom.cwPumpHead || calc.cwPumpHead;
      effectiveCwPumpPower = (custom.cwPumpFlow * h) / 247.7;
    }

    let effectiveTowerPower = sysMeta.hasCoolingTower ? calc.coolingTowerFanPowerkW : 0;
    if (sysMeta.hasCoolingTower && custom?.coolingTowerFlow) {
      effectiveTowerPower = custom.coolingTowerFlow * 0.18;
    }

    let effectiveHwPumpPower = sysMeta.hasHotWaterPump ? calc.hwPumpPowerkW : 0;
    if (sysMeta.hasHotWaterPump && custom?.hwPumpFlow) {
      const h = custom.hwPumpHead || calc.hwPumpHead;
      effectiveHwPumpPower = (custom.hwPumpFlow * h) / 247.7;
    }

    const itemTotalElectricPower = 
      effectiveChillerPower + 
      effectiveChwPumpPower + 
      effectiveCwPumpPower + 
      effectiveTowerPower + 
      effectiveHwPumpPower + 
      calc.achpPowerkW + 
      calc.vrfPowerkW + 
      calc.gshpGroundPumpPowerkW + 
      calc.gshpLoadPumpPowerkW + 
      calc.districtPumpPowerkW + 
      calc.splitPowerkW;

    totalInstalledPowerkW += itemTotalElectricPower;

    sumChillerPower += effectiveChillerPower + calc.achpPowerkW + calc.vrfPowerkW;
    sumBoilerGasFlow += effectiveBoilerGasFlow;
    sumPumpsPower += effectiveChwPumpPower + effectiveCwPumpPower + effectiveHwPumpPower + calc.gshpGroundPumpPowerkW + calc.gshpLoadPumpPowerkW + calc.districtPumpPowerkW;
    sumTowersPower += effectiveTowerPower;
    sumTerminalsPower += item.area * 0.008;
  });

  const coolingMonthCoeffs = [0, 0, 0.1, 0.35, 0.65, 0.90, 1.00, 0.95, 0.70, 0.30, 0.05, 0];
  const heatingMonthCoeffs = [1.00, 0.85, 0.40, 0.05, 0, 0, 0, 0, 0.10, 0.50, 0.90];

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthlyData: MonthlyEnergyRecord[] = [];

  let annualElectricitykWh = 0;
  let annualGasm3 = 0;

  for (let m = 0; m < 12; m++) {
    const cCoeff = coolingMonthCoeffs[m];
    const hCoeff = heatingMonthCoeffs[m];

    const hoursInMonth = 30 * 10;

    const coolingkWh = sumChillerPower * cCoeff * hoursInMonth;
    const pumpskWh = sumPumpsPower * Math.max(cCoeff, hCoeff) * hoursInMonth;
    const towerskWh = sumTowersPower * cCoeff * hoursInMonth;
    const terminalskWh = sumTerminalsPower * Math.max(cCoeff, hCoeff) * hoursInMonth;

    const gasm3 = sumBoilerGasFlow * hCoeff * hoursInMonth;
    const totalElec = coolingkWh + pumpskWh + towerskWh + terminalskWh;

    const totalCost = (totalElec * ENERGY_FACTORS.electricityPrice) + (gasm3 * ENERGY_FACTORS.gasPrice);
    const avgCOP = cCoeff > 0 ? (4.2 + cCoeff * 0.8) : (hCoeff > 0 ? 3.2 : 4.0);

    monthlyData.push({
      month: m + 1,
      monthName: monthNames[m],
      coolingkWh,
      heatingkWh: 0,
      pumpskWh,
      towerskWh,
      terminalsAndOtherkWh: terminalskWh,
      gasm3,
      totalElectricitkykWh: totalElec,
      totalCostRmb: totalCost,
      avgCOP
    });

    annualElectricitykWh += totalElec;
    annualGasm3 += gasm3;
  }

  const annualCostRmb = (annualElectricitykWh * ENERGY_FACTORS.electricityPrice) + (annualGasm3 * ENERGY_FACTORS.gasPrice);
  const annualCarbonTons = ((annualElectricitykWh * ENERGY_FACTORS.electricityCarbon) + (annualGasm3 * ENERGY_FACTORS.gasCarbon)) / 1000;

  const energyIntensitykWhPerM2 = totalArea > 0 ? annualElectricitykWh / totalArea : 0;
  const costPerM2 = totalArea > 0 ? annualCostRmb / totalArea : 0;

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
    discrepancies: allDiscrepancies
  };
}
