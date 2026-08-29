import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Sparkles, Wrench, TrendingDown, Building, ShieldAlert, Cpu, Plus, Trash2, ShoppingBag, Check, Flame, Wind, Zap 
} from 'lucide-react';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { calculateEquipmentForSubItem } from '../hvacEngine/calculator';
import { EquipmentCatalogModal } from './EquipmentCatalogModal';
import { AiRetrofitAdvisorModal } from './AiRetrofitAdvisorModal';
import type { EquipmentCategory, CatalogEquipmentItem } from '../data/equipmentCatalog';
import type { 
  SystemType, BuildingSubItem, UserEquipmentOverrides, ExistingChillerDetail, ExistingBoilerDetail, ExistingPumpDetail, 
  ExistingAchpDetail, ExistingVrfDetail, ExistingDistrictDetail, ExistingGshpDetail, ExistingSplitDetail, ExistingTowerDetail,
  EnergyTariffConfig 
} from '../types/hvac';

interface RetrofitOptimizerProps {
  tariffConfig?: EnergyTariffConfig;
  onUpdateTariffConfig?: (cfg: EnergyTariffConfig) => void;
}

export const RetrofitOptimizer: React.FC<RetrofitOptimizerProps> = ({ tariffConfig, onUpdateTariffConfig }) => {
  const [isAiReportModalOpen, setIsAiReportModalOpen] = useState(false);

  // 1. 既有系统基本信息
  const [existingSystemType, setExistingSystemType] = useState<SystemType>('chiller_boiler');
  const [buildingName, setBuildingName] = useState<string>('某既有商业综合体及酒店');
  const [buildingArea, setBuildingArea] = useState<number>(55000);
  const [operatingHours, setOperatingHours] = useState<number>(3200);
  const [electricityRate, setElectricityRate] = useState<number>(tariffConfig?.averageElectricityPrice ?? 0.85);
  const [gasRate, setGasRate] = useState<number>(tariffConfig?.gasPrice ?? 3.50);

  // 2. 7 种系统的详细既有设备明细录入（与新建建筑自动配置设备类型 100% 对齐）
  const [chillers, setChillers] = useState<ExistingChillerDetail[]>([
    { id: 'c1', modelName: '老旧螺杆/离心机组 A组', capacitykW: 3000, powerkW: 769, cop: 3.9, count: 2 }
  ]);

  const [boilers, setBoilers] = useState<ExistingBoilerDetail[]>([
    { id: 'b1', modelName: '老旧大气式燃气热水锅炉', capacitykW: 2400, powerkW: 18, gasFlowm3h: Number((2400 / (9.967 * 0.82)).toFixed(1)), efficiencyPercent: 82, count: 2 }
  ]);

  const [pumps, setPumps] = useState<ExistingPumpDetail[]>([
    { id: 'p1', modelName: '冷水水泵 (夏季冷水泵)', type: 'chw', flowm3h: 516, headm: 35, powerkW: 73, efficiencyPercent: 58, count: 3 },
    { id: 'p2', modelName: '冷却水水泵', type: 'cw', flowm3h: 620, headm: 28, powerkW: 74, efficiencyPercent: 58, count: 3 },
    { id: 'p3', modelName: '锅炉独立热水泵 (冬季热水循环泵)', type: 'hw', flowm3h: 206, headm: 25, powerkW: 24, efficiencyPercent: 58, count: 2 }
  ]);

  const [towers, setTowers] = useState<ExistingTowerDetail[]>([
    { id: 't1', modelName: '冷却塔 (冷却水散热)', flowm3h: 700, fanPowerkW: 18.5, count: 3 }
  ]);

  const [achps, setAchps] = useState<ExistingAchpDetail[]>([
    { id: 'a1', modelName: '老旧风冷热泵主机模块', coolingkW: 3000, heatingkW: 2400, powerkW: 1000, cop: 3.0, count: 12 }
  ]);

  const [vrfs, setVrfs] = useState<ExistingVrfDetail[]>([
    { id: 'v1', modelName: '老旧 VRF 多联机室外机', coolingkW: 3000, powerkW: 857, eer: 3.5, count: 50 }
  ]);

  const [districts, setDistricts] = useState<ExistingDistrictDetail[]>([
    { id: 'd1', modelName: '区域板式换热器机组', capacitykW: 3000, pumpFlowm3h: 516, pumpPowerkW: 73, count: 2 }
  ]);

  const [gshps, setGshps] = useState<ExistingGshpDetail[]>([
    { id: 'g1', modelName: '老旧地源热泵主机', coolingkW: 3000, powerkW: 666, cop: 4.5, groundFlowm3h: 600, groundPumpPowerkW: 78, loadFlowm3h: 516, loadPumpPowerkW: 73, count: 2 }
  ]);

  const [splits, setSplits] = useState<ExistingSplitDetail[]>([
    { id: 's1', modelName: '老旧分体空调主机', capacitykW: 3000, powerkW: 1000, apf: 3.0, count: 1000 }
  ]);

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // ----------------------------------------------------
  // 【步骤二：更换系统形式】 目标系统的详细设备明细（同新建项目格式）
  // ----------------------------------------------------
  const [targetSystemType, setTargetSystemType] = useState<SystemType>('air_heat_pump');
  const [targetCapEx, setTargetCapEx] = useState<number>(280); // 工程总初投资 CapEx (万元)
  const [targetCustomEquipment, setTargetCustomEquipment] = useState<UserEquipmentOverrides>({});

  // 品牌选型模态框
  const [catalogModalState, setCatalogModalState] = useState<{
    isOpen: boolean;
    category: EquipmentCategory;
    categoryTitle: string;
    targetSingleValue: number;
    overrideKey: keyof UserEquipmentOverrides;
  }>({
    isOpen: false,
    category: 'chiller',
    categoryTitle: '冷水机组',
    targetSingleValue: 0,
    overrideKey: 'selectedChillerProduct'
  });

  // 构建目标系统的虚拟 SubItem，推算推荐的标准设备选型
  const targetSubItem: BuildingSubItem = useMemo(() => {
    return {
      id: 'target-subitem',
      name: buildingName + ' (目标更换新系统)',
      type: 'office',
      area: buildingArea,
      coolingIndex: 90,
      heatingIndex: 60,
      operatingHours: operatingHours,
      systemType: targetSystemType,
      chwSupplyTemp: 7,
      chwReturnTemp: 12,
      hwSupplyTemp: targetSystemType === 'air_heat_pump' ? 45 : 60,
      hwReturnTemp: targetSystemType === 'air_heat_pump' ? 40 : 50,
      cwSupplyTemp: 32,
      cwReturnTemp: 37,
      customEquipment: targetCustomEquipment
    };
  }, [buildingName, buildingArea, operatingHours, targetSystemType, targetCustomEquipment]);

  const targetCalc = useMemo(() => {
    return calculateEquipmentForSubItem(targetSubItem);
  }, [targetSubItem]);

  const handleTargetCustomChange = (key: keyof UserEquipmentOverrides, val: any) => {
    setTargetCustomEquipment(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const openCatalogModal = (
    category: EquipmentCategory,
    categoryTitle: string,
    targetSingleValue: number,
    overrideKey: keyof UserEquipmentOverrides
  ) => {
    setCatalogModalState({
      isOpen: true,
      category,
      categoryTitle,
      targetSingleValue,
      overrideKey
    });
  };

  const handleSelectCatalogItem = (item: CatalogEquipmentItem) => {
    const overrideKey = catalogModalState.overrideKey;
    const selectedProd = {
      catalogId: item.id,
      brand: item.brand,
      model: item.model,
      name: item.name,
      ratedCapacitykW: item.ratedCapacitykW,
      actualPowerkW: item.ratedPowerkW,
      gasFlowm3h: item.gasFlowm3h
    };

    const newCustom = { ...targetCustomEquipment, [overrideKey]: selectedProd };

    if (catalogModalState.category === 'chiller') {
      const count = targetCustomEquipment.chillerCount || targetCalc.chillerCount;
      newCustom.chillerCapacitykW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'boiler') {
      const count = targetCustomEquipment.boilerCount || targetCalc.boilerCount;
      newCustom.boilerCapacitykW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'achp') {
      const count = targetCustomEquipment.achpCount || targetCalc.achpCount;
      newCustom.achpCoolingkW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'vrf') {
      const count = targetCustomEquipment.vrfCount || targetCalc.vrfCount;
      newCustom.vrfCoolingkW = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedChwPumpProduct') {
      const count = targetCustomEquipment.chwPumpCount || targetCalc.chwPumpCount;
      newCustom.chwPumpFlow = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedCwPumpProduct') {
      const count = targetCustomEquipment.cwPumpCount || targetCalc.cwPumpCount;
      newCustom.cwPumpFlow = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedHwPumpProduct') {
      const count = targetCustomEquipment.hwPumpCount || targetCalc.hwPumpCount;
      newCustom.hwPumpFlow = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedTowerProduct') {
      const count = targetCustomEquipment.coolingTowerCount || targetCalc.coolingTowerCount;
      newCustom.coolingTowerFlow = item.ratedCapacitykW * count;
    }

    setTargetCustomEquipment(newCustom);
  };

  const handleBoilerCapChange = (idx: number, capkW: number) => {
    const updated = [...boilers];
    updated[idx].capacitykW = capkW;
    const eff = updated[idx].efficiencyPercent / 100;
    updated[idx].gasFlowm3h = Number((capkW / (9.967 * Math.max(0.5, eff))).toFixed(1));
    setBoilers(updated);
  };

  // 汇总计算既有系统总装机功率与年能耗基准
  const baseline = useMemo(() => {
    let totalChillerCapkW = 0;
    let totalChillerPowerkW = 0;
    let totalBoilerCapkW = 0;
    let totalBoilerGasFlow = 0;
    let totalPumpPowerkW = 0;
    let totalTowerPowerkW = 0;

    if (existingSystemType === 'chiller_boiler' || existingSystemType === 'hybrid') {
      totalChillerCapkW = chillers.reduce((a, b) => a + b.capacitykW * b.count, 0);
      totalChillerPowerkW = chillers.reduce((a, b) => a + b.powerkW * b.count, 0);
      totalBoilerCapkW = boilers.reduce((a, b) => a + b.capacitykW * b.count, 0);
      totalBoilerGasFlow = boilers.reduce((a, b) => a + b.gasFlowm3h * b.count, 0);
      totalPumpPowerkW = pumps.reduce((a, b) => a + b.powerkW * b.count, 0);
      totalTowerPowerkW = towers.reduce((a, b) => a + b.fanPowerkW * b.count, 0);
    } else if (existingSystemType === 'air_heat_pump') {
      totalChillerCapkW = achps.reduce((a, b) => a + b.coolingkW * b.count, 0);
      totalChillerPowerkW = achps.reduce((a, b) => a + b.powerkW * b.count, 0);
      totalPumpPowerkW = pumps.filter(p => p.type === 'chw' || p.type === 'hw').reduce((a, b) => a + b.powerkW * b.count, 0);
    } else if (existingSystemType === 'vrf') {
      totalChillerCapkW = vrfs.reduce((a, b) => a + b.coolingkW * b.count, 0);
      totalChillerPowerkW = vrfs.reduce((a, b) => a + b.powerkW * b.count, 0);
    } else if (existingSystemType === 'district_energy') {
      totalChillerCapkW = districts.reduce((a, b) => a + b.capacitykW * b.count, 0);
      totalPumpPowerkW = districts.reduce((a, b) => a + b.pumpPowerkW * b.count, 0);
    } else if (existingSystemType === 'ground_heat_pump') {
      totalChillerCapkW = gshps.reduce((a, b) => a + b.coolingkW * b.count, 0);
      totalChillerPowerkW = gshps.reduce((a, b) => a + b.powerkW * b.count, 0);
      totalPumpPowerkW = gshps.reduce((a, b) => a + (b.groundPumpPowerkW + b.loadPumpPowerkW) * b.count, 0);
    } else if (existingSystemType === 'split_ac') {
      totalChillerCapkW = splits.reduce((a, b) => a + b.capacitykW * b.count, 0);
      totalChillerPowerkW = splits.reduce((a, b) => a + b.powerkW * b.count, 0);
    }

    const annualCoolingkWh = totalChillerPowerkW * operatingHours * 0.65;
    const annualPumpskWh = totalPumpPowerkW * operatingHours * 0.7;
    const annualTowerskWh = totalTowerPowerkW * operatingHours * 0.65;
    
    const totalElectricitykWh = annualCoolingkWh + annualPumpskWh + annualTowerskWh;
    const totalGasm3 = totalBoilerGasFlow * operatingHours * 0.55;

    const electricityCost = totalElectricitykWh * electricityRate;
    const gasCost = totalGasm3 * gasRate;
    const totalCost = electricityCost + gasCost;
    const carbonTons = (totalElectricitykWh * 0.581 + totalGasm3 * 2.162) / 1000;

    return {
      totalChillerCapkW,
      totalChillerPowerkW,
      totalBoilerCapkW,
      totalBoilerGasFlow,
      totalPumpPowerkW,
      totalTowerPowerkW,
      totalElectricitykWh,
      totalGasm3,
      electricityCost,
      gasCost,
      totalCost,
      carbonTons
    };
  }, [existingSystemType, chillers, boilers, pumps, towers, achps, vrfs, districts, gshps, splits, operatingHours, electricityRate, gasRate]);

  // ⚡ 一键根据主机自动推导匹配水泵与冷却塔
  const handleAutoDerivePumpsAndTowers = () => {
    const totalCoolkW = chillers.reduce((a, c) => a + c.capacitykW * c.count, 0);
    const totalHeatkW = boilers.reduce((a, b) => a + b.capacitykW * b.count, 0);
    const chillerCnt = Math.max(1, chillers.reduce((a, c) => a + c.count, 0));
    const boilerCnt = Math.max(1, boilers.reduce((a, b) => a + b.count, 0));

    if (totalCoolkW > 0 || totalHeatkW > 0) {
      const newPumps: ExistingPumpDetail[] = [];
      if (totalCoolkW > 0) {
        // 冷水泵 (5℃ 温差: 7℃/12℃)
        const chwFlow = Number(((totalCoolkW * 3.6) / (4.186 * 5)).toFixed(0));
        const chwHead = 30;
        const chwPower = Number(((chwFlow * chwHead) / 247.7).toFixed(1));
        newPumps.push({
          id: 'p-chw-auto',
          modelName: '冷水水泵 (夏季冷水循环泵)',
          type: 'chw',
          flowm3h: Number((chwFlow / chillerCnt).toFixed(0)),
          headm: chwHead,
          powerkW: Number((chwPower / chillerCnt).toFixed(1)),
          efficiencyPercent: 65,
          count: chillerCnt + 1
        });

        // 冷却水泵 (5℃ 温差: 32℃/37℃)
        const avgCop = chillers[0]?.cop || 4.0;
        const qCond = totalCoolkW * (1 + 1 / avgCop);
        const cwFlow = Number(((qCond * 3.6) / (4.186 * 5)).toFixed(0));
        const cwHead = 26;
        const cwPower = Number(((cwFlow * cwHead) / 247.7).toFixed(1));
        newPumps.push({
          id: 'p-cw-auto',
          modelName: '冷却水水泵 (冷凝散热循环泵)',
          type: 'cw',
          flowm3h: Number((cwFlow / chillerCnt).toFixed(0)),
          headm: cwHead,
          powerkW: Number((cwPower / chillerCnt).toFixed(1)),
          efficiencyPercent: 65,
          count: chillerCnt + 1
        });

        // 冷却塔 (考虑 1.15 富裕系数)
        const towerFlow = Number((cwFlow * 1.15).toFixed(0));
        const towerFanPower = Number((towerFlow * 0.18).toFixed(1));
        setTowers([{
          id: 't-auto',
          modelName: '开式方形横流冷却塔 (冷却水散热)',
          flowm3h: Number((towerFlow / chillerCnt).toFixed(0)),
          fanPowerkW: Number((towerFanPower / chillerCnt).toFixed(1)),
          count: chillerCnt
        }]);
      }

      if (totalHeatkW > 0) {
        // 独立热水泵 (10℃ 温差: 60℃/50℃)
        const hwFlow = Number(((totalHeatkW * 3.6) / (4.186 * 10)).toFixed(0));
        const hwHead = 22;
        const hwPower = Number(((hwFlow * hwHead) / 247.7).toFixed(1));
        newPumps.push({
          id: 'p-hw-auto',
          modelName: '锅炉独立热水泵 (冬季热水循环泵)',
          type: 'hw',
          flowm3h: Number((hwFlow / boilerCnt).toFixed(0)),
          headm: hwHead,
          powerkW: Number((hwPower / boilerCnt).toFixed(1)),
          efficiencyPercent: 65,
          count: boilerCnt + 1
        });
      }

      if (newPumps.length > 0) {
        setPumps(newPumps);
      }
    }
  };

  // 步骤 1：维持原系统，仅更换老旧高效设备方案
  const step1Result = useMemo(() => {
    const newChillerPowerkW = baseline.totalChillerCapkW / 6.8;
    const newPumpPowerkW = baseline.totalPumpPowerkW * (0.58 / 0.82) * 0.8;
    const newBoilerGasFlow = baseline.totalBoilerGasFlow * (0.82 / 0.95);
    const newTowerPowerkW = baseline.totalTowerPowerkW * 0.75;

    const newEleckWh = (newChillerPowerkW * 0.65 + newPumpPowerkW * 0.7 + newTowerPowerkW * 0.65) * operatingHours;
    const newGasm3 = newBoilerGasFlow * operatingHours * 0.55;

    const newElecCost = newEleckWh * electricityRate;
    const newGasCost = newGasm3 * gasRate;
    const newTotalCost = newElecCost + newGasCost;
    const costSaved = baseline.totalCost - newTotalCost;
    const carbonTons = (newEleckWh * 0.581 + newGasm3 * 2.162) / 1000;
    const capEx = 220;

    return {
      title: '步骤一：维持原系统架构，仅更换老旧高效设备',
      newChillerCOP: 6.8,
      newPumpEff: 82,
      newBoilerEff: 95,
      elecCost: newElecCost,
      gasCost: newGasCost,
      totalCost: newTotalCost,
      costSavedRmb: costSaved,
      elecSavedPercent: Math.max(0, ((baseline.totalElectricitykWh - newEleckWh) / Math.max(1, baseline.totalElectricitykWh)) * 100),
      gasSavedPercent: baseline.totalGasm3 > 0 ? ((baseline.totalGasm3 - newGasm3) / baseline.totalGasm3) * 100 : 0,
      carbonTons,
      carbonSavedTons: baseline.carbonTons - carbonTons,
      capExRmbTenThousand: capEx,
      paybackYears: costSaved > 0 ? capEx / (costSaved / 10000) : 0
    };
  }, [baseline, operatingHours, electricityRate, gasRate]);

  // 步骤 2：更换系统形式 (完全依据目标选定品牌设备的真实输入电功率和耗气量计算)
  const step2Result = useMemo(() => {
    const targetElectricPowerkW = targetCalc.totalInstalledElectricPowerkW;
    const targetGasm3h = targetCalc.boilerGasFlow;

    const newEleckWh = targetElectricPowerkW * operatingHours * 0.65;
    const newGasm3 = targetGasm3h * operatingHours * 0.55;

    const newElecCost = newEleckWh * electricityRate;
    const newGasCost = newGasm3 * gasRate;
    const newTotalCost = newElecCost + newGasCost;
    const costSaved = baseline.totalCost - newTotalCost;
    const carbonTons = (newEleckWh * 0.581 + newGasm3 * 2.162) / 1000;

    return {
      title: `步骤二：更换系统形式为【${SYSTEM_TYPES_META[targetSystemType].name}】`,
      elecCost: newElecCost,
      gasCost: newGasCost,
      totalCost: newTotalCost,
      costSavedRmb: costSaved,
      elecSavedPercent: Math.max(0, ((baseline.totalElectricitykWh - newEleckWh) / Math.max(1, baseline.totalElectricitykWh)) * 100),
      gasSavedPercent: baseline.totalGasm3 > 0 ? ((baseline.totalGasm3 - newGasm3) / baseline.totalGasm3) * 100 : 0,
      carbonTons,
      carbonSavedTons: baseline.carbonTons - carbonTons,
      capExRmbTenThousand: targetCapEx,
      paybackYears: costSaved > 0 ? targetCapEx / (costSaved / 10000) : 0
    };
  }, [baseline, targetSystemType, targetCalc, targetCapEx, operatingHours, electricityRate, gasRate]);

  // 步骤 3：AI 边缘计算智能群控与寻优
  const step3Result = useMemo(() => {
    const newEleckWh = baseline.totalElectricitykWh * 0.81;
    const newGasm3 = baseline.totalGasm3 * 0.92;
    const newElecCost = newEleckWh * electricityRate;
    const newGasCost = newGasm3 * gasRate;
    const newTotalCost = newElecCost + newGasCost;
    const costSaved = baseline.totalCost - newTotalCost;
    const carbonTons = (newEleckWh * 0.581 + newGasm3 * 2.162) / 1000;
    const capEx = 35;

    return {
      title: '步骤三：AI 边缘计算智能群控与零碳数字寻优',
      elecCost: newElecCost,
      gasCost: newGasCost,
      totalCost: newTotalCost,
      costSavedRmb: costSaved,
      elecSavedPercent: 19.0,
      gasSavedPercent: 8.0,
      carbonTons,
      carbonSavedTons: baseline.carbonTons - carbonTons,
      capExRmbTenThousand: capEx,
      paybackYears: costSaved > 0 ? capEx / (costSaved / 10000) : 0
    };
  }, [baseline, electricityRate, gasRate]);

  const currentResult = activeStep === 1 ? step1Result : (activeStep === 2 ? step2Result : step3Result);

  // ECharts 对比图配置
  const getChartOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['改造前既有现状', '改造优化后'], textStyle: { color: '#94a3b8', fontSize: 12 }, top: 0 },
      grid: { top: '15%', left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['年运行电费 (万元)', '年天然气费 (万元)', '年总能耗费用 (万元)', '年碳排放 (吨)'],
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 }
      },
      series: [
        {
          name: '改造前既有现状',
          type: 'bar',
          data: [
            (baseline.electricityCost / 10000).toFixed(1),
            (baseline.gasCost / 10000).toFixed(1),
            (baseline.totalCost / 10000).toFixed(1),
            baseline.carbonTons.toFixed(0)
          ],
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '改造优化后',
          type: 'bar',
          data: [
            (currentResult.elecCost / 10000).toFixed(1),
            (currentResult.gasCost / 10000).toFixed(1),
            (currentResult.totalCost / 10000).toFixed(1),
            currentResult.carbonTons.toFixed(0)
          ],
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  };

  const targetSysMeta = SYSTEM_TYPES_META[targetSystemType];

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* 品牌选型模态框 */}
      <EquipmentCatalogModal
        isOpen={catalogModalState.isOpen}
        onClose={() => setCatalogModalState(prev => ({ ...prev, isOpen: false }))}
        category={catalogModalState.category}
        categoryTitle={catalogModalState.categoryTitle}
        targetSingleValue={catalogModalState.targetSingleValue}
        selectedCatalogId={(targetCustomEquipment[catalogModalState.overrideKey] as any)?.catalogId}
        onSelectProduct={handleSelectCatalogItem}
      />

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/40 text-blue-400">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <span>既有建筑空调冷热源系统改造与 AI 智能寻优</span>
                <span className="px-3 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs rounded-full shadow">
                  真实品牌型号精算
                </span>
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                既有系统设备分类与新建项目设备配置表 100% 保持一致，支持真实品牌型号物理铭牌电量精算！
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAiReportModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/25 border border-emerald-300/50 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>🤖 AI 专家级改造诊断与多方案比选报告</span>
          </button>
        </div>
      </div>

      {/* 2. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: Detailed Existing Equipment Input Form (设备类型与新建建筑完全对齐) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-400" />
              <span>既有建筑与老旧设备明细录入</span>
            </h3>
            <span className="text-xs text-blue-400 font-semibold">设备类型与新建配置一致</span>
          </div>

          <div className="space-y-4 text-sm">
            
            <div>
              <label className="block text-slate-200 font-semibold mb-1">1. 既有冷热源系统形式</label>
              <select
                value={existingSystemType}
                onChange={(e) => setExistingSystemType(e.target.value as SystemType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-blue-300 font-bold text-sm focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(SYSTEM_TYPES_META).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">建筑名称</label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">建筑面积 (m²)</label>
                <input
                  type="number"
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-bold text-sm"
                />
              </div>
            </div>

            {/* 1. 冷水机组 (chiller_boiler / hybrid) */}
            {(existingSystemType === 'chiller_boiler' || existingSystemType === 'hybrid') && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                  <span className="font-bold text-blue-300 flex items-center space-x-1">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span>冷水机组 (螺杆/离心/磁悬浮) ({chillers.length} 组)</span>
                  </span>
                  <button
                    onClick={() => setChillers([...chillers, {
                      id: `c-${Date.now()}`,
                      modelName: `老旧螺杆/离心机组 ${chillers.length + 1}`,
                      capacitykW: 1500,
                      powerkW: 384,
                      cop: 3.9,
                      count: 1
                    }])}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加主机</span>
                  </button>
                </div>

                {chillers.map((c, idx) => (
                  <div key={c.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <input
                        type="text"
                        value={c.modelName}
                        onChange={(e) => {
                          const updated = [...chillers];
                          updated[idx].modelName = e.target.value;
                          setChillers(updated);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                      <button
                        onClick={() => {
                          if (chillers.length > 1) setChillers(chillers.filter(item => item.id !== c.id));
                        }}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-300 block">制冷量(kW)</span>
                        <input
                          type="number"
                          value={c.capacitykW}
                          onChange={(e) => {
                            const updated = [...chillers];
                            const cap = Number(e.target.value);
                            updated[idx].capacitykW = cap;
                            updated[idx].powerkW = Number((cap / c.cop).toFixed(1));
                            setChillers(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-300 block">电功率(kW)</span>
                        <input
                          type="number"
                          value={c.powerkW}
                          onChange={(e) => {
                            const updated = [...chillers];
                            updated[idx].powerkW = Number(e.target.value);
                            setChillers(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-300 block">COP值</span>
                        <input
                          type="number"
                          step="0.1"
                          value={c.cop}
                          onChange={(e) => {
                            const updated = [...chillers];
                            const cop = Number(e.target.value);
                            updated[idx].cop = cop;
                            updated[idx].powerkW = Number((c.capacitykW / Math.max(1, cop)).toFixed(1));
                            setChillers(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-blue-300 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-300 block">台数</span>
                        <input
                          type="number"
                          value={c.count}
                          onChange={(e) => {
                            const updated = [...chillers];
                            updated[idx].count = Number(e.target.value);
                            setChillers(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. 燃气热水锅炉 */}
            {(existingSystemType === 'chiller_boiler' || existingSystemType === 'hybrid') && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-rose-400 block border-b border-slate-750 pb-2">
                  燃气热水锅炉 (耗气量按制热量自动推算，支持修改)
                </span>
                {boilers.map((b, idx) => (
                  <div key={b.id} className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">供热量(kW)</span>
                      <input
                        type="number"
                        value={b.capacitykW}
                        onChange={(e) => handleBoilerCapChange(idx, Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">耗气量(m³/h)</span>
                      <input
                        type="number"
                        value={b.gasFlowm3h}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].gasFlowm3h = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-rose-400 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">效率(%)</span>
                      <input
                        type="number"
                        value={b.efficiencyPercent}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].efficiencyPercent = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">台数</span>
                      <input
                        type="number"
                        value={b.count}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].count = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. 水泵循环系统 */}
            {(existingSystemType === 'chiller_boiler' || existingSystemType === 'air_heat_pump' || existingSystemType === 'hybrid') && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                  <span className="font-bold text-blue-300">
                    水泵循环系统 (冷水泵、冷却水泵、热水泵)
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoDerivePumpsAndTowers}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                    title="根据上方输入的冷水机组与锅炉参数，自动推导冷水泵、冷却水泵、冷却塔与热水泵流量与扬程"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ 一键根据主机自动推导匹配</span>
                  </button>
                </div>

                {pumps.map((p, idx) => (
                  <div key={p.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">{p.modelName}</span>
                      <span className="text-xs text-slate-400">效率 {p.efficiencyPercent}%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-300 block">流量(m³/h)</span>
                        <input
                          type="number"
                          value={p.flowm3h}
                          onChange={(e) => {
                            const updated = [...pumps];
                            const fl = Number(e.target.value);
                            updated[idx].flowm3h = fl;
                            updated[idx].powerkW = Number(((fl * p.headm) / 247.7).toFixed(1));
                            setPumps(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-300 block">扬程(m)</span>
                        <input
                          type="number"
                          value={p.headm}
                          onChange={(e) => {
                            const updated = [...pumps];
                            const hd = Number(e.target.value);
                            updated[idx].headm = hd;
                            updated[idx].powerkW = Number(((p.flowm3h * hd) / 247.7).toFixed(1));
                            setPumps(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-300 block">功率(kW)</span>
                        <input
                          type="number"
                          value={p.powerkW}
                          onChange={(e) => {
                            const updated = [...pumps];
                            updated[idx].powerkW = Number(e.target.value);
                            setPumps(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-300 block">台数</span>
                        <input
                          type="number"
                          value={p.count}
                          onChange={(e) => {
                            const updated = [...pumps];
                            updated[idx].count = Number(e.target.value);
                            setPumps(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. 冷却塔 (冷却水散热) */}
            {(existingSystemType === 'chiller_boiler' || existingSystemType === 'hybrid') && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block border-b border-slate-750 pb-2">
                  冷却塔 (冷却水散热)
                </span>
                {towers.map((t, idx) => (
                  <div key={t.id} className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">流量(m³/h)</span>
                      <input
                        type="number"
                        value={t.flowm3h}
                        onChange={(e) => {
                          const updated = [...towers];
                          updated[idx].flowm3h = Number(e.target.value);
                          setTowers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">风机电功率(kW)</span>
                      <input
                        type="number"
                        value={t.fanPowerkW}
                        onChange={(e) => {
                          const updated = [...towers];
                          updated[idx].fanPowerkW = Number(e.target.value);
                          setTowers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">台数</span>
                      <input
                        type="number"
                        value={t.count}
                        onChange={(e) => {
                          const updated = [...towers];
                          updated[idx].count = Number(e.target.value);
                          setTowers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. 风冷热泵主机模块 */}
            {existingSystemType === 'air_heat_pump' && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-sky-400 block border-b border-slate-750 pb-2">
                  风冷热泵主机模块
                </span>
                {achps.map((a, idx) => (
                  <div key={a.id} className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">总制冷量(kW)</span>
                      <input
                        type="number"
                        value={a.coolingkW}
                        onChange={(e) => {
                          const updated = [...achps];
                          updated[idx].coolingkW = Number(e.target.value);
                          setAchps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">电功率(kW)</span>
                      <input
                        type="number"
                        value={a.powerkW}
                        onChange={(e) => {
                          const updated = [...achps];
                          updated[idx].powerkW = Number(e.target.value);
                          setAchps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">COP值</span>
                      <input
                        type="number"
                        step="0.1"
                        value={a.cop}
                        onChange={(e) => {
                          const updated = [...achps];
                          updated[idx].cop = Number(e.target.value);
                          setAchps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sky-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">模块台数</span>
                      <input
                        type="number"
                        value={a.count}
                        onChange={(e) => {
                          const updated = [...achps];
                          updated[idx].count = Number(e.target.value);
                          setAchps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. VRF 多联机室外机 */}
            {existingSystemType === 'vrf' && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-purple-400 block border-b border-slate-750 pb-2">
                  VRF 多联机室外机
                </span>
                {vrfs.map((v, idx) => (
                  <div key={v.id} className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">总制冷量(kW)</span>
                      <input
                        type="number"
                        value={v.coolingkW}
                        onChange={(e) => {
                          const updated = [...vrfs];
                          updated[idx].coolingkW = Number(e.target.value);
                          setVrfs(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">电功率(kW)</span>
                      <input
                        type="number"
                        value={v.powerkW}
                        onChange={(e) => {
                          const updated = [...vrfs];
                          updated[idx].powerkW = Number(e.target.value);
                          setVrfs(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">EER/COP</span>
                      <input
                        type="number"
                        step="0.1"
                        value={v.eer}
                        onChange={(e) => {
                          const updated = [...vrfs];
                          updated[idx].eer = Number(e.target.value);
                          setVrfs(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-purple-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">外机台数</span>
                      <input
                        type="number"
                        value={v.count}
                        onChange={(e) => {
                          const updated = [...vrfs];
                          updated[idx].count = Number(e.target.value);
                          setVrfs(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 7. 区域能源换热器机组 */}
            {existingSystemType === 'district_energy' && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-teal-400 block border-b border-slate-750 pb-2">
                  区域板式换热器机组与二次循环泵
                </span>
                {districts.map((d, idx) => (
                  <div key={d.id} className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">换热容量(kW)</span>
                      <input
                        type="number"
                        value={d.capacitykW}
                        onChange={(e) => {
                          const updated = [...districts];
                          updated[idx].capacitykW = Number(e.target.value);
                          setDistricts(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">二次泵功率(kW)</span>
                      <input
                        type="number"
                        value={d.pumpPowerkW}
                        onChange={(e) => {
                          const updated = [...districts];
                          updated[idx].pumpPowerkW = Number(e.target.value);
                          setDistricts(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">机组台数</span>
                      <input
                        type="number"
                        value={d.count}
                        onChange={(e) => {
                          const updated = [...districts];
                          updated[idx].count = Number(e.target.value);
                          setDistricts(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 8. 地源热泵系统 */}
            {existingSystemType === 'ground_heat_pump' && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-400 block border-b border-slate-750 pb-2">
                  地源热泵主机与源侧/负荷侧水泵
                </span>
                {gshps.map((g, idx) => (
                  <div key={g.id} className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">主机容量(kW)</span>
                      <input
                        type="number"
                        value={g.coolingkW}
                        onChange={(e) => {
                          const updated = [...gshps];
                          updated[idx].coolingkW = Number(e.target.value);
                          setGshps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">主机电功率(kW)</span>
                      <input
                        type="number"
                        value={g.powerkW}
                        onChange={(e) => {
                          const updated = [...gshps];
                          updated[idx].powerkW = Number(e.target.value);
                          setGshps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">地埋管泵功率(kW)</span>
                      <input
                        type="number"
                        value={g.groundPumpPowerkW}
                        onChange={(e) => {
                          const updated = [...gshps];
                          updated[idx].groundPumpPowerkW = Number(e.target.value);
                          setGshps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-teal-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">台数</span>
                      <input
                        type="number"
                        value={g.count}
                        onChange={(e) => {
                          const updated = [...gshps];
                          updated[idx].count = Number(e.target.value);
                          setGshps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 9. 分体空调系统 */}
            {existingSystemType === 'split_ac' && (
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 block border-b border-slate-750 pb-2">
                  分体空调主机
                </span>
                {splits.map((s, idx) => (
                  <div key={s.id} className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-300 block">总容量(kW)</span>
                      <input
                        type="number"
                        value={s.capacitykW}
                        onChange={(e) => {
                          const updated = [...splits];
                          updated[idx].capacitykW = Number(e.target.value);
                          setSplits(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">总功率(kW)</span>
                      <input
                        type="number"
                        value={s.powerkW}
                        onChange={(e) => {
                          const updated = [...splits];
                          updated[idx].powerkW = Number(e.target.value);
                          setSplits(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-300 block">台数</span>
                      <input
                        type="number"
                        value={s.count}
                        onChange={(e) => {
                          const updated = [...splits];
                          updated[idx].count = Number(e.target.value);
                          setSplits(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                <span className="font-bold text-amber-400 flex items-center space-x-1.5 text-xs">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>能源价格设定 (电价与天然气单价)</span>
                </span>
                <span className="text-[11px] text-slate-400">实时联动精算</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">综合电价 (元/kWh)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={electricityRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setElectricityRate(val);
                      if (onUpdateTariffConfig && tariffConfig) {
                        onUpdateTariffConfig({ ...tariffConfig, averageElectricityPrice: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">天然气单价 (元/m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gasRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setGasRate(val);
                      if (onUpdateTariffConfig && tariffConfig) {
                        onUpdateTariffConfig({ ...tariffConfig, gasPrice: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-400 font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-xs">空调系统年运行小时 (h/年)</label>
                <input
                  type="number"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold text-sm"
                />
              </div>
            </div>

          </div>

          {/* 既有基准计算统计卡片 */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-2 text-sm">
            <span className="font-bold text-red-300 flex items-center space-x-1.5 text-base">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>改造前老旧系统能耗基准计算结果</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-200 pt-1">
              <div>既有年耗电量：<span className="font-bold text-white">{(baseline.totalElectricitykWh / 10000).toFixed(1)} 万 kWh</span></div>
              <div>既有年耗气量：<span className="font-bold text-white">{(baseline.totalGasm3 / 10000).toFixed(1)} 万 m³</span></div>
              <div>既有年电费：<span className="font-bold text-amber-300">¥{(baseline.electricityCost / 10000).toFixed(2)} 万元</span></div>
              <div>既有年燃气费：<span className="font-bold text-rose-300">¥{(baseline.gasCost / 10000).toFixed(2)} 万元</span></div>
              <div className="col-span-2 pt-1 border-t border-red-500/20 text-slate-200 font-bold flex justify-between text-base">
                <span>既有年总能耗开支：</span>
                <span className="text-red-400 text-lg">¥{(baseline.totalCost / 10000).toFixed(2)} 万元/年</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right 7 Cols: 3-Step Retrofit Engine + Interactive Comparisons */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 3 Step Tabs Navigation Header */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap gap-2 shadow-lg">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                activeStep === 1
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/40'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-slate-950/60 text-blue-300 text-xs flex items-center justify-center font-black">1</span>
              <span>维持原系统，仅换高效设备 (首推)</span>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                activeStep === 2
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-slate-950/60 text-emerald-300 text-xs flex items-center justify-center font-black">2</span>
              <span>更换系统形式 (同新建明细表)</span>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                activeStep === 3
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/40'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-850'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-slate-950/60 text-purple-300 text-xs flex items-center justify-center font-black">3</span>
              <span>AI 边缘计算智能群控</span>
            </button>
          </div>

          {/* Detailed Content Panel for Active Step */}
          {activeStep === 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded font-bold text-xs">首推方案</span>
                  <h4 className="text-base font-bold text-white">维持原空调系统形式，仅更换老旧高效设备</h4>
                </div>
                <span className="text-emerald-400 font-bold text-base">
                  每年节省 ¥{(step1Result.costSavedRmb / 10000).toFixed(2)} 万元
                </span>
              </div>

              <p className="text-slate-200 leading-relaxed">
                无需变动已有管路架构与机房布局。将老旧主机替换为**超高效磁悬浮离心机组 (COP 6.8)**，水泵更换为**高效率变频水泵 (82%)**，锅炉更换为**低氮冷凝热水锅炉 (效率95%)**。
              </p>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                  <span className="text-slate-300 text-xs block">冷水主机 COP 提升</span>
                  <span className="text-blue-300 font-bold text-base">3.9 &rarr; 6.8 (+74%)</span>
                </div>
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                  <span className="text-slate-300 text-xs block">水泵综合效率提升</span>
                  <span className="text-emerald-300 font-bold text-base">58% &rarr; 82% (+41%)</span>
                </div>
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750">
                  <span className="text-slate-300 text-xs block">估算回收期</span>
                  <span className="text-amber-300 font-bold text-base">{step1Result.paybackYears.toFixed(1)} 年</span>
                </div>
              </div>
            </div>
          )}

          {/* 步骤二：目标系统设备明细表 + 真实品牌产品选型 */}
          {activeStep === 2 && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-6 shadow-xl text-sm">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded font-bold text-xs">方案二</span>
                  <h4 className="text-base font-bold text-white">更换系统形式 (真实品牌选型，真实铭牌电功率精算)</h4>
                </div>
              </div>

              {/* 子步骤 2.1: 选择目标新系统形式 */}
              <div className="bg-slate-850 p-4.5 rounded-xl border border-slate-750 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-base">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">2.1</span>
                  <span>第一步：选择目标新空调系统形式</span>
                </div>
                <div>
                  <select
                    value={targetSystemType}
                    onChange={(e) => {
                      setTargetSystemType(e.target.value as SystemType);
                      setTargetCustomEquipment({});
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2.5 text-emerald-300 font-bold text-base"
                  >
                    {Object.values(SYSTEM_TYPES_META).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 子步骤 2.2: 目标新系统的完整设备明细表 + 品牌库选型 */}
              <div className="bg-slate-850 p-4.5 rounded-xl border border-slate-750 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-base">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">2.2</span>
                    <span>第二步：【{targetSysMeta.name}】主要设备选型 (支持品牌库真实型号选型)</span>
                  </div>
                  <span className="text-xs text-slate-400">* 电量取自所选真实品牌型号物理电量</span>
                </div>

                {/* 核心设备明细表格 */}
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-750">
                        <th className="py-3 px-3">主要空调设备名称</th>
                        <th className="py-3 px-3 text-amber-300">选定实际市场品牌型号</th>
                        <th className="py-3 px-3">推荐标准计算总值</th>
                        <th className="py-3 px-3 text-blue-300">配置台数 (台)</th>
                        <th className="py-3 px-3 text-emerald-300">折算单台容量/流量</th>
                        <th className="py-3 px-3 text-blue-300">配置总值</th>
                        <th className="py-3 px-3 text-amber-400">单台铭牌真实电量/气耗</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      
                      {/* 冷水机组 */}
                      {(targetSystemType === 'chiller_boiler' || targetSystemType === 'hybrid') && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <span>冷水机组 (螺杆/离心/磁悬浮)</span>
                          </td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedChillerProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold text-xs rounded border border-blue-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{targetCustomEquipment.selectedChillerProduct.brand} {targetCustomEquipment.selectedChillerProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('chiller', '冷水机组', (targetCustomEquipment.chillerCapacitykW || targetCalc.chillerCapacitykW) / (targetCustomEquipment.chillerCount || targetCalc.chillerCount), 'selectedChillerProduct')}
                                  className="text-xs text-blue-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('chiller', '冷水机组', (targetCustomEquipment.chillerCapacitykW || targetCalc.chillerCapacitykW) / (targetCustomEquipment.chillerCount || targetCalc.chillerCount), 'selectedChillerProduct')}
                                className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white rounded text-xs font-bold border border-blue-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选型 (约克/开利...)</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.chillerCapacitykW.toFixed(1)} kW</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={targetCustomEquipment.chillerCount ?? targetCalc.chillerCount}
                              onChange={(e) => handleTargetCustomChange('chillerCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-blue-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.chillerCapacitykW || targetCalc.chillerCapacitykW) / (targetCustomEquipment.chillerCount || targetCalc.chillerCount)).toFixed(1)} kW/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.chillerCapacitykW ?? ''}
                              placeholder={targetCalc.chillerCapacitykW.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('chillerCapacitykW', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedChillerProduct ? `${targetCustomEquipment.selectedChillerProduct.actualPowerkW} kW/台` : `${(targetCalc.chillerPowerkW / targetCalc.chillerCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* 燃气热水锅炉 */}
                      {(targetSystemType === 'chiller_boiler' || targetSystemType === 'hybrid') && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <span>燃气热水锅炉</span>
                          </td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedBoilerProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold text-xs rounded border border-rose-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-rose-400" />
                                  <span>{targetCustomEquipment.selectedBoilerProduct.brand} {targetCustomEquipment.selectedBoilerProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('boiler', '燃气热水锅炉', (targetCustomEquipment.boilerCapacitykW || targetCalc.boilerCapacitykW) / (targetCustomEquipment.boilerCount || targetCalc.boilerCount), 'selectedBoilerProduct')}
                                  className="text-xs text-rose-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('boiler', '燃气热水锅炉', (targetCustomEquipment.boilerCapacitykW || targetCalc.boilerCapacitykW) / (targetCustomEquipment.boilerCount || targetCalc.boilerCount), 'selectedBoilerProduct')}
                                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded text-xs font-bold border border-rose-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选型 (方快/双良...)</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.boilerCapacitykW.toFixed(1)} kW</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={targetCustomEquipment.boilerCount ?? targetCalc.boilerCount}
                              onChange={(e) => handleTargetCustomChange('boilerCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-rose-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.boilerCapacitykW || targetCalc.boilerCapacitykW) / (targetCustomEquipment.boilerCount || targetCalc.boilerCount)).toFixed(1)} kW/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.boilerCapacitykW ?? ''}
                              placeholder={targetCalc.boilerCapacitykW.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('boilerCapacitykW', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-rose-400">
                            {targetCustomEquipment.selectedBoilerProduct ? `${targetCustomEquipment.selectedBoilerProduct.gasFlowm3h || '-'} m³/h/台` : `${(targetCalc.boilerGasFlow / targetCalc.boilerCount).toFixed(1)} m³/h (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* 冷水水泵 */}
                      {targetSysMeta.hasChilledWaterPump && targetCalc.chwPumpFlow > 0 && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">冷水水泵 (夏季冷水泵)</td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedChwPumpProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold text-xs rounded border border-blue-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{targetCustomEquipment.selectedChwPumpProduct.brand} {targetCustomEquipment.selectedChwPumpProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('pump', '冷水水泵', (targetCustomEquipment.chwPumpFlow || targetCalc.chwPumpFlow) / (targetCustomEquipment.chwPumpCount || targetCalc.chwPumpCount), 'selectedChwPumpProduct')}
                                  className="text-xs text-blue-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('pump', '冷水水泵', (targetCustomEquipment.chwPumpFlow || targetCalc.chwPumpFlow) / (targetCustomEquipment.chwPumpCount || targetCalc.chwPumpCount), 'selectedChwPumpProduct')}
                                className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white rounded text-xs font-bold border border-blue-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选水泵</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.chwPumpFlow.toFixed(1)} m³/h</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={targetCustomEquipment.chwPumpCount ?? targetCalc.chwPumpCount}
                              onChange={(e) => handleTargetCustomChange('chwPumpCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-blue-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.chwPumpFlow || targetCalc.chwPumpFlow) / (targetCustomEquipment.chwPumpCount || targetCalc.chwPumpCount)).toFixed(1)} m³/h/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.chwPumpFlow ?? ''}
                              placeholder={targetCalc.chwPumpFlow.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('chwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedChwPumpProduct ? `${targetCustomEquipment.selectedChwPumpProduct.actualPowerkW} kW/台` : `${(targetCalc.chwPumpPowerkW / targetCalc.chwPumpCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* 冬季热水循环泵 */}
                      {targetSysMeta.hasHotWaterPump && targetCalc.hwPumpFlow > 0 && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">
                            {targetSystemType === 'air_heat_pump' ? '冬季热水循环泵' : '锅炉独立热水泵 (冬季热水循环泵)'}
                          </td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedHwPumpProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold text-xs rounded border border-rose-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-rose-400" />
                                  <span>{targetCustomEquipment.selectedHwPumpProduct.brand} {targetCustomEquipment.selectedHwPumpProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('pump', '热水水泵', (targetCustomEquipment.hwPumpFlow || targetCalc.hwPumpFlow) / (targetCustomEquipment.hwPumpCount || targetCalc.hwPumpCount), 'selectedHwPumpProduct')}
                                  className="text-xs text-rose-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('pump', '热水水泵', (targetCustomEquipment.hwPumpFlow || targetCalc.hwPumpFlow) / (targetCustomEquipment.hwPumpCount || targetCalc.hwPumpCount), 'selectedHwPumpProduct')}
                                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded text-xs font-bold border border-rose-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选水泵</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.hwPumpFlow.toFixed(1)} m³/h</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={targetCustomEquipment.hwPumpCount ?? targetCalc.hwPumpCount}
                              onChange={(e) => handleTargetCustomChange('hwPumpCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-rose-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.hwPumpFlow || targetCalc.hwPumpFlow) / (targetCustomEquipment.hwPumpCount || targetCalc.hwPumpCount)).toFixed(1)} m³/h/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.hwPumpFlow ?? ''}
                              placeholder={targetCalc.hwPumpFlow.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('hwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedHwPumpProduct ? `${targetCustomEquipment.selectedHwPumpProduct.actualPowerkW} kW/台` : `${(targetCalc.hwPumpPowerkW / targetCalc.hwPumpCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* 冷却水水泵 */}
                      {targetSysMeta.hasCoolingWaterPump && targetCalc.cwPumpFlow > 0 && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">冷却水水泵</td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedCwPumpProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded border border-emerald-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{targetCustomEquipment.selectedCwPumpProduct.brand} {targetCustomEquipment.selectedCwPumpProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('pump', '冷却水水泵', (targetCustomEquipment.cwPumpFlow || targetCalc.cwPumpFlow) / (targetCustomEquipment.cwPumpCount || targetCalc.cwPumpCount), 'selectedCwPumpProduct')}
                                  className="text-xs text-emerald-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('pump', '冷却水水泵', (targetCustomEquipment.cwPumpFlow || targetCalc.cwPumpFlow) / (targetCustomEquipment.cwPumpCount || targetCalc.cwPumpCount), 'selectedCwPumpProduct')}
                                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded text-xs font-bold border border-emerald-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选水泵</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.cwPumpFlow.toFixed(1)} m³/h</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={targetCustomEquipment.cwPumpCount ?? targetCalc.cwPumpCount}
                              onChange={(e) => handleTargetCustomChange('cwPumpCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-emerald-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.cwPumpFlow || targetCalc.cwPumpFlow) / (targetCustomEquipment.cwPumpCount || targetCalc.cwPumpCount)).toFixed(1)} m³/h/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.cwPumpFlow ?? ''}
                              placeholder={targetCalc.cwPumpFlow.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('cwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedCwPumpProduct ? `${targetCustomEquipment.selectedCwPumpProduct.actualPowerkW} kW/台` : `${(targetCalc.cwPumpPowerkW / targetCalc.cwPumpCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* 冷却塔 */}
                      {targetSysMeta.hasCoolingTower && targetCalc.coolingTowerFlow > 0 && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">冷却塔 (冷却水散热)</td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedTowerProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded border border-emerald-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{targetCustomEquipment.selectedTowerProduct.brand} {targetCustomEquipment.selectedTowerProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('cooling_tower', '冷却塔', (targetCustomEquipment.coolingTowerFlow || targetCalc.coolingTowerFlow) / (targetCustomEquipment.coolingTowerCount || targetCalc.coolingTowerCount), 'selectedTowerProduct')}
                                  className="text-xs text-emerald-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('cooling_tower', '冷却塔', (targetCustomEquipment.coolingTowerFlow || targetCalc.coolingTowerFlow) / (targetCustomEquipment.coolingTowerCount || targetCalc.coolingTowerCount), 'selectedTowerProduct')}
                                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded text-xs font-bold border border-emerald-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选型</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.coolingTowerFlow.toFixed(1)} m³/h</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={targetCustomEquipment.coolingTowerCount ?? targetCalc.coolingTowerCount}
                              onChange={(e) => handleTargetCustomChange('coolingTowerCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-emerald-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.coolingTowerFlow || targetCalc.coolingTowerFlow) / (targetCustomEquipment.coolingTowerCount || targetCalc.coolingTowerCount)).toFixed(1)} m³/h/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.coolingTowerFlow ?? ''}
                              placeholder={targetCalc.coolingTowerFlow.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('coolingTowerFlow', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedTowerProduct ? `${targetCustomEquipment.selectedTowerProduct.actualPowerkW} kW/台` : `${(targetCalc.coolingTowerFanPowerkW / targetCalc.coolingTowerCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* 风冷热泵主机模块 */}
                      {targetSystemType === 'air_heat_pump' && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                            <Wind className="w-4 h-4 text-sky-400" />
                            <span>风冷热泵主机模块</span>
                          </td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedAchpProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 font-bold text-xs rounded border border-sky-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-sky-400" />
                                  <span>{targetCustomEquipment.selectedAchpProduct.brand} {targetCustomEquipment.selectedAchpProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('achp', '风冷热泵', (targetCustomEquipment.achpCoolingkW || targetCalc.achpCoolingkW) / (targetCustomEquipment.achpCount || targetCalc.achpCount), 'selectedAchpProduct')}
                                  className="text-xs text-sky-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('achp', '风冷热泵', (targetCustomEquipment.achpCoolingkW || targetCalc.achpCoolingkW) / (targetCustomEquipment.achpCount || targetCalc.achpCount), 'selectedAchpProduct')}
                                className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white rounded text-xs font-bold border border-sky-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选型 (麦克维尔...)</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.achpCoolingkW.toFixed(1)} kW</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={targetCustomEquipment.achpCount ?? targetCalc.achpCount}
                              onChange={(e) => handleTargetCustomChange('achpCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-sky-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.achpCoolingkW || targetCalc.achpCoolingkW) / (targetCustomEquipment.achpCount || targetCalc.achpCount)).toFixed(1)} kW/模块
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.achpCoolingkW ?? ''}
                              placeholder={targetCalc.achpCoolingkW.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('achpCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedAchpProduct ? `${targetCustomEquipment.selectedAchpProduct.actualPowerkW} kW/模块` : `${(targetCalc.achpPowerkW / targetCalc.achpCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                      {/* VRF多联机 */}
                      {targetSystemType === 'vrf' && (
                        <tr className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            <span>VRF 多联机室外机</span>
                          </td>
                          <td className="py-3 px-3">
                            {targetCustomEquipment.selectedVrfProduct ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold text-xs rounded border border-purple-500/30 inline-flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5 text-purple-400" />
                                  <span>{targetCustomEquipment.selectedVrfProduct.brand} {targetCustomEquipment.selectedVrfProduct.model}</span>
                                </span>
                                <button
                                  onClick={() => openCatalogModal('vrf', 'VRF 多联机室外机', (targetCustomEquipment.vrfCoolingkW || targetCalc.vrfCoolingkW) / (targetCustomEquipment.vrfCount || targetCalc.vrfCount), 'selectedVrfProduct')}
                                  className="text-xs text-purple-400 hover:text-white underline block"
                                >
                                  更换品牌型号
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCatalogModal('vrf', 'VRF 多联机室外机', (targetCustomEquipment.vrfCoolingkW || targetCalc.vrfCoolingkW) / (targetCustomEquipment.vrfCount || targetCalc.vrfCount), 'selectedVrfProduct')}
                                className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded text-xs font-bold border border-purple-500/40 flex items-center space-x-1 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>从品牌库选型 (大金/日立...)</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-400">{targetCalc.vrfCoolingkW.toFixed(1)} kW</td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={targetCustomEquipment.vrfCount ?? targetCalc.vrfCount}
                              onChange={(e) => handleTargetCustomChange('vrfCount', Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-purple-300 text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">
                            {((targetCustomEquipment.vrfCoolingkW || targetCalc.vrfCoolingkW) / (targetCustomEquipment.vrfCount || targetCalc.vrfCount)).toFixed(1)} kW/台
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={targetCustomEquipment.vrfCoolingkW ?? ''}
                              placeholder={targetCalc.vrfCoolingkW.toFixed(1)}
                              onChange={(e) => handleTargetCustomChange('vrfCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-bold text-sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-300">
                            {targetCustomEquipment.selectedVrfProduct ? `${targetCustomEquipment.selectedVrfProduct.actualPowerkW} kW/台` : `${(targetCalc.vrfPowerkW / targetCalc.vrfCount).toFixed(1)} kW (理论)`}
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-750">
                  <label className="block text-slate-300 mb-1 font-semibold">更换系统工程总初投资 CapEx (万元)</label>
                  <input
                    type="number"
                    value={targetCapEx}
                    onChange={(e) => setTargetCapEx(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-amber-300 font-bold text-base"
                  />
                </div>

              </div>

              {/* 子步骤 2.3: 运行费用对比与投资回收期 */}
              <div className="bg-slate-850 p-4.5 rounded-xl border border-slate-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-base">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">2.3</span>
                    <span>第三步：运行费用对比、碳减排与静态投资回收期</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-base">
                    每年节省 ¥{(step2Result.costSavedRmb / 10000).toFixed(2)} 万元
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-xs block">年运行电费</span>
                    <span className="text-amber-300 font-bold text-sm">¥{(step2Result.elecCost / 10000).toFixed(1)}万</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-xs block">年运行气费</span>
                    <span className="text-rose-300 font-bold text-sm">¥{(step2Result.gasCost / 10000).toFixed(1)}万</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-xs block">年减排 CO₂</span>
                    <span className="text-teal-300 font-bold text-sm">{step2Result.carbonSavedTons.toFixed(1)} 吨</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-xs block">投资回收期</span>
                    <span className="text-emerald-400 font-bold text-sm">{step2Result.paybackYears.toFixed(1)} 年</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeStep === 3 && (
            <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-xl text-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                  <h4 className="text-base font-bold text-white">第三步：AI 边缘计算智能群控与寻优技术详解</h4>
                </div>
                <span className="text-purple-300 font-bold text-xs bg-purple-500/20 px-3 py-1 rounded">
                  免换主机 / 回收期 0.9年
                </span>
              </div>

              <div className="space-y-3 text-slate-200 leading-relaxed">
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-300 block text-base">① AI 边缘计算关重节点部署</span>
                  <p className="text-xs text-slate-300">
                    在机房部署高规格 AI 边缘网关 (AI Edge Gateway)，通过 RS485/BACnet 实时采集冷水机组、水泵、锅炉及冷却塔的 100+ 维运行参数。
                  </p>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-300 block text-base">② 动态冷冻水供水温度自适应寻优 (Chw Temp Optimization)</span>
                  <p className="text-xs text-slate-300">
                    AI 算法结合气象预报与建筑负荷预测模型，在低负荷时段将冷冻水供水温度从 $7^\circ C$ 提升至 $9\sim 10.5^\circ C$，冷水机组 COP 自动提升 6%~12%！
                  </p>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-300 block text-base">③ 冷却塔逼近度与风机水泵最佳能效配比算法</span>
                  <p className="text-xs text-slate-300">
                    AI 实时寻优冷却水流量与冷却塔风机转速的边际功率平衡点，确保机组冷凝温度始终处于低能耗区间。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 直观对比展示面板 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                <span>【{currentResult.title}】改造前后直观数据对比</span>
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-300 text-xs block">年运行电费</span>
                <span className="text-amber-300 font-bold text-base">
                  ¥{(currentResult.elecCost / 10000).toFixed(1)}万
                </span>
                <span className="text-xs text-emerald-400 block font-semibold">
                  节电 {currentResult.elecSavedPercent.toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-300 text-xs block">年天然气费</span>
                <span className="text-rose-300 font-bold text-base">
                  ¥{(currentResult.gasCost / 10000).toFixed(1)}万
                </span>
                <span className="text-xs text-rose-400 block font-semibold">
                  降气 {currentResult.gasSavedPercent.toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-300 text-xs block">年减排 CO₂</span>
                <span className="text-teal-300 font-bold text-base">
                  {currentResult.carbonSavedTons.toFixed(1)} 吨
                </span>
                <span className="text-xs text-teal-400 block font-semibold">环保减碳</span>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-300 text-xs block">回收期 (CapEx)</span>
                <span className="text-white font-bold text-base">
                  {currentResult.paybackYears.toFixed(1)} 年
                </span>
                <span className="text-xs text-slate-300 block">初投资 ¥{currentResult.capExRmbTenThousand}万</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-64">
              <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>

          </div>

        </div>

      </div>

      {/* 3. AI 专家级改造诊断与多方案比选报告弹窗 */}
      <AiRetrofitAdvisorModal
        isOpen={isAiReportModalOpen}
        onClose={() => setIsAiReportModalOpen(false)}
        buildingName={buildingName}
        buildingArea={buildingArea}
        existingSystemType={existingSystemType}
        operatingHours={operatingHours}
        electricityRate={electricityRate}
        gasRate={gasRate}
        chillers={chillers}
        boilers={boilers}
        pumps={pumps}
        towers={towers}
        baselineCost={baseline.totalCost}
        tariffConfig={tariffConfig}
      />

    </div>
  );
};
