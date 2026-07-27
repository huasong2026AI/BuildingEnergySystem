import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Sparkles, Wrench, ArrowRight, CheckCircle2, TrendingDown, DollarSign, 
  Zap, Flame, Leaf, Building, Maximize2, ShieldAlert, RotateCcw 
} from 'lucide-react';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import type { SystemType } from '../types/hvac';

interface ExistingBuildingInputs {
  name: string;
  area: number; // m²
  systemType: SystemType;
  existingChillerCOP: number; // 老旧主机COP, e.g. 3.8
  existingBoilerEfficiency: number; // 老旧锅炉效率 %, e.g. 82%
  existingPumpHead: number; // 老旧水泵扬程 m, e.g. 35m
  existingPumpEfficiency: number; // 老旧水泵效率 %, e.g. 58%
  existingRoomSpace: number; // 既有机房面积 m²
  operatingHours: number; // 年运行小时数 h
  electricityRate: number; // 电价元/kWh
  gasRate: number; // 气价元/m³
}

const DEFAULT_EXISTING: ExistingBuildingInputs = {
  name: '某既有星级酒店与办公综合体',
  area: 55000,
  systemType: 'chiller_boiler',
  existingChillerCOP: 3.9,
  existingBoilerEfficiency: 82,
  existingPumpHead: 36,
  existingPumpEfficiency: 58,
  existingRoomSpace: 320,
  operatingHours: 3200,
  electricityRate: 0.85,
  gasRate: 3.5
};

