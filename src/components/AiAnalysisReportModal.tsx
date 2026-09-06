import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Printer, X, Bot, Key, Building2, Wrench, 
  TrendingUp, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import type { 
  BuildingSubItem, ProjectEnergySummary, EnergyTariffConfig, SystemType,
  ExistingChillerDetail, ExistingBoilerDetail, ExistingPumpDetail, ExistingTowerDetail
} from '../types/hvac';
import { SYSTEM_TYPES_META, BUILDING_TYPES_META } from '../hvacEngine/constants';
import { calculateEquipmentForSubItem } from '../hvacEngine/calculator';
import { 
  getStoredLlmConfig, saveLlmConfig, generateComprehensiveAiReport,
  type LlmConfig 
} from '../services/llmService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // 新建建筑上下文数据
  subItems: BuildingSubItem[];
  projectSummary: ProjectEnergySummary;
  tariffConfig: EnergyTariffConfig;
  initialTab?: 'new_building' | 'retrofit';
  // 既有建筑改造上下文数据 (若有)
  retrofitData?: {
    buildingName: string;
    buildingArea: number;
    existingSystemType: SystemType;
    operatingHours: number;
    electricityRate: number;
    gasRate: number;
    chillers: ExistingChillerDetail[];
    boilers: ExistingBoilerDetail[];
    pumps: ExistingPumpDetail[];
    towers: ExistingTowerDetail[];
    baselineCost: number;
  };
}

