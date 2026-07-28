import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Sparkles, Wrench, TrendingDown, Building, ShieldAlert, Cpu, Plus, Trash2 
} from 'lucide-react';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import type { SystemType, ExistingChillerDetail, ExistingBoilerDetail, ExistingPumpDetail } from '../types/hvac';

export const RetrofitOptimizer: React.FC = () => {
  // 1. 既有系统基本信息
  const [existingSystemType, setExistingSystemType] = useState<SystemType>('chiller_boiler');
  const [buildingName, setBuildingName] = useState<string>('某既有商业综合体及酒店');
  const [buildingArea, setBuildingArea] = useState<number>(55000);
  const [operatingHours, setOperatingHours] = useState<number>(3200);
  const [electricityRate, setElectricityRate] = useState<number>(0.85);
  const [gasRate] = useState<number>(3.5);

  // 2. 详细既有设备列表录入（根据系统类型可自定义添加多台/多组型号）
  const [chillers, setChillers] = useState<ExistingChillerDetail[]>([
    { id: 'c1', modelName: '老旧螺杆式冷水机组 A组', capacitykW: 3000, powerkW: 769, cop: 3.9, count: 2 }
  ]);

  const [boilers, setBoilers] = useState<ExistingBoilerDetail[]>([
    { id: 'b1', modelName: '老旧大气式燃气锅炉', capacitykW: 2400, powerkW: 18, gasFlowm3h: 293, efficiencyPercent: 82, count: 2 }
  ]);

  const [pumps, setPumps] = useState<ExistingPumpDetail[]>([
    { id: 'p1', modelName: '工频冷水水泵', type: 'chw', flowm3h: 516, headm: 35, powerkW: 73, efficiencyPercent: 58, count: 3 },
    { id: 'p2', modelName: '工频冷却水水泵', type: 'cw', flowm3h: 620, headm: 28, powerkW: 74, efficiencyPercent: 58, count: 3 },
    { id: 'p3', modelName: '工频热水水泵', type: 'hw', flowm3h: 206, headm: 25, powerkW: 24, efficiencyPercent: 58, count: 2 }
  ]);

  // 3. 当前选中的改造步骤模式 (Step 1: 维持原系统更换老设备; Step 2: 更换系统形式; Step 3: AI智能群控)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // 步骤2: 更换系统形式 - 目标新系统与设备参数（允许用户全手动修改）
  const [targetSystemType, setTargetSystemType] = useState<SystemType>('vrf');
  const [targetCapEx, setTargetCapEx] = useState<number>(320); // 初投资万元
  const [targetChillerCOP, setTargetChillerCOP] = useState<number>(6.8); // 新主机COP
  const [targetVRFEER, setTargetVRFEER] = useState<number>(4.2); // VRF EER

  // 计算既有系统总装机功率与年能耗基准
  const baseline = useMemo(() => {
    // 既有冷水机组电功率与容量
    const totalChillerCapkW = chillers.reduce((a, b) => a + b.capacitykW * b.count, 0);
    const totalChillerPowerkW = chillers.reduce((a, b) => a + b.powerkW * b.count, 0);

    // 既有锅炉热容量与耗气量
    const totalBoilerCapkW = boilers.reduce((a, b) => a + b.capacitykW * b.count, 0);
    const totalBoilerGasFlow = boilers.reduce((a, b) => a + b.gasFlowm3h * b.count, 0);

    // 既有水泵总功率
    const totalPumpPowerkW = pumps.reduce((a, b) => a + b.powerkW * b.count, 0);

    // 年运行能耗计算
    const annualCoolingkWh = totalChillerPowerkW * operatingHours * 0.65;
    const annualPumpskWh = totalPumpPowerkW * operatingHours * 0.7;
    const annualTowerskWh = (totalChillerCapkW > 0 ? totalChillerCapkW * 0.05 : 0) * operatingHours * 0.65;
    
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
      totalElectricitykWh,
      totalGasm3,
      electricityCost,
      gasCost,
      totalCost,
      carbonTons
    };
  }, [chillers, boilers, pumps, operatingHours, electricityRate, gasRate]);

  // ----------------------------------------------------
  // 步骤 1：维持原系统，仅更换老旧高效设备方案
  // ----------------------------------------------------
  const step1Result = useMemo(() => {
    // 将老旧机组更换为超高效磁悬浮离心机组 (COP 6.8)，水泵更换为变频高效泵 (效率82%)，锅炉更换为冷凝低氮锅炉 (效率95%)
    const newChillerPowerkW = baseline.totalChillerCapkW / 6.8;
    const newPumpPowerkW = baseline.totalPumpPowerkW * (0.58 / 0.82) * 0.8; // 变频+高效泵省电约35%
    const newBoilerGasFlow = baseline.totalBoilerGasFlow * (0.82 / 0.95); // 效率提升省气 13.7%

    const newEleckWh = (newChillerPowerkW * 0.65 + newPumpPowerkW * 0.7) * operatingHours;
    const newGasm3 = newBoilerGasFlow * operatingHours * 0.55;

    const newElecCost = newEleckWh * electricityRate;
    const newGasCost = newGasm3 * gasRate;
    const newTotalCost = newElecCost + newGasCost;
    const costSaved = baseline.totalCost - newTotalCost;
    const carbonTons = (newEleckWh * 0.581 + newGasm3 * 2.162) / 1000;
    const capEx = 220; // 估算初投资 220 万元

    return {
      title: '步骤一：维持原系统架构，仅更换老旧高效设备',
      newChillerCOP: 6.8,
      newPumpEff: 82,
      newBoilerEff: 95,
      elecCost: newElecCost,
      gasCost: newGasCost,
      totalCost: newTotalCost,
      costSavedRmb: costSaved,
      elecSavedPercent: ((baseline.totalElectricitykWh - newEleckWh) / baseline.totalElectricitykWh) * 100,
      gasSavedPercent: ((baseline.totalGasm3 - newGasm3) / baseline.totalGasm3) * 100,
      carbonTons,
      carbonSavedTons: baseline.carbonTons - carbonTons,
      capExRmbTenThousand: capEx,
      paybackYears: capEx / (costSaved / 10000)
    };
  }, [baseline, operatingHours, electricityRate, gasRate]);

  // ----------------------------------------------------
  // 步骤 2：更换系统形式 (AI生成 + 全手动自建设备参数)
  // ----------------------------------------------------
  const step2Result = useMemo(() => {
    let newEleckWh = 0;
    let newGasm3 = 0;
    let spaceSavedM2 = 0;

    if (targetSystemType === 'vrf') {
      const vrfPowerkW = baseline.totalChillerCapkW / targetVRFEER;
      newEleckWh = vrfPowerkW * operatingHours * 0.6;
      newGasm3 = 0; // 100% 消除燃气
      spaceSavedM2 = 120; // 拆除锅炉房与冷却水系统，释放 120 m²
    } else if (targetSystemType === 'air_heat_pump') {
      const achpPowerkW = baseline.totalChillerCapkW / 3.4;
      newEleckWh = achpPowerkW * operatingHours * 0.65;
      newGasm3 = 0;
      spaceSavedM2 = 90;
    } else {
      const gshpPowerkW = baseline.totalChillerCapkW / targetChillerCOP;
      newEleckWh = gshpPowerkW * operatingHours * 0.55;
      newGasm3 = 0;
      spaceSavedM2 = 60;
    }

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
      elecSavedPercent: ((baseline.totalElectricitykWh - newEleckWh) / baseline.totalElectricitykWh) * 100,
      gasSavedPercent: baseline.totalGasm3 > 0 ? ((baseline.totalGasm3 - newGasm3) / baseline.totalGasm3) * 100 : 0,
      carbonTons,
      carbonSavedTons: baseline.carbonTons - carbonTons,
      spaceSavedM2,
      capExRmbTenThousand: targetCapEx,
      paybackYears: targetCapEx / (costSaved / 10000)
    };
  }, [baseline, targetSystemType, targetVRFEER, targetChillerCOP, targetCapEx, operatingHours, electricityRate, gasRate]);

  // ----------------------------------------------------
  // 步骤 3：AI 边缘计算智能群控与寻优
  // ----------------------------------------------------
  const step3Result = useMemo(() => {
    const newEleckWh = baseline.totalElectricitykWh * 0.81;
    const newGasm3 = baseline.totalGasm3 * 0.92;
    const newElecCost = newEleckWh * electricityRate;
    const newGasCost = newGasm3 * gasRate;
    const newTotalCost = newElecCost + newGasCost;
    const costSaved = baseline.totalCost - newTotalCost;
    const carbonTons = (newEleckWh * 0.581 + newGasm3 * 2.162) / 1000;
    const capEx = 35; // 控制系统初投资 35 万元

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
      paybackYears: capEx / (costSaved / 10000)
    };
  }, [baseline, electricityRate, gasRate]);

  const currentResult = activeStep === 1 ? step1Result : (activeStep === 2 ? step2Result : step3Result);

  // ECharts 对比图配置
  const getChartOption = () => {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['改造前既有现状', '改造优化后'], textStyle: { color: '#cbd5e1', fontSize: 11 }, top: 0 },
      grid: { top: '15%', left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['年运行电费 (万元)', '年天然气费 (万元)', '年总能耗费用 (万元)', '年碳排放 (吨)'],
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

  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/40 text-blue-400">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>既有建筑空调冷热源系统改造与 AI 智能寻优</span>
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[10px] rounded-full shadow">
                  专业三步改造分析引擎
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                详细录入既有冷水机组、水泵、锅炉型号与参数，程序将提供【步骤1:维持原系统换高效设备】、【步骤2:更换系统形式(自建全调)】及【步骤3:AI智能群控】三大深度方案对比！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Left Detailed Equipment Input + Right 3-Step Retrofit Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: Detailed Existing Equipment Input Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-400" />
              <span>既有建筑与老旧设备明细录入</span>
            </h3>
            <span className="text-[11px] text-blue-400 font-semibold">先选系统再加设备</span>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* 1. 先选择既有系统类型 */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">1. 既有冷热源系统形式</label>
              <select
                value={existingSystemType}
                onChange={(e) => setExistingSystemType(e.target.value as SystemType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-blue-300 font-bold focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(SYSTEM_TYPES_META).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 2. 基础建筑参数 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">建筑名称</label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">建筑面积 (m²)</label>
                <input
                  type="number"
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                />
              </div>
            </div>

            {/* 3. 详细既有设备参数录入表 (冷水机组明细) */}
            {(existingSystemType === 'chiller_boiler' || existingSystemType === 'hybrid') && (
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                  <span className="font-bold text-blue-300 flex items-center space-x-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>冷水机组详细型号与参数 ({chillers.length} 组)</span>
                  </span>
                  <button
                    onClick={() => setChillers([...chillers, {
                      id: `c-${Date.now()}`,
                      modelName: `老旧机组 ${chillers.length + 1}`,
                      capacitykW: 1500,
                      powerkW: 384,
                      cop: 3.9,
                      count: 1
                    }])}
                    className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加主机</span>
                  </button>
                </div>

                {chillers.map((c, idx) => (
                  <div key={c.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <input
                        type="text"
                        value={c.modelName}
                        onChange={(e) => {
                          const updated = [...chillers];
                          updated[idx].modelName = e.target.value;
                          setChillers(updated);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white font-bold"
                      />
                      <button
                        onClick={() => {
                          if (chillers.length > 1) setChillers(chillers.filter(item => item.id !== c.id));
                        }}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">制冷量(kW)</span>
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
                          className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block">电功率(kW)</span>
                        <input
                          type="number"
                          value={c.powerkW}
                          onChange={(e) => {
                            const updated = [...chillers];
                            updated[idx].powerkW = Number(e.target.value);
                            setChillers(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-amber-400 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block">COP值</span>
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
                          className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-blue-300 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block">台数</span>
                        <input
                          type="number"
                          value={c.count}
                          onChange={(e) => {
                            const updated = [...chillers];
                            updated[idx].count = Number(e.target.value);
                            setChillers(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. 水泵明细参数 */}
            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-blue-300 block border-b border-slate-750 pb-2">
                水泵循环系统参数 ({pumps.length} 组水泵)
              </span>

              {pumps.map((p, idx) => (
                <div key={p.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-200">{p.modelName}</span>
                    <span className="text-[10px] text-slate-400">效率 {p.efficiencyPercent}%</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">流量(m³/h)</span>
                      <input
                        type="number"
                        value={p.flowm3h}
                        onChange={(e) => {
                          const updated = [...pumps];
                          updated[idx].flowm3h = Number(e.target.value);
                          setPumps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">扬程(m)</span>
                      <input
                        type="number"
                        value={p.headm}
                        onChange={(e) => {
                          const updated = [...pumps];
                          updated[idx].headm = Number(e.target.value);
                          setPumps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">功率(kW)</span>
                      <input
                        type="number"
                        value={p.powerkW}
                        onChange={(e) => {
                          const updated = [...pumps];
                          updated[idx].powerkW = Number(e.target.value);
                          setPumps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">台数</span>
                      <input
                        type="number"
                        value={p.count}
                        onChange={(e) => {
                          const updated = [...pumps];
                          updated[idx].count = Number(e.target.value);
                          setPumps(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. 燃气锅炉明细 */}
            {(existingSystemType === 'chiller_boiler' || existingSystemType === 'hybrid') && (
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-rose-400 block border-b border-slate-750 pb-2">
                  燃气锅炉参数明细
                </span>
                {boilers.map((b, idx) => (
                  <div key={b.id} className="grid grid-cols-4 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">供热量(kW)</span>
                      <input
                        type="number"
                        value={b.capacitykW}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].capacitykW = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">耗气量(m³/h)</span>
                      <input
                        type="number"
                        value={b.gasFlowm3h}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].gasFlowm3h = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-rose-400 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">效率(%)</span>
                      <input
                        type="number"
                        value={b.efficiencyPercent}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].efficiencyPercent = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">台数</span>
                      <input
                        type="number"
                        value={b.count}
                        onChange={(e) => {
                          const updated = [...boilers];
                          updated[idx].count = Number(e.target.value);
                          setBoilers(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">年运行小时 (h)</label>
                <input
                  type="number"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">电价 (元/kWh)</label>
                <input
                  type="number"
                  step="0.05"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

          </div>

          {/* 既有基准计算统计卡片 */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 space-y-2 text-xs">
            <span className="font-bold text-red-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>改造前老旧系统能耗基准计算结果</span>
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

        {/* Right 7 Cols: 3-Step Retrofit Engine + Interactive Comparisons */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 3 Step Tabs Navigation Header */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap gap-2 shadow-lg">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeStep === 1
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/60 text-blue-300 text-[10px] flex items-center justify-center font-black">1</span>
              <span>维持原系统，仅换高效设备 (首推)</span>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeStep === 2
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/60 text-emerald-300 text-[10px] flex items-center justify-center font-black">2</span>
              <span>更换系统形式 (自建可调)</span>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeStep === 3
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/60 text-purple-300 text-[10px] flex items-center justify-center font-black">3</span>
              <span>AI 边缘计算智能群控</span>
            </button>
          </div>

          {/* Detailed Content Panel for Active Step */}
          {activeStep === 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded font-bold">首推方案</span>
                  <h4 className="text-sm font-bold text-white">维持原空调系统形式，仅更换老旧高效设备</h4>
                </div>
                <span className="text-emerald-400 font-bold text-sm">
                  每年节省 ¥{(step1Result.costSavedRmb / 10000).toFixed(2)} 万元
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                无需变动已有管路架构与机房布局。将老旧螺杆/离心主机替换为**超高效磁悬浮离心机组 (COP 6.8)**，水泵更换为**高效率变频水泵 (82%)**，锅炉更换为**低氮冷凝热水锅炉 (效率95%)**。
              </p>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[10px] block">冷水主机 COP 提升</span>
                  <span className="text-blue-300 font-bold text-sm">3.9 &rarr; 6.8 (+74%)</span>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[10px] block">水泵综合效率提升</span>
                  <span className="text-emerald-300 font-bold text-sm">58% &rarr; 82% (+41%)</span>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[10px] block">估算回收期</span>
                  <span className="text-amber-300 font-bold text-sm">{step1Result.paybackYears.toFixed(1)} 年</span>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">第二步</span>
                  <h4 className="text-sm font-bold text-white">更换系统形式 (AI 推荐生成 + 全手动自建设备参数)</h4>
                </div>
                <span className="text-emerald-400 font-bold text-sm">
                  每年节省 ¥{(step2Result.costSavedRmb / 10000).toFixed(2)} 万元
                </span>
              </div>

              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                <span className="font-bold text-emerald-300 block">
                  目标新系统搭建与参数全手动调整：
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">目标新系统形式</label>
                    <select
                      value={targetSystemType}
                      onChange={(e) => setTargetSystemType(e.target.value as SystemType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-300 font-bold"
                    >
                      {Object.values(SYSTEM_TYPES_META).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">工程初投资 (CapEx 万元)</label>
                    <input
                      type="number"
                      value={targetCapEx}
                      onChange={(e) => setTargetCapEx(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>

                  {targetSystemType === 'vrf' && (
                    <div>
                      <label className="block text-slate-400 mb-1">VRF 室外机 EER (W/W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={targetVRFEER}
                        onChange={(e) => setTargetVRFEER(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-purple-300 font-bold"
                      />
                    </div>
                  )}

                  {targetSystemType !== 'vrf' && (
                    <div>
                      <label className="block text-slate-400 mb-1">新主机 COP (W/W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={targetChillerCOP}
                        onChange={(e) => setTargetChillerCOP(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-blue-300 font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <h4 className="text-sm font-bold text-white">第三步：AI 边缘计算智能群控与寻优技术详解</h4>
                </div>
                <span className="text-purple-300 font-bold text-xs bg-purple-500/20 px-2.5 py-1 rounded">
                  免换主机 / 回收期 0.9年
                </span>
              </div>

              <div className="space-y-3 text-slate-300 leading-relaxed">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-300 block">① AI 边缘计算关重节点部署</span>
                  <p className="text-[11px] text-slate-400">
                    在机房部署高规格 AI 边缘网关 (AI Edge Gateway)，通过 RS485/BACnet 实时采集冷水机组、水泵、锅炉及冷却塔的 100+ 维运行参数。
                  </p>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-300 block">② 动态冷冻水供水温度自适应寻优 (Chw Temp Optimization)</span>
                  <p className="text-[11px] text-slate-400">
                    AI 算法结合气象预报与建筑负荷预测模型，在低负荷时段将冷冻水供水温度从 $7^\circ C$ 提升至 $9\sim 10.5^\circ C$，冷水机组 COP 自动提升 6%~12%！
                  </p>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-300 block">③ 冷却塔逼近度与风机水泵最佳能效配比算法</span>
                  <p className="text-[11px] text-slate-400">
                    AI 实时寻优冷却水流量与冷却塔风机转速的边际功率平衡点，确保机组冷凝温度始终处于低能耗区间。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 直观对比展示面板 (ECharts + 改造前后 4 大卡片) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span>【{currentResult.title}】改造前后直观数据对比</span>
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-400 text-[10px] block">年运行电费</span>
                <span className="text-amber-300 font-bold text-sm">
                  ¥{(currentResult.elecCost / 10000).toFixed(1)}万
                </span>
                <span className="text-[10px] text-emerald-400 block font-semibold">
                  节电 {currentResult.elecSavedPercent.toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-400 text-[10px] block">年天然气费</span>
                <span className="text-rose-300 font-bold text-sm">
                  ¥{(currentResult.gasCost / 10000).toFixed(1)}万
                </span>
                <span className="text-[10px] text-rose-400 block font-semibold">
                  降气 {currentResult.gasSavedPercent.toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-400 text-[10px] block">年减排 CO₂</span>
                <span className="text-teal-300 font-bold text-sm">
                  {currentResult.carbonSavedTons.toFixed(1)} 吨
                </span>
                <span className="text-[10px] text-teal-400 block font-semibold">环保减碳</span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750 space-y-1">
                <span className="text-slate-400 text-[10px] block">回收期 (CapEx)</span>
                <span className="text-white font-bold text-sm">
                  {currentResult.paybackYears.toFixed(1)} 年
                </span>
                <span className="text-[10px] text-slate-400 block">初投资 ¥{currentResult.capExRmbTenThousand}万</span>
              </div>
            </div>

            {/* ECharts 柱状图 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-64">
              <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
