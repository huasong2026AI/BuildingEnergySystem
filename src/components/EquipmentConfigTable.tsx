import React, { useState } from 'react';
import type { BuildingSubItem, EquipmentCalcResult, UserEquipmentOverrides } from '../types/hvac';
import { calculateEquipmentForSubItem, checkDiscrepancies } from '../hvacEngine/calculator';
import { SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { EquipmentCatalogModal } from './EquipmentCatalogModal';
import type { EquipmentCategory, CatalogEquipmentItem } from '../data/equipmentCatalog';
import { 
  AlertTriangle, CheckCircle, Calculator, Info, RotateCcw, Thermometer, ChevronDown, ChevronUp, Cpu, Flame, Wind, Link2, Layers2, ShoppingBag, Check 
} from 'lucide-react';

interface Props {
  subItem: BuildingSubItem;
  allSubItems?: BuildingSubItem[];
  onUpdateSubItem: (item: BuildingSubItem) => void;
}

export const EquipmentConfigTable: React.FC<Props> = ({ subItem, allSubItems = [], onUpdateSubItem }) => {
  const [showFormulas, setShowFormulas] = useState(true);

  // 品牌选型弹窗状态
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

  const defaultHwSupply = isAchp ? 45 : 60;
  const defaultHwReturn = isAchp ? 40 : 50;

  const handleCustomChange = (key: keyof UserEquipmentOverrides, val: any) => {
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

    // 自动更新用户容量/流量总值
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
            <h2 className="text-xl font-bold text-white">空调系统主设备选型与实际铭牌参数精算</h2>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            当前系统：<span className="text-blue-300 font-semibold">{sysMeta.name}</span>。
            支持在<span className="text-amber-300 font-bold">【主流品牌库】</span>中挑选真实型号，设备电量取自<span className="text-emerald-400 font-bold">真实选定产品的铭牌输入电功率 (非理论公式算得)</span>！
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition-all"
          >
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>{showFormulas ? '隐藏工程公式' : '显示工程计算公式'}</span>
            {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {Object.keys(custom).length > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-200 hover:text-red-300 rounded-xl text-sm font-medium border border-slate-700 hover:border-red-500/40 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>恢复全部推荐配置</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. 水温工况参数自定义填写区 */}
      {(sysMeta.hasChilledWaterPump || sysMeta.hasHotWaterPump || sysMeta.hasCoolingWaterPump) ? (
        <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-100">
              <Thermometer className="w-5 h-5 text-emerald-400" />
              <span>水系统供回水温度工况设置（包含冷水 7/12°C 与 热水 {isAchp ? '45/40°C' : '60/50°C'}）</span>
            </div>
            <span className="text-xs text-slate-400">
              * 改变温差将改变水泵流量公式：G = Q × 3.6 / (4.186 × ΔT)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {sysMeta.hasChilledWaterPump && (
              <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-300 font-semibold">冷冻水/冷水供回水温度 (制冷)</span>
                  <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-xs">
                    ΔT = {calc.deltaTchw} ℃
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">供水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.chwSupplyTemp ?? 7}
                      onChange={(e) => handleWaterTempChange('chwSupplyTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white text-sm font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">回水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.chwReturnTemp ?? 12}
                      onChange={(e) => handleWaterTempChange('chwReturnTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white text-sm font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {sysMeta.hasCoolingWaterPump && sysMeta.hasCoolingTower && (
              <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-300 font-semibold">冷却水进出水温度</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
                    ΔT = {calc.deltaTcw} ℃
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">进水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.cwSupplyTemp ?? 32}
                      onChange={(e) => handleWaterTempChange('cwSupplyTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white text-sm font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">出水温度 (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={subItem.cwReturnTemp ?? 37}
                      onChange={(e) => handleWaterTempChange('cwReturnTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white text-sm font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {sysMeta.hasHotWaterPump && (
              <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-300 font-semibold">
                    {isAchp ? '风冷热泵热水供回水温度 (制热)' : '锅炉热水供回水温度'}
                  </span>
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-xs">
                    ΔT = {calc.deltaThw} ℃
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">供水温度 (°C)</label>
                    <input
                      type="number"
                      step="1"
                      value={subItem.hwSupplyTemp ?? defaultHwSupply}
                      onChange={(e) => handleWaterTempChange('hwSupplyTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white text-sm font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">回水温度 (°C)</label>
                    <input
                      type="number"
                      step="1"
                      value={subItem.hwReturnTemp ?? defaultHwReturn}
                      onChange={(e) => handleWaterTempChange('hwReturnTemp', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white text-sm font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="bg-slate-850/80 border border-purple-500/30 rounded-xl p-4 flex items-center space-x-3 text-sm">
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-white text-base block">直接蒸发式系统 (无水温及水泵设置)</span>
            <p className="text-slate-300 text-xs mt-0.5">
              当前系统为【{sysMeta.name}】，采用氟利昂制冷剂直接蒸发换热，系统无需水泵、冷却水管路及冷却塔。
            </p>
          </div>
        </div>
      )}

      {/* 2. HVAC Engineering Formulas Explanation Card */}
      {showFormulas && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center space-x-2 font-bold text-blue-300 text-base">
            <Info className="w-5 h-5 text-blue-400" />
            <span>品牌设备物理参数与理论工程计算区分说明</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-200 pt-1">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">① 理论公式 vs 物理选型</span>
              <p className="text-xs text-slate-300">
                工程理论计算值代表最小负荷需求；实际从品牌库选定产品后，将以<span className="text-amber-300 font-bold">物理设备真实铭牌输入功率 (kW)</span> 计算能耗。
              </p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">② 主流品牌数据库支持</span>
              <p className="text-xs text-slate-300">
                涵盖约克、开利、特灵、麦克维尔、格力、美的、海尔、威乐、方快等国内外一线品牌物理铭牌参数。
              </p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">③ 黄金配比范围</span>
              <p className="text-xs text-slate-300">
                所选品牌单机容量在计算负荷推荐值的 <span className="text-emerald-400 font-bold">100% ~ 110%</span> 属于最具性价比选型。
              </p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-blue-200 block mb-1">④ 实际装机总电量</span>
              <p className="text-xs text-slate-300">
                系统总装机电量 = Σ(单台真实铭牌电功率 × 配置台数)，真实反映项目装机余量。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Red Warning Alert Box if user configuration differs */}
      {discrepancies.length > 0 && (
        <div className="bg-red-950/60 border-2 border-red-500 rounded-xl p-4 space-y-3 animate-pulse">
          <div className="flex items-center space-x-2 font-bold text-red-400 text-base">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span>【红字警报】检测到 {discrepancies.length} 项设备容量超出 95%~110% 合理产品选型区间！</span>
          </div>

          <div className="space-y-2">
            {discrepancies.map((d, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-red-500/40 text-sm">
                <div className="text-red-300 font-semibold space-y-0.5">
                  <p>{d.message}</p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center space-x-3 self-end sm:self-auto">
                  <span className="text-red-400 font-bold text-base">
                    {d.diffPercent > 0 ? `+${d.diffPercent.toFixed(1)}%` : `${d.diffPercent.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Comprehensive Equipment Table with Brand Selection */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800/90 text-slate-200 font-bold border-b border-slate-700">
              <th className="py-3.5 px-4">主要空调设备名称</th>
              <th className="py-3.5 px-4 text-amber-300">实际市场品牌与型号选型</th>
              <th className="py-3.5 px-4">推荐标准计算总值</th>
              <th className="py-3.5 px-4 text-blue-300">配置台数 (台)</th>
              <th className="py-3.5 px-4 text-emerald-300">折算单台容量/流量</th>
              <th className="py-3.5 px-4 text-blue-300">配置总值</th>
              <th className="py-3.5 px-4 text-amber-400">单台铭牌真实电量/气耗</th>
              <th className="py-3.5 px-4">可行性状态与恢复</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">

            {/* 1. 冷水机组 */}
            {(subItem.systemType === 'chiller_boiler' || subItem.systemType === 'hybrid') && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold flex items-center space-x-2 text-white">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <span>冷水机组 (螺杆/离心/磁悬浮)</span>
                </td>
                <td className="py-3.5 px-4">
                  {custom.selectedChillerProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 font-bold text-xs rounded border border-blue-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>{custom.selectedChillerProduct.brand} {custom.selectedChillerProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('chiller', '冷水机组', (custom.chillerCapacitykW || calc.chillerCapacitykW) / (custom.chillerCount || calc.chillerCount), 'selectedChillerProduct')}
                        className="text-xs text-blue-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('chiller', '冷水机组', (custom.chillerCapacitykW || calc.chillerCapacitykW) / (custom.chillerCount || calc.chillerCount), 'selectedChillerProduct')}
                      className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white rounded-lg text-xs font-bold border border-blue-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选型 (约克/开利/格力...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.chillerCapacitykW.toFixed(1)} kW</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={custom.chillerCount ?? calc.chillerCount}
                    onChange={(e) => handleCustomChange('chillerCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-blue-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.chillerCapacitykW || calc.chillerCapacitykW) / (custom.chillerCount || calc.chillerCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.chillerCapacitykW ?? ''}
                    placeholder={calc.chillerCapacitykW.toFixed(1)}
                    onChange={(e) => handleCustomChange('chillerCapacitykW', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedChillerProduct ? `${custom.selectedChillerProduct.actualPowerkW} kW/台` : `${(calc.chillerPowerkW / calc.chillerCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.chillerCapacitykW, custom.chillerCapacitykW, () => handleResetField('chillerCapacitykW'))}
                </td>
              </tr>
            )}

            {/* 2. 燃气锅炉 */}
            {(subItem.systemType === 'chiller_boiler' || subItem.systemType === 'hybrid') && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold flex items-center space-x-2 text-white">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <span>燃气热水锅炉</span>
                </td>
                <td className="py-3.5 px-4">
                  {custom.selectedBoilerProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 font-bold text-xs rounded border border-rose-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-rose-400" />
                        <span>{custom.selectedBoilerProduct.brand} {custom.selectedBoilerProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('boiler', '燃气热水锅炉', (custom.boilerCapacitykW || calc.boilerCapacitykW) / (custom.boilerCount || calc.boilerCount), 'selectedBoilerProduct')}
                        className="text-xs text-rose-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('boiler', '燃气热水锅炉', (custom.boilerCapacitykW || calc.boilerCapacitykW) / (custom.boilerCount || calc.boilerCount), 'selectedBoilerProduct')}
                      className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg text-xs font-bold border border-rose-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选型 (方快/双良...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.boilerCapacitykW.toFixed(1)} kW</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={custom.boilerCount ?? calc.boilerCount}
                    onChange={(e) => handleCustomChange('boilerCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-rose-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.boilerCapacitykW || calc.boilerCapacitykW) / (custom.boilerCount || calc.boilerCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.boilerCapacitykW ?? ''}
                    placeholder={calc.boilerCapacitykW.toFixed(1)}
                    onChange={(e) => handleCustomChange('boilerCapacitykW', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-rose-400">
                  {custom.selectedBoilerProduct ? `${custom.selectedBoilerProduct.gasFlowm3h || '-'} m³/h/台` : `${(calc.boilerGasFlow / calc.boilerCount).toFixed(1)} m³/h (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.boilerCapacitykW, custom.boilerCapacitykW, () => handleResetField('boilerCapacitykW'))}
                </td>
              </tr>
            )}

            {/* 3. 冷水水泵 */}
            {sysMeta.hasChilledWaterPump && calc.chwPumpFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">冷水水泵 (夏季冷水泵)</td>
                <td className="py-3.5 px-4">
                  {custom.selectedChwPumpProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 font-bold text-xs rounded border border-blue-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>{custom.selectedChwPumpProduct.brand} {custom.selectedChwPumpProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('pump', '冷水水泵', (custom.chwPumpFlow || calc.chwPumpFlow) / (custom.chwPumpCount || calc.chwPumpCount), 'selectedChwPumpProduct')}
                        className="text-xs text-blue-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('pump', '冷水水泵', (custom.chwPumpFlow || calc.chwPumpFlow) / (custom.chwPumpCount || calc.chwPumpCount), 'selectedChwPumpProduct')}
                      className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white rounded-lg text-xs font-bold border border-blue-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选水泵 (威乐/凯泉...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.chwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={custom.chwPumpCount ?? calc.chwPumpCount}
                    onChange={(e) => handleCustomChange('chwPumpCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-blue-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.chwPumpFlow || calc.chwPumpFlow) / (custom.chwPumpCount || calc.chwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.chwPumpFlow ?? ''}
                    placeholder={calc.chwPumpFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('chwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedChwPumpProduct ? `${custom.selectedChwPumpProduct.actualPowerkW} kW/台` : `${(calc.chwPumpPowerkW / calc.chwPumpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.chwPumpFlow, custom.chwPumpFlow, () => handleResetField('chwPumpFlow'))}
                </td>
              </tr>
            )}

            {/* 4. 独立热水水泵 */}
            {sysMeta.hasHotWaterPump && calc.hwPumpFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">
                  {subItem.systemType === 'chiller_boiler' ? '锅炉独立热水泵' : '冬季热水循环泵'}
                </td>
                <td className="py-3.5 px-4">
                  {custom.selectedHwPumpProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 font-bold text-xs rounded border border-rose-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-rose-400" />
                        <span>{custom.selectedHwPumpProduct.brand} {custom.selectedHwPumpProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('pump', '热水水泵', (custom.hwPumpFlow || calc.hwPumpFlow) / (custom.hwPumpCount || calc.hwPumpCount), 'selectedHwPumpProduct')}
                        className="text-xs text-rose-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('pump', '热水水泵', (custom.hwPumpFlow || calc.hwPumpFlow) / (custom.hwPumpCount || calc.hwPumpCount), 'selectedHwPumpProduct')}
                      className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg text-xs font-bold border border-rose-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选水泵 (威乐/凯泉...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.hwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={custom.hwPumpCount ?? calc.hwPumpCount}
                    onChange={(e) => handleCustomChange('hwPumpCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-rose-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.hwPumpFlow || calc.hwPumpFlow) / (custom.hwPumpCount || calc.hwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.hwPumpFlow ?? ''}
                    placeholder={calc.hwPumpFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('hwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedHwPumpProduct ? `${custom.selectedHwPumpProduct.actualPowerkW} kW/台` : `${(calc.hwPumpPowerkW / calc.hwPumpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.hwPumpFlow, custom.hwPumpFlow, () => handleResetField('hwPumpFlow'))}
                </td>
              </tr>
            )}

            {/* 5. 冷却水水泵 */}
            {sysMeta.hasCoolingWaterPump && calc.cwPumpFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">冷却水水泵</td>
                <td className="py-3.5 px-4">
                  {custom.selectedCwPumpProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded border border-emerald-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{custom.selectedCwPumpProduct.brand} {custom.selectedCwPumpProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('pump', '冷却水水泵', (custom.cwPumpFlow || calc.cwPumpFlow) / (custom.cwPumpCount || calc.cwPumpCount), 'selectedCwPumpProduct')}
                        className="text-xs text-emerald-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('pump', '冷却水水泵', (custom.cwPumpFlow || calc.cwPumpFlow) / (custom.cwPumpCount || calc.cwPumpCount), 'selectedCwPumpProduct')}
                      className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选水泵 (威乐/凯泉...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.cwPumpFlow.toFixed(1)} m³/h</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={custom.cwPumpCount ?? calc.cwPumpCount}
                    onChange={(e) => handleCustomChange('cwPumpCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-emerald-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.cwPumpFlow || calc.cwPumpFlow) / (custom.cwPumpCount || calc.cwPumpCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.cwPumpFlow ?? ''}
                    placeholder={calc.cwPumpFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('cwPumpFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedCwPumpProduct ? `${custom.selectedCwPumpProduct.actualPowerkW} kW/台` : `${(calc.cwPumpPowerkW / calc.cwPumpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.cwPumpFlow, custom.cwPumpFlow, () => handleResetField('cwPumpFlow'))}
                </td>
              </tr>
            )}

            {/* 6. 冷却塔 */}
            {sysMeta.hasCoolingTower && calc.coolingTowerFlow > 0 && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">冷却塔 (冷却水散热)</td>
                <td className="py-3.5 px-4">
                  {custom.selectedTowerProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded border border-emerald-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{custom.selectedTowerProduct.brand} {custom.selectedTowerProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('cooling_tower', '冷却塔', (custom.coolingTowerFlow || calc.coolingTowerFlow) / (custom.coolingTowerCount || calc.coolingTowerCount), 'selectedTowerProduct')}
                        className="text-xs text-emerald-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('cooling_tower', '冷却塔', (custom.coolingTowerFlow || calc.coolingTowerFlow) / (custom.coolingTowerCount || calc.coolingTowerCount), 'selectedTowerProduct')}
                      className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选型 (金日/斯维奇...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.coolingTowerFlow.toFixed(1)} m³/h</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={custom.coolingTowerCount ?? calc.coolingTowerCount}
                    onChange={(e) => handleCustomChange('coolingTowerCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-emerald-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.coolingTowerFlow || calc.coolingTowerFlow) / (custom.coolingTowerCount || calc.coolingTowerCount)).toFixed(1)} m³/h/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.coolingTowerFlow ?? ''}
                    placeholder={calc.coolingTowerFlow.toFixed(1)}
                    onChange={(e) => handleCustomChange('coolingTowerFlow', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedTowerProduct ? `${custom.selectedTowerProduct.actualPowerkW} kW/台` : `${(calc.coolingTowerFanPowerkW / calc.coolingTowerCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.coolingTowerFlow, custom.coolingTowerFlow, () => handleResetField('coolingTowerFlow'))}
                </td>
              </tr>
            )}

            {/* 7. 风冷热泵主机 */}
            {(subItem.systemType === 'air_heat_pump' || (subItem.systemType === 'hybrid' && calc.achpCoolingkW > 0)) && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">风冷热泵主机模块</td>
                <td className="py-3.5 px-4">
                  {custom.selectedAchpProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 font-bold text-xs rounded border border-sky-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                        <span>{custom.selectedAchpProduct.brand} {custom.selectedAchpProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('achp', '风冷热泵', (custom.achpCoolingkW || calc.achpCoolingkW) / (custom.achpCount || calc.achpCount), 'selectedAchpProduct')}
                        className="text-xs text-sky-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('achp', '风冷热泵', (custom.achpCoolingkW || calc.achpCoolingkW) / (custom.achpCount || calc.achpCount), 'selectedAchpProduct')}
                      className="px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white rounded-lg text-xs font-bold border border-sky-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选型 (麦克维尔/格力/美的...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.achpCoolingkW.toFixed(1)} kW</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={custom.achpCount ?? calc.achpCount}
                    onChange={(e) => handleCustomChange('achpCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-sky-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.achpCoolingkW || calc.achpCoolingkW) / (custom.achpCount || calc.achpCount)).toFixed(1)} kW/模块
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.achpCoolingkW ?? ''}
                    placeholder={calc.achpCoolingkW.toFixed(1)}
                    onChange={(e) => handleCustomChange('achpCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedAchpProduct ? `${custom.selectedAchpProduct.actualPowerkW} kW/模块` : `${(calc.achpPowerkW / calc.achpCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.achpCoolingkW, custom.achpCoolingkW, () => handleResetField('achpCoolingkW'))}
                </td>
              </tr>
            )}

            {/* 8. VRF 多联机室外机 */}
            {(subItem.systemType === 'vrf' || (subItem.systemType === 'hybrid' && calc.vrfCoolingkW > 0)) && (
              <tr className="hover:bg-slate-850/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-white">VRF 多联机室外机</td>
                <td className="py-3.5 px-4">
                  {custom.selectedVrfProduct ? (
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded border border-purple-500/30 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                        <span>{custom.selectedVrfProduct.brand} {custom.selectedVrfProduct.model}</span>
                      </span>
                      <button
                        onClick={() => openCatalogModal('vrf', 'VRF 多联机室外机', (custom.vrfCoolingkW || calc.vrfCoolingkW) / (custom.vrfCount || calc.vrfCount), 'selectedVrfProduct')}
                        className="text-xs text-purple-400 hover:text-white underline block ml-1"
                      >
                        更换品牌型号
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCatalogModal('vrf', 'VRF 多联机室外机', (custom.vrfCoolingkW || calc.vrfCoolingkW) / (custom.vrfCount || calc.vrfCount), 'selectedVrfProduct')}
                      className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-xs font-bold border border-purple-500/40 flex items-center space-x-1 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>从品牌库选型 (大金/日立/美的...)</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-400">{calc.vrfCoolingkW.toFixed(1)} kW</td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={custom.vrfCount ?? calc.vrfCount}
                    onChange={(e) => handleCustomChange('vrfCount', Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-purple-300 text-sm"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {((custom.vrfCoolingkW || calc.vrfCoolingkW) / (custom.vrfCount || calc.vrfCount)).toFixed(1)} kW/台
                </td>
                <td className="py-3.5 px-4">
                  <input
                    type="number"
                    value={custom.vrfCoolingkW ?? ''}
                    placeholder={calc.vrfCoolingkW.toFixed(1)}
                    onChange={(e) => handleCustomChange('vrfCoolingkW', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-bold text-sm text-white"
                  />
                </td>
                <td className="py-3.5 px-4 font-bold text-amber-300">
                  {custom.selectedVrfProduct ? `${custom.selectedVrfProduct.actualPowerkW} kW/台` : `${(calc.vrfPowerkW / calc.vrfCount).toFixed(1)} kW (理论)`}
                </td>
                <td className="py-3.5 px-4">
                  {renderDiscrepancyBadge(calc.vrfCoolingkW, custom.vrfCoolingkW, () => handleResetField('vrfCoolingkW'))}
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
      <span className="inline-flex items-center space-x-1 text-emerald-400 text-sm font-semibold">
        <CheckCircle className="w-4 h-4" />
        <span>匹配标准推荐 (100%)</span>
      </span>
    );
  }

  const ratio = userVal / calcVal;
  const diffPercent = ((userVal - calcVal) / calcVal) * 100;

  if (ratio >= 0.95 && ratio <= 1.10) {
    return (
      <span className="inline-flex items-center space-x-1 text-emerald-400 text-sm font-semibold">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>在售产品合理选型范围 ({diffPercent > 0 ? `+${diffPercent.toFixed(1)}%` : `${diffPercent.toFixed(1)}%`})</span>
      </span>
    );
  }

  const isOversized = ratio > 1.10;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-red-500 font-extrabold text-sm flex items-center space-x-1 animate-pulse">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span>
          【红字提醒】{isOversized ? `超出 >110% (+${diffPercent.toFixed(1)}%)` : `低于下限 <95% (${diffPercent.toFixed(1)}%)`}
        </span>
      </span>

      <button
        onClick={onReset}
        className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white px-2.5 py-1 rounded border border-slate-700 transition-colors"
        title="恢复推荐计算值"
      >
        恢复推荐
      </button>
    </div>
  );
}
