import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { ProjectEnergySummary, BuildingSubItem } from '../types/hvac';
import { ENERGY_FACTORS } from '../hvacEngine/constants';
import { 
  Zap, PieChart, TrendingUp, AlertTriangle, FileSpreadsheet, CheckCircle2 
} from 'lucide-react';

interface Props {
  summary: ProjectEnergySummary;
  subItems: BuildingSubItem[];
}

export const EnergyAnalysisDashboard: React.FC<Props> = ({ summary, subItems }) => {

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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">全年能耗分析与项目汇总 (Annual Energy Analysis)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            提供 8760h 逐月负荷与电量/气量分布模拟、设备电耗占比拆解及工程选型经济性诊断
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="text-slate-400">电价:</span>
          <span className="text-amber-400 font-bold">{ENERGY_FACTORS.electricityPrice} 元/kWh</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">气价:</span>
          <span className="text-emerald-400 font-bold">{ENERGY_FACTORS.gasPrice} 元/m³</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block">全年用电总量</span>
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
          <span className="text-[11px] text-slate-400 font-semibold block">全年运行总费用</span>
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

      {/* ECharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>逐月用电量、天然气量与费用分布趋势 (12 Months Energy & Cost)</span>
          </h3>
          <ReactECharts option={monthlyChartOption} style={{ height: '320px', width: '100%' }} />
        </div>

        {/* Pie Chart (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>设备电耗占比拆解 (Energy Breakdown)</span>
            </h3>
            <ReactECharts option={pieChartOption} style={{ height: '320px', width: '100%' }} />
          </div>
        </div>

      </div>

      {/* Detailed Sub-item Breakdown Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
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
                <th className="py-2.5 px-3">红字预警状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {subItems.map((item) => {
                const countWarnings = summary.discrepancies.filter(d => d.equipmentName.includes(item.name) || d.message.includes(item.name)).length;
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
                      {item.chwSupplyTemp ?? 7}/{item.chwReturnTemp ?? 12}℃ | {item.hwSupplyTemp ?? 60}/{item.hwReturnTemp ?? 50}℃
                    </td>
                    <td className="py-2.5 px-3">
                      {countWarnings > 0 ? (
                        <span className="text-red-400 font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span>有 {countWarnings} 项预警</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>正常推荐</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
