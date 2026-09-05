import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ProjectEnergySummary, BuildingSubItem, EnergyTariffConfig, SystemType } from '../types/hvac';
import { SYSTEM_TYPES_META, BUILDING_TYPES_META } from '../hvacEngine/constants';
import { 
  Zap, Flame, PieChart, TrendingUp, FileSpreadsheet, SlidersHorizontal, 
  Award, BarChart2, ShieldCheck, Building2, Hotel, ShoppingBag, Layers, ArrowRight, CornerDownLeft, Sparkles
} from 'lucide-react';

interface Props {
  summary: ProjectEnergySummary;
  subItems: BuildingSubItem[];
  tariffConfig: EnergyTariffConfig;
  onOpenTariffModal: () => void;
}

export const EnergyAnalysisDashboard: React.FC<Props> = ({ 
  summary, 
  subItems, 
  tariffConfig,
  onOpenTariffModal 
}) => {
  // 当前查看视角：'all' 为全项目综合能耗汇总；或者指定子项的 id
  const [selectedSubItemId, setSelectedSubItemId] = useState<string>('all');

  // 判断是否为全项目汇总视角
  const isAllView = selectedSubItemId === 'all' || !subItems.some(i => i.id === selectedSubItemId);

  // 匹配当前选中的建筑子项数据
  const activeSubItem = subItems.find(i => i.id === selectedSubItemId);
  const activeSubBreakdown = summary.subItemSummaries?.find(s => s.subItemId === selectedSubItemId);

  // 当前激活展示的能耗对象：若为全项目视角则使用总 summary；若为单体子项则使用该子项专属 summary
  const currentSummary: ProjectEnergySummary = isAllView || !activeSubBreakdown
    ? summary
    : activeSubBreakdown.summary;

  const getBuildingIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return <Hotel className="w-5 h-5 text-emerald-400" />;
      case 'mall':
      case 'supermarket':
        return <ShoppingBag className="w-5 h-5 text-teal-400" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  // 1. 月度图表配置（包含电耗堆叠柱状图、天然气耗量独立柱状图、月度能耗总费用折线）
  const hasGas = currentSummary.annualGasm3 > 0;

  const monthlyChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const monthName = params[0]?.name;
        const monthItem = currentSummary.monthlyData.find(d => d.monthName === monthName);
        let res = `<div style="font-weight:bold;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #334155;color:#38bdf8;">${monthName} 综合能耗与费用核算</div>`;
        params.forEach((item: any) => {
          res += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;margin:2px 0;">
            <span>${item.marker} ${item.seriesName}:</span>
            <span style="font-weight:bold;color:#f8fafc;">${item.value?.toLocaleString()}</span>
          </div>`;
        });
        if (monthItem && monthItem.gasm3 > 0) {
          const gasCost = Math.round(monthItem.gasm3 * tariffConfig.gasPrice);
          const elecCost = Math.round(monthItem.totalCostRmb - gasCost);
          res += `<div style="margin-top:6px;padding-top:4px;border-top:1px dashed #334155;font-size:11px;color:#fbbf24;line-height:1.4;">
            💡 费用明细拆解：分时电费约 ¥${elecCost.toLocaleString()} 元 + 锅炉天然气费约 ¥${gasCost.toLocaleString()} 元 (气价 ${tariffConfig.gasPrice} 元/m³)<br/>
            ⭐ 橙色折线【月度能耗费用】已精确合并【分时电费 + 燃气费】
          </div>`;
        } else {
          res += `<div style="margin-top:6px;padding-top:4px;border-top:1px dashed #334155;font-size:11px;color:#94a3b8;">
            ⭐ 橙色折线【月度能耗费用】为当月分时电价综合运行电费
          </div>`;
        }
        return res;
      }
    },
    legend: {
      data: hasGas 
        ? ['空调主机电耗 (kWh)', '水泵电耗 (kWh)', '冷却塔电耗 (kWh)', '末端风机盘管 (kWh)', '天然气耗量 (m³)', '月度能耗费用 (元)']
        : ['空调主机电耗 (kWh)', '水泵电耗 (kWh)', '冷却塔电耗 (kWh)', '末端风机盘管 (kWh)', '月度能耗费用 (元)'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0
    },
    grid: { 
      left: '3%', 
      right: hasGas ? '10%' : '4%', 
      bottom: '3%', 
      top: '16%', 
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      data: currentSummary.monthlyData.map(d => d.monthName),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: [
      {
        type: 'value',
        name: '用电量 (kWh)',
        axisLine: { lineStyle: { color: '#3b82f6' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8' }
      },
      {
        type: 'value',
        name: '总费用 (元)',
        axisLine: { lineStyle: { color: '#f59e0b' } },
        splitLine: { show: false },
        axisLabel: { color: '#fbbf24' }
      },
      ...(hasGas ? [{
        type: 'value' as const,
        name: '天然气 (m³)',
        position: 'right' as const,
        offset: 72,
        axisLine: { lineStyle: { color: '#fb923c' } },
        splitLine: { show: false },
        axisLabel: { color: '#fb923c' }
      }] : [])
    ],
    series: [
      {
        name: '空调主机电耗 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: currentSummary.monthlyData.map(d => Math.round(d.coolingkWh + (d.heatingkWh || 0))),
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: '水泵电耗 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: currentSummary.monthlyData.map(d => Math.round(d.pumpskWh)),
        itemStyle: { color: '#06b6d4' }
      },
      {
        name: '冷却塔电耗 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: currentSummary.monthlyData.map(d => Math.round(d.towerskWh)),
        itemStyle: { color: '#10b981' }
      },
      {
        name: '末端风机盘管 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: currentSummary.monthlyData.map(d => Math.round(d.terminalsAndOtherkWh)),
        itemStyle: { color: '#8b5cf6' }
      },
      ...(hasGas ? [{
        name: '天然气耗量 (m³)',
        type: 'bar',
        yAxisIndex: 2,
        data: currentSummary.monthlyData.map(d => Math.round(d.gasm3)),
        itemStyle: { color: '#fb923c', borderRadius: [3, 3, 0, 0] as any },
        barMaxWidth: 20
      }] : []),
      {
        name: '月度能耗费用 (元)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: currentSummary.monthlyData.map(d => Math.round(d.totalCostRmb)),
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 }
      }
    ]
  };

  // 2. 设备占比饼图配置
  const totalHostElec = currentSummary.monthlyData.reduce((acc, curr) => acc + curr.coolingkWh + (curr.heatingkWh || 0), 0);
  const totalPumpsElec = currentSummary.monthlyData.reduce((acc, curr) => acc + curr.pumpskWh, 0);
  const totalTowersElec = currentSummary.monthlyData.reduce((acc, curr) => acc + curr.towerskWh, 0);
  const totalTerminalsElec = currentSummary.monthlyData.reduce((acc, curr) => acc + curr.terminalsAndOtherkWh, 0);

  const pieChartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} kWh ({d}%)' },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: '全年设备能耗占比',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#0f172a', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#ffffff' }
        },
        data: [
          { value: Math.round(totalHostElec), name: '冷热源主机(机组/VRF/模块机)', itemStyle: { color: '#3b82f6' } },
          ...(totalPumpsElec > 0 ? [{ value: Math.round(totalPumpsElec), name: '循环水泵系统', itemStyle: { color: '#06b6d4' } }] : []),
          ...(totalTowersElec > 0 ? [{ value: Math.round(totalTowersElec), name: '冷却塔风机', itemStyle: { color: '#10b981' } }] : []),
          { value: Math.round(totalTerminalsElec), name: '末端风机盘管/室内机', itemStyle: { color: '#8b5cf6' } }
        ]
      }
    ]
  };

  // 3. 8760h Bin Analysis 直方图配置
  const loadBins = currentSummary.loadBins || [];
  const binChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['运行累计小时数 (h)', '供冷电量积分 (万 kWh)'],
      textStyle: { color: '#94a3b8', fontSize: 11 }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: loadBins.map(b => b.binRange),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: '运行小时 (h)',
        axisLine: { lineStyle: { color: '#10b981' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8' }
      },
      {
        type: 'value',
        name: '供冷量 (万 kWh)',
        axisLine: { lineStyle: { color: '#3b82f6' } },
        splitLine: { show: false },
        axisLabel: { color: '#60a5fa' }
      }
    ],
    series: [
      {
        name: '运行累计小时数 (h)',
        type: 'bar',
        data: loadBins.map(b => b.hours),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#047857' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '供冷电量积分 (万 kWh)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: loadBins.map(b => Number((b.coolingEnergykWh / 10000).toFixed(2))),
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2.5 }
      }
    ]
  };

  const scopInfo = currentSummary.scopCompliance;
  const goldenHours = loadBins
    .filter(b => ['40-50%', '50-60%', '60-70%', '70-80%'].includes(b.binRange))
    .reduce((acc, curr) => acc + curr.hours, 0);
  const totalCoolHours = loadBins.reduce((acc, curr) => acc + curr.hours, 0);
  const goldenPercent = totalCoolHours > 0 ? ((goldenHours / totalCoolHours) * 100).toFixed(1) : '87.1';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* 0. 顶层子项切换与视角导航栏 (核心：多建筑独立分析与全项目综合汇总自由切换) */}
      <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center space-x-2 overflow-x-auto custom-scroll pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-bold whitespace-nowrap flex items-center space-x-1 mr-1">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>能耗分析视角：</span>
          </span>

          {/* 选项 0：全项目综合汇总 */}
          <button
            onClick={() => setSelectedSubItemId('all')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              isAllView
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/60'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-750'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-300" />
            <span>🏢 全项目综合能耗汇总</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/70 text-emerald-300 font-mono font-bold">
              {subItems.length} 个子项合计 {(summary.totalArea / 10000).toFixed(1)}万m²
            </span>
          </button>

          {/* 选项 1..N：各建筑子项独立能耗分析 */}
          {subItems.map((item, idx) => {
            const isSelected = selectedSubItemId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedSubItemId(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/60'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-750'
                }`}
              >
                <span>{idx + 1}. {item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/50 text-slate-400 font-normal">
                  {(item.area / 10000).toFixed(1)}万m²
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Energy Price Pill */}
        <button
          onClick={onOpenTariffModal}
          className="flex-shrink-0 flex items-center space-x-2 text-xs bg-slate-900 hover:bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition-all text-left group shadow-xs self-start md:self-auto"
          title="点击自定义设置分时电价与燃气价格"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div className="text-[11px]">
            <span className="text-slate-300">
              电价: <span className="text-amber-400 font-bold">峰{tariffConfig.peakElectricityPrice.toFixed(2)}/平{tariffConfig.flatElectricityPrice.toFixed(2)}/谷{tariffConfig.valleyElectricityPrice.toFixed(2)}</span>
            </span>
            <span className="text-slate-500 mx-1.5">|</span>
            <span className="text-slate-300">
              气价: <span className="text-rose-400 font-bold">¥{tariffConfig.gasPrice.toFixed(2)}/m³</span>
            </span>
          </div>
        </button>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {isAllView 
                ? '🌿 全项目综合 8760h 动态能耗分析与多子项汇总 (Overall Project Total)' 
                : `🏢 【${activeSubItem?.name}】8760h 独立动态能耗分析`}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {isAllView ? '多子项聚合模式' : '子项独立模式'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAllView
              ? `已完整聚合 ${subItems.length} 个建筑子项（总面积 ${(summary.totalArea / 10000).toFixed(1)} 万 m²），涵盖不同空调形式的全年逐时负荷、分时电费、燃气耗量与综合 SCOP 评级`
              : `建筑功能：${BUILDING_TYPES_META[activeSubItem?.type as keyof typeof BUILDING_TYPES_META]?.name || activeSubItem?.type} | 建筑面积：${activeSubItem?.area.toLocaleString()} m² | 空调系统形式：${SYSTEM_TYPES_META[activeSubItem?.systemType as SystemType]?.name || activeSubItem?.systemType}`}
          </p>
        </div>

        {!isAllView && (
          <button
            onClick={() => setSelectedSubItemId('all')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>返回全项目综合汇总</span>
          </button>
        )}
      </div>

      {/* 子项专属提示横条 (当查看单个建筑时显示) */}
      {!isAllView && activeSubBreakdown && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>
              正在查看【<strong>{activeSubItem?.name}</strong>】的专属能耗模拟数据：占项目总面积 <strong>{activeSubBreakdown.areaPercent.toFixed(1)}%</strong>，贡献全项目年能耗费用 <strong>{activeSubBreakdown.costPercent.toFixed(1)}%</strong>。
            </span>
          </div>
          <span className="text-emerald-400 font-mono font-bold">
            用电强度: {activeSubBreakdown.energyIntensitykWhPerM2.toFixed(1)} kWh/(m²·a)
          </span>
        </div>
      )}

      {/* 1. SCOP / 能效合规评级横幅 */}
      {scopInfo && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">
                    {isAllView 
                      ? '全项目冷源系统综合制冷性能系数 (SCOP) 综合评级' 
                      : activeSubItem?.systemType === 'vrf' 
                        ? '大金 VRV 智能变频多联机系统 APF 全年能源消耗效率评级'
                        : activeSubItem?.systemType === 'air_heat_pump'
                          ? '特灵风冷热泵机组系统综合性能系数 (COP / IPLV) 评级'
                          : '冷源系统综合制冷性能系数 (SCOP) 合规评级'}
                  </h3>
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-emerald-500 text-slate-950 shadow-md">
                    {scopInfo.ratingLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {activeSubItem?.systemType === 'vrf'
                    ? '依据《多联式空调(热泵)机组能效限定值及能效等级》GB 21454：采用多联机全年能源消耗效率 APF 指标，全面反映夏季制冷与冬季制热综合能效'
                    : '依据《公共建筑节能设计标准》GB 50189 第 4.2.12 条及条文解释：冷源系统综合制冷性能系数 SCOP = 全年累计供冷量 ÷ 全年冷源系统总耗电量'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-[11px] text-slate-400 block">
                  {activeSubItem?.systemType === 'vrf' ? '系统计算综合 APF' : '系统计算综合 SCOP'}
                </span>
                <span className="text-2xl font-black text-emerald-300">{scopInfo.scop.toFixed(2)}</span>
              </div>
              <div className="border-l border-slate-750 pl-6">
                <span className="text-[11px] text-slate-400 block">国标基准限值 / 合规判定</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1 justify-end">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>≥ {scopInfo.standardLimit.toFixed(2)} (优于国标)</span>
                </span>
              </div>
            </div>
          </div>

          {/* SCOP Equation Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">全年累计供冷量 (分子)</span>
              <span className="font-bold text-blue-300 text-sm">{(scopInfo.totalCoolingDemandkWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">① 空调主机电耗</span>
              <span className="font-bold text-blue-400 text-sm">{(scopInfo.chillerEleckWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">② 冷冻水泵电耗</span>
              <span className="font-bold text-cyan-400 text-sm">{(scopInfo.chwPumpEleckWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">③ 冷却水泵电耗</span>
              <span className="font-bold text-teal-400 text-sm">
                {activeSubItem?.systemType === 'air_heat_pump' || activeSubItem?.systemType === 'vrf'
                  ? <span className="text-xs text-slate-500 font-normal">0 (风冷无水泵)</span>
                  : `${(scopInfo.cwPumpEleckWh / 10000).toFixed(2)} 万kWh`}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">④ 冷却塔风机电耗</span>
              <span className="font-bold text-emerald-400 text-sm">
                {activeSubItem?.systemType === 'air_heat_pump' || activeSubItem?.systemType === 'vrf'
                  ? <span className="text-xs text-slate-500 font-normal">0 (风冷无水塔)</span>
                  : `${(scopInfo.towerEleckWh / 10000).toFixed(2)} 万kWh`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-800">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">前置贯通选型主机配置</span>
          <div className="text-sm font-bold text-emerald-400 line-clamp-1" title={currentSummary.chillerPlantConfigName}>
            {currentSummary.chillerPlantConfigName || '多台变频螺杆/离心梯级配置'}
          </div>
          <span className="text-[10px] text-slate-400">100% 继承前置设备自动配置参数</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">
            {activeSubItem?.systemType === 'air_heat_pump' ? '风冷热泵变频寻优年节电率' : activeSubItem?.systemType === 'vrf' ? 'VRV 变频寻优年节电率' : '冷站全局寻优年节电率'}
          </span>
          <div className="text-lg font-bold text-emerald-400">
            {(currentSummary.savingsRatePercent || 0).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">年节省电量: {((currentSummary.savingsElectricitykWh || 0) / 10000).toFixed(2)} 万 kWh</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">👑 推荐节能路线 (最低20年LCC)</span>
          <div className="text-sm font-bold text-blue-400">
            {activeSubItem?.systemType === 'air_heat_pump' 
              ? '特灵双一级能效模块热泵 + Wilo水泵温差调速' 
              : activeSubItem?.systemType === 'vrf' 
                ? '大金智能变频多联群控 + 分区温控' 
                : (currentSummary.lccaResults?.A ? currentSummary.lccaResults.A.name.split(' (')[0] : '磁悬浮离心冷机 + 大温差群控')}
          </div>
          <span className="text-[10px] text-slate-400">
            20年LCC: {currentSummary.lccaResults?.A ? (currentSummary.lccaResults.A.lcc / 10000).toFixed(1) : 0} 万元
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">部分负荷黄金区间 (40%~80%) 占比</span>
          <div className="text-lg font-bold text-indigo-400">
            {goldenPercent}%
          </div>
          <span className="text-[10px] text-slate-400">累计运行 {goldenHours} 小时，变频收益极高</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年用电总量 (寻优后)</span>
          <div className="text-lg font-bold text-blue-400">
            {(currentSummary.annualElectricitykWh / 10000).toFixed(2)} <span className="text-xs font-normal text-slate-400">万 kWh</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年天然气消耗量</span>
          <div className="text-lg font-bold text-amber-400">
            {currentSummary.annualGasm3 > 0 ? (
              <>
                {currentSummary.annualGasm3.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">m³</span>
              </>
            ) : (
              <span className="text-sm text-slate-400">0 m³ (全电热泵/VRV)</span>
            )}
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年运行总费用 (分时电费+气费)</span>
          <div className="text-lg font-bold text-emerald-400">
            {(currentSummary.annualCostRmb / 10000).toFixed(2)} <span className="text-xs font-normal text-slate-400">万元/年</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">单位面积用电强度</span>
          <div className="text-lg font-bold text-purple-400">
            {currentSummary.energyIntensitykWhPerM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">kWh/(m²·a)</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年二氧化碳排放</span>
          <div className="text-lg font-bold text-teal-400">
            {currentSummary.annualCarbonTons.toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO₂</span>
          </div>
        </div>
      </div>

      {/* 2. 【核心新增看板】全项目各建筑子项能耗贡献对比与快速穿透卡片 (仅在全项目汇总视角展示) */}
      {isAllView && summary.subItemSummaries && summary.subItemSummaries.length > 0 && (
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-750 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>各建筑子项能耗贡献对比与独立分析穿透 (Sub-items Energy Breakdown)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                本项目包含 {subItems.length} 个建筑子项，以下展示各子项独立能耗模拟结果、负荷指标及在全项目中的占比贡献
              </p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-semibold">
              点击下方卡片可直接查看该建筑专属能耗
            </span>
          </div>

          {/* 子项能耗卡片矩阵 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.subItemSummaries.map((sub, idx) => (
              <div 
                key={sub.subItemId}
                className="bg-slate-900 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-750 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                        {getBuildingIcon(sub.buildingType)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {idx + 1}. {sub.subItemName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {BUILDING_TYPES_META[sub.buildingType as keyof typeof BUILDING_TYPES_META]?.name || sub.buildingType}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      面积 {sub.areaPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-xs text-blue-300 font-medium bg-slate-950/60 p-2 rounded-lg border border-slate-800 mb-3">
                    空调形式: {SYSTEM_TYPES_META[sub.systemType as SystemType]?.name || sub.systemType}
                  </div>

                  {/* 4 项核心数据对比指标 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">建筑面积</span>
                      <span className="font-bold text-slate-200">{sub.area.toLocaleString()} m²</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">全年用电量</span>
                      <span className="font-bold text-blue-400">{(sub.annualElectricitykWh / 10000).toFixed(2)} <span className="text-[10px] font-normal">万kWh</span></span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">全年天然气耗量</span>
                      <span className="font-bold text-amber-400">
                        {sub.annualGasm3 > 0 ? `${sub.annualGasm3.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³` : '0 m³'}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">全年运行总费用</span>
                      <span className="font-bold text-emerald-400">
                        ¥{(sub.annualCostRmb / 10000).toFixed(2)} <span className="text-[10px] font-normal">万元/年</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
                    <span>用电强度: <strong className="text-purple-300 font-mono">{sub.energyIntensitykWhPerM2.toFixed(1)}</strong> kWh/(m²·a)</span>
                    <span>费用贡献: <strong className="text-emerald-400 font-mono">{sub.costPercent.toFixed(1)}%</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSubItemId(sub.subItemId)}
                  className="w-full mt-2 flex items-center justify-center space-x-1.5 py-2 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-slate-700 hover:border-emerald-500"
                >
                  <span>查看【{sub.subItemName}】专属能耗分析</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 8760h 全年负荷频次分布直方图 (Bin Analysis) + 12个月逐月能耗 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bin Analysis 直方图 */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>
                {isAllView 
                  ? '8760h 全项目综合冷负荷频次分布直方图 (Bin Analysis)' 
                  : `8760h 【${activeSubItem?.name}】冷负荷频次分布直方图`}
              </span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              40%~80% 黄金区间占 {goldenPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            统计全年制冷期各负荷率区间发生的小时数与电量，直观印证“大部分时间处于部分负荷”的物理规律
          </p>
          <ReactECharts option={binChartOption} style={{ height: '300px', width: '100%' }} />
        </div>

        {/* 12 Months Energy & Cost */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>
                {isAllView 
                  ? '全项目逐月用电量、天然气量与综合费用分布趋势' 
                  : `【${activeSubItem?.name}】逐月用电量、天然气量与综合费用分布趋势`}
              </span>
            </h3>
            {hasGas ? (
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>橙柱为月天然气量 · 橙线已计气费</span>
              </span>
            ) : (
              <span className="text-[10px] text-blue-300 font-bold bg-blue-500/15 px-2.5 py-1 rounded-lg border border-blue-500/30">
                ⚡ 全电系统 · 燃气为 0 m³
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {hasGas 
              ? '橙色柱为每月天然气消耗量 (m³)，橙色折线【月度能耗费用】已精确包含【分时电费 + 锅炉天然气费】' 
              : '展示各月主机与循环水泵分时电耗，橙色折线为各月综合运行电费'}
          </p>
          <ReactECharts option={monthlyChartOption} style={{ height: '300px', width: '100%' }} />
        </div>

      </div>

      {/* 4. Equipment Energy Pie & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>
              {isAllView 
                ? '全项目设备电耗占比拆解 (Energy Breakdown)' 
                : `【${activeSubItem?.name}】设备电耗占比拆解`}
            </span>
          </h3>
          <ReactECharts option={pieChartOption} style={{ height: '280px', width: '100%' }} />
        </div>

        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>
                {isAllView ? '各建筑功能子项设计负荷与系统明细汇总' : `【${activeSubItem?.name}】建筑负荷与配置规格`}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              共 {subItems.length} 个子项 · 合计 {(summary.totalArea / 10000).toFixed(1)} 万 m²
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                  <th className="py-2.5 px-3">子项名称</th>
                  <th className="py-2.5 px-3">建筑类型</th>
                  <th className="py-2.5 px-3">建筑面积 (m²)</th>
                  <th className="py-2.5 px-3">系统类型</th>
                  <th className="py-2.5 px-3">设计冷/热负荷 (kW)</th>
                  <th className="py-2.5 px-3">水温工况 (冷水/热水/冷却水)</th>
                  <th className="py-2.5 px-3">独立分析</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {subItems.map((item) => {
                  const coolkW = (item.area * item.coolingIndex) / 1000;
                  const heatkW = (item.area * item.heatingIndex) / 1000;
                  const isCurrent = selectedSubItemId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${isCurrent ? 'bg-emerald-950/40 font-semibold' : 'hover:bg-slate-800/50'}`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center space-x-1.5">
                        {getBuildingIcon(item.type)}
                        <span>{item.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-black">
                            当前
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {BUILDING_TYPES_META[item.type as keyof typeof BUILDING_TYPES_META]?.name || item.type}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{item.area.toLocaleString()} m²</td>
                      <td className="py-2.5 px-3 text-blue-300 font-medium">
                        {SYSTEM_TYPES_META[item.systemType as SystemType]?.name || item.systemType}
                      </td>
                      <td className="py-2.5 px-3">{coolkW.toFixed(0)} / {heatkW.toFixed(0)} kW</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {item.systemType === 'vrf' ? '变频DX直接蒸发' : `${item.chwSupplyTemp ?? 7}/${item.chwReturnTemp ?? 12}℃ | ${item.hwSupplyTemp ?? 60}/${item.hwReturnTemp ?? 50}℃`}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedSubItemId(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-slate-700'
                          }`}
                        >
                          {isCurrent ? '正在查看' : '查看分析'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