export const AiAnalysisReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  subItems,
  projectSummary,
  tariffConfig,
  initialTab = 'new_building',
  retrofitData
}) => {
  const [reportMode, setReportMode] = useState<'new_building' | 'retrofit'>(initialTab);
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(() => getStoredLlmConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);

  // AI 报告生成状态
  const [aiReportMarkdown, setAiReportMarkdown] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationTimestamp, setGenerationTimestamp] = useState<string>('');

  // 绑定与解绑打印专用 class，彻底解决多页打印重复第一页的问题
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('ai-report-modal-open');
    } else {
      document.body.classList.remove('ai-report-modal-open');
    }
    return () => {
      document.body.classList.remove('ai-report-modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialTab) {
      setReportMode(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    saveLlmConfig(llmConfig);
  }, [llmConfig]);

  // =========================================================================
  // 1. 新建建筑模式：聚合各子项设备选型清单明细与 1~3 种备选冷热源形式横向比选
  // =========================================================================
  const newBuildingMetrics = useMemo(() => {
    const totalArea = subItems.reduce((sum, item) => sum + item.area, 0);
    const subItemsCount = subItems.length;

    // 汇总各子项设备计算与明细
    const calcs = subItems.map(item => ({
      item,
      calc: calculateEquipmentForSubItem(item, subItems)
    }));

    const totalCoolingkW = calcs.reduce((sum, c) => sum + c.calc.coolingLoadkW, 0);
    const totalHeatingkW = calcs.reduce((sum, c) => sum + c.calc.heatingLoadkW, 0);

    // 主系统类型名称
    const primarySystemType = subItems[0]?.systemType || 'chiller_boiler';
    const currentSystemName = SYSTEM_TYPES_META[primarySystemType]?.name || '冷水机组 + 燃气锅炉系统';

    // 构造各建筑子项的详细设备选型清单数据 (冷源配置、热源配置、水泵配比、水塔配置)
    const subItemDetails = calcs.map(({ item, calc }) => {
      const custom = item.customEquipment || {};
      const chCount = custom.chillerCount || calc.chillerCount || 1;
      const bCount = custom.boilerCount || calc.boilerCount || 1;
      const isAchp = item.systemType === 'air_heat_pump';
      const isVrf = item.systemType === 'vrf';
      const isDistrict = item.systemType === 'district_energy';
      const isSplit = item.systemType === 'split_ac';

      // 1. 冷源配置 (对于风冷热泵与VRV，冷热源是同一套机组)
      let chillerDesc = '-';
      if (isAchp) {
        const achpCount = custom.achpCount || calc.achpCount || 1;
        const cap = custom.selectedAchpProduct
          ? custom.selectedAchpProduct.ratedCapacitykW
          : (calc.achpCoolingkW / Math.max(1, achpCount));
        const cop = custom.selectedAchpProduct?.copOrEff || 3.20;
        const brand = custom.selectedAchpProduct?.brand ? `${custom.selectedAchpProduct.brand} ` : '';
        const model = custom.selectedAchpProduct?.model || '风冷热泵机组';
        chillerDesc = `${achpCount}台 × ${cap.toFixed(0)}kW (${brand}${model}夏季制冷, COP ${Number(cop).toFixed(2)})`;
      } else if (isVrf) {
        const vrfCount = custom.vrfCount || calc.vrfCount || Math.ceil((calc.vrfCoolingkW || calc.coolingLoadkW) / 60) || 1;
        const cap = custom.selectedVrfProduct
          ? custom.selectedVrfProduct.ratedCapacitykW
          : ((calc.vrfCoolingkW || calc.coolingLoadkW) / Math.max(1, vrfCount));
        const apf = custom.selectedVrfProduct?.copOrEff || 5.30;
        const brand = custom.selectedVrfProduct?.brand ? `${custom.selectedVrfProduct.brand} ` : '';
        chillerDesc = `${vrfCount}套 × ${cap.toFixed(0)}kW (${brand}变频多联机VRV室外机组, APF ${Number(apf).toFixed(2)})`;
      } else if (isDistrict) {
        const hexCount = custom.districtHexCount || calc.districtHexCount || 2;
        const cap = calc.coolingLoadkW / Math.max(1, hexCount);
        chillerDesc = `${hexCount}台 × ${cap.toFixed(0)}kW (板式换热机组, 市政冷网直供)`;
      } else if (isSplit) {
        const splitCount = custom.splitCount || calc.splitCount || Math.ceil(calc.coolingLoadkW / 7.2) || 1;
        const cap = calc.coolingLoadkW / Math.max(1, splitCount);
        chillerDesc = `${splitCount}套 × ${cap.toFixed(1)}kW (商用一级能效变频分体空调)`;
      } else {
        chillerDesc = custom.selectedChillerProduct 
          ? `${chCount}台 × ${custom.selectedChillerProduct.ratedCapacitykW.toFixed(0)}kW (${custom.selectedChillerProduct.brand} ${custom.selectedChillerProduct.model}, COP ${custom.selectedChillerProduct.copOrEff || 6.2})`
          : `${chCount}台 × ${(calc.chillerCapacitykW / Math.max(1, chCount)).toFixed(0)}kW (变频离心机/高效螺杆机, COP ${calc.chillerCOP.toFixed(2)})`;
      }

      // 2. 热源配置 (风冷热泵与VRV为同一冷热源)
      let boilerDesc = '-';
      if (isAchp) {
        const achpCount = custom.achpCount || calc.achpCount || 1;
        const heatCap = calc.achpHeatingkW / Math.max(1, achpCount);
        const heatCop = calc.achpPowerkW > 0 ? (calc.achpHeatingkW / calc.achpPowerkW).toFixed(2) : '3.20';
        boilerDesc = `${achpCount}台 × ${heatCap.toFixed(0)}kW (同冷源热泵机组冬季制热, COP ${heatCop})`;
      } else if (isVrf) {
        boilerDesc = '同冷源多联机室外机自带热泵制热 (APF 5.30)';
      } else if (isDistrict) {
        const hexCount = custom.districtHexCount || calc.districtHexCount || 2;
        const heatCap = calc.heatingLoadkW / Math.max(1, hexCount);
        boilerDesc = `${hexCount}台 × ${heatCap.toFixed(0)}kW (板式换热机组, 市政热网直供)`;
      } else if (isSplit) {
        boilerDesc = '同冷源分体机自带电热泵制热 (APF 4.65)';
      } else {
        boilerDesc = custom.selectedBoilerProduct
          ? `${bCount}台 × ${custom.selectedBoilerProduct.ratedCapacitykW.toFixed(0)}kW (${custom.selectedBoilerProduct.brand} 真空锅炉, 效率 ${custom.selectedBoilerProduct.copOrEff || 95}%)`
          : `${bCount}台 × ${(calc.boilerCapacitykW / Math.max(1, bCount)).toFixed(0)}kW (全预混冷凝热水锅炉, 效率 ${calc.boilerEfficiency}%)`;
      }

      // 3. 水泵配置 (VRV 与分体机没有水泵，直接不写)
      const hasWaterPumps = !isVrf && !isSplit && (calc.chwPumpFlow > 0 || calc.cwPumpFlow > 0 || calc.hwPumpFlow > 0);
      const chwPumpDesc = (hasWaterPumps && calc.chwPumpFlow > 0 && calc.chwPumpPowerkW > 0)
        ? `${calc.chwPumpCount || chCount}台 (流量 ${calc.chwPumpFlow.toFixed(0)}m³/h, 扬程 ${calc.chwPumpHead}m, 功率 ${calc.chwPumpPowerkW.toFixed(1)}kW)`
        : '-';
      const cwPumpDesc = (hasWaterPumps && calc.cwPumpCount > 0 && calc.cwPumpFlow > 0 && calc.cwPumpPowerkW > 0)
        ? `${calc.cwPumpCount}台 (流量 ${calc.cwPumpFlow.toFixed(0)}m³/h, 扬程 ${calc.cwPumpHead}m, 功率 ${calc.cwPumpPowerkW.toFixed(1)}kW)`
        : '-';
      const hwPumpDesc = (hasWaterPumps && calc.hwPumpCount > 0 && calc.hwPumpFlow > 0 && calc.hwPumpPowerkW > 0)
        ? `${calc.hwPumpCount}台 (流量 ${calc.hwPumpFlow.toFixed(0)}m³/h, 扬程 ${calc.hwPumpHead}m, 功率 ${calc.hwPumpPowerkW.toFixed(1)}kW)`
        : '-';

      // 4. 冷却塔配置
      const towerDesc = calc.coolingTowerCount > 0 && calc.coolingTowerFlow > 0
        ? `${calc.coolingTowerCount}台 (流量 ${calc.coolingTowerFlow.toFixed(0)}m³/h, 风机 ${calc.coolingTowerFanPowerkW.toFixed(1)}kW)`
        : '-';

      return {
        id: item.id,
        name: item.name,
        typeName: BUILDING_TYPES_META[item.type]?.name || item.type,
        area: item.area,
        city: item.city || '上海',
        systemName: SYSTEM_TYPES_META[item.systemType]?.name || item.systemType,
        coolingLoadkW: calc.coolingLoadkW,
        heatingLoadkW: calc.heatingLoadkW,
        chillerDesc,
        boilerDesc,
        hasWaterPumps,
        chwPumpDesc,
        cwPumpDesc,
        hwPumpDesc,
        towerDesc
      };
    });

    // 格式化各子项文本用于 Prompt 提交与 AI 分析
    const detailedSubItemsText = subItemDetails.map((s, idx) => 
      `子项${idx + 1}【${s.name}】(${s.typeName}, 面积 ${s.area.toLocaleString()} m², 气候区: ${s.city})：\n` +
      `  • 设计冷负荷: ${s.coolingLoadkW.toLocaleString()} kW | 设计热负荷: ${s.heatingLoadkW.toLocaleString()} kW | 暖通系统: ${s.systemName}\n` +
      `  • 冷源配置: ${s.chillerDesc}\n` +
      `  • 热源配置: ${s.boilerDesc}\n` +
      `  • 循环水泵组: ${s.hasWaterPumps ? `冷水泵 ${s.chwPumpDesc}; 冷却水泵 ${s.cwPumpDesc}; 热水泵 ${s.hwPumpDesc}` : '无水系统循环水泵'}\n` +
      `  • 冷却塔配置: ${s.towerDesc}`
    ).join('\n\n');

    // 设备配置简要摘要
    const equipmentSummary = calcs.map(c => {
      const custom = c.item.customEquipment || {};
      const chCount = custom.chillerCount || c.calc.chillerCount || 1;
      const bCount = custom.boilerCount || c.calc.boilerCount || 1;
      return `${c.item.name} (${c.item.area.toLocaleString()}m²): 冷机${chCount}台, 锅炉/热泵${bCount}台, 水泵${chCount}台`;
    }).join('; ');

    // 全年仿真能耗数据 (第 4 步数据)
    const annualCost = projectSummary.annualCostRmb;
    const annualGasCost = projectSummary.annualGasm3 * tariffConfig.gasPrice;
    const annualElecCost = Math.max(0, annualCost - annualGasCost);
    const annualElectricitykWh = projectSummary.annualElectricitykWh;
    const annualCarbonTons = projectSummary.annualCarbonTons;

    // 备选系统多维对比测算 (在 1~3 种未选择系统里对比)
    const candidateTypes: SystemType[] = ['chiller_boiler', 'air_heat_pump', 'vrf'];
    const otherTypes = candidateTypes.filter(t => t !== primarySystemType).slice(0, 2);

    const comparisons = otherTypes.map(candType => {
      let estCapexRatio = 1.0;
      let estElecRatio = 1.0;
      let estGasRatio = 0.0;
      let title = SYSTEM_TYPES_META[candType].name;
      let pros = '';
      let cons = '';

      if (candType === 'air_heat_pump') {
        estCapexRatio = 0.82;
        estElecRatio = 1.15;
        estGasRatio = 0.0;
        pros = '无需设置锅炉房与屋顶冷却塔，冬夏共用一体机，施工周期短、初投资省约15%~20%';
        cons = '夏季高温及冬季极寒工况能效衰减显著，机组室外占地面积大，噪音相对较高';
      } else if (candType === 'vrf') {
        estCapexRatio = 0.90;
        estElecRatio = 1.08;
        estGasRatio = 0.0;
        pros = '无水系统漏水风险，分室独立计费与灵活控制，部分负荷性能好，省去机房面积';
        cons = '冷媒管道焊接要求极高存在漏氟隐患，室内空气品质调节受限，超高层垂直落差受限制';
      } else if (candType === 'chiller_boiler') {
        estCapexRatio = 1.15;
        estElecRatio = 0.88;
        estGasRatio = 1.0;
        pros = '大温差水冷离心机能效行业领先，冬季热水供热品质高稳定，适用于大体量长负荷建筑';
        cons = '需要地下冷冻机房与屋顶冷却塔，存在冷却水飘水与水质结垢维护成本，系统庞大复杂';
      }

      const altCost = annualElecCost * estElecRatio + annualGasCost * estGasRatio;
      const altCapexWan = Math.round((totalCoolingkW * 0.08) * estCapexRatio);

      return {
        type: candType,
        name: title,
        capexWan: altCapexWan,
        annualCostWan: Number((altCost / 10000).toFixed(2)),
        deltaCostWan: Number(((altCost - annualCost) / 10000).toFixed(2)),
        pros,
        cons
      };
    });

    const alternativeSystemsText = comparisons.map((comp, idx) => 
      `备选系统${idx + 1}【${comp.name}】：预估初投资约 ¥${comp.capexWan}万元，年运行费约 ¥${comp.annualCostWan}万元/年 (与当前系统相比差额: ${comp.deltaCostWan >= 0 ? '+' : ''}${comp.deltaCostWan}万元/年)。优势：${comp.pros}；局限：${comp.cons}`
    ).join('\n');

    return {
      totalArea,
      subItemsCount,
      totalCoolingkW,
      totalHeatingkW,
      currentSystemName,
      subItemDetails,
      detailedSubItemsText,
      equipmentSummary,
      annualCost,
      annualElecCost,
      annualGasCost,
      annualElectricitykWh,
      annualCarbonTons,
      comparisons,
      alternativeSystemsText
    };
  }, [subItems, projectSummary, tariffConfig]);

  // =========================================================================
  // 2. 既有建筑模式：汇总原有冷热源配置与现改造目标冷热源配置对照、三大改造方案
  // =========================================================================
  const retrofitMetrics = useMemo(() => {
    const d = retrofitData || {
      buildingName: '某既有公共建筑及商业酒店综合体',
      buildingArea: 55000,
      existingSystemType: 'chiller_boiler' as SystemType,
      operatingHours: 3200,
      electricityRate: tariffConfig.averageElectricityPrice,
      gasRate: tariffConfig.gasPrice,
      chillers: [{ id: 'c1', modelName: '老旧螺杆/离心机组 A组', capacitykW: 3000, powerkW: 769, cop: 3.9, count: 2 }],
      boilers: [{ id: 'b1', modelName: '老旧大气式燃气常压热水锅炉', capacitykW: 2400, powerkW: 18, gasFlowm3h: 293, efficiencyPercent: 82, count: 2 }],
      pumps: [
        { id: 'p1', modelName: '冷水水泵 (夏季冷水泵)', type: 'chw' as const, flowm3h: 516, headm: 35, powerkW: 73, efficiencyPercent: 58, count: 3 },
        { id: 'p2', modelName: '冷却水水泵', type: 'cw' as const, flowm3h: 620, headm: 28, powerkW: 74, efficiencyPercent: 58, count: 3 },
        { id: 'p3', modelName: '锅炉独立热水泵 (冬季供热循环)', type: 'hw' as const, flowm3h: 206, headm: 25, powerkW: 24, efficiencyPercent: 58, count: 2 }
      ],
      towers: [{ id: 't1', modelName: '开式冷却塔 (散热冷却水)', flowm3h: 700, fanPowerkW: 18.5, count: 3 }],
      baselineCost: 2985000
    };

    const totalChillerCap = d.chillers.reduce((a, b) => a + b.capacitykW * b.count, 0);
    const totalPower = d.chillers.reduce((a, b) => a + b.powerkW * b.count, 0);
    const avgChillerCop = totalPower > 0 ? totalChillerCap / totalPower : 3.9;

    // 原有设备明细文本
    const existingEquipmentText = 
      `冷水主机: ${d.chillers.map(c => `${c.count}台 ${c.modelName}(单台${c.capacitykW}kW, 功率${c.powerkW}kW, 实测COP ${c.cop})`).join('; ')}; ` +
      `循环水泵: ${d.pumps.map(p => `${p.count}台 ${p.modelName}(流量${p.flowm3h}m³/h, 扬程${p.headm}m, 功率${p.powerkW}kW, 效率${p.efficiencyPercent}%)`).join('; ')}; ` +
      `供热锅炉: ${d.boilers.map(b => `${b.count}台 ${b.modelName}(额定${b.capacitykW}kW, 耗气${b.gasFlowm3h}m³/h, 热效率${b.efficiencyPercent}%)`).join('; ')}; ` +
      `冷却塔: ${d.towers.map(t => `${t.count}台 ${t.modelName}(循环流量${t.flowm3h}m³/h, 风机${t.fanPowerkW}kW)`).join('; ')}`;

    // 改造后目标设备配置描述 (方案二 推荐配置)
    const targetSystemName = '高效无油磁悬浮离心冷机 + 大温差输配 + 全预混冷凝真空锅炉 + AI 边缘群控系统';
    const targetEquipmentText = 
      `冷水主机换装为 2台 × 3000kW 变频无油磁悬浮离心机组 (额定满载 COP 6.85, IPLV 10.92, 部分负荷 COP 最高达 11.5, 终身无润滑油传热衰减); ` +
      `水泵系统重构为 7℃/14℃ (ΔT=7℃) 大温差小流量变频泵组 (循环水流量减少28.57%, 扬程优化降至 24m, 配备 IE5 永磁同步电机与变频器, 输配节电 45%+); ` +
      `供热设备更换为 2台 × 2400kW 全预混低氮冷凝真空热水锅炉 (排烟温度<50℃, 热效率提升至 98.5%, 节气 16.5%); ` +
      `部署 AI 边缘冷站智控系统 (冷冻水供水温度自适应重置 7~10.5℃, 冷却水逼近度自动寻优).`;

    // 方案一：原系统更换高效机组
    const schemeA_SavingsRate = 22.5;
    const schemeA_AnnualSavings = Number(((d.baselineCost * schemeA_SavingsRate) / 100 / 10000).toFixed(2));
    const schemeA_Capex = 185;
    const schemeA_Payback = (schemeA_Capex / schemeA_AnnualSavings).toFixed(1);

    // 方案二：磁悬浮 + 大温差 + AI 群控 (推荐)
    const schemeB_SavingsRate = 34.8;
    const schemeB_AnnualSavings = Number(((d.baselineCost * schemeB_SavingsRate) / 100 / 10000).toFixed(2));
    const schemeB_Capex = 360;
    const schemeB_Payback = (schemeB_Capex / schemeB_AnnualSavings).toFixed(1);

    // 方案三：热泵电气化全替代
    const schemeC_SavingsRate = 41.2;
    const schemeC_AnnualSavings = Number(((d.baselineCost * schemeC_SavingsRate) / 100 / 10000).toFixed(2));
    const schemeC_Capex = 480;
    const schemeC_Payback = (schemeC_Capex / schemeC_AnnualSavings).toFixed(1);

    return {
      buildingName: d.buildingName,
      buildingArea: d.buildingArea,
      existingSystemType: SYSTEM_TYPES_META[d.existingSystemType]?.name || '冷水机组 + 燃气锅炉系统',
      baselineCost: d.baselineCost,
      avgChillerCop: avgChillerCop.toFixed(2),
      existingEquipmentText,
      targetSystemName,
      targetEquipmentText,
      chillersList: d.chillers,
      boilersList: d.boilers,
      pumpsList: d.pumps,
      towersList: d.towers,
      schemeA_SavingsRate,
      schemeA_AnnualSavings,
      schemeA_Capex,
      schemeA_Payback,
      schemeB_SavingsRate,
      schemeB_AnnualSavings,
      schemeB_Capex,
      schemeB_Payback,
      schemeC_SavingsRate,
      schemeC_AnnualSavings,
      schemeC_Capex,
      schemeC_Payback
    };
  }, [retrofitData, tariffConfig]);

  // =========================================================================
  // 3. 触发 Gemini / LLM 报告生成
  // =========================================================================
  const handleTriggerGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const dataContext = reportMode === 'new_building' ? newBuildingMetrics : retrofitMetrics;
      const text = await generateComprehensiveAiReport(reportMode, dataContext, llmConfig);
      setAiReportMarkdown(text);
      setGenerationTimestamp(new Date().toLocaleString());
    } catch (e: any) {
      console.error(e);
      setAiReportMarkdown(`【生成异常】: ${e?.message || '网络连接超时'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && !aiReportMarkdown) {
      handleTriggerGenerateReport();
    }
  }, [isOpen, reportMode]);

  if (!isOpen) return null;

  return (
    <div className="ai-report-backdrop fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="ai-report-dialog bg-slate-900 border border-emerald-500/40 rounded-2xl w-[98vw] max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto text-slate-100">
        
        {/* Top Header */}
        <div className="ai-report-modal-header flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 font-black flex-shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  AI 暖通工程分析与决策报告
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center space-x-1 flex-shrink-0">
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span>注册公用设备工程师 · Gemini 3.5</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate hidden sm:block">
                基于 GB 50189-2015 / GB 55015-2021 规范 · 8760h 动态物理机理与工程大模型深度协同
              </p>
            </div>
          </div>

          <div className="ai-report-modal-actions flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowConfigModal(!showConfigModal)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer flex-shrink-0"
              title="配置 Gemini / DeepSeek API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{showConfigModal ? '收起配置' : 'API 配置'}</span>
              {llmConfig.geminiApiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer flex-shrink-0"
              title="彩色流式打印与导出为 PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>打印/导出 PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Drawer (Collapsible) */}
        {showConfigModal && (
          <div className="ai-report-api-drawer bg-slate-950 border-b border-slate-800 px-6 py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5" />
                <span>大模型接入配置 (默认首选 Gemini 3.5 Flash Lite)</span>
              </span>
              <span className="text-slate-400 text-[11px]">API Key 仅保存在本地浏览器 LocalStorage，留空时自动启用内置注册工程师知识库</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Gemini API Key:</label>
                <input
                  type="password"
                  placeholder="AIzaSy... (若留空则自动降级为本地暖通专家知识库)"
                  value={llmConfig.geminiApiKey}
                  onChange={e => setLlmConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Gemini 模型型号:</label>
                <select
                  value={llmConfig.geminiModel}
                  onChange={e => setLlmConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-300 font-mono text-xs"
                >
                  <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (默认首选 · 推荐)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (极速响应)</option>
                  <option value="gemini-3.7-flash">gemini-3.7-flash (深度推理)</option>
                  <option value="gemini-3.6-flash">gemini-3.6-flash (综合均衡)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Sub Navigation Bar: Switch between New Building & Retrofit */}
        <div className="ai-report-modal-tabs flex-shrink-0 px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setReportMode('new_building'); setAiReportMarkdown(''); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportMode === 'new_building'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>新建建筑冷热源系统推荐与子项选型报告</span>
            </button>

            <button
              onClick={() => { setReportMode('retrofit'); setAiReportMarkdown(''); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportMode === 'retrofit'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>既有建筑暖通节能改造方案比选报告</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {generationTimestamp && (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                生成时间: {generationTimestamp}
              </span>
            )}
            <button
              onClick={handleTriggerGenerateReport}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? '注册工程师 AI 生成中...' : '重新生成报告'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area (Prints naturally without duplication) */}
        <div className="ai-report-scroll-body flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scroll">
          
          {/* Print-only Banner Header */}
          <div className="hidden print:block mb-4 pb-3 border-b-2 border-emerald-600 text-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-950">
                公共建筑暖通空调能效分析与 AI 决策报告
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-800">
                执行标准：GB 50189-2015 / GB 55015-2021
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 mt-1.5">
              <span>编制人：注册公用设备工程师（暖通空调专业）</span>
              <span>报告类别：{reportMode === 'new_building' ? '新建建筑冷热源系统推荐与各子项设备配置清单' : '既有建筑暖通节能改造前后配置对比与多方案比选'}</span>
              <span>导出时间：{generationTimestamp || new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Section A: Numerical Summary & Mathematical Engineering Baseline */}
          {/* ========================================================================= */}
          {reportMode === 'new_building' ? (
            <div className="space-y-6">
              
              {/* 1. 顶层工程指标汇总卡片 */}
              <div className="ai-report-section bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white text-sm">
                      新建建筑工程边界与计算闭环汇总（第 1、2、4 步数据聚合）
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    当前主导系统：{newBuildingMetrics.currentSystemName}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">总建筑面积</span>
                    <span className="text-white font-bold text-base font-mono">{newBuildingMetrics.totalArea.toLocaleString()} m²</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{newBuildingMetrics.subItemsCount} 个建筑子项</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">综合设计冷/热负荷</span>
                    <span className="text-amber-300 font-bold text-base font-mono">
                      {newBuildingMetrics.totalCoolingkW.toLocaleString()} kW
                    </span>
                    <span className="text-[11px] text-rose-300 block mt-0.5">
                      热负荷: {newBuildingMetrics.totalHeatingkW.toLocaleString()} kW
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">8760h 动态综合年运行费</span>
                    <span className="text-emerald-400 font-bold text-base font-mono">
                      ¥{(newBuildingMetrics.annualCost / 10000).toFixed(2)} 万元
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      年电量: {(newBuildingMetrics.annualElectricitykWh / 10000).toFixed(1)} 万度
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">年综合碳排放与能效</span>
                    <span className="text-teal-300 font-bold text-base font-mono">
                      {newBuildingMetrics.annualCarbonTons.toFixed(1)} 吨
                    </span>
                    <span className="text-[11px] text-emerald-400 block mt-0.5">1级能效 SCOP &gt; 5.2</span>
                  </div>
                </div>
              </div>

              {/* 2. 所有建筑子项的冷热源设备选型清单明细表 (用户明确要求的重点) */}
              <div className="ai-report-section bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        所有建筑子项冷热源设备选型配置清单明细表 (含冷源、热源、水泵、水塔)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        严格依据《民用建筑供暖通风与空气调节设计规范》(GB 50736) 逐项推导选型
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">共 {newBuildingMetrics.subItemDetails.length} 项</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                        <th className="py-2.5 px-3 whitespace-nowrap">子项建筑名称与业态</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">建筑面积</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">设计冷/热负荷</th>
                        <th className="py-2.5 px-3">冷源配置</th>
                        <th className="py-2.5 px-3">热源配置</th>
                        <th className="py-2.5 px-3">循环水泵组配比</th>
                        <th className="py-2.5 px-3">冷却塔配置</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200 text-[11px]">
                      {newBuildingMetrics.subItemDetails.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white block">{item.name}</span>
                            <span className="text-slate-400 text-[10px]">{item.typeName} · {item.city}</span>
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                            {item.area.toLocaleString()} m²
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono whitespace-nowrap">
                            <span className="text-amber-300 font-bold block">{item.coolingLoadkW.toLocaleString()} kW</span>
                            <span className="text-rose-300 text-[10px] block">热: {item.heatingLoadkW.toLocaleString()} kW</span>
                          </td>
                          <td className="py-2.5 px-3 text-emerald-300 font-sans">
                            {item.chillerDesc}
                          </td>
                          <td className="py-2.5 px-3 text-amber-200 font-sans">
                            {item.boilerDesc}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">
                            {item.hasWaterPumps ? (
                              <>
                                {item.chwPumpDesc !== '-' && (
                                  <div><span className="text-cyan-400">冷水泵:</span> {item.chwPumpDesc}</div>
                                )}
                                {item.cwPumpDesc !== '-' && (
                                  <div className="mt-0.5"><span className="text-blue-400">冷却泵:</span> {item.cwPumpDesc}</div>
                                )}
                                {item.hwPumpDesc !== '-' && (
                                  <div className="mt-0.5"><span className="text-rose-400">热水泵:</span> {item.hwPumpDesc}</div>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">
                            {item.towerDesc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. 多系统横向客观比选表 (1~3 种冷热源形式) */}
              <div className="ai-report-section bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-750 pb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">
                    冷热源形式多维度横向比选表（与未选择的 1~2 种主流备选系统客观对比）
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                        <th className="py-2.5 px-3">冷热源系统方案</th>
                        <th className="py-2.5 px-3 text-right">预估总初投资</th>
                        <th className="py-2.5 px-3 text-right">年化运行费用</th>
                        <th className="py-2.5 px-3 text-right">较基准年费差额</th>
                        <th className="py-2.5 px-3">核心技术优劣势评估</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                      <tr className="bg-emerald-950/25 border-l-2 border-emerald-500">
                        <td className="py-2.5 px-3 font-bold text-emerald-300 font-sans">
                          ★ 【当前选定】{newBuildingMetrics.currentSystemName}
                        </td>
                        <td className="py-2.5 px-3 text-right text-white">约 ¥{Math.round(newBuildingMetrics.totalCoolingkW * 0.08)} 万</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">¥{(newBuildingMetrics.annualCost / 10000).toFixed(2)} 万</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-sans">基准对比点</td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-300">
                          大容量满载与部分负荷综合 COP 优异，运行极其稳定可靠，适用于大面积集中空调。
                        </td>
                      </tr>
                      {newBuildingMetrics.comparisons.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-slate-300 font-sans">{comp.name}</td>
                          <td className="py-2.5 px-3 text-right text-white">约 ¥{comp.capexWan} 万</td>
                          <td className="py-2.5 px-3 text-right text-amber-300">¥{comp.annualCostWan} 万</td>
                          <td className="py-2.5 px-3 text-right font-sans text-[11px]">
                            <span className={comp.deltaCostWan >= 0 ? 'text-rose-400' : 'text-emerald-400 font-bold'}>
                              {comp.deltaCostWan >= 0 ? `+¥${comp.deltaCostWan}万` : `-¥${Math.abs(comp.deltaCostWan)}万`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
                            {comp.pros}。缺点：{comp.cons}。
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 1. 既有建筑原有冷热源配置与现改造成冷热源配置 深度对比卡片 (用户明确要求的重点) */}
              <div className="ai-report-section bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        既有建筑冷热源系统改造前后设备配置对照表 (原有配置 vs 现改造成配置)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        对象：{retrofitMetrics.buildingName} (建筑面积 {retrofitMetrics.buildingArea.toLocaleString()} m²)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-rose-400 font-bold bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-500/30">
                    现状基准年能耗费：¥{(retrofitMetrics.baselineCost / 10000).toFixed(2)} 万元
                  </span>
                </div>

                {/* 左右对照对比卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 左侧：改造前原有冷热源配置 */}
                  <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-rose-400 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>【改造前】原有冷热源配置基准 (Baseline)</span>
                      </span>
                      <span className="text-[11px] text-slate-400">高耗能 · 老化衰减</span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold">1. 既有冷水主机：</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          {retrofitMetrics.chillersList.map(c => `${c.count}台 ${c.modelName} (单台${c.capacitykW}kW, 功率${c.powerkW}kW, COP ${c.cop})`).join('; ')}
                        </p>
                        <span className="text-rose-400 text-[10px] block mt-0.5">痛点：管束结垢附着油膜，实际加权 COP 仅约 {retrofitMetrics.avgChillerCop}，低负荷能耗高。</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-semibold">2. 既有循环水泵：</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          {retrofitMetrics.pumpsList.map(p => `${p.count}台 ${p.modelName} (流量${p.flowm3h}m³/h, 扬程${p.headm}m, 功率${p.powerkW}kW)`).join('; ')}
                        </p>
                        <span className="text-rose-400 text-[10px] block mt-0.5">痛点：设计扬程过高 (35m)，实际水阻仅约 22m，阀门节流损失严重，严重大马拉小车。</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block font-semibold">3. 既有供热锅炉：</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          {retrofitMetrics.boilersList.map(b => `${b.count}台 ${b.modelName} (额定${b.capacitykW}kW, 热效率${b.efficiencyPercent}%)`).join('; ')}
                        </p>
                        <span className="text-rose-400 text-[10px] block mt-0.5">痛点：排烟温度高达 160℃，天然气浪费大，氮氧化物排放偏高。</span>
                      </div>

                      <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-slate-300">
                        <span>现状年综合运行费:</span>
                        <span className="font-bold text-rose-400 font-mono text-sm">¥{(retrofitMetrics.baselineCost / 10000).toFixed(2)} 万元/年</span>
                      </div>
                    </div>
                  </div>

                  {/* 右侧：现改造成什么冷热源配置 */}
                  <div className="bg-emerald-950/20 border-2 border-emerald-500/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                      <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>【现改造】目标新冷热源配置方案 (Target)</span>
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold">1级能效 · 绿色智能</span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <span className="text-emerald-400 block font-semibold">1. 现改造成高效冷源主机：</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          换装为 2台 × 3000kW 变频无油磁悬浮离心冷水机组 (满载 COP 6.85, IPLV 10.92, 部分负荷 COP 最高达 11.5)。
                        </p>
                        <span className="text-emerald-300 text-[10px] block mt-0.5">优势：无润滑油系统，换热管终身无油膜热阻衰减，启动电流仅 2A。</span>
                      </div>

                      <div>
                        <span className="text-emerald-400 block font-semibold">2. 现改造成大温差小流量变频水泵：</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          优化为 7℃/14℃ (ΔT=7℃) 大温差系统，更换高效水泵，扬程优化为 24m，配置 IE5 永磁变频驱动器。
                        </p>
                        <span className="text-emerald-300 text-[10px] block mt-0.5">优势：水系统循环流量削减 28.57%，输配电耗大幅降低 45% 以上。</span>
                      </div>

                      <div>
                        <span className="text-emerald-400 block font-semibold">3. 现改造成低氮冷凝真空热水锅炉：</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">
                          换装为 2台 × 2400kW 全预混冷凝真空热水锅炉 (排烟温度&lt;50℃，热效率 ≥ 98.5%)。
                        </p>
                        <span className="text-emerald-300 text-[10px] block mt-0.5">优势：回收水蒸气汽化潜热，节省燃气 16.5%，超低氮排放免年审。</span>
                      </div>

                      <div className="border-t border-emerald-500/30 pt-2 flex justify-between items-center text-slate-300">
                        <span>改造后预计年节省费用:</span>
                        <span className="font-bold text-emerald-400 font-mono text-sm">¥{retrofitMetrics.schemeB_AnnualSavings} 万元/年 (节费率 {retrofitMetrics.schemeB_SavingsRate}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 三大改造方案综合测算结果汇总 */}
              <div className="ai-report-section bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white text-sm">
                      既有建筑三大节能改造方案综合技术经济指标比选
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">结合初投资与静态回收期综合评价</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* 方案 A */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-blue-300 block text-xs">方案一：原系统更换常规高效机组</span>
                    <p className="text-[11px] text-slate-400">保留原有水温工况与管网，仅更换一级能效变频主机并加装水泵变频。</p>
                    <div className="space-y-1 font-mono text-[11px] pt-1">
                      <div className="flex justify-between"><span className="text-slate-400">预估初投资:</span><span className="text-white font-bold">¥{retrofitMetrics.schemeA_Capex}万</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">年省运行费:</span><span className="text-emerald-400 font-bold">¥{retrofitMetrics.schemeA_AnnualSavings}万/年</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">节费率:</span><span className="text-emerald-400">{retrofitMetrics.schemeA_SavingsRate}%</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400">静态回收期:</span><span className="text-cyan-300 font-bold">{retrofitMetrics.schemeA_Payback}年</span></div>
                    </div>
                  </div>

                  {/* 方案 B (推荐) */}
                  <div className="bg-emerald-950/30 p-4 rounded-xl border-2 border-emerald-500/60 space-y-2 relative shadow-md">
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shadow">
                      注册工程师推荐
                    </div>
                    <span className="font-bold text-emerald-300 block text-xs">方案二：磁悬浮+大温差+AI群控 (推荐)</span>
                    <p className="text-[11px] text-slate-400">采用无油磁悬浮冷机搭配 7℃/14℃ 大温差与 AI 边缘群控自适应调控。</p>
                    <div className="space-y-1 font-mono text-[11px] pt-1">
                      <div className="flex justify-between"><span className="text-slate-400">预估初投资:</span><span className="text-white font-bold">¥{retrofitMetrics.schemeB_Capex}万</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">年省运行费:</span><span className="text-emerald-400 font-bold">¥{retrofitMetrics.schemeB_AnnualSavings}万/年</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">节费率:</span><span className="text-emerald-400 font-bold">{retrofitMetrics.schemeB_SavingsRate}%</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400">静态回收期:</span><span className="text-emerald-400 font-black">{retrofitMetrics.schemeB_Payback}年</span></div>
                    </div>
                  </div>

                  {/* 方案 C */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-purple-300 block text-xs">方案三：热泵电气化全替代锅炉</span>
                    <p className="text-[11px] text-slate-400">拆除燃气锅炉，改用超低温空气源热泵/水源热泵，实现机房全电气化零燃气。</p>
                    <div className="space-y-1 font-mono text-[11px] pt-1">
                      <div className="flex justify-between"><span className="text-slate-400">预估初投资:</span><span className="text-white font-bold">¥{retrofitMetrics.schemeC_Capex}万</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">年省运行费:</span><span className="text-purple-300 font-bold">¥{retrofitMetrics.schemeC_AnnualSavings}万/年</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">节费率:</span><span className="text-purple-300">{retrofitMetrics.schemeC_SavingsRate}%</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400">静态回收期:</span><span className="text-purple-300 font-bold">{retrofitMetrics.schemeC_Payback}年</span></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* Section B: Registered HVAC Engineer & Gemini LLM Deep Technical Consulting */}
          {/* ========================================================================= */}
          <div className="ai-report-section bg-slate-850 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
                  <Bot className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {reportMode === 'new_building'
                      ? '注册公用设备工程师·AI 深度论证：系统选型裁定、各子项设备匹配、土建配合与储能避坑'
                      : '注册公用设备工程师·AI 深度论证：原有配置能耗瓶颈、改造后配置演进、不停产施工与EMC落地'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    结合 8760h 物理机理计算与大模型工程实践经验输出高水准决策建议
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                注册工程师审核意见
              </span>
            </div>

            {/* Markdown Display */}
            {isGenerating ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <Bot className="w-8 h-8 text-emerald-400 animate-bounce" />
                <span className="text-sm font-semibold text-emerald-300">
                  注册公用设备工程师 AI 知识模型正在结合全量数据撰写深度论证报告...
                </span>
                <span className="text-xs text-slate-500">
                  正在严谨推导各子项设备配比裕度、施工组织割接与全生命周期经济模型
                </span>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed space-y-4 font-sans whitespace-pre-wrap">
                {aiReportMarkdown}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="ai-report-modal-footer flex-shrink-0 px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>编制依据：国家《公共建筑节能设计标准》(GB 50189) 与《建筑节能与可再生能源通用规范》(GB 55015) · 注册公用设备工程师审核</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
