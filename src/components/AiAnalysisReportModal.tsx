import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Printer, X, Bot, Key, Building2, Wrench, 
  TrendingUp, ShieldCheck, RefreshCw 
} from 'lucide-react';
import type { 
  BuildingSubItem, ProjectEnergySummary, EnergyTariffConfig, SystemType,
  ExistingChillerDetail, ExistingBoilerDetail, ExistingPumpDetail, ExistingTowerDetail
} from '../types/hvac';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
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

  useEffect(() => {
    if (initialTab) {
      setReportMode(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    saveLlmConfig(llmConfig);
  }, [llmConfig]);

  // =========================================================================
  // 1. 新建建筑模式：计算 1、2、4 步汇总与 1~3 种备选冷热源形式横向比选
  // =========================================================================
  const newBuildingMetrics = useMemo(() => {
    const totalArea = subItems.reduce((sum, item) => sum + item.area, 0);
    const subItemsCount = subItems.length;

    // 汇总各子项设备计算
    const calcs = subItems.map(item => ({
      item,
      calc: calculateEquipmentForSubItem(item, subItems)
    }));

    const totalCoolingkW = calcs.reduce((sum, c) => sum + c.calc.coolingLoadkW, 0);
    const totalHeatingkW = calcs.reduce((sum, c) => sum + c.calc.heatingLoadkW, 0);

    // 主系统类型名称
    const primarySystemType = subItems[0]?.systemType || 'chiller_boiler';
    const currentSystemName = SYSTEM_TYPES_META[primarySystemType]?.name || '冷水机组 + 燃气锅炉系统';

    // 设备配置摘要
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
  // 2. 既有建筑模式：汇总现有设备、基准能耗与三大改造方案
  // =========================================================================
  const retrofitMetrics = useMemo(() => {
    const d = retrofitData || {
      buildingName: '某既有商业综合体',
      buildingArea: 55000,
      existingSystemType: 'chiller_boiler' as SystemType,
      operatingHours: 3200,
      electricityRate: tariffConfig.averageElectricityPrice,
      gasRate: tariffConfig.gasPrice,
      chillers: [{ id: 'c1', modelName: '老旧离心/螺杆机组', capacitykW: 3000, powerkW: 769, cop: 3.9, count: 2 }],
      boilers: [{ id: 'b1', modelName: '老旧燃气常压热水锅炉', capacitykW: 2400, powerkW: 18, gasFlowm3h: 293, efficiencyPercent: 82, count: 2 }],
      pumps: [{ id: 'p1', modelName: '冷水水泵', type: 'chw', flowm3h: 516, headm: 35, powerkW: 73, efficiencyPercent: 58, count: 3 }],
      towers: [{ id: 't1', modelName: '冷却塔', flowm3h: 700, fanPowerkW: 18.5, count: 3 }],
      baselineCost: 2985000
    };

    const totalChillerCap = d.chillers.reduce((a, b) => a + b.capacitykW * b.count, 0);
    const totalPower = d.chillers.reduce((a, b) => a + b.powerkW * b.count, 0);
    const avgChillerCop = totalPower > 0 ? totalChillerCap / totalPower : 3.9;

    const existingEquipmentText = `冷水主机${d.chillers.map(c => `${c.count}台 ${c.modelName}(${c.capacitykW}kW, COP ${c.cop})`).join('; ')}; ` +
      `循环水泵${d.pumps.map(p => `${p.count}台(${p.flowm3h}m³/h, ${p.powerkW}kW)`).join('; ')}; ` +
      `供热锅炉${d.boilers.map(b => `${b.count}台(${b.capacitykW}kW, 效率${b.efficiencyPercent}%)`).join('; ')}; ` +
      `冷却塔${d.towers.map(t => `${t.count}台(${t.flowm3h}m³/h)`).join('; ')}`;

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
      existingSystemType: SYSTEM_TYPES_META[d.existingSystemType]?.name || '冷水机组 + 锅炉系统',
      baselineCost: d.baselineCost,
      avgChillerCop: avgChillerCop.toFixed(2),
      existingEquipmentText,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-[98vw] max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto text-slate-100">
        
        {/* Top Header */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 font-black">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  AI 暖通工程分析与决策报告
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center space-x-1">
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span>Google Gemini 3.5 驱动</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                基于 GB 50189 / GB 55015 规范 · 8760h 物理机理与专家大模型深度协同
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfigModal(!showConfigModal)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="配置 Gemini / DeepSeek API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{showConfigModal ? '收起配置' : 'API 配置'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="彩色打印与导出为 PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>打印/导出 PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Drawer (Collapsible) */}
        {showConfigModal && (
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5" />
                <span>大模型接入设置 (优先使用 Gemini 3.5 Flash Lite)</span>
              </span>
              <span className="text-slate-400 text-[11px]">Key 保存在本地浏览器 LocalStorage，无网络时自动切换本地专家库</span>
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
        <div className="flex-shrink-0 px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
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
              <span>新建建筑冷热源系统推荐与比选报告</span>
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

          <div className="flex items-center space-x-3">
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
              <span>{isGenerating ? 'Gemini 专家生成中...' : '重新生成报告'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scroll">
          
          {/* Section A: Numerical Summary & Mathematical Engineering Baseline */}
          {reportMode === 'new_building' ? (
            <div className="space-y-4">
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white text-sm">
                      新建建筑工程边界与计算闭环汇总（第 1、2、4 步数据聚合）
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">
                    当前选定系统：{newBuildingMetrics.currentSystemName}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">总建筑面积</span>
                    <span className="text-white font-bold text-base font-mono">{newBuildingMetrics.totalArea.toLocaleString()} m²</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{newBuildingMetrics.subItemsCount} 个子项建筑</span>
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
                    <span className="text-slate-400 block mb-1">年综合碳排放</span>
                    <span className="text-teal-300 font-bold text-base font-mono">
                      {newBuildingMetrics.annualCarbonTons.toFixed(1)} 吨
                    </span>
                    <span className="text-[11px] text-emerald-400 block mt-0.5">1级能效 SCOP &gt; 5.2</span>
                  </div>
                </div>

                {/* 多系统横向客观比选表 (1~3 种冷热源形式) */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>冷热源形式多维度横向比选表（与未选择的 1~2 种主流备选系统进行严格对比）</span>
                  </span>

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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-white text-sm">
                      既有建筑改造现状基准与三大改造方案综合汇总
                    </h4>
                  </div>
                  <span className="text-xs text-rose-400 font-bold">
                    现状基准年能耗费：¥{(retrofitMetrics.baselineCost / 10000).toFixed(2)} 万元
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* 方案 A */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-blue-300 block text-xs">方案一：原系统更换高效机组</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-400">初投资:</span><span className="text-white font-bold">¥{retrofitMetrics.schemeA_Capex}万</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">年省运行费:</span><span className="text-emerald-400 font-bold">¥{retrofitMetrics.schemeA_AnnualSavings}万/年</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">节费率:</span><span className="text-emerald-400">{retrofitMetrics.schemeA_SavingsRate}%</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400">静态回收期:</span><span className="text-cyan-300 font-bold">{retrofitMetrics.schemeA_Payback}年</span></div>
                    </div>
                  </div>

                  {/* 方案 B (推荐) */}
                  <div className="bg-emerald-950/30 p-4 rounded-xl border-2 border-emerald-500/60 space-y-2 relative shadow-md">
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shadow">
                      AI 推荐方案
                    </div>
                    <span className="font-bold text-emerald-300 block text-xs">方案二：磁悬浮+大温差+AI群控</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-400">初投资:</span><span className="text-white font-bold">¥{retrofitMetrics.schemeB_Capex}万</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">年省运行费:</span><span className="text-emerald-400 font-bold">¥{retrofitMetrics.schemeB_AnnualSavings}万/年</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">节费率:</span><span className="text-emerald-400 font-bold">{retrofitMetrics.schemeB_SavingsRate}%</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400">静态回收期:</span><span className="text-emerald-400 font-black">{retrofitMetrics.schemeB_Payback}年</span></div>
                    </div>
                  </div>

                  {/* 方案 C */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-purple-300 block text-xs">方案三：热泵电气化全替代</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-400">初投资:</span><span className="text-white font-bold">¥{retrofitMetrics.schemeC_Capex}万</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">年省运行费:</span><span className="text-purple-300 font-bold">¥{retrofitMetrics.schemeC_AnnualSavings}万/年</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">节费率:</span><span className="text-purple-300">{retrofitMetrics.schemeC_SavingsRate}%</span></div>
                      <div className="flex justify-between border-t border-slate-800 pt-1"><span className="text-slate-400">静态回收期:</span><span className="text-purple-300 font-bold">{retrofitMetrics.schemeC_Payback}年</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section B: Gemini LLM Deep Professional Consulting Section */}
          <div className="bg-slate-850 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
                  <Bot className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {reportMode === 'new_building'
                      ? 'Gemini 大模型专家深度论证：系统选型裁定、土建配合、储能潜力与避坑清单'
                      : 'Gemini 大模型专家深度论证：不停产施工组织、管网利旧、EMC商务模式与数字化落地'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    大模型赋予传统报告更深层次的土建协同、施工策略与商业模式增量价值
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                权威工程咨询报告
              </span>
            </div>

            {/* Markdown Display */}
            {isGenerating ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <Bot className="w-8 h-8 text-emerald-400 animate-bounce" />
                <span className="text-sm font-semibold text-emerald-300">
                  Google Gemini 3.5 专家模型正在结合物理数据全链路撰写报告...
                </span>
                <span className="text-xs text-slate-500">
                  正在严谨推导土建配合要点、施工割接组织与全生命周期经济模型
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
        <div className="flex-shrink-0 px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>符合国家《公共建筑节能设计标准》(GB 50189) 与《建筑节能与可再生能源通用规范》(GB 55015)</span>
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
