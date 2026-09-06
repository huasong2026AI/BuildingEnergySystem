import React, { useState } from 'react';
import type { BuildingSubItem, EquipmentCalcResult, UserEquipmentOverrides } from '../types/hvac';
import { calculateEquipmentForSubItem, checkDiscrepancies } from '../hvacEngine/calculator';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { EquipmentCatalogModal } from './EquipmentCatalogModal';
import { CATEGORY_BRANDS } from '../data/equipmentCatalog';
import type { EquipmentCategory, CatalogEquipmentItem } from '../data/equipmentCatalog';
import { 
  AlertTriangle, CheckCircle, RotateCcw, Cpu, Flame, Wind, Link2, Layers2, Thermometer
} from 'lucide-react';

interface Props {
  subItem: BuildingSubItem;
  allSubItems?: BuildingSubItem[];
  onUpdateSubItem: (item: BuildingSubItem) => void;
}

export const EquipmentConfigTable: React.FC<Props> = ({ subItem, allSubItems = [], onUpdateSubItem }) => {

  // 品牌选型模态框状态
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

  const calc: EquipmentCalcResult = calculateEquipmentForSubItem(subItem, allSubItems);
  const discrepancies = checkDiscrepancies(subItem, calc);
  const custom: UserEquipmentOverrides = subItem.customEquipment || {};

  const sysMeta = SYSTEM_TYPES_META[subItem.systemType];
  const isAchp = subItem.systemType === 'air_heat_pump';

  const handleCustomChange = (key: keyof UserEquipmentOverrides, val: any) => {
    const newCustom = { ...custom, [key]: val };

    // 一机对一泵，一泵对一塔，一锅炉对一热水泵：手动修改主机/锅炉/换热器台数时自动同步联动
    if (key === 'chillerCount') {
      newCustom.chwPumpCount = val;
      newCustom.cwPumpCount = val;
      newCustom.coolingTowerCount = val;
    } else if (key === 'boilerCount') {
      newCustom.hwPumpCount = val;
    } else if (key === 'achpCount') {
      newCustom.chwPumpCount = val;
      newCustom.hwPumpCount = val;
    } else if (key === 'districtHexCount') {
      newCustom.chwPumpCount = val;
      newCustom.hwPumpCount = val;
    }

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
    const newCustom = { ...custom };
    // 水温发生微调变更时，清除该泵/塔固定的用户静态覆盖量，使流量严格随新温差动态重新计算
    if (key === 'chwSupplyTemp' || key === 'chwReturnTemp') {
      delete newCustom.chwPumpFlow;
      delete newCustom.selectedChwPumpProduct;
    } else if (key === 'cwSupplyTemp' || key === 'cwReturnTemp') {
      delete newCustom.cwPumpFlow;
      delete newCustom.coolingTowerFlow;
      delete newCustom.selectedCwPumpProduct;
      delete newCustom.selectedTowerProduct;
    } else if (key === 'hwSupplyTemp' || key === 'hwReturnTemp') {
      delete newCustom.hwPumpFlow;
      delete newCustom.selectedHwPumpProduct;
    }

    onUpdateSubItem({
      ...subItem,
      [key]: val,
      customEquipment: newCustom
    });
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
      copOrEff: item.copOrEff,
      gasFlowm3h: item.gasFlowm3h
    };

    const newCustom = { ...custom, [overrideKey]: selectedProd };

    if (catalogModalState.category === 'chiller' || catalogModalState.category === 'magnetic_chiller') {
      const count = custom.chillerCount || calc.chillerCount;
      newCustom.chillerCapacitykW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'boiler' || catalogModalState.category === 'vacuum_boiler') {
      const count = custom.boilerCount || calc.boilerCount;
      newCustom.boilerCapacitykW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'achp') {
      const count = custom.achpCount || calc.achpCount;
      newCustom.achpCount = count;
      newCustom.achpCoolingkW = item.ratedCapacitykW * count;
      newCustom.chwPumpCount = count;
      newCustom.hwPumpCount = count;
    } else if (catalogModalState.category === 'vrf') {
      const count = custom.vrfCount || calc.vrfCount;
      newCustom.vrfCoolingkW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'plate_hex') {
      const count = custom.districtHexCount || calc.districtHexCount || 2;
      newCustom.districtHexCapacitykW = item.ratedCapacitykW * count;
      newCustom.chwPumpCount = count;
      newCustom.hwPumpCount = count;
    } else if (catalogModalState.category === 'split_ac') {
      const count = custom.splitCount || calc.splitCount || 10;
      newCustom.splitTotalCapacitykW = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedChwPumpProduct') {
      const count = custom.chwPumpCount || calc.chwPumpCount;
      newCustom.chwPumpFlow = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedCwPumpProduct') {
      const count = custom.cwPumpCount || calc.cwPumpCount;
      newCustom.cwPumpFlow = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedHwPumpProduct') {
      const count = custom.hwPumpCount || calc.hwPumpCount;
      newCustom.hwPumpFlow = item.ratedCapacitykW * count;
    } else if (overrideKey === 'selectedTowerProduct') {
      const count = custom.coolingTowerCount || calc.coolingTowerCount;
      newCustom.coolingTowerFlow = item.ratedCapacitykW * count;
    }

    onUpdateSubItem({
      ...subItem,
      customEquipment: newCustom
    });
  };

  const sharedGroup = subItem.useSharedPlant ? allSubItems.filter(s => s.useSharedPlant && s.systemType === subItem.systemType) : [];
  const isShared = sharedGroup.length > 1;
  const sharedAreaSum = sharedGroup.reduce((acc, curr) => acc + curr.area, 0);

  // 实际配比率标签渲染辅助函数 (实际选型总值 ÷ 推荐标准联动值)
  const renderRatioBadge = (configured: number, recommended: number) => {
    if (recommended <= 0) return <span className="text-slate-500">-</span>;
    const ratio = (configured / recommended) * 100;
    let colorCls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (ratio < 95 || ratio > 115) {
      colorCls = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    } else if (ratio > 105) {
      colorCls = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorCls} inline-flex items-center shadow-sm`}>
        {ratio.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* 品牌选型模态框 */}
      <EquipmentCatalogModal
        isOpen={catalogModalState.isOpen}
        onClose={() => setCatalogModalState(prev => ({ ...prev, isOpen: false }))}
        category={catalogModalState.category}
        categoryTitle={catalogModalState.categoryTitle}
        targetSingleValue={catalogModalState.targetSingleValue}
        selectedCatalogId={(custom[catalogModalState.overrideKey] as any)?.catalogId}
        onSelectProduct={handleSelectCatalogItem}
      />

      {/* Top Title & System Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-3.5 py-1 bg-blue-500/20 text-blue-300 font-bold text-sm rounded-full border border-blue-500/30">
              {subItem.name} ({subItem.area.toLocaleString()} m²)
            </span>
            {isShared && (
              <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-sm rounded-full border border-indigo-500/30 flex items-center space-x-1">
                <Link2 className="w-4 h-4" />
                <span>集中共用冷热源合并计算 (总面积: {sharedAreaSum.toLocaleString()} m²)</span>
              </span>
            )}
            {subItem.systemType === 'hybrid' && (
              <span className="px-3.5 py-1 bg-purple-500/20 text-purple-300 font-bold text-sm rounded-full border border-purple-500/30 flex items-center space-x-1">
                <Layers2 className="w-4 h-4" />
                <span>复合空调系统组合</span>
              </span>
            )}
            <h2 className="text-xl font-bold text-white">2. 设备自动配置与工况选型精算</h2>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            当前系统：<span className="text-blue-300 font-semibold">{sysMeta.name}</span>。
            集成各品类顶级市场品牌全系列规格库，设备电耗基于选定规格铭牌真实电功率精算！
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {Object.keys(custom).length > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-200 hover:text-red-300 rounded-xl text-sm font-medium border border-slate-700 hover:border-red-500/40 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>恢复标准推荐配置</span>
            </button>
          )}
        </div>
      </div>

      {/* Hybrid System Allocation Indicator */}
      {subItem.systemType === 'hybrid' && (
        <div className="bg-slate-850 border border-purple-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
            <span className="flex items-center space-x-1">
              <Layers2 className="w-4 h-4" />
              <span>复合系统子项负荷分流比例</span>
            </span>
            <span>
              冷水机组+锅炉系统 60% | VRF多联机系统 40%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: '60%' }} title="冷水机组+锅炉 60%" />
            <div className="bg-purple-500 h-full" style={{ width: '40%' }} title="VRF多联机 40%" />
          </div>
          <p className="text-xs text-slate-400">
            根据建筑复合分区（裙房/公区采用水系统冷机，塔楼/办公采用氟系统VRF），负荷分别进入对应机型计算，下表展示各子系统配置。
          </p>
        </div>
      )}

      {/* Water Temperature & Condition Form Inputs (Only for Water-based Systems) */}
      {(sysMeta.hasChilledWaterPump || sysMeta.hasHotWaterPump || sysMeta.hasCoolingWaterPump) && (
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-blue-400" />
            <span>设计水温工况与系统温差调整 (最小步长 0.5°C，改变水温将自动联动推算水泵流量)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* CHW Temp */}
            {sysMeta.hasChilledWaterPump && (
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-750 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">冷冻水供回水温度</span>
                  <span className="text-[11px] text-slate-400">当前设计温差 ΔT_chw = {calc.deltaTchw.toFixed(1)} ℃</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    step="0.5"
                    value={subItem.chwSupplyTemp ?? 7}
                    onChange={e => handleWaterTempChange('chwSupplyTemp', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-blue-400 focus:outline-none"
                  />
                  <span className="text-slate-500">/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={subItem.chwReturnTemp ?? 12}
                    onChange={e => handleWaterTempChange('chwReturnTemp', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-blue-400 focus:outline-none"
                  />
                  <span className="text-slate-400">℃</span>
                </div>
              </div>
            )}

            {/* HW Temp */}
            {sysMeta.hasHotWaterPump && (
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-750 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">热水供回水温度</span>
                  <span className="text-[11px] text-slate-400">当前设计温差 ΔT_hw = {calc.deltaThw.toFixed(1)} ℃</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    step="0.5"
                    value={subItem.hwSupplyTemp ?? (isAchp ? 45 : 60)}
                    onChange={e => handleWaterTempChange('hwSupplyTemp', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-rose-400 focus:outline-none"
                  />
                  <span className="text-slate-500">/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={subItem.hwReturnTemp ?? (isAchp ? 40 : 50)}
                    onChange={e => handleWaterTempChange('hwReturnTemp', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-rose-400 focus:outline-none"
                  />
                  <span className="text-slate-400">℃</span>
                </div>
              </div>
            )}

            {/* CW Temp */}
            {sysMeta.hasCoolingWaterPump && sysMeta.hasCoolingTower && (
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-750 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">冷却水进出水温度</span>
                  <span className="text-[11px] text-slate-400">当前设计温差 ΔT_cw = {calc.deltaTcw.toFixed(1)} ℃</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    step="0.5"
                    value={subItem.cwSupplyTemp ?? 32}
                    onChange={e => handleWaterTempChange('cwSupplyTemp', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-emerald-400 focus:outline-none"
                  />
                  <span className="text-slate-500">/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={subItem.cwReturnTemp ?? 37}
                    onChange={e => handleWaterTempChange('cwReturnTemp', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-emerald-400 focus:outline-none"
                  />
                  <span className="text-slate-400">℃</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Equipment Selection & Warning Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700">
              <th className="py-3 px-3">主要空调设备名称</th>
              <th className="py-3 px-3">实际市场品牌与型号选型库</th>
              <th className="py-3 px-3 text-blue-300" title="主机为客观设计负荷计算值(不随选型改变)，配件为主机实际选型联动标准值">
                负荷计算值 / 标准联动值
              </th>
              <th className="py-3 px-3">配置台数 (台)</th>
              <th className="py-3 px-3 text-emerald-300">折算单台容量/流量</th>
              <th className="py-3 px-3">配置总值 (用户微调)</th>
              <th className="py-3 px-3 text-cyan-300" title="实际配比率 = 主机配置总值 ÷ 负荷计算值 (仅主机核算)">
                实际配比率 (仅主机)
              </th>
              <th className="py-3 px-3 text-amber-300">单台铭牌真实电量/气耗</th>
              <th className="py-3 px-3">可行性状态与恢复</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            
            {/* 1. 冷水机组 (Chillers) */}
            {(subItem.systemType === 'chiller_boiler' || subItem.systemType === 'hybrid') && (() => {
              const count = custom.chillerCount || calc.chillerCount;
              const configuredCap = custom.selectedChillerProduct 
                ? custom.selectedChillerProduct.ratedCapacitykW * count 
                : (custom.chillerCapacitykW || calc.chillerCapacitykW);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span>冷水机组 (螺杆/离心/磁悬浮)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('chiller', '冷水机组 (含磁悬浮机组)', configuredCap / count, 'selectedChillerProduct')}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-bold rounded-lg border border-blue-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedChillerProduct ? custom.selectedChillerProduct.name : `从品牌库选型 (${CATEGORY_BRANDS.chiller}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingLoadkW.toFixed(1)} kW</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('chillerCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredCap / count).toFixed(1)} kW/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredCap.toFixed(1)} kW
                  </td>
                  <td className="py-3 px-3">
                    {renderRatioBadge(configuredCap, calc.coolingLoadkW)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedChillerProduct ? `${custom.selectedChillerProduct.actualPowerkW} kW (铭牌)` : `${(calc.chillerPowerkW / count).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    {discrepancies.some(d => d.paramName.includes('冷水机组')) ? (
                      <span className="text-red-400 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>偏离警告</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>匹配标准推荐</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })()}

            {/* 2. 燃气热水锅炉 (Boiler) */}
            {(subItem.systemType === 'chiller_boiler' || subItem.systemType === 'hybrid') && (() => {
              const count = custom.boilerCount || calc.boilerCount;
              const configuredCap = custom.selectedBoilerProduct 
                ? custom.selectedBoilerProduct.ratedCapacitykW * count 
                : (custom.boilerCapacitykW || calc.boilerCapacitykW);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>超低氮冷凝真空热水机组 (锅炉)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('boiler', '全预混冷凝真空热水机组', configuredCap / count, 'selectedBoilerProduct')}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg border border-rose-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedBoilerProduct ? custom.selectedBoilerProduct.name : `从品牌库选真空机组 (${CATEGORY_BRANDS.boiler}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.heatingLoadkW.toFixed(1)} kW</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('boilerCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredCap / count).toFixed(1)} kW/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredCap.toFixed(1)} kW
                  </td>
                  <td className="py-3 px-3">
                    {renderRatioBadge(configuredCap, calc.heatingLoadkW)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedBoilerProduct ? `${custom.selectedBoilerProduct.gasFlowm3h || '-'} m³/h` : `${(calc.boilerGasFlow / count).toFixed(1)} m³/h (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>匹配标准推荐</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 3. 多联机室外主机 (VRF) */}
            {(subItem.systemType === 'vrf' || (subItem.systemType === 'hybrid' && calc.vrfCoolingkW > 0)) && (() => {
              const count = custom.vrfCount || calc.vrfCount;
              const configuredCap = custom.selectedVrfProduct 
                ? custom.selectedVrfProduct.ratedCapacitykW * count 
                : (custom.vrfCoolingkW || calc.vrfCoolingkW);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>多联机室外主机 (VRF)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('vrf', 'VRF多联机', configuredCap / count, 'selectedVrfProduct')}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 font-bold rounded-lg border border-purple-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedVrfProduct ? custom.selectedVrfProduct.name : `从品牌库选多联机 (${CATEGORY_BRANDS.vrf}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingLoadkW.toFixed(1)} kW</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('vrfCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredCap / count).toFixed(1)} kW/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredCap.toFixed(1)} kW
                  </td>
                  <td className="py-3 px-3">
                    {renderRatioBadge(configuredCap, calc.coolingLoadkW)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedVrfProduct ? `${custom.selectedVrfProduct.actualPowerkW} kW (铭牌)` : `${(calc.vrfPowerkW / Math.max(1, count)).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>匹配标准推荐</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 4. 风冷热泵模块主机 (ACHP) */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpCoolingkW > 0)) && (() => {
              const count = custom.achpCount || calc.achpCount;
              const configuredCap = custom.selectedAchpProduct 
                ? custom.selectedAchpProduct.ratedCapacitykW * count 
                : (custom.achpCoolingkW || calc.achpCoolingkW);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-emerald-400" />
                    <span>风冷热泵模块主机 (ACHP)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('achp', '风冷热泵模块', configuredCap / count, 'selectedAchpProduct')}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedAchpProduct ? custom.selectedAchpProduct.name : `从品牌库选风冷热泵 (${CATEGORY_BRANDS.achp}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingLoadkW.toFixed(1)} kW</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('achpCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredCap / count).toFixed(1)} kW/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredCap.toFixed(1)} kW
                  </td>
                  <td className="py-3 px-3">
                    {renderRatioBadge(configuredCap, calc.coolingLoadkW)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedAchpProduct ? `${custom.selectedAchpProduct.actualPowerkW} kW (铭牌)` : `${(calc.achpPowerkW / Math.max(1, count)).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>匹配标准推荐</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 4.1 风冷热泵-夏季冷水泵 */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpCoolingkW > 0)) && (() => {
              const count = custom.achpCount || calc.achpCount;
              const pumpCount = count > 0 ? count : 1;
              const configuredFlow = custom.selectedChwPumpProduct 
                ? custom.selectedChwPumpProduct.ratedCapacitykW * pumpCount 
                : (custom.chwPumpFlow || calc.achpChwPumpFlow);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    <span>风冷热泵-夏季冷水泵</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('pump', '风冷热泵冷水泵', configuredFlow / pumpCount, 'selectedChwPumpProduct')}
                      className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedChwPumpProduct ? custom.selectedChwPumpProduct.name : `从品牌库选水泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.achpChwPumpFlow.toFixed(1)} m³/h</td>
                  <td className="py-3 px-3 font-bold text-white text-center">
                    {pumpCount} (1机对1泵)
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredFlow / pumpCount).toFixed(1)} m³/h/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredFlow.toFixed(1)} m³/h
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500 font-mono text-center block">-</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedChwPumpProduct ? `${custom.selectedChwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.achpSummerPumpPowerkW / pumpCount).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>温差联动合理选型</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 4.2 风冷热泵-冬季热水泵 */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpHeatingkW > 0)) && (() => {
              const count = custom.achpCount || calc.achpCount;
              const pumpCount = count > 0 ? count : 1;
              const configuredFlow = custom.selectedHwPumpProduct 
                ? custom.selectedHwPumpProduct.ratedCapacitykW * pumpCount 
                : (custom.hwPumpFlow || calc.achpHwPumpFlow);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-rose-400" />
                    <span>风冷热泵-冬季热水泵</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('pump', '风冷热泵热水泵', configuredFlow / pumpCount, 'selectedHwPumpProduct')}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg border border-rose-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedHwPumpProduct ? custom.selectedHwPumpProduct.name : `从品牌库选水泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.achpHwPumpFlow.toFixed(1)} m³/h</td>
                  <td className="py-3 px-3 font-bold text-white text-center">
                    {pumpCount} (1机对1泵)
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredFlow / pumpCount).toFixed(1)} m³/h/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredFlow.toFixed(1)} m³/h
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500 font-mono text-center block">-</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedHwPumpProduct ? `${custom.selectedHwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.achpWinterPumpPowerkW / pumpCount).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>温差联动合理选型</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 4.3 板式换热器 (HEX - 仅区域能源站系统或复合系统) */}
            {(subItem.systemType === 'district_energy' || (subItem.systemType === 'hybrid' && calc.districtHexCapacitykW > 0)) && (() => {
              const count = custom.districtHexCount || calc.districtHexCount || 2;
              const configuredCap = custom.selectedDistrictHexProduct 
                ? custom.selectedDistrictHexProduct.ratedCapacitykW * count 
                : (custom.districtHexCapacitykW || calc.districtHexCapacitykW);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Layers2 className="w-4 h-4 text-cyan-400" />
                    <span>板式换热机组 (HEX - 区域供冷/供热)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('plate_hex', '高效板式换热器', configuredCap / count, 'selectedDistrictHexProduct')}
                      className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedDistrictHexProduct ? custom.selectedDistrictHexProduct.name : `从品牌库选板换 (${CATEGORY_BRANDS.plate_hex}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingLoadkW.toFixed(1)} kW</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('districtHexCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredCap / count).toFixed(1)} kW/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredCap.toFixed(1)} kW
                  </td>
                  <td className="py-3 px-3">
                    {renderRatioBadge(configuredCap, calc.coolingLoadkW)}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-400">
                    0 kW (无源热网换热)
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>匹配推荐</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 4.4 商用分体空调机组群 (Split AC) */}
            {(subItem.systemType === 'split_ac' || (subItem.systemType === 'hybrid' && calc.splitTotalCapacitykW > 0)) && (() => {
              const count = custom.splitCount || calc.splitCount || 10;
              const configuredCap = custom.selectedSplitProduct 
                ? custom.selectedSplitProduct.ratedCapacitykW * count 
                : (custom.splitTotalCapacitykW || calc.splitTotalCapacitykW);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-emerald-400" />
                    <span>商用分体空调 (新一级能效)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('split_ac', '商用分体空调', configuredCap / count, 'selectedSplitProduct')}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedSplitProduct ? custom.selectedSplitProduct.name : `从品牌库选分体机 (${CATEGORY_BRANDS.split_ac}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingLoadkW.toFixed(1)} kW</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('splitCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredCap / count).toFixed(1)} kW/套
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredCap.toFixed(1)} kW
                  </td>
                  <td className="py-3 px-3">
                    {renderRatioBadge(configuredCap, calc.coolingLoadkW)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedSplitProduct ? `${custom.selectedSplitProduct.actualPowerkW} kW/套 (铭牌)` : `${(calc.splitPowerkW / Math.max(1, count)).toFixed(2)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>匹配推荐</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 5. 冷水泵 (CHWP - 仅非风冷热泵系统) */}
            {sysMeta.hasChilledWaterPump && subItem.systemType !== 'air_heat_pump' && (() => {
              const count = custom.chwPumpCount || calc.chwPumpCount;
              const configuredFlow = custom.selectedChwPumpProduct 
                ? custom.selectedChwPumpProduct.ratedCapacitykW * count 
                : (custom.chwPumpFlow || calc.chwPumpFlow);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    <span>{subItem.systemType === 'district_energy' ? '二次冷水循环泵 (区域供冷)' : '冷水泵'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('pump', subItem.systemType === 'district_energy' ? '二次冷水循环泵' : '冷水泵', configuredFlow / count, 'selectedChwPumpProduct')}
                      className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedChwPumpProduct ? custom.selectedChwPumpProduct.name : `从品牌库选水泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.chwPumpFlow.toFixed(1)} m³/h</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('chwPumpCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredFlow / count).toFixed(1)} m³/h/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredFlow.toFixed(1)} m³/h
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500 font-mono text-center block">-</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedChwPumpProduct ? `${custom.selectedChwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.chwPumpPowerkW / count).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>温差联动合理选型</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 6. 热水泵 (HWP - 仅非风冷热泵系统) */}
            {sysMeta.hasHotWaterPump && subItem.systemType !== 'air_heat_pump' && (() => {
              const count = custom.hwPumpCount || calc.hwPumpCount;
              const configuredFlow = custom.selectedHwPumpProduct 
                ? custom.selectedHwPumpProduct.ratedCapacitykW * count 
                : (custom.hwPumpFlow || calc.hwPumpFlow);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-rose-400" />
                    <span>{subItem.systemType === 'district_energy' ? '二次热水循环泵 (区域供热)' : '热水泵'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('pump', subItem.systemType === 'district_energy' ? '二次热水循环泵' : '热水泵', configuredFlow / count, 'selectedHwPumpProduct')}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg border border-rose-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedHwPumpProduct ? custom.selectedHwPumpProduct.name : `从品牌库选水泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.hwPumpFlow.toFixed(1)} m³/h</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('hwPumpCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredFlow / count).toFixed(1)} m³/h/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredFlow.toFixed(1)} m³/h
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500 font-mono text-center block">-</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedHwPumpProduct ? `${custom.selectedHwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.hwPumpPowerkW / count).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>温差联动合理选型</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 7. 冷却泵 (CWP) */}
            {sysMeta.hasCoolingWaterPump && (() => {
              const count = custom.cwPumpCount || calc.cwPumpCount;
              const configuredFlow = custom.selectedCwPumpProduct 
                ? custom.selectedCwPumpProduct.ratedCapacitykW * count 
                : (custom.cwPumpFlow || calc.cwPumpFlow);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-emerald-400" />
                    <span>冷却泵</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('pump', '冷却泵', configuredFlow / count, 'selectedCwPumpProduct')}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedCwPumpProduct ? custom.selectedCwPumpProduct.name : `从品牌库选冷却泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.cwPumpFlow.toFixed(1)} m³/h</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('cwPumpCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredFlow / count).toFixed(1)} m³/h/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredFlow.toFixed(1)} m³/h
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500 font-mono text-center block">-</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedCwPumpProduct ? `${custom.selectedCwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.cwPumpPowerkW / count).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>温差联动合理选型</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

            {/* 8. 冷却塔 (Cooling Tower) */}
            {sysMeta.hasCoolingTower && (() => {
              const count = custom.coolingTowerCount || calc.coolingTowerCount;
              const configuredFlow = custom.selectedTowerProduct 
                ? custom.selectedTowerProduct.ratedCapacitykW * count 
                : (custom.coolingTowerFlow || calc.coolingTowerFlow);
              return (
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>冷却塔 (冷却水散热)</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => openCatalogModal('cooling_tower', '冷却塔', configuredFlow / count, 'selectedTowerProduct')}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                    >
                      <span>{custom.selectedTowerProduct ? custom.selectedTowerProduct.name : `从品牌库选冷却塔 (${CATEGORY_BRANDS.cooling_tower}...)`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingTowerFlow.toFixed(1)} m³/h</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={1} max={9999}
                      value={count}
                      onChange={e => handleCustomChange('coolingTowerCount', Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {(configuredFlow / count).toFixed(1)} m³/h/台
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    {configuredFlow.toFixed(1)} m³/h
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-500 font-mono text-center block">-</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300">
                    {custom.selectedTowerProduct ? `${custom.selectedTowerProduct.actualPowerkW} kW (铭牌)` : `${(calc.coolingTowerFanPowerkW / count).toFixed(1)} kW (理论)`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>匹配标准推荐</span>
                    </span>
                  </td>
                </tr>
              );
            })()}

          </tbody>
        </table>
      </div>

      {/* Discrepancy Alert Warnings Container */}
      {discrepancies.length > 0 && (
        <div className="bg-red-950/60 border border-red-500/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            <span>【红字预警提醒】检测到用户手动调整的选型参数偏离物理推荐值：</span>
          </div>

          <div className="space-y-2 text-xs">
            {discrepancies.map((disc, idx) => (
              <div key={idx} className="bg-red-900/40 border border-red-700/50 p-3 rounded-lg flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-red-200">
                    {disc.equipmentName} - {disc.paramName}: 用户设置 {disc.userValue.toFixed(1)} {disc.unit} vs 推荐联动计算值 {disc.recommendedValue.toFixed(1)} {disc.unit} ({disc.diffPercent > 0 ? `偏大 +${disc.diffPercent.toFixed(1)}%` : `偏小 ${disc.diffPercent.toFixed(1)}%`})
                  </div>
                  <p className="text-slate-300">{disc.message}</p>
                </div>
                <button
                  onClick={handleResetAll}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold shadow whitespace-nowrap ml-3"
                >
                  一键恢复标准联动
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
