import React, { useState } from 'react';
import type { BuildingSubItem, EquipmentCalcResult, UserEquipmentOverrides } from '../types/hvac';
import { calculateEquipmentForSubItem, checkDiscrepancies } from '../hvacEngine/calculator';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { EquipmentCatalogModal } from './EquipmentCatalogModal';
import { CATEGORY_BRANDS } from '../data/equipmentCatalog';
import type { EquipmentCategory, CatalogEquipmentItem } from '../data/equipmentCatalog';
import { 
  AlertTriangle, CheckCircle, Calculator, RotateCcw, ChevronDown, ChevronUp, Cpu, Flame, Wind, Link2, Layers2, ShieldCheck, Thermometer
} from 'lucide-react';

interface Props {
  subItem: BuildingSubItem;
  allSubItems?: BuildingSubItem[];
  onUpdateSubItem: (item: BuildingSubItem) => void;
}

export const EquipmentConfigTable: React.FC<Props> = ({ subItem, allSubItems = [], onUpdateSubItem }) => {
  const [showFormulas, setShowFormulas] = useState(true);

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

    // 一机对一泵，一泵对一塔，一锅炉对一热水泵：手动修改主机/锅炉台数时自动同步联动
    if (key === 'chillerCount') {
      newCustom.chwPumpCount = val;
      newCustom.cwPumpCount = val;
      newCustom.coolingTowerCount = val;
    } else if (key === 'boilerCount') {
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
      gasFlowm3h: item.gasFlowm3h
    };

    const newCustom = { ...custom, [overrideKey]: selectedProd };

    if (catalogModalState.category === 'chiller') {
      const count = custom.chillerCount || calc.chillerCount;
      newCustom.chillerCapacitykW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'boiler') {
      const count = custom.boilerCount || calc.boilerCount;
      newCustom.boilerCapacitykW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'achp') {
      const count = custom.achpCount || calc.achpCount;
      newCustom.achpCoolingkW = item.ratedCapacitykW * count;
    } else if (catalogModalState.category === 'vrf') {
      const count = custom.vrfCount || calc.vrfCount;
      newCustom.vrfCoolingkW = item.ratedCapacitykW * count;
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

  // 冷站阶梯逻辑判定文本 (依据实际冷机分摊容量 Q_chiller)
  const Q_chiller = calc.chillerCapacitykW > 0 ? calc.chillerCapacitykW : calc.coolingLoadkW;
  let sizingRuleText = '';
  if (Q_chiller <= 2500) {
    sizingRuleText = `1. 小型冷站 (Q_chiller = ${Q_chiller.toFixed(1)} kW ≤ 2500 kW): 推荐配置 2 台等分变频螺杆机 (单台 ${(Q_chiller / 2).toFixed(1)} kW)`;
  } else if (Q_chiller <= 5500) {
    sizingRuleText = `2. 中型冷站 (2500 kW < Q_chiller = ${Q_chiller.toFixed(1)} kW ≤ 5500 kW): 推荐配置 3 台等分高效变频螺杆机 (单台 ${(Q_chiller / 3).toFixed(1)} kW)`;
  } else {
    const qSmall = Q_chiller / 7;
    const qLarge = 2 * qSmall;
    sizingRuleText = `3. 大型冷站 (Q_chiller = ${Q_chiller.toFixed(1)} kW > 5500 kW): 推荐 3大1小 异构梯级配置 (1台磁悬浮 ${qSmall.toFixed(1)} kW + 3台变频离心机 ${qLarge.toFixed(1)} kW)`;
  }

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
            <h2 className="text-xl font-bold text-white">2. 设备自动配置、四步推导逻辑与水温预警</h2>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            当前系统：<span className="text-blue-300 font-semibold">{sysMeta.name}</span>。
            集成各品类顶级市场品牌（冷机: 约克 / 锅炉: 方快 / 水泵: 威乐 / 冷却塔: 金日）全系列规格库，设备电耗基于选定规格铭牌真实电功率精算！
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition-all"
          >
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>{showFormulas ? '隐藏推导逻辑指南' : '显示四步推导逻辑指南'}</span>
            {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

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

      {/* 4-Step Recommendation & Constraint Linking Guide Banner */}
      {showFormulas && (
        <div className="bg-slate-850 border border-blue-500/30 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-blue-300 font-bold border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>系统的推荐配置与物理联动推导四大步骤：</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-300">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center space-x-1">
                <span>第一步: 冷水机组配置</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                根据总冷负荷 <span className="text-white font-bold">{calc.coolingLoadkW.toFixed(1)} kW</span> 按照分阶规则自动推荐最佳主机：<br/>
                • ≤2500kW: 2台变频螺杆<br/>
                • 2500~5500kW: 3台高效变频螺杆<br/>
                • &gt;5500kW: 3大1小 异构梯级(磁悬浮+离心)
              </p>
              <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 p-1.5 rounded mt-1">
                匹配结论: {sizingRuleText}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400 flex items-center space-x-1">
                <span>第二步: 冷水泵/冷却泵/塔</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                根据冷机容量和各工况水温温差联动计算水泵与水塔：<br/>
                • 冷水泵流量: <span className="text-white">Q_cool × 3.6 / (4.186 × ΔT_chw)</span><br/>
                • 冷却泵流量: <span className="text-white">Q_cond × 3.6 / (4.186 × ΔT_cw)</span><br/>
                • 冷却塔流量: <span className="text-white">冷却泵流量 × 1.15 (安全余量)</span>
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400 flex items-center space-x-1">
                <span>第三步: 锅炉及热水水泵</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                根据总热负荷 <span className="text-white font-bold">{calc.heatingLoadkW.toFixed(1)} kW</span> 配置高能效真空锅炉，并按热水供回水温差联动配置热水泵：<br/>
                • 热水泵流量: <span className="text-white">Q_heat × 3.6 / (4.186 × ΔT_hw)</span>
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="font-bold text-rose-400 flex items-center space-x-1">
                <span>第四步: 参数联动限制说明</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                所有设备参数均开放显示与微调，但各设备间存在严格的热力/水力关联约束。微调水温可自动调控水泵推荐流量；若手动偏离选型 &gt;110% 或 &lt;95%，将触发<span className="text-red-400 font-bold">【红字预警】</span>！
              </p>
              <div className="text-[10px] text-amber-300 font-bold bg-amber-950/60 p-1.5 rounded mt-1">
                设备品牌专属匹配：冷机-约克 | 锅炉-方快 | 水泵-威乐 | 水塔-金日
              </div>
            </div>
          </div>
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
              <th className="py-3 px-3 text-blue-300">推荐标准联动总值</th>
              <th className="py-3 px-3">配置台数 (台)</th>
              <th className="py-3 px-3 text-emerald-300">折算单台容量/流量</th>
              <th className="py-3 px-3">配置总值 (用户微调)</th>
              <th className="py-3 px-3 text-cyan-300">实际配比率</th>
              <th className="py-3 px-3 text-amber-300">单台铭牌真实电量/气耗</th>
              <th className="py-3 px-3">可行性状态与恢复</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            
            {/* 1. 冷水机组 (Chillers) */}
            {(subItem.systemType === 'chiller_boiler' || subItem.systemType === 'hybrid') && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>冷水机组 (螺杆/离心/磁悬浮)</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('chiller', '冷水机组', custom.chillerCapacitykW ? custom.chillerCapacitykW / (custom.chillerCount || calc.chillerCount) : calc.chillerCapacitykW / calc.chillerCount, 'selectedChillerProduct')}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-bold rounded-lg border border-blue-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedChillerProduct ? custom.selectedChillerProduct.name : `从品牌库选型 (${CATEGORY_BRANDS.chiller}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.chillerCapacitykW.toFixed(1)} kW</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={custom.chillerCount || calc.chillerCount}
                    onChange={e => handleCustomChange('chillerCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.chillerCapacitykW || calc.chillerCapacitykW) / (custom.chillerCount || calc.chillerCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.chillerCapacitykW || calc.chillerCapacitykW).toFixed(1)} kW
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.chillerCapacitykW || calc.chillerCapacitykW, calc.chillerCapacitykW)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedChillerProduct ? `${custom.selectedChillerProduct.actualPowerkW} kW (铭牌)` : `${(calc.chillerPowerkW / calc.chillerCount).toFixed(1)} kW (理论)`}
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
            )}

            {/* 2. 燃气热水锅炉 (Boiler) */}
            {(subItem.systemType === 'chiller_boiler' || subItem.systemType === 'hybrid') && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>燃气热水锅炉</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('boiler', '燃气热水锅炉', custom.boilerCapacitykW ? custom.boilerCapacitykW / (custom.boilerCount || calc.boilerCount) : calc.boilerCapacitykW / calc.boilerCount, 'selectedBoilerProduct')}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg border border-rose-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedBoilerProduct ? custom.selectedBoilerProduct.name : `从品牌库选型 (${CATEGORY_BRANDS.boiler}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.boilerCapacitykW.toFixed(1)} kW</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={custom.boilerCount || calc.boilerCount}
                    onChange={e => handleCustomChange('boilerCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.boilerCapacitykW || calc.boilerCapacitykW) / (custom.boilerCount || calc.boilerCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.boilerCapacitykW || calc.boilerCapacitykW).toFixed(1)} kW
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.boilerCapacitykW || calc.boilerCapacitykW, calc.boilerCapacitykW)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedBoilerProduct ? `${custom.selectedBoilerProduct.gasFlowm3h || '-'} m³/h` : `${(calc.boilerGasFlow / calc.boilerCount).toFixed(1)} m³/h (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>匹配标准推荐</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 3. 多联机室外主机 (VRF) */}
            {(subItem.systemType === 'vrf' || (subItem.systemType === 'hybrid' && calc.vrfCoolingkW > 0)) && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>多联机室外主机 (VRF)</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('vrf', 'VRF多联机', custom.vrfCoolingkW ? custom.vrfCoolingkW / (custom.vrfCount || calc.vrfCount) : calc.vrfCoolingkW / calc.vrfCount, 'selectedVrfProduct')}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 font-bold rounded-lg border border-purple-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedVrfProduct ? custom.selectedVrfProduct.name : `从品牌库选多联机 (${CATEGORY_BRANDS.vrf}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.vrfCoolingkW.toFixed(1)} kW</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={100}
                    value={custom.vrfCount || calc.vrfCount}
                    onChange={e => handleCustomChange('vrfCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.vrfCoolingkW || calc.vrfCoolingkW) / (custom.vrfCount || calc.vrfCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.vrfCoolingkW || calc.vrfCoolingkW).toFixed(1)} kW
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.vrfCoolingkW || calc.vrfCoolingkW, calc.vrfCoolingkW)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedVrfProduct ? `${custom.selectedVrfProduct.actualPowerkW} kW (铭牌)` : `${(calc.vrfPowerkW / Math.max(1, calc.vrfCount)).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>匹配标准推荐</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 4. 风冷热泵模块主机 (ACHP) */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpCoolingkW > 0)) && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <span>风冷热泵模块主机 (ACHP)</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('achp', '风冷热泵模块', custom.achpCoolingkW ? custom.achpCoolingkW / (custom.achpCount || calc.achpCount) : calc.achpCoolingkW / calc.achpCount, 'selectedAchpProduct')}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedAchpProduct ? custom.selectedAchpProduct.name : `从品牌库选风冷热泵 (${CATEGORY_BRANDS.achp}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.achpCoolingkW.toFixed(1)} kW</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={50}
                    value={custom.achpCount || calc.achpCount}
                    onChange={e => handleCustomChange('achpCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.achpCoolingkW || calc.achpCoolingkW) / (custom.achpCount || calc.achpCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.achpCoolingkW || calc.achpCoolingkW).toFixed(1)} kW
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.achpCoolingkW || calc.achpCoolingkW, calc.achpCoolingkW)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedAchpProduct ? `${custom.selectedAchpProduct.actualPowerkW} kW (铭牌)` : `${(calc.achpPowerkW / Math.max(1, calc.achpCount)).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>匹配标准推荐</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 4.1 风冷热泵-夏季冷水泵 */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpCoolingkW > 0)) && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>风冷热泵-夏季冷水泵</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('pump', '风冷热泵冷水泵', calc.achpChwPumpFlow / Math.max(1, calc.achpChwPumpCount), 'selectedChwPumpProduct')}
                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>从品牌库选水泵 ({CATEGORY_BRANDS.pump}...)</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.achpChwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3 px-3 font-bold text-white text-center">
                  {calc.achpChwPumpCount} (1机对1泵)
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {(calc.achpChwPumpFlow / Math.max(1, calc.achpChwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {calc.achpChwPumpFlow.toFixed(1)} m³/h
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(calc.achpChwPumpFlow, calc.achpChwPumpFlow)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {(calc.achpSummerPumpPowerkW / Math.max(1, calc.achpChwPumpCount)).toFixed(1)} kW (理论)
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>温差联动合理选型</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 4.2 风冷热泵-冬季热水泵 */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpHeatingkW > 0)) && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-rose-400" />
                  <span>风冷热泵-冬季热水泵</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('pump', '风冷热泵热水泵', calc.achpHwPumpFlow / Math.max(1, calc.achpHwPumpCount), 'selectedHwPumpProduct')}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg border border-rose-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>从品牌库选水泵 ({CATEGORY_BRANDS.pump}...)</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.achpHwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3 px-3 font-bold text-white text-center">
                  {calc.achpHwPumpCount} (1机对1泵)
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {(calc.achpHwPumpFlow / Math.max(1, calc.achpHwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {calc.achpHwPumpFlow.toFixed(1)} m³/h
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(calc.achpHwPumpFlow, calc.achpHwPumpFlow)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {(calc.achpWinterPumpPowerkW / Math.max(1, calc.achpHwPumpCount)).toFixed(1)} kW (理论)
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>温差联动合理选型</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 3. 冷水泵 (CHWP) */}
            {sysMeta.hasChilledWaterPump && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>冷水泵</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('pump', '冷水泵', custom.chwPumpFlow ? custom.chwPumpFlow / (custom.chwPumpCount || calc.chwPumpCount) : calc.chwPumpFlow / calc.chwPumpCount, 'selectedChwPumpProduct')}
                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedChwPumpProduct ? custom.selectedChwPumpProduct.name : `从品牌库选冷水泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.chwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={custom.chwPumpCount || calc.chwPumpCount}
                    onChange={e => handleCustomChange('chwPumpCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.chwPumpFlow || calc.chwPumpFlow) / (custom.chwPumpCount || calc.chwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.chwPumpFlow || calc.chwPumpFlow).toFixed(1)} m³/h
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.chwPumpFlow || calc.chwPumpFlow, calc.chwPumpFlow)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedChwPumpProduct ? `${custom.selectedChwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.chwPumpPowerkW / calc.chwPumpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>温差联动合理选型</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 4. 热水泵 (HWP) */}
            {sysMeta.hasHotWaterPump && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-rose-400" />
                  <span>热水泵</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('pump', '热水泵', custom.hwPumpFlow ? custom.hwPumpFlow / (custom.hwPumpCount || calc.hwPumpCount) : calc.hwPumpFlow / calc.hwPumpCount, 'selectedHwPumpProduct')}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold rounded-lg border border-rose-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedHwPumpProduct ? custom.selectedHwPumpProduct.name : `从品牌库选热水泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.hwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={custom.hwPumpCount || calc.hwPumpCount}
                    onChange={e => handleCustomChange('hwPumpCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.hwPumpFlow || calc.hwPumpFlow) / (custom.hwPumpCount || calc.hwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.hwPumpFlow || calc.hwPumpFlow).toFixed(1)} m³/h
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.hwPumpFlow || calc.hwPumpFlow, calc.hwPumpFlow)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedHwPumpProduct ? `${custom.selectedHwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.hwPumpPowerkW / calc.hwPumpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>温差联动合理选型</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 5. 冷却泵 (CWP) */}
            {sysMeta.hasCoolingWaterPump && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <span>冷却泵</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('pump', '冷却泵', custom.cwPumpFlow ? custom.cwPumpFlow / (custom.cwPumpCount || calc.cwPumpCount) : calc.cwPumpFlow / calc.cwPumpCount, 'selectedCwPumpProduct')}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedCwPumpProduct ? custom.selectedCwPumpProduct.name : `从品牌库选冷却泵 (${CATEGORY_BRANDS.pump}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.cwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={custom.cwPumpCount || calc.cwPumpCount}
                    onChange={e => handleCustomChange('cwPumpCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.cwPumpFlow || calc.cwPumpFlow) / (custom.cwPumpCount || calc.cwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.cwPumpFlow || calc.cwPumpFlow).toFixed(1)} m³/h
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.cwPumpFlow || calc.cwPumpFlow, calc.cwPumpFlow)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedCwPumpProduct ? `${custom.selectedCwPumpProduct.actualPowerkW} kW (铭牌)` : `${(calc.cwPumpPowerkW / calc.cwPumpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>温差联动合理选型</span>
                  </span>
                </td>
              </tr>
            )}

            {/* 6. 冷却塔 (Cooling Tower) */}
            {sysMeta.hasCoolingTower && (
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span>冷却塔 (冷却水散热)</span>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => openCatalogModal('cooling_tower', '冷却塔', custom.coolingTowerFlow ? custom.coolingTowerFlow / (custom.coolingTowerCount || calc.coolingTowerCount) : calc.coolingTowerFlow / calc.coolingTowerCount, 'selectedTowerProduct')}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                  >
                    <span>{custom.selectedTowerProduct ? custom.selectedTowerProduct.name : `从品牌库选冷却塔 (${CATEGORY_BRANDS.cooling_tower}...)`}</span>
                  </button>
                </td>
                <td className="py-3 px-3 font-bold text-blue-300">{calc.coolingTowerFlow.toFixed(1)} m³/h</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={custom.coolingTowerCount || calc.coolingTowerCount}
                    onChange={e => handleCustomChange('coolingTowerCount', Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400">
                  {((custom.coolingTowerFlow || calc.coolingTowerFlow) / (custom.coolingTowerCount || calc.coolingTowerCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3 px-3 font-bold text-white">
                  {(custom.coolingTowerFlow || calc.coolingTowerFlow).toFixed(1)} m³/h
                </td>
                <td className="py-3 px-3">
                  {renderRatioBadge(custom.coolingTowerFlow || calc.coolingTowerFlow, calc.coolingTowerFlow)}
                </td>
                <td className="py-3 px-3 font-bold text-amber-300">
                  {custom.selectedTowerProduct ? `${custom.selectedTowerProduct.actualPowerkW} kW (铭牌)` : `${(calc.coolingTowerFanPowerkW / calc.coolingTowerCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3 px-3">
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>匹配标准推荐</span>
                  </span>
                </td>
              </tr>
            )}

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
