import React, { useState } from 'react';
import type { BuildingSubItem, EquipmentCalcResult } from '../types/hvac';
import { calculateEquipmentForSubItem } from '../hvacEngine/calculator';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { 
  Sun, Snowflake, Activity, Info, CheckCircle 
} from 'lucide-react';

interface Props {
  subItem: BuildingSubItem;
}

export const InteractiveSystemSchematic: React.FC<Props> = ({ subItem }) => {
  const [seasonMode, setSeasonMode] = useState<'cooling' | 'heating'>('cooling');
  const [selectedNode, setSelectedNode] = useState<string | null>('chiller');

  const calc: EquipmentCalcResult = calculateEquipmentForSubItem(subItem);
  const sysMeta = SYSTEM_TYPES_META[subItem.systemType];

  const custom = subItem.customEquipment || {};

  const effectiveChwFlow = custom.chwPumpFlow || calc.chwPumpFlow;
  const effectiveCwFlow = custom.cwPumpFlow || calc.cwPumpFlow;
  const effectiveHwFlow = custom.hwPumpFlow || calc.hwPumpFlow;
  const effectiveTowerFlow = custom.coolingTowerFlow || calc.coolingTowerFlow;
  const effectiveChillerCap = custom.chillerCapacitykW || calc.chillerCapacitykW;
  const effectiveBoilerCap = custom.boilerCapacitykW || calc.boilerCapacitykW;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Top Header & Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">空调系统标准 CAD 原理拓扑图 (System Schematic Diagram)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            当前展示：<span className="text-emerald-300 font-bold">{subItem.name}</span> — <span className="text-blue-300 font-semibold">{sysMeta.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setSeasonMode('cooling')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                seasonMode === 'cooling'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>夏季供冷工况</span>
            </button>
            <button
              onClick={() => setSeasonMode('heating')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                seasonMode === 'heating'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>冬季供热工况</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Standard CAD Schematic View */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-hidden min-h-[460px] flex items-center justify-center">
        
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 w-full max-w-5xl">
          {renderSystemSVG(subItem.systemType, seasonMode, selectedNode, setSelectedNode, {
            calc,
            effectiveChwFlow,
            effectiveCwFlow,
            effectiveHwFlow,
            effectiveTowerFlow,
            effectiveChillerCap,
            effectiveBoilerCap
          })}
        </div>

      </div>

      {/* Bottom Selected Equipment Inspector Drawer */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              设备节点诊断：<span className="text-blue-300">{getNodeTitle(selectedNode)}</span>
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              点击上方原理图设备查看选型容量、管路水温与设计流量
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-750">
          <div>
            <span className="text-[10px] text-slate-400 block">设计容量/流量</span>
            <span className="font-bold text-white text-xs">
              {getNodeValue(selectedNode, calc, effectiveChwFlow, effectiveCwFlow, effectiveHwFlow, effectiveTowerFlow, effectiveChillerCap, effectiveBoilerCap)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">供水/进水温度</span>
            <span className="font-bold text-blue-400 text-xs">
              {getNodeSupplyTemp(selectedNode, subItem, seasonMode)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">回水/出水温度</span>
            <span className="font-bold text-rose-400 text-xs">
              {getNodeReturnTemp(selectedNode, subItem, seasonMode)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">选型校验状态</span>
            <span className="font-bold text-emerald-400 text-xs flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>运行正常</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

function renderSystemSVG(
  systemType: string,
  season: 'cooling' | 'heating',
  selectedNode: string | null,
  setSelectedNode: (n: string) => void,
  data: any
) {
  const isCooling = season === 'cooling';

  // 1. 冷水机组 + 燃气锅炉系统 (冷却塔与冷却水泵置于冷水机组左侧)
  if (systemType === 'chiller_boiler' || systemType === 'hybrid') {
    return (
      <svg viewBox="0 0 960 450" className="w-full h-auto">
        <defs>
          <linearGradient id="chillerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="boilerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="towerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* 箭头标记 */}
          <marker id="arrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>
          <marker id="arrowRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
          </marker>
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
          </marker>
        </defs>

        {/* --- 夏季供冷工况管线 --- */}
        {isCooling && (
          <g>
            {/* 冷却水回路 (位于冷水机组左侧): 机组左侧(x=260, y=120) -> 冷却水泵(x=170) -> 冷却塔(x=50, y=40) */}
            <path d="M 260 120 L 170 120 L 170 65 L 150 65" fill="none" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowRed)" />
            <text x="145" y="85" fill="#f87171" fontSize="10" fontWeight="bold">37℃ 冷却水回</text>

            <path d="M 150 90 L 170 90 L 170 160 L 260 160" fill="none" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowGreen)" />
            <text x="145" y="145" fill="#34d399" fontSize="10" fontWeight="bold">32℃ 冷却水供</text>

            {/* 冷水供水管 (实线 Solid, 接入末端下部右侧 x=840, y=260) */}
            <path d="M 410 140 L 840 140 L 840 260" fill="none" stroke="#3b82f6" strokeWidth="4" markerEnd="url(#arrowBlue)" />
            <text x="560" y="132" fill="#60a5fa" fontSize="12" fontWeight="bold">
              7℃ 冷冻水供水管 (Solid Line)
            </text>

            {/* 冷水回水管 (虚线 Dashed, 从末端下部左侧 x=780, y=260 出发 -> 90° 转角接回机组底部) */}
            <path d="M 780 260 L 780 290 L 335 290 L 335 180" fill="none" stroke="#60a5fa" strokeWidth="3" strokeDasharray="8 4" markerEnd="url(#arrowBlue)" />
            <text x="560" y="282" fill="#93c5fd" fontSize="12" fontWeight="bold">
              12℃ 冷冻水回水管 (Dashed Line)
            </text>
          </g>
        )}

        {/* --- 冬季供热工况管线 --- */}
        {!isCooling && (
          <g>
            {/* 锅炉热水供水管 (实线 Solid, 从锅炉 x=410, y=320 直线出发 -> 水泵 x=550 -> 接入末端下部右侧 x=840, y=260) */}
            <path d="M 410 320 L 840 320 L 840 260" fill="none" stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrowRed)" />
            <text x="560" y="312" fill="#fca5a5" fontSize="12" fontWeight="bold">
              60℃ 锅炉热水供水管 (Solid Line)
            </text>

            {/* 锅炉热水回水管 (虚线 Dashed, 从末端下部左侧 x=780, y=260 出发 -> 走直线加 90° 转角: 下至 y=390 -> 左至 x=335 -> 上接锅炉底 y=360) */}
            <path d="M 780 260 L 780 390 L 335 390 L 335 360" fill="none" stroke="#f87171" strokeWidth="3" strokeDasharray="8 4" markerEnd="url(#arrowRed)" />
            <text x="560" y="382" fill="#fca5a5" fontSize="12" fontWeight="bold">
              50℃ 锅炉热水回水管 (Dashed Line 90°转角)
            </text>
          </g>
        )}

        {/* 设备 1: 冷却塔 & 冷却水泵 (位于冷水机组左侧 x=30~170) */}
        {isCooling && (
          <>
            <g onClick={() => setSelectedNode('coolingTower')} className="cursor-pointer">
              <rect x="30" y="40" width="120" height="65" rx="12" fill="url(#towerGrad)" stroke={selectedNode === 'coolingTower' ? '#34d399' : '#065f46'} strokeWidth="3" />
              <text x="90" y="70" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">冷却塔 (左侧)</text>
              <text x="90" y="88" fill="#a7f3d0" fontSize="10" textAnchor="middle">{data.effectiveTowerFlow.toFixed(0)} m³/h</text>
            </g>
            <g onClick={() => setSelectedNode('cwPump')} className="cursor-pointer">
              <circle cx="170" cy="120" r="18" fill="#1e293b" stroke="#10b981" strokeWidth="3" />
              <text x="170" y="124" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">冷却泵</text>
            </g>
          </>
        )}

        {/* 设备 2: 冷水机组 (居中位置 x=260) */}
        <g onClick={() => setSelectedNode('chiller')} className={`cursor-pointer ${!isCooling ? 'opacity-40' : ''}`}>
          <rect x="260" y="100" width="150" height="80" rx="12" fill="url(#chillerGrad)" stroke={selectedNode === 'chiller' ? '#60a5fa' : '#1e40af'} strokeWidth="3" />
          <text x="335" y="135" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">冷水机组 (Chiller)</text>
          <text x="335" y="155" fill="#93c5fd" fontSize="11" textAnchor="middle">{data.effectiveChillerCap.toFixed(0)} kW</text>
        </g>

        {/* 设备 3: 冷水水泵 (直接绘制在冷水供水管线 x=550, y=140 上) */}
        {isCooling && (
          <g onClick={() => setSelectedNode('chwPump')} className="cursor-pointer">
            <circle cx="550" cy="140" r="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="3" />
            <text x="550" y="144" fill="#60a5fa" fontSize="10" fontWeight="bold" textAnchor="middle">冷水泵</text>
          </g>
        )}

        {/* 设备 4: 燃气锅炉 */}
        <g onClick={() => setSelectedNode('boiler')} className={`cursor-pointer ${isCooling ? 'opacity-40' : ''}`}>
          <rect x="260" y="280" width="150" height="80" rx="12" fill="url(#boilerGrad)" stroke={selectedNode === 'boiler' ? '#f87171' : '#991b1b'} strokeWidth="3" />
          <text x="335" y="315" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">燃气锅炉 (Boiler)</text>
          <text x="335" y="335" fill="#fca5a5" fontSize="11" textAnchor="middle">{data.effectiveBoilerCap.toFixed(0)} kW</text>
        </g>

        {/* 设备 5: 独立热水水泵 (直接绘制在锅炉热水供水管线 x=550, y=320 上) */}
        {!isCooling && (
          <g onClick={() => setSelectedNode('hwPump')} className="cursor-pointer">
            <circle cx="550" cy="320" r="20" fill="#1e293b" stroke="#ef4444" strokeWidth="3" />
            <text x="550" y="324" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">热水泵</text>
          </g>
        )}

        {/* 设备 6: 空调末端 (AHU/FCU) */}
        <g onClick={() => setSelectedNode('terminal')} className="cursor-pointer">
          <rect x="740" y="140" width="150" height="120" rx="14" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
          <text x="815" y="185" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">空调末端 (AHU/FCU)</text>
          <text x="815" y="210" fill="#cbd5e1" fontSize="11" textAnchor="middle">室内维持 {isCooling ? '26℃ 供冷' : '20℃ 供热'}</text>
          <circle cx="840" cy="260" r="4" fill="#ef4444" />
          <circle cx="780" cy="260" r="4" fill="#60a5fa" />
        </g>

      </svg>
    );
  }

  // 2. 多联机 VRF 系统 (一根主管分多歧管连接多台室内机)
  if (systemType === 'vrf') {
    return (
      <svg viewBox="0 0 960 400" className="w-full h-auto">
        {/* VRF 室外主机 */}
        <rect x="140" y="130" width="170" height="140" rx="16" fill="#7c3aed" stroke="#a78bfa" strokeWidth="3" />
        <text x="225" y="180" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">VRF 多联机室外主机</text>
        <text x="225" y="205" fill="#ddd6fe" fontSize="12" textAnchor="middle">变频气液双管 (DX系统)</text>

        {/* 主冷媒气/液管 (一根主管从主机 x=310 出发延伸至歧管分配点 x=540) */}
        <path d="M 310 170 L 540 170" fill="none" stroke="#a78bfa" strokeWidth="5" />
        <path d="M 310 210 L 540 210" fill="none" stroke="#c084fc" strokeWidth="3" strokeDasharray="6 4" />
        <text x="420" y="160" fill="#c084fc" fontSize="12" fontWeight="bold">冷媒气主管 (Main Gas Line)</text>
        <text x="420" y="230" fill="#ddd6fe" fontSize="11">冷媒液主管 (Main Liquid Line)</text>

        {/* 分支歧管 / 分流器节点 (Disconnector / Y-Joint) */}
        <circle cx="540" cy="170" r="8" fill="#7c3aed" stroke="#ffffff" strokeWidth="2" />
        <circle cx="540" cy="210" r="6" fill="#a78bfa" stroke="#ffffff" strokeWidth="2" />
        <text x="540" y="145" fill="#a78bfa" fontSize="10" fontWeight="bold" textAnchor="middle">分流歧管器</text>

        {/* 从主管分支引出 3 根支管分别接入 3 台室内机 */}
        <path d="M 540 170 L 580 170 L 580 80 L 740 80" fill="none" stroke="#a78bfa" strokeWidth="3" />
        <path d="M 540 170 L 740 170" fill="none" stroke="#a78bfa" strokeWidth="3" />
        <path d="M 540 170 L 580 170 L 580 260 L 740 260" fill="none" stroke="#a78bfa" strokeWidth="3" />

        {/* 3 台多联机室内机 */}
        <g onClick={() => setSelectedNode('terminal')}>
          <rect x="740" y="50" width="160" height="60" rx="10" fill="#334155" stroke="#a78bfa" strokeWidth="2" />
          <text x="820" y="85" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">VRF 室内机 A (高档客房)</text>
        </g>

        <g onClick={() => setSelectedNode('terminal')}>
          <rect x="740" y="140" width="160" height="60" rx="10" fill="#334155" stroke="#a78bfa" strokeWidth="2" />
          <text x="820" y="175" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">VRF 室内机 B (行政办公区)</text>
        </g>

        <g onClick={() => setSelectedNode('terminal')}>
          <rect x="740" y="230" width="160" height="60" rx="10" fill="#334155" stroke="#a78bfa" strokeWidth="2" />
          <text x="820" y="265" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">VRF 室内机 C (公共大堂区)</text>
        </g>
      </svg>
    );
  }

  // 3. 风冷热泵系统
  if (systemType === 'air_heat_pump') {
    return (
      <svg viewBox="0 0 960 400" className="w-full h-auto">
        <defs>
          <marker id="arrowBlue2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
          <marker id="arrowRose2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
          </marker>
        </defs>

        <rect x="180" y="120" width="180" height="140" rx="16" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
        <text x="270" y="170" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">风冷热泵室外主机</text>
        <text x="270" y="195" fill="#bae6fd" fontSize="12" textAnchor="middle">夏供冷 / 冬供热 (无冷却塔)</text>

        {isCooling ? (
          <g>
            <path d="M 360 160 L 840 160 L 840 250" fill="none" stroke="#38bdf8" strokeWidth="4" markerEnd="url(#arrowBlue2)" />
            <text x="600" y="152" fill="#38bdf8" fontSize="12" fontWeight="bold">7℃ 夏季冷冻水供水 (Solid)</text>

            <g onClick={() => setSelectedNode('chwPump')} className="cursor-pointer">
              <circle cx="520" cy="160" r="22" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
              <text x="520" y="164" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">夏季冷水泵</text>
            </g>

            <path d="M 780 250 L 780 290 L 270 290 L 270 260" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="8 4" markerEnd="url(#arrowBlue2)" />
            <text x="600" y="282" fill="#bae6fd" fontSize="12" fontWeight="bold">12℃ 夏季冷水回水 (Dashed 90°转角)</text>
          </g>
        ) : (
          <g>
            <path d="M 360 210 L 840 210 L 840 250" fill="none" stroke="#f43f5e" strokeWidth="4" markerEnd="url(#arrowRose2)" />
            <text x="600" y="202" fill="#f43f5e" fontSize="12" fontWeight="bold">45℃ 冬季热水供水 (Solid)</text>

            <g onClick={() => setSelectedNode('hwPump')} className="cursor-pointer">
              <circle cx="520" cy="210" r="22" fill="#1e293b" stroke="#f43f5e" strokeWidth="3" />
              <text x="520" y="214" fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">冬季热水泵</text>
            </g>

            <path d="M 780 250 L 780 320 L 270 320 L 270 260" fill="none" stroke="#e11d48" strokeWidth="3" strokeDasharray="8 4" markerEnd="url(#arrowRose2)" />
            <text x="600" y="312" fill="#fca5a5" fontSize="12" fontWeight="bold">40℃ 冬季热水回水 (Dashed 90°转角)</text>
          </g>
        )}

        <g onClick={() => setSelectedNode('terminal')} className="cursor-pointer">
          <rect x="740" y="130" width="150" height="120" rx="14" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
          <text x="815" y="175" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">末端风机盘管 (FCU)</text>
          <text x="815" y="200" fill="#cbd5e1" fontSize="11" textAnchor="middle">室内维持 {isCooling ? '26℃' : '20℃'}</text>
          <circle cx="840" cy="250" r="4" fill="#ef4444" />
          <circle cx="780" cy="250" r="4" fill="#60a5fa" />
        </g>
      </svg>
    );
  }

  // 4. 区域能源站系统
  if (systemType === 'district_energy') {
    return (
      <svg viewBox="0 0 960 360" className="w-full h-auto">
        <rect x="180" y="110" width="160" height="120" rx="14" fill="#0891b2" stroke="#22d3ee" strokeWidth="3" />
        <text x="260" y="155" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">板式换热器 (HEX)</text>
        <text x="260" y="180" fill="#cff4fc" fontSize="11" textAnchor="middle">区域集中冷/热源换热</text>

        <path d="M 340 140 L 840 140 L 840 240" fill="none" stroke="#06b6d4" strokeWidth="4" />
        <path d="M 780 240 L 780 280 L 260 280 L 260 230" fill="none" stroke="#0891b2" strokeWidth="3" strokeDasharray="8 4" />

        <circle cx="520" cy="140" r="20" fill="#1e293b" stroke="#22d3ee" strokeWidth="3" />
        <text x="520" y="144" fill="#22d3ee" fontSize="10" fontWeight="bold" textAnchor="middle">二次泵</text>

        <rect x="740" y="120" width="150" height="120" rx="14" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
        <text x="815" y="170" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">建筑空调末端</text>
        <circle cx="840" cy="240" r="4" fill="#ef4444" />
        <circle cx="780" cy="240" r="4" fill="#60a5fa" />
      </svg>
    );
  }

  return (
    <div className="text-center py-12 text-slate-400">
      <Activity className="w-12 h-12 mx-auto text-blue-400 mb-3 animate-bounce" />
      <p className="text-sm font-bold text-white">系统拓扑图加载中...</p>
    </div>
  );
}

function getNodeTitle(nodeId: string | null) {
  switch (nodeId) {
    case 'chiller': return '冷水机组 (Chiller)';
    case 'boiler': return '燃气锅炉 (Boiler)';
    case 'coolingTower': return '冷却塔 (Cooling Tower)';
    case 'chwPump': return '冷水水泵 (夏季冷水泵)';
    case 'hwPump': return '热水水泵 (独立热水泵)';
    case 'cwPump': return '冷却水水泵 (Cooling Water Pump)';
    case 'terminal': return '末端空调设备 (AHU/FCU Terminals)';
    default: return '中央空调主设备';
  }
}

function getNodeValue(
  nodeId: string | null,
  calc: EquipmentCalcResult,
  chwFlow: number,
  cwFlow: number,
  hwFlow: number,
  towerFlow: number,
  chillerCap: number,
  boilerCap: number
) {
  switch (nodeId) {
    case 'chiller': return `${chillerCap.toFixed(1)} kW (COP: ${calc.chillerCOP})`;
    case 'boiler': return `${boilerCap.toFixed(1)} kW (效率: 92%)`;
    case 'coolingTower': return `${towerFlow.toFixed(1)} m³/h`;
    case 'chwPump': return `${chwFlow.toFixed(1)} m³/h (扬程: 28m)`;
    case 'hwPump': return `${hwFlow.toFixed(1)} m³/h (扬程: 22m)`;
    case 'cwPump': return `${cwFlow.toFixed(1)} m³/h (扬程: 24m)`;
    case 'terminal': return `设计总冷量: ${calc.coolingLoadkW.toFixed(1)} kW`;
    default: return '100% 正常运行';
  }
}

function getNodeSupplyTemp(nodeId: string | null, subItem: BuildingSubItem, season: 'cooling' | 'heating') {
  if (season === 'heating') return `${subItem.hwSupplyTemp ?? 60} °C`;
  if (nodeId === 'cwPump' || nodeId === 'coolingTower') return `${subItem.cwSupplyTemp ?? 32} °C`;
  return `${subItem.chwSupplyTemp ?? 7} °C`;
}

function getNodeReturnTemp(nodeId: string | null, subItem: BuildingSubItem, season: 'cooling' | 'heating') {
  if (season === 'heating') return `${subItem.hwReturnTemp ?? 50} °C`;
  if (nodeId === 'cwPump' || nodeId === 'coolingTower') return `${subItem.cwReturnTemp ?? 37} °C`;
  return `${subItem.chwReturnTemp ?? 12} °C`;
}