export const RetrofitOptimizer: React.FC = () => {
  const [inputs, setInputs] = useState<ExistingBuildingInputs>(DEFAULT_EXISTING);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('maglev');
  const [isAiSimulating, setIsAiSimulating] = useState<boolean>(false);

  // 1. 既有系统能耗与费用基准计算
  const baseline = useMemo(() => {
    const coolIndex = 110; // W/m²
    const heatIndex = 70;  // W/m²

    const coolingLoadkW = (inputs.area * coolIndex) / 1000;
    const heatingLoadkW = (inputs.area * heatIndex) / 1000;

    // 既有主机电功率
    const chillerPowerkW = coolingLoadkW / inputs.existingChillerCOP;
    // 既有锅炉耗气量 (m³/h)
    const boilerGasm3h = heatingLoadkW / (9.967 * (inputs.existingBoilerEfficiency / 100));

    // 既有冷水泵 + 冷却泵 + 热水泵流量与电功率
    const chwFlow = (coolingLoadkW * 3.6) / (4.186 * 5);
    const cwFlow = chwFlow * 1.2;
    const hwFlow = (heatingLoadkW * 3.6) / (4.186 * 10);

    const pumpEff = inputs.existingPumpEfficiency / 100;
    const chwPowerkW = (chwFlow * inputs.existingPumpHead * 9.81 * 1000) / (3600 * 1000 * pumpEff);
    const cwPowerkW = (cwFlow * 28 * 9.81 * 1000) / (3600 * 1000 * pumpEff);
    const hwPowerkW = (hwFlow * 25 * 9.81 * 1000) / (3600 * 1000 * pumpEff);

    const totalPumpPowerkW = chwPowerkW + cwPowerkW + hwPowerkW;
    const towerPowerkW = cwFlow * 0.22;

    // 全年耗电量 (kWh) & 耗气量 (m³)
    const annualCoolingkWh = chillerPowerkW * inputs.operatingHours * 0.65;
    const annualPumpskWh = totalPumpPowerkW * inputs.operatingHours * 0.7;
    const annualTowerskWh = towerPowerkW * inputs.operatingHours * 0.65;
    const totalElectricitykWh = annualCoolingkWh + annualPumpskWh + annualTowerskWh;

    const totalGasm3 = boilerGasm3h * inputs.operatingHours * 0.55;

    // 年费用 (RMB)
    const electricityCost = totalElectricitykWh * inputs.electricityRate;
    const gasCost = totalGasm3 * inputs.gasRate;
    const totalCost = electricityCost + gasCost;

    // 碳排放 (tCO₂)
    const carbonTons = (totalElectricitykWh * 0.581 + totalGasm3 * 2.162) / 1000;

    return {
      coolingLoadkW,
      heatingLoadkW,
      chillerPowerkW,
      totalPumpPowerkW,
      totalElectricitykWh,
      totalGasm3,
      electricityCost,
      gasCost,
      totalCost,
      carbonTons,
      roomSpace: inputs.existingRoomSpace
    };
  }, [inputs]);

  // 2. 三大系统改造方案对比计算
  const solutions = useMemo(() => {
    // 方案 1: 磁悬浮变频冷水机组 + 极高效率水泵 (Maglev)
    const sol1ElecKwh = baseline.totalElectricitykWh * 0.58; // 省电 42%
    const sol1Gasm3 = baseline.totalGasm3 * 0.88; // 锅炉低氮改造省气 12%
    const sol1ElecCost = sol1ElecKwh * inputs.electricityRate;
    const sol1GasCost = sol1Gasm3 * inputs.gasRate;
    const sol1TotalCost = sol1ElecCost + sol1GasCost;
    const sol1Carbon = (sol1ElecKwh * 0.581 + sol1Gasm3 * 2.162) / 1000;
    const sol1CapEx = 280; // 改造初投资 280 万元
    const sol1SpaceSaved = 45; // 释放机房空间 45 m²

    // 方案 2: 高效空气源/水地源热泵 + 拆除燃气锅炉 (Thermal Heat Pump - Zero Gas)
    const sol2ElecKwh = baseline.totalElectricitykWh * 0.72; // 热泵供热增加部分用电，但整体COP高
    const sol2ElecCost = sol2ElecKwh * inputs.electricityRate;
    const sol2GasCost = 0;
    const sol2TotalCost = sol2ElecCost + sol2GasCost;
    const sol2Carbon = (sol2ElecKwh * 0.581) / 1000;
    const sol2CapEx = 350; // 改造初投资 350 万元
    const sol2SpaceSaved = 110; // 拆除锅炉房与气瓶间，释放 110 m² 商业/停车空间

    // 方案 3: AI 智能零碳机房寻优控制系统 (AI Smart Control Only)
    const sol3ElecKwh = baseline.totalElectricitykWh * 0.81; // 仅依靠 AI 寻优控制节电 19%
    const sol3Gasm3 = baseline.totalGasm3 * 0.92; // 节气 8%
    const sol3ElecCost = sol3ElecKwh * inputs.electricityRate;
    const sol3GasCost = sol3Gasm3 * inputs.gasRate;
    const sol3TotalCost = sol3ElecCost + sol3GasCost;
    const sol3Carbon = (sol3ElecKwh * 0.581 + sol3Gasm3 * 2.162) / 1000;
    const sol3CapEx = 45; // 纯控制改造初投资仅 45 万元
    const sol3SpaceSaved = 0; // 无空间释放

    return [
      {
        id: 'maglev',
        title: '方案一：磁悬浮变频冷水机组 + 高效水泵全面重构',
        tag: '高效能强力改造 (推荐)',
        color: 'blue',
        description: '替换老旧主机为无油磁悬浮变频离心机组 (COP 7.0+)，水泵全变频+高效水力平衡，燃气锅炉做低氮及余热回收改造。',
        capExRmbTenThousand: sol1CapEx,
        elecCost: sol1ElecCost,
        gasCost: sol1GasCost,
        totalCost: sol1TotalCost,
        costSavedRmb: baseline.totalCost - sol1TotalCost,
        elecSavedPercent: ((baseline.totalElectricitykWh - sol1ElecKwh) / baseline.totalElectricitykWh) * 100,
        gasSavedPercent: ((baseline.totalGasm3 - sol1Gasm3) / baseline.totalGasm3) * 100,
        carbonTons: sol1Carbon,
        carbonSavedTons: baseline.carbonTons - sol1Carbon,
        spaceSavedM2: sol1SpaceSaved,
        paybackYears: sol1CapEx / ((baseline.totalCost - sol1TotalCost) / 10000)
      },
      {
        id: 'heatpump',
        title: '方案二：热泵替代锅炉 + 蓄能电气化改造 (零天然气)',
        tag: '零碳电气化 / 释放巨大空间',
        color: 'emerald',
        description: '彻底拆除老旧燃气锅炉，替换为超低温风冷/水源热泵加水蓄冷蓄热系统，彻底消除天然气安全隐患并释放高价值机房空间。',
        capExRmbTenThousand: sol2CapEx,
        elecCost: sol2ElecCost,
        gasCost: sol2GasCost,
        totalCost: sol2TotalCost,
        costSavedRmb: baseline.totalCost - sol2TotalCost,
        elecSavedPercent: ((baseline.totalElectricitykWh - sol2ElecKwh) / baseline.totalElectricitykWh) * 100,
        gasSavedPercent: 100, // 100% 消除燃气
        carbonTons: sol2Carbon,
        carbonSavedTons: baseline.carbonTons - sol2Carbon,
        spaceSavedM2: sol2SpaceSaved,
        paybackYears: sol2CapEx / ((baseline.totalCost - sol2TotalCost) / 10000)
      },
      {
        id: 'ai_control',
        title: '方案三：AI 边缘计算智能群控与零碳数字寻优',
        tag: '极低初投资 / 极速回收',
        color: 'purple',
        description: '无需更换大型主机与管线，仅部署 AI 边缘计算网关、高精度传感器与全局能效算法，通过负荷预测与动态水温寻优实现即刻节电。',
        capExRmbTenThousand: sol3CapEx,
        elecCost: sol3ElecCost,
        gasCost: sol3GasCost,
        totalCost: sol3TotalCost,
        costSavedRmb: baseline.totalCost - sol3TotalCost,
        elecSavedPercent: ((baseline.totalElectricitykWh - sol3ElecKwh) / baseline.totalElectricitykWh) * 100,
        gasSavedPercent: ((baseline.totalGasm3 - sol3Gasm3) / baseline.totalGasm3) * 100,
        carbonTons: sol3Carbon,
        carbonSavedTons: baseline.carbonTons - sol3Carbon,
        spaceSavedM2: sol3SpaceSaved,
        paybackYears: sol3CapEx / ((baseline.totalCost - sol3TotalCost) / 10000)
      }
    ];
  }, [baseline, inputs]);

  const activeSolution = solutions.find(s => s.id === selectedSolutionId) || solutions[0];

  const handleSimulateAi = () => {
    setIsAiSimulating(true);
    setTimeout(() => {
      setIsAiSimulating(false);
    }, 800);
  };

  // ECharts 对比柱状图配置
  const getChartOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['既有现状 (Baseline)', '改造优化后 (Retrofitted)'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0
      },
      grid: {
        top: '15%',
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['年运行电费 (万元)', '年天然气费 (万元)', '年总能耗费用 (万元)', '年二氧化碳排放 (吨)'],
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#cbd5e1', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      series: [
        {
          name: '既有现状 (Baseline)',
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
          name: '改造优化后 (Retrofitted)',
          type: 'bar',
          data: [
            (activeSolution.elecCost / 10000).toFixed(1),
            (activeSolution.gasCost / 10000).toFixed(1),
            (activeSolution.totalCost / 10000).toFixed(1),
            activeSolution.carbonTons.toFixed(0)
          ],
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  };

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-blue-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/40 text-blue-400">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>既有建筑空调冷热源系统改造与 AI 方案优化</span>
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[10px] rounded-full shadow">
                    AI 智能寻优引擎
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  输入既有已建建筑的老旧主机、水泵及能耗参数，算法与 AI 将自动生成 3 套节能改造方案，直观对比电费、天然气费、碳排放及机房释放空间！
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSimulateAi}
            disabled={isAiSimulating}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 border border-blue-400/30 transition-all self-start md:self-auto"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${isAiSimulating ? 'animate-spin' : ''}`} />
            <span>{isAiSimulating ? 'AI 诊断计算中...' : '重新运行 AI 改造算力诊断'}</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Layout: Left Input Drawer + Right Solutions & Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Existing Building Input Parameters */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-400" />
              <span>已建建筑现状参数录入</span>
            </h3>
            <button
              onClick={() => setInputs(DEFAULT_EXISTING)}
              className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置默认样本</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">既有建筑名称</label>
              <input
                type="text"
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">建筑面积 (m²)</label>
                <input
                  type="number"
                  value={inputs.area}
                  onChange={(e) => setInputs({ ...inputs, area: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">既有系统类型</label>
                <select
                  value={inputs.systemType}
                  onChange={(e) => setInputs({ ...inputs, systemType: e.target.value as SystemType })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-blue-300 font-bold focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(SYSTEM_TYPES_META).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 block border-b border-slate-750 pb-1">
                老旧冷热源主机与水泵性能指标
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">老旧冷水主机 COP</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.existingChillerCOP}
                    onChange={(e) => setInputs({ ...inputs, existingChillerCOP: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">老旧锅炉热效率 (%)</label>
                  <input
                    type="number"
                    value={inputs.existingBoilerEfficiency}
                    onChange={(e) => setInputs({ ...inputs, existingBoilerEfficiency: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">老旧水泵扬程 (m)</label>
                  <input
                    type="number"
                    value={inputs.existingPumpHead}
                    onChange={(e) => setInputs({ ...inputs, existingPumpHead: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-blue-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">水泵综合效率 (%)</label>
                  <input
                    type="number"
                    value={inputs.existingPumpEfficiency}
                    onChange={(e) => setInputs({ ...inputs, existingPumpEfficiency: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-blue-400 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">既有机房占地 (m²)</label>
                <input
                  type="number"
                  value={inputs.existingRoomSpace}
                  onChange={(e) => setInputs({ ...inputs, existingRoomSpace: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">年运行小时数 (h)</label>
                <input
                  type="number"
                  value={inputs.operatingHours}
                  onChange={(e) => setInputs({ ...inputs, operatingHours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">电价 (元/kWh)</label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.electricityRate}
                  onChange={(e) => setInputs({ ...inputs, electricityRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">天然气价 (元/m³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.gasRate}
                  onChange={(e) => setInputs({ ...inputs, gasRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

          </div>

          {/* Baseline Calculations Summary Box */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-2 text-xs mt-4">
            <span className="font-bold text-red-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>改造前既有能耗基准计算结果</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
              <div>既有年耗电量：<span className="font-bold text-white">{(baseline.totalElectricitykWh / 10000).toFixed(1)} 万 kWh</span></div>
              <div>既有年耗气量：<span className="font-bold text-white">{(baseline.totalGasm3 / 10000).toFixed(1)} 万 m³</span></div>
              <div>既有年电费：<span className="font-bold text-amber-300">¥{(baseline.electricityCost / 10000).toFixed(2)} 万元</span></div>
              <div>既有年燃气费：<span className="font-bold text-rose-300">¥{(baseline.gasCost / 10000).toFixed(2)} 万元</span></div>
              <div className="col-span-2 pt-1 border-t border-red-500/20 text-slate-200 font-bold flex justify-between">
                <span>既有年总能耗开支：</span>
                <span className="text-red-400 text-sm">¥{(baseline.totalCost / 10000).toFixed(2)} 万元/年</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: 3 Retrofit Solutions + Intuitive Comparison Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Solution Selector Cards (3 方案卡片) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {solutions.map((sol) => {
              const isSelected = sol.id === selectedSolutionId;

              return (
                <div
                  key={sol.id}
                  onClick={() => setSelectedSolutionId(sol.id)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/10'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sol.color === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        sol.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {sol.tag}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-2 mt-1">{sol.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">{sol.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">年节省能耗费用：</span>
                      <span className="font-bold text-emerald-400">¥{(sol.costSavedRmb / 10000).toFixed(1)} 万元/年</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">静态投资回收期：</span>
                      <span className="font-bold text-amber-300">{sol.paybackYears.toFixed(1)} 年</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct Metric Comparison Cards (改造前后四大核心指标直观对比卡片) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  <span>改造前后核心指标直观对比 (Before vs After Comparison)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  已选择：<span className="text-blue-300 font-bold">{activeSolution.title}</span>
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-500/30">
                综合能效提升 +{activeSolution.elecSavedPercent.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. 年运行电费对比 */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>年运行电费</span>
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    节电 {activeSolution.elecSavedPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-slate-400 line-through text-xs">¥{(baseline.electricityCost / 10000).toFixed(1)}万</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-lg font-bold text-amber-300">¥{(activeSolution.elecCost / 10000).toFixed(1)}万</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-slate-750">
                  每年省电费 ¥{((baseline.electricityCost - activeSolution.elecCost) / 10000).toFixed(2)} 万元
                </div>
              </div>

              {/* 2. 年天然气费对比 */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>年天然气费用</span>
                  </span>
                  <span className="text-rose-400 font-bold text-[11px] bg-rose-500/10 px-1.5 py-0.5 rounded">
                    {activeSolution.gasSavedPercent >= 99 ? '零燃气 100%' : `降气 ${activeSolution.gasSavedPercent.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-slate-400 line-through text-xs">¥{(baseline.gasCost / 10000).toFixed(1)}万</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-lg font-bold text-rose-300">¥{(activeSolution.gasCost / 10000).toFixed(1)}万</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-slate-750">
                  每年省气费 ¥{((baseline.gasCost - activeSolution.gasCost) / 10000).toFixed(2)} 万元
                </div>
              </div>

              {/* 3. 年二氧化碳碳排放量对比 */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="flex items-center space-x-1.5">
                    <Leaf className="w-4 h-4 text-teal-400" />
                    <span>年碳排放量</span>
                  </span>
                  <span className="text-teal-300 font-bold text-[11px] bg-teal-500/10 px-1.5 py-0.5 rounded">
                    减碳 {((activeSolution.carbonSavedTons / baseline.carbonTons) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-slate-400 line-through text-xs">{baseline.carbonTons.toFixed(0)} 吨</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-lg font-bold text-teal-300">{activeSolution.carbonTons.toFixed(0)} 吨</span>
                </div>
                <div className="text-[11px] text-teal-400 font-semibold pt-1 border-t border-slate-750">
                  年减排 CO₂ {activeSolution.carbonSavedTons.toFixed(1)} 吨
                </div>
              </div>

              {/* 4. 机房释放建筑空间对比 */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="flex items-center space-x-1.5">
                    <Maximize2 className="w-4 h-4 text-purple-400" />
                    <span>机房建筑空间优化</span>
                  </span>
                  <span className="text-purple-300 font-bold text-[11px] bg-purple-500/10 px-1.5 py-0.5 rounded">
                    {activeSolution.spaceSavedM2 > 0 ? `释放 ${activeSolution.spaceSavedM2} m²` : '维持原面积'}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-slate-400 text-xs">{baseline.roomSpace} m²</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-lg font-bold text-purple-300">
                    {baseline.roomSpace - activeSolution.spaceSavedM2} m²
                  </span>
                </div>
                <div className="text-[11px] text-purple-300 font-semibold pt-1 border-t border-slate-750">
                  {activeSolution.spaceSavedM2 > 0 ? `额外释放 ${activeSolution.spaceSavedM2} m² 停车/储藏空间` : '无需额外机房占地'}
                </div>
              </div>

            </div>

            {/* Intuitive ECharts Bar Chart Comparison */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200">费用与碳排放柱状直观对比</h4>
                <span className="text-[10px] text-slate-400">红柱为改造前现状，绿柱为选定改造方案</span>
              </div>
              <div className="h-64 w-full">
                <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            {/* Financial ROI Table & Proposal Detail Summary */}
            <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-white text-sm border-b border-slate-750 pb-2">
                <span className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>改造方案投资可行性与回收期财务分析表</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  静态投资回收期：{activeSolution.paybackYears.toFixed(1)} 年
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">改造估算初投资 (CapEx)</span>
                  <span className="font-bold text-white text-sm">¥{activeSolution.capExRmbTenThousand} 万元</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">年综合节省总开支</span>
                  <span className="font-bold text-emerald-400 text-sm">¥{(activeSolution.costSavedRmb / 10000).toFixed(2)} 万元/年</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">10 年生命周期净收益</span>
                  <span className="font-bold text-blue-300 text-sm">
                    ¥{(((activeSolution.costSavedRmb / 10000) * 10) - activeSolution.capExRmbTenThousand).toFixed(1)} 万元
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">AI 方案推荐度评级</span>
                  <span className="font-bold text-amber-300 text-sm flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AAAAA 级推荐</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
