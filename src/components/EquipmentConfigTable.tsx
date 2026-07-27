import React, { useState } from 'react';
import type { BuildingSubItem, EquipmentCalcResult, UserEquipmentOverrides } from '../types/hvac';
import { calculateEquipmentForSubItem, checkDiscrepancies } from '../hvacEngine/calculator';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { 
  AlertTriangle, CheckCircle, Calculator, Info, RotateCcw, Thermometer, ChevronDown, ChevronUp, Cpu, Flame, Wind, Link2 
} from 'lucide-react';

interface Props {
  subItem: BuildingSubItem;
  allSubItems?: BuildingSubItem[];
  onUpdateSubItem: (item: BuildingSubItem) => void;
}

export const EquipmentConfigTable: React.FC<Props> = ({ subItem, allSubItems = [], onUpdateSubItem }) => {
  const [showFormulas, setShowFormulas] = useState(true);

  // 实时计算当前建筑子项（及共用机房合并负荷）的标准工程推导结果
  const calc: EquipmentCalcResult = calculateEquipmentForSubItem(subItem, allSubItems);
  const discrepancies = checkDiscrepancies(subItem, calc);
  const custom: UserEquipmentOverrides = subItem.customEquipment || {};

  const sysMeta = SYSTEM_TYPES_META[subItem.systemType];

  const handleCustomChange = (key: keyof UserEquipmentOverrides, val: number | undefined) => {
    const newCustom = { ...custom, [key]: val };
    onUpdateSubItem({
      ...subItem,
      customEquipment: newCustom
    });
  };

  const handleResetField = (key: keyof UserEquipmentOverrides) => {
    const newCustom = { ...custom };
    delete newCustom[key];
    onUpdateSubItem({
      ...subItem,
      customEquipment: newCustom
    });
  };

  const handleResetAll = () => {
    onUpdateSubItem({
      ...subItem,
      customEquipment: {}
    });
  };

  const handleWaterTempChange = (key: keyof BuildingSubItem, val: number) => {
    onUpdateSubItem({
      ...subItem,
      [key]: val
    });
  };

  // 如果此建筑勾选了共用集中冷热源机房，提示合并后的总面积与总负荷
  const sharedGroup = subItem.useSharedPlant ? allSubItems.filter(s => s.useSharedPlant && s.systemType === subItem.systemType) : [];
  const isShared = sharedGroup.length > 1;
  const sharedAreaSum = sharedGroup.reduce((acc, curr) => acc + curr.area, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Top Title & System Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 font-bold text-xs rounded-full border border-blue-500/30">
              {subItem.name} ({subItem.area.toLocaleString()} m²)
            </span>
            {isShared && (
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-full border border-indigo-500/30 flex items-center space-x-1">
                <Link2 className="w-3.5 h-3.5" />
                <span>集中共用冷热源合并计算 (总面积: {sharedAreaSum.toLocaleString()} m²)</span>
              </span>
            )}
            <h2 className="text-lg font-bold text-white">空调系统主设备配置与计算校验</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            当前系统：<span className="text-blue-300 font-semibold">{sysMeta.name}</span>。
            {isShared ? `已自动合并共享机房建筑【${sharedGroup.map(g => g.name).join(' + ')}】的总负荷进行主机与水泵选型推导。` : '根据所选系统的真实设备组成展现配比表，可自主修改并触发红字偏差预警！'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span>{showFormulas ? '隐藏工程公式' : '显示工程计算公式'}</span>
            {showFormulas ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {Object.keys(custom).length > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-red-500/40 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>恢复全部推荐配置</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. 水温工况参数自定义填写区 */}
      {(sysMeta.hasChilledWaterPump || sysMeta.hasHotWaterPump || sysMeta.hasCoolingWaterPump) ? (
        <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Thermometer className="w-4 h-4 text-emerald-400" />
              <span>水系统供回水温度工况设置（仅显示当前系统包含的水路）</span>
            </div>
            <span className="text-[11px] text-slate-400">
              * 改变温差将改变水泵流量公式：G = Q × 3.6 / (4.186 × ΔT)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {sysMeta.hasChilledWaterPump && (
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-300 font-semibold">冷冻水/冷水供回水温度</span>
                  <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    ΔT = {calc.deltaTchw} ℃
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">供水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.chwSupplyTemp ?? 7}
                      onChange={(e) => handleWaterTempChange('chwSupplyTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">回水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.chwReturnTemp ?? 12}
                      onChange={(e) => handleWaterTempChange('chwReturnTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {sysMeta.hasCoolingWaterPump && sysMeta.hasCoolingTower && (
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-semibold">冷却水进出水温度</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ΔT = {calc.deltaTcw} ℃
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">进水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.cwSupplyTemp ?? 32}
                      onChange={(e) => handleWaterTempChange('cwSupplyTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">出水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.cwReturnTemp ?? 37}
                      onChange={(e) => handleWaterTempChange('cwReturnTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {sysMeta.hasHotWaterPump && (
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-300 font-semibold">热水供回水温度</span>
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    ΔT = {calc.deltaThw} ℃
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">供水温度 (°C)</label>
                    <input
                      type="number"
                      step="1"
                      value={subItem.hwSupplyTemp ?? 60}
                      onChange={(e) => handleWaterTempChange('hwSupplyTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">回水温度 (°C)</label>
                    <input
                      type="number"
                      step="1"
                      value={subItem.hwReturnTemp ?? 50}
                      onChange={(e) => handleWaterTempChange('hwReturnTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="bg-slate-850/80 border border-purple-500/30 rounded-xl p-4 flex items-center space-x-3 text-xs">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">直接蒸发式系统 (无水温及水泵设置)</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              当前系统为【{sysMeta.name}】，采用氟利昂制冷剂直接蒸发换热，系统无需水泵、冷却水管路及冷却塔。
            </p>
          </div>
        </div>
      )}

      {/* 2. HVAC Engineering Formulas Explanation Card */}
      {showFormulas && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center space-x-2 font-bold text-blue-300">
            <Info className="w-4 h-4 text-blue-400" />
            <span>程序内置空调设备选型工程计算公式手册</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-300 pt-1">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">① 冷水机组/锅炉容量</span>
              <p className="text-[11px] text-slate-400">
                Q_chiller = Area × q_cool × K_sim / 1000 (kW)<br/>
                Q_boiler = Area × q_heat × 1.1 / 1000 (kW)
              </p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">② 水泵流量公式</span>
              <p className="text-[11px] text-slate-400">
                G_chw = Q_chiller × 3.6 / (4.186 × ΔT_chw) (m³/h)<br/>
                G_hw = Q_boiler × 3.6 / (4.186 × ΔT_hw) (m³/h)
              </p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">③ 冷却塔选型</span>
              <p className="text-[11px] text-slate-400">
                Q_cond = Q_chiller × (1 + 1/COP)<br/>
                G_ct = G_cw × 1.15 (仅适用于冷水机组)
              </p>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">④ 水泵电功率</span>
              <p className="text-[11px] text-slate-400">
                P_elec = (ρ × g × G × H) / (3600 × 1000 × η) ≈ (G × H) / 247.7 (kW)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Red Warning Alert Box if user configuration differs */}
      {discrepancies.length > 0 && (
        <div className="bg-red-950/60 border-2 border-red-500 rounded-xl p-4 space-y-3 animate-pulse">
          <div className="flex items-center space-x-2 font-bold text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>【红字警报】检测到 {discrepancies.length} 项设备容量与推荐标准不匹配！</span>
          </div>

          <div className="space-y-2">
            {discrepancies.map((d, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-red-500/40 text-xs">
                <div className="text-red-300 font-semibold space-y-0.5">
                  <p>{d.message}</p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center space-x-3 self-end sm:self-auto">
                  <span className="text-red-400 font-bold text-sm">
                    {d.diffPercent > 0 ? `+${d.diffPercent.toFixed(1)}%` : `${d.diffPercent.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Comprehensive Equipment Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700">
              <th className="py-3 px-4">主要空调设备名称</th>
              <th className="py-3 px-4">核心工程参数</th>
              <th className="py-3 px-4">程序推荐标准计算值</th>
              <th className="py-3 px-4 text-blue-300">用户自定义配置值 (可修改)</th>
              <th className="py-3 px-4">单位</th>
              <th className="py-3 px-4">偏差状态与能耗后果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">

            {/* 1. 冷水机组 */}
            {subItem.systemType === 'chiller_boiler' && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center space-x-2 text-white">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>冷水机组 (螺杆/离心式)</span>
                </td>
                <td className="py-3 px-4 text-slate-300">额定制冷容量 (kW)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.chillerCapacitykW.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.chillerCapacitykW ?? ''}
                    placeholder={calc.chillerCapacitykW.toFixed(1)}
                    onChange={(e) => handleCustomChange('chillerCapacitykW', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.chillerCapacitykW && Math.abs(custom.chillerCapacitykW - calc.chillerCapacitykW) / calc.chillerCapacitykW >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">kW</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.chillerCapacitykW, custom.chillerCapacitykW, () => handleResetField('chillerCapacitykW'))}
                </td>
              </tr>
            )}

            {/* 2. 燃气锅炉 */}
            {subItem.systemType === 'chiller_boiler' && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center space-x-2 text-white">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>燃气热水锅炉</span>
                </td>
                <td className="py-3 px-4 text-slate-300">额定供热容量 (kW)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.boilerCapacitykW.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.boilerCapacitykW ?? ''}
                    placeholder={calc.boilerCapacitykW.toFixed(1)}
                    onChange={(e) => handleCustomChange('boilerCapacitykW', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.boilerCapacitykW && Math.abs(custom.boilerCapacitykW - calc.boilerCapacitykW) / calc.boilerCapacitykW >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">kW</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.boilerCapacitykW, custom.boilerCapacitykW, () => handleResetField('boilerCapacitykW'))}
                </td>
              </tr>
            )}

            {/* 3. 冷水水泵 */}
            {sysMeta.hasChilledWaterPump && calc.chwPumpFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">冷水水泵 (夏季冷水泵)</td>
                <td className="py-3 px-4 text-slate-300">水泵循环流量 (m³/h)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.chwPumpFlow.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.chwPumpFlow ?? ''}
                    placeholder={calc.chwPumpFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('chwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.chwPumpFlow && Math.abs(custom.chwPumpFlow - calc.chwPumpFlow) / calc.chwPumpFlow >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">m³/h</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.chwPumpFlow, custom.chwPumpFlow, () => handleResetField('chwPumpFlow'))}
                </td>
              </tr>
            )}

            {/* 4. 独立热水水泵 */}
            {sysMeta.hasHotWaterPump && calc.hwPumpFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">
                  {subItem.systemType === 'chiller_boiler' ? '锅炉独立热水泵' : '冬季热水循环泵'}
                </td>
                <td className="py-3 px-4 text-slate-300">热水循环流量 (m³/h)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.hwPumpFlow.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.hwPumpFlow ?? ''}
                    placeholder={calc.hwPumpFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('hwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.hwPumpFlow && Math.abs(custom.hwPumpFlow - calc.hwPumpFlow) / calc.hwPumpFlow >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">m³/h</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.hwPumpFlow, custom.hwPumpFlow, () => handleResetField('hwPumpFlow'))}
                </td>
              </tr>
            )}

            {/* 5. 冷却水水泵 */}
            {sysMeta.hasCoolingWaterPump && calc.cwPumpFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">冷却水水泵</td>
                <td className="py-3 px-4 text-slate-300">冷却水流量 (m³/h)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.cwPumpFlow.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.cwPumpFlow ?? ''}
                    placeholder={calc.cwPumpFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('cwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.cwPumpFlow && Math.abs(custom.cwPumpFlow - calc.cwPumpFlow) / calc.cwPumpFlow >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">m³/h</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.cwPumpFlow, custom.cwPumpFlow, () => handleResetField('cwPumpFlow'))}
                </td>
              </tr>
            )}

            {/* 6. 冷却塔 */}
            {sysMeta.hasCoolingTower && calc.coolingTowerFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">冷却塔 (冷却水散热)</td>
                <td className="py-3 px-4 text-slate-300">散热处理水流量 (m³/h)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.coolingTowerFlow.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.coolingTowerFlow ?? ''}
                    placeholder={calc.coolingTowerFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('coolingTowerFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.coolingTowerFlow && Math.abs(custom.coolingTowerFlow - calc.coolingTowerFlow) / calc.coolingTowerFlow >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">m³/h</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.coolingTowerFlow, custom.coolingTowerFlow, () => handleResetField('coolingTowerFlow'))}
                </td>
              </tr>
            )}

            {/* 7. 风冷热泵主机 */}
            {subItem.systemType === 'air_heat_pump' && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">风冷热泵主机模块</td>
                <td className="py-3 px-4 text-slate-300">总制冷容量 (kW)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.achpCoolingkW.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.achpCoolingkW ?? ''}
                    placeholder={calc.achpCoolingkW.toFixed(1)}
                    onChange={(e) => handleCustomChange('achpCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.achpCoolingkW && Math.abs(custom.achpCoolingkW - calc.achpCoolingkW) / calc.achpCoolingkW >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">kW</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.achpCoolingkW, custom.achpCoolingkW, () => handleResetField('achpCoolingkW'))}
                </td>
              </tr>
            )}

            {/* 8. VRF 多联机室外机 */}
            {subItem.systemType === 'vrf' && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">VRF 多联机室外机</td>
                <td className="py-3 px-4 text-slate-300">总制冷容量 (kW)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.vrfCoolingkW.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.vrfCoolingkW ?? ''}
                    placeholder={calc.vrfCoolingkW.toFixed(1)}
                    onChange={(e) => handleCustomChange('vrfCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.vrfCoolingkW && Math.abs(custom.vrfCoolingkW - calc.vrfCoolingkW) / calc.vrfCoolingkW >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">kW</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.vrfCoolingkW, custom.vrfCoolingkW, () => handleResetField('vrfCoolingkW'))}
                </td>
              </tr>
            )}

            {/* 9. 地源热泵 */}
            {subItem.systemType === 'ground_heat_pump' && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3 px-4 font-bold text-white">地源热泵主机</td>
                <td className="py-3 px-4 text-slate-300">额定制冷容量 (kW)</td>
                <td className="py-3 px-4 font-semibold text-slate-400">{calc.gshpCoolingkW.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={custom.gshpCoolingkW ?? ''}
                    placeholder={calc.gshpCoolingkW.toFixed(1)}
                    onChange={(e) => handleCustomChange('gshpCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-32 bg-slate-900 border rounded px-2.5 py-1 font-bold text-xs focus:ring-2 focus:outline-none ${
                      custom.gshpCoolingkW && Math.abs(custom.gshpCoolingkW - calc.gshpCoolingkW) / calc.gshpCoolingkW >= 0.08
                        ? 'text-red-500 border-red-500 focus:ring-red-500 font-extrabold bg-red-950/30'
                        : 'text-white border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-slate-400">kW</td>
                <td className="py-3 px-4">
                  {renderDiscrepancyBadge(calc.gshpCoolingkW, custom.gshpCoolingkW, () => handleResetField('gshpCoolingkW'))}
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

    </div>
  );
};

function renderDiscrepancyBadge(
  calcVal: number,
  userVal: number | undefined,
  onReset: () => void
) {
  if (userVal === undefined || userVal === 0 || calcVal === 0) {
    return (
      <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>匹配标准配置</span>
      </span>
    );
  }

  const diffPercent = ((userVal - calcVal) / calcVal) * 100;
  if (Math.abs(diffPercent) < 8) {
    return (
      <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>在正常合理误差范围内 ({diffPercent > 0 ? `+${diffPercent.toFixed(1)}%` : `${diffPercent.toFixed(1)}%`})</span>
      </span>
    );
  }

  const isOversized = diffPercent > 0;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-red-500 font-extrabold text-xs flex items-center space-x-1 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        <span>
          【红字提醒】{isOversized ? `偏大 +${diffPercent.toFixed(1)}%` : `偏小 ${diffPercent.toFixed(1)}%`}
        </span>
      </span>

      <button
        onClick={onReset}
        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white px-2 py-0.5 rounded border border-slate-700 transition-colors"
        title="恢复推荐计算值"
      >
        恢复推荐
      </button>
    </div>
  );
}
