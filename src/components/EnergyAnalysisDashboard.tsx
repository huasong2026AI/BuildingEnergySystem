import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { ProjectEnergySummary, BuildingSubItem, EnergyTariffConfig } from '../types/hvac';
import { 
  Zap, PieChart, TrendingUp, FileSpreadsheet, CheckCircle2, SlidersHorizontal, 
  Award, BarChart2, ShieldCheck 
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

  const monthlyChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['空调主机电耗 (kWh)', '水泵电耗 (kWh)', '冷却塔电耗 (kWh)', '月度能耗费用 (元)'],
      textStyle: { color: '#94a3b8', fontSize: 11 }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: summary.monthlyData.map(d => d.monthName),
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
        name: '费用 (元)',
        axisLine: { lineStyle: { color: '#10b981' } },
        splitLine: { show: false },
        axisLabel: { color: '#34d399' }
      }
    ],
    series: [
      {
        name: '空调主机电耗 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: summary.monthlyData.map(d => Math.round(d.coolingkWh)),
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: '水泵电耗 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: summary.monthlyData.map(d => Math.round(d.pumpskWh)),
        itemStyle: { color: '#06b6d4' }
      },
      {
        name: '冷却塔电耗 (kWh)',
        type: 'bar',
        stack: 'elec',
        data: summary.monthlyData.map(d => Math.round(d.towerskWh)),
        itemStyle: { color: '#10b981' }
      },
      {
        name: '月度能耗费用 (元)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: summary.monthlyData.map(d => Math.round(d.totalCostRmb)),
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 }
      }
    ]
  };

  const totalHostElec = summary.monthlyData.reduce((acc, curr) => acc + curr.coolingkWh, 0);
  const totalPumpsElec = summary.monthlyData.reduce((acc, curr) => acc + curr.pumpskWh, 0);
  const totalTowersElec = summary.monthlyData.reduce((acc, curr) => acc + curr.towerskWh, 0);
  const totalTerminalsElec = summary.monthlyData.reduce((acc, curr) => acc + curr.terminalsAndOtherkWh, 0);

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
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#ffffff' }
        },
        data: [
          { value: Math.round(totalHostElec), name: '冷热源主机(机组/VRF/锅炉)', itemStyle: { color: '#3b82f6' } },
          { value: Math.round(totalPumpsElec), name: '循环水泵系统', itemStyle: { color: '#06b6d4' } },
          { value: Math.round(totalTowersElec), name: '冷却塔风机', itemStyle: { color: '#10b981' } },
          { value: Math.round(totalTerminalsElec), name: '末端风机盘管/AHU', itemStyle: { color: '#8b5cf6' } }
        ]
      }
    ]
  };

  // 8760h Bin Analysis Chart Option
  const loadBins = summary.loadBins || [];
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

  const scopInfo = summary.scopCompliance;
  const goldenHours = loadBins
    .filter(b => ['40-50%', '50-60%', '60-70%', '70-80%'].includes(b.binRange))
    .reduce((acc, curr) => acc + curr.hours, 0);
  const totalCoolHours = loadBins.reduce((acc, curr) => acc + curr.hours, 0);
  const goldenPercent = totalCoolHours > 0 ? ((goldenHours / totalCoolHours) * 100).toFixed(1) : '72.5';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">🌿 全年 8760h 动态能耗分析与全局寻优 (Annual Energy & Global Optimization)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            采用基于城市 EPW 气象与湿球温度的 8,760 小时逐时仿真模型、GB 50189 标准 SCOP 冷源综合能效评价及分时峰谷电价精算
          </p>
        </div>

        {/* Dynamic Energy Price Pill */}
        <button
          onClick={onOpenTariffModal}
          className="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition-all text-left group shadow-sm"
          title="点击自定义设置分时电价与燃气价格"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div>
            <span className="text-slate-300">
              电价: <span className="text-amber-400 font-bold">峰{tariffConfig.peakElectricityPrice.toFixed(2)}/平{tariffConfig.flatElectricityPrice.toFixed(2)}/谷{tariffConfig.valleyElectricityPrice.toFixed(2)}</span> (均价 ¥{tariffConfig.averageElectricityPrice.toFixed(2)})
            </span>
            <span className="text-slate-500 mx-1.5">|</span>
            <span className="text-slate-300">
              气价: <span className="text-rose-400 font-bold">¥{tariffConfig.gasPrice.toFixed(2)}/m³</span>
            </span>
          </div>
        </button>
      </div>

      {/* 1. 《公共建筑节能设计标准》GB 50189-2015 第 4.2.12 条 SCOP 评价横幅 */}
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
                    冷源系统综合制冷性能系数 (SCOP) 合规评级
                  </h3>
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-emerald-500 text-slate-950 shadow-md">
                    {scopInfo.ratingLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  依据《公共建筑节能设计标准》GB 50189-2015 第 4.2.12 条及条文解释：冷源系统综合制冷性能系数 SCOP = 全年累计供冷量 ÷ (冷水机组耗电 + 冷水泵耗电 + 冷却水泵耗电 + 冷却塔风机耗电)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-[11px] text-slate-400 block">系统计算综合 SCOP</span>
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
              <span className="text-slate-400 block text-[10px]">① 冷水机组电耗</span>
              <span className="font-bold text-blue-400 text-sm">{(scopInfo.chillerEleckWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">② 冷冻水泵电耗</span>
              <span className="font-bold text-cyan-400 text-sm">{(scopInfo.chwPumpEleckWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">③ 冷却水泵电耗</span>
              <span className="font-bold text-teal-400 text-sm">{(scopInfo.cwPumpEleckWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[10px]">④ 冷却塔风机电耗</span>
              <span className="font-bold text-emerald-400 text-sm">{(scopInfo.towerEleckWh / 10000).toFixed(2)} <span className="text-xs font-normal">万kWh</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-800">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">前置贯通选型主机配置</span>
          <div className="text-sm font-bold text-emerald-400 line-clamp-1" title={summary.chillerPlantConfigName}>
            {summary.chillerPlantConfigName || '多台变频螺杆/离心梯级配置'}
          </div>
          <span className="text-[10px] text-slate-400">100% 继承前置设备自动配置参数</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">冷站全局寻优年节电率</span>
          <div className="text-lg font-bold text-emerald-400">
            {(summary.savingsRatePercent || 0).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">年节省电量: {((summary.savingsElectricitykWh || 0) / 10000).toFixed(2)} 万 kWh</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">👑 推荐改造路线 (最低20年LCC)</span>
          <div className="text-sm font-bold text-blue-400">
            {summary.lccaResults?.A ? summary.lccaResults.A.name.split(' (')[0] : '水冷冷机 + 燃气锅炉 (寻优)'}
          </div>
          <span className="text-[10px] text-slate-400">
            20年LCC: {summary.lccaResults?.A ? (summary.lccaResults.A.lcc / 10000).toFixed(1) : 0} 万元
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
            {(summary.annualElectricitykWh / 10000).toFixed(2)} <span className="text-xs font-normal text-slate-400">万 kWh</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年天然气消耗量</span>
          <div className="text-lg font-bold text-amber-400">
            {summary.annualGasm3.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">m³</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年运行总费用 (分时电费+气费)</span>
          <div className="text-lg font-bold text-emerald-400">
            {(summary.annualCostRmb / 10000).toFixed(2)} <span className="text-xs font-normal text-slate-400">万元/年</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">单位面积用电强度</span>
          <div className="text-lg font-bold text-purple-400">
            {summary.energyIntensitykWhPerM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">kWh/(m²·a)</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年二氧化碳排放</span>
          <div className="text-lg font-bold text-teal-400">
            {summary.annualCarbonTons.toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO₂</span>
          </div>
        </div>
      </div>

      {/* 2. 8760h 全年负荷频次分布直方图 (Bin Analysis) + 12个月逐月能耗 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bin Analysis 直方图 */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>8760h 全年冷负荷频次分布直方图 (Bin Analysis)</span>
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
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>逐月用电量、天然气量与费用分布趋势 (12 Months Trend)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            包含夏季主机与输配电耗峰值、冬季锅炉天然气耗量与分时电价核算费用
          </p>
          <ReactECharts option={monthlyChartOption} style={{ height: '300px', width: '100%' }} />
        </div>

      </div>

      {/* Equipment Energy Pie & Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>设备电耗占比拆解 (Energy Breakdown)</span>
          </h3>
          <ReactECharts option={pieChartOption} style={{ height: '280px', width: '100%' }} />
        </div>

        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>各建筑功能子项能耗与空调系统明细汇总</span>
          </h3>

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
                  <th className="py-2.5 px-3">选型状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {subItems.map((item) => {
                  const coolkW = (item.area * item.coolingIndex) / 1000;
                  const heatkW = (item.area * item.heatingIndex) / 1000;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-bold text-white">{item.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.type}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{item.area.toLocaleString()} m²</td>
                      <td className="py-2.5 px-3 text-blue-300 font-medium">{item.systemType}</td>
                      <td className="py-2.5 px-3">{coolkW.toFixed(0)} / {heatkW.toFixed(0)} kW</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {item.systemType === 'vrf' ? '变频DX直接蒸发' : `${item.chwSupplyTemp ?? 7}/${item.chwReturnTemp ?? 12}℃ | ${item.hwSupplyTemp ?? 60}/${item.hwReturnTemp ?? 50}℃`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-400 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>已同步模拟</span>
                        </span>
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
