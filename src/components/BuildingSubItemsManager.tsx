import React, { useState } from 'react';
import type { BuildingSubItem, BuildingType, SystemType, HybridSubSystemConfig } from '../types/hvac';
import { BUILDING_TYPES_META, SYSTEM_TYPES_META } from '../hvacEngine/constants';
import { 
  Building2, Hotel, ShoppingBag, ShoppingCart, Utensils, Cross, Building, 
  Plus, Trash2, Layers, Settings2, Link2, Share2, Layers2 
} from 'lucide-react';

interface Props {
  subItems: BuildingSubItem[];
  activeItemId: string;
  onSelectSubItem: (id: string) => void;
  onUpdateSubItem: (item: BuildingSubItem) => void;
  onAddSubItem: (item: BuildingSubItem) => void;
  onDeleteSubItem: (id: string) => void;
}

export const BuildingSubItemsManager: React.FC<Props> = ({
  subItems,
  activeItemId,
  onSelectSubItem,
  onUpdateSubItem,
  onAddSubItem,
  onDeleteSubItem,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubItem, setNewSubItem] = useState<{
    name: string;
    type: BuildingType;
    area: number;
    systemType: SystemType;
    useSharedPlant: boolean;
  }>({
    name: '新建商业楼区',
    type: 'office',
    area: 15000,
    systemType: 'chiller_boiler',
    useSharedPlant: false
  });

  const getIcon = (type: BuildingType) => {
    switch (type) {
      case 'hotel': return <Hotel className="w-6 h-6 text-indigo-400" />;
      case 'office': return <Building2 className="w-6 h-6 text-blue-400" />;
      case 'mall': return <ShoppingBag className="w-6 h-6 text-purple-400" />;
      case 'supermarket': return <ShoppingCart className="w-6 h-6 text-emerald-400" />;
      case 'restaurant': return <Utensils className="w-6 h-6 text-amber-400" />;
      case 'hospital': return <Cross className="w-6 h-6 text-rose-400" />;
      default: return <Building className="w-6 h-6 text-slate-400" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = BUILDING_TYPES_META[newSubItem.type];
    const createdItem: BuildingSubItem = {
      id: `sub-${Date.now()}`,
      name: newSubItem.name,
      type: newSubItem.type,
      area: newSubItem.area,
      coolingIndex: meta.defaultCoolingIndex,
      heatingIndex: meta.defaultHeatingIndex,
      operatingHours: meta.defaultOperatingHours,
      systemType: newSubItem.systemType,
      hybridSubSystems: newSubItem.systemType === 'hybrid' ? [
        { systemType: 'chiller_boiler', ratioPercent: 60 },
        { systemType: 'vrf', ratioPercent: 40 }
      ] : undefined,
      useSharedPlant: newSubItem.useSharedPlant,
      chwSupplyTemp: 7,
      chwReturnTemp: 12,
      hwSupplyTemp: 60,
      hwReturnTemp: 50,
      cwSupplyTemp: 32,
      cwReturnTemp: 37,
      customEquipment: {}
    };
    onAddSubItem(createdItem);
    setIsAdding(false);
  };

  const sharedItems = subItems.filter(item => item.useSharedPlant);
  const totalSharedArea = sharedItems.reduce((acc, curr) => acc + curr.area, 0);

  const activeItem = subItems.find(item => item.id === activeItemId) || subItems[0];

  const handleToggleHybridSub = (item: BuildingSubItem, subSysType: SystemType) => {
    const existing = item.hybridSubSystems || [
      { systemType: 'chiller_boiler', ratioPercent: 60 },
      { systemType: 'vrf', ratioPercent: 40 }
    ];

    const exists = existing.some(s => s.systemType === subSysType);
    let updated: HybridSubSystemConfig[] = [];
    if (exists) {
      if (existing.length <= 1) return;
      updated = existing.filter(s => s.systemType !== subSysType);
    } else {
      updated = [...existing, { systemType: subSysType, ratioPercent: 30 }];
    }

    const totalRatio = updated.reduce((acc, curr) => acc + curr.ratioPercent, 0);
    updated = updated.map(s => ({
      ...s,
      ratioPercent: Math.round((s.ratioPercent / totalRatio) * 100)
    }));

    onUpdateSubItem({
      ...item,
      hybridSubSystems: updated
    });
  };

  const handleRatioChange = (item: BuildingSubItem, subSysType: SystemType, newRatio: number) => {
    const existing = item.hybridSubSystems || [];
    const updated = existing.map(s => {
      if (s.systemType === subSysType) {
        return { ...s, ratioPercent: Math.max(1, Math.min(99, newRatio)) };
      }
      return s;
    });

    onUpdateSubItem({
      ...item,
      hybridSubSystems: updated
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">建筑分类与功能子项 (Building Sub-items)</h2>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            按公共建筑/园区划分酒店、办公、商场、大型超市等子项。支持**复合空调系统**（组合多种基础冷热源系统并自定义负荷占比）！
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>添加建筑子项</span>
        </button>
      </div>

      {/* Shared Plant Summary Banner */}
      {sharedItems.length > 0 && (
        <div className="bg-blue-950/50 border border-blue-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-base flex items-center space-x-2">
                <span>集中共用冷热源机房已启用</span>
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                  共 {sharedItems.length} 个建筑共享
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                包含建筑：{sharedItems.map(i => i.name).join(' + ')}（共用集中冷热源面积共计 <span className="font-bold text-blue-300">{totalSharedArea.toLocaleString()} m²</span>）
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Sub-item Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="bg-slate-800/90 border border-blue-500/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-blue-300 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>新增建筑功能子项</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              取消
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">子项名称</label>
              <input
                type="text"
                value={newSubItem.name}
                onChange={e => setNewSubItem({ ...newSubItem, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">建筑分类</label>
              <select
                value={newSubItem.type}
                onChange={e => setNewSubItem({ ...newSubItem, type: e.target.value as BuildingType })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.values(BUILDING_TYPES_META).map(meta => (
                  <option key={meta.id} value={meta.id}>{meta.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">建筑面积 (m²)</label>
              <input
                type="number"
                min={100}
                max={500000}
                value={newSubItem.area}
                onChange={e => setNewSubItem({ ...newSubItem, area: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">空调系统形式</label>
              <select
                value={newSubItem.systemType}
                onChange={e => setNewSubItem({ ...newSubItem, systemType: e.target.value as SystemType })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.values(SYSTEM_TYPES_META).map(sys => (
                  <option key={sys.id} value={sys.id}>{sys.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1 text-sm">
            <input
              type="checkbox"
              id="sharedCheck"
              checked={newSubItem.useSharedPlant}
              onChange={e => setNewSubItem({ ...newSubItem, useSharedPlant: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sharedCheck" className="text-slate-300 font-medium">
              和其他建筑共用集中冷热源机房（与其他共用子项合并负荷选型）
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md"
            >
              确定保存并分配系统
            </button>
          </div>
        </form>
      )}

      {/* Grid of Sub-item Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subItems.map((item) => {
          const isActive = item.id === activeItemId;
          const meta = BUILDING_TYPES_META[item.type];
          const coolkW = (item.area * item.coolingIndex) / 1000;
          const heatkW = (item.area * item.heatingIndex) / 1000;

          return (
            <div
              key={item.id}
              onClick={() => onSelectSubItem(item.id)}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-500/10'
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/30'
              }`}
            >
              {isActive && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[10px] rounded-full shadow-md">
                  当前选中
                </span>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{item.name}</h3>
                    <span className="text-xs text-slate-300 font-medium">{meta.name}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (subItems.length > 1) onDeleteSubItem(item.id);
                  }}
                  className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  title="删除该子项"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">建筑面积：</span>
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      value={item.area}
                      onChange={(e) => onUpdateSubItem({ ...item, area: Math.max(1, Number(e.target.value)) })}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-sm font-bold text-white focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300">m²</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">冷/热负荷：</span>
                  <span className="text-blue-400 font-bold">{coolkW.toFixed(0)} kW / <span className="text-rose-400">{heatkW.toFixed(0)} kW</span></span>
                </div>
              </div>

              {/* Shared Plant checkbox on card */}
              <div className="mt-3 flex items-center justify-between text-xs bg-slate-850 p-2.5 rounded-lg border border-slate-800" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-slate-300 flex items-center space-x-1">
                  <Link2 className="w-4 h-4 text-emerald-400" />
                  <span>共用集中冷热源机房</span>
                </span>
                <input
                  type="checkbox"
                  checked={!!item.useSharedPlant}
                  onChange={(e) => onUpdateSubItem({ ...item, useSharedPlant: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                    <Settings2 className="w-4 h-4 text-emerald-400" />
                    <span>EPW气象城市：</span>
                  </label>
                  <select
                    value={item.city || '上海'}
                    onChange={(e) => {
                      onUpdateSubItem({ ...item, city: e.target.value as any });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="上海">上海 (夏热冬冷)</option>
                    <option value="北京">北京 (寒冷北方)</option>
                    <option value="广州">广州 (夏热冬暖)</option>
                    <option value="成都">成都 (西南盆地)</option>
                    <option value="武汉">武汉 (华中夏热)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                    <Settings2 className="w-4 h-4 text-blue-400" />
                    <span>空调系统形式：</span>
                  </label>
                  <select
                    value={item.systemType}
                    onChange={(e) => {
                      const sysType = e.target.value as SystemType;
                      onUpdateSubItem({ 
                        ...item, 
                        systemType: sysType,
                        hybridSubSystems: sysType === 'hybrid' ? [
                          { systemType: 'chiller_boiler', ratioPercent: 60 },
                          { systemType: 'vrf', ratioPercent: 40 }
                        ] : item.hybridSubSystems
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-blue-300 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.values(SYSTEM_TYPES_META).map((sys) => (
                      <option key={sys.id} value={sys.id}>{sys.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isActive && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-md">
                  当前选中编辑
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 复合空调系统配置拓展面板 */}
      {activeItem && activeItem.systemType === 'hybrid' && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/30 pb-3">
            <div className="flex items-center space-x-2 text-white">
              <Layers2 className="w-6 h-6 text-purple-400" />
              <h3 className="text-base font-bold text-purple-200">
                【{activeItem.name}】复合空调系统多源组合配置面板
              </h3>
            </div>
            <span className="text-sm text-purple-300 font-semibold bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
              单体总冷负荷: {((activeItem.area * activeItem.coolingIndex) / 1000).toFixed(0)} kW
            </span>
          </div>

          <p className="text-sm text-slate-300">
            选择参与复合的基础系统类型，并自定义各个子系统承担的冷/热负荷比例 (%)：
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {['chiller_boiler', 'air_heat_pump', 'vrf', 'district_energy', 'split_ac'].map((sysKey) => {
              const sysMeta = SYSTEM_TYPES_META[sysKey as SystemType];
              const subConfigs = activeItem.hybridSubSystems || [
                { systemType: 'chiller_boiler', ratioPercent: 60 },
                { systemType: 'vrf', ratioPercent: 40 }
              ];
              const isChecked = subConfigs.some(s => s.systemType === sysKey);
              const curConfig = subConfigs.find(s => s.systemType === sysKey);
              const totalCooling = (activeItem.area * activeItem.coolingIndex) / 1000;
              const subCoolingkW = curConfig ? (totalCooling * curConfig.ratioPercent) / 100 : 0;

              return (
                <div 
                  key={sysKey}
                  className={`p-4 rounded-xl border transition-all space-y-2 ${
                    isChecked
                      ? 'bg-slate-800/90 border-purple-500/60 ring-1 ring-purple-500/30'
                      : 'bg-slate-900/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleHybridSub(activeItem, sysKey as SystemType)}
                        className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                      />
                      <span>{sysMeta.name.split(' ')[1] || sysMeta.name}</span>
                    </label>

                    {isChecked && (
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                        {subCoolingkW.toFixed(0)} kW
                      </span>
                    )}
                  </div>

                  {isChecked && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-750/80">
                      <span className="text-slate-300 text-xs">承担负荷占比:</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min={5}
                          max={95}
                          value={curConfig?.ratioPercent || 50}
                          onChange={(e) => handleRatioChange(activeItem, sysKey as SystemType, Number(e.target.value))}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-bold text-purple-300 text-sm"
                        />
                        <span className="text-slate-300 font-bold">%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
