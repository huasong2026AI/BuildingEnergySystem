import React, { useState } from 'react';
import { 
  X, Search, Plus, Trash2, Edit3, Layers, Cpu, 
  Flame, Wind, Droplet, Sparkles, RotateCcw
} from 'lucide-react';
import { 
  getMergedEquipmentCatalog, addCustomCatalogEquipment, updateCatalogEquipment, 
  deleteCustomCatalogEquipment, resetCatalogToDefault,
  type EquipmentCategory, type CatalogEquipmentItem, CATEGORY_BRANDS
} from '../data/equipmentCatalog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_TABS: Array<{ id: EquipmentCategory | 'all'; name: string; icon: any }> = [
  { id: 'all', name: '全部设备库', icon: Layers },
  { id: 'magnetic_chiller', name: '磁悬浮冷水机组', icon: Sparkles },
  { id: 'chiller', name: '变频水冷螺杆/离心冷机', icon: Cpu },
  { id: 'vacuum_boiler', name: '全预混冷凝真空热水锅炉', icon: Flame },
  { id: 'boiler', name: '常压燃气热水锅炉', icon: Flame },
  { id: 'pump', name: '循环水泵 (冷水/热水/冷却)', icon: Droplet },
  { id: 'cooling_tower', name: '冷却塔 (冷却水散热)', icon: Wind },
  { id: 'achp', name: '风冷螺杆/模块热泵 (ACHP)', icon: Wind },
  { id: 'vrf', name: 'VRF 变频多联机组', icon: Cpu },
];

export const EquipmentBrandManagerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [catalogItems, setCatalogItems] = useState<CatalogEquipmentItem[]>(() => getMergedEquipmentCatalog());
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  
  // 表单状态：新增或编辑
  const [formMode, setFormMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CatalogEquipmentItem>>({
    category: 'magnetic_chiller',
    brand: '海尔 (Haier)',
    model: '',
    name: '',
    ratedCapacitykW: 1200,
    ratedPowerkW: 176.5,
    copOrEff: 6.8,
    iplvOrPartLoadCop: 11.2,
    ratedFlowm3h: 206.4,
    gasFlowm3h: 0,
    priceRmbTenThousand: 98,
    description: ''
  });

  if (!isOpen) return null;

  const refreshCatalog = () => {
    setCatalogItems(getMergedEquipmentCatalog());
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setEditingId(null);
    setFormData({
      category: activeCategory === 'all' ? 'magnetic_chiller' : activeCategory,
      brand: activeCategory === 'all' ? '海尔 (Haier)' : (CATEGORY_BRANDS[activeCategory]?.split(' / ')[0] || '约克 (York)'),
      model: '',
      name: '',
      ratedCapacitykW: 1000,
      ratedPowerkW: 160,
      copOrEff: 6.2,
      iplvOrPartLoadCop: 9.5,
      ratedFlowm3h: 172,
      priceRmbTenThousand: 50,
      description: ''
    });
  };

  const handleOpenEditForm = (item: CatalogEquipmentItem) => {
    setFormMode('edit');
    setEditingId(item.id);
    setFormData({ ...item });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.model || !formData.brand) {
      alert('请完整填写设备名称、品牌和型号！');
      return;
    }

    if (formMode === 'add') {
      const newItem: CatalogEquipmentItem = {
        id: `custom-${Date.now()}`,
        category: formData.category as EquipmentCategory || 'magnetic_chiller',
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        name: formData.name.trim(),
        ratedCapacitykW: Number(formData.ratedCapacitykW) || 100,
        ratedPowerkW: Number(formData.ratedPowerkW) || 20,
        copOrEff: Number(formData.copOrEff) || 5.0,
        iplvOrPartLoadCop: formData.iplvOrPartLoadCop ? Number(formData.iplvOrPartLoadCop) : undefined,
        ratedFlowm3h: formData.ratedFlowm3h ? Number(formData.ratedFlowm3h) : undefined,
        gasFlowm3h: formData.gasFlowm3h ? Number(formData.gasFlowm3h) : undefined,
        priceRmbTenThousand: formData.priceRmbTenThousand ? Number(formData.priceRmbTenThousand) : undefined,
        description: formData.description?.trim() || '用户自定义补充设备',
        isCustom: true
      };
      addCustomCatalogEquipment(newItem);
    } else if (formMode === 'edit' && editingId) {
      const updatedItem: CatalogEquipmentItem = {
        id: editingId,
        category: formData.category as EquipmentCategory || 'magnetic_chiller',
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        name: formData.name.trim(),
        ratedCapacitykW: Number(formData.ratedCapacitykW) || 100,
        ratedPowerkW: Number(formData.ratedPowerkW) || 20,
        copOrEff: Number(formData.copOrEff) || 5.0,
        iplvOrPartLoadCop: formData.iplvOrPartLoadCop ? Number(formData.iplvOrPartLoadCop) : undefined,
        ratedFlowm3h: formData.ratedFlowm3h ? Number(formData.ratedFlowm3h) : undefined,
        gasFlowm3h: formData.gasFlowm3h ? Number(formData.gasFlowm3h) : undefined,
        priceRmbTenThousand: formData.priceRmbTenThousand ? Number(formData.priceRmbTenThousand) : undefined,
        description: formData.description?.trim() || '',
        isCustom: true
      };
      updateCatalogEquipment(updatedItem);
    }

    refreshCatalog();
    setFormMode('none');
    setEditingId(null);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`确定要从设备库中删除【${name}】吗？`)) {
      deleteCustomCatalogEquipment(id);
      refreshCatalog();
    }
  };

  const handleResetToDefault = () => {
    if (confirm('确定要恢复出厂默认设备库吗？这将重置所有设备的修改和自定义项。')) {
      resetCatalogToDefault();
      refreshCatalog();
    }
  };

  // 筛选过滤
  const filteredItems = catalogItems.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchBrand = selectedBrandFilter === 'all' || item.brand.includes(selectedBrandFilter);
    const matchSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchCategory && matchBrand && matchSearch;
  });

  const availableBrands = Array.from(new Set(catalogItems.map(item => item.brand.split(' ')[0])));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-[98vw] max-w-[1700px] h-[82vh] max-h-[82vh] shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Modal Top Header (全宽可见，不会被切断，flex-shrink-0) */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-xl shadow-md font-black">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  暖通设备品牌与规格参数库 (HVAC Equipment Brand & Model Database)
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  当前库共 {catalogItems.length} 款设备 (每品类精选2大顶级品牌，支持全量修改/删除)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                包含磁悬浮冷水机组、变频螺杆/离心冷机、全预混真空锅炉等真实铭牌参数，支持自由修改、删除与补充录入
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleResetToDefault}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
              title="恢复至出厂预置设备库"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>恢复默认库</span>
            </button>

            <button
              onClick={formMode === 'add' ? () => setFormMode('none') : handleOpenAddForm}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{formMode === 'add' ? '取消新增' : '➕ 补充新设备型号'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Navigation Bar (自适应换行，确保风冷热泵、VRF等全部10个分类100%可见，flex-shrink-0) */}
        <div className="flex-shrink-0 px-6 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center gap-2 py-3 text-sm font-bold">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.id === 'all' 
              ? catalogItems.length 
              : catalogItems.filter(i => i.category === tab.id).length;
            const isActive = activeCategory === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setSelectedBrandFilter('all');
                }}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-400/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{tab.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-black ${isActive ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add / Edit Equipment Form (字号放大、高对比度) */}
        {formMode !== 'none' && (
          <form onSubmit={handleFormSubmit} className="p-6 bg-gradient-to-b from-slate-850 to-slate-900 border-b border-slate-750 space-y-4 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-750 pb-2">
              <span className="font-bold text-emerald-400 text-base flex items-center space-x-2">
                {formMode === 'edit' ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{formMode === 'edit' ? `修改设备参数 — 【${formData.name}】` : '录入并补充新的设备品牌型号参数'}</span>
              </span>
              <span className="text-xs text-slate-400">修改或录入后将自动实时同步至系统选型与能耗计算</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">设备类别</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm"
                >
                  <option value="magnetic_chiller">磁悬浮冷水机组</option>
                  <option value="chiller">变频水冷螺杆/离心冷机</option>
                  <option value="vacuum_boiler">全预混冷凝真空热水锅炉</option>
                  <option value="boiler">常压燃气热水锅炉</option>
                  <option value="pump">循环水泵 (冷水/热水/冷却)</option>
                  <option value="cooling_tower">冷却塔 (冷却水散热)</option>
                  <option value="achp">风冷螺杆/模块热泵 (ACHP)</option>
                  <option value="vrf">VRF 变频多联机组</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">品牌名称 (如：海尔/格力/开利/约克/方快/双良/威乐/凯泉/金日/良机/特灵/麦克维尔/东芝/大金)</label>
                <input
                  type="text"
                  required
                  placeholder="例如：海尔 (Haier)"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">设备型号 (Model)</label>
                <input
                  type="text"
                  required
                  placeholder="例如：MX-1200-MagLev"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">产品全称 (Name)</label>
                <input
                  type="text"
                  required
                  placeholder="例如：海尔 磁悬浮无油变频离心冷水机组 1200kW"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">额定容量/流量 (kW 或 m³/h)</label>
                <input
                  type="number"
                  required
                  value={formData.ratedCapacitykW}
                  onChange={e => setFormData({ ...formData, ratedCapacitykW: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">物理铭牌真实电功率 (kW)</label>
                <input
                  type="number"
                  required
                  value={formData.ratedPowerkW}
                  onChange={e => setFormData({ ...formData, ratedPowerkW: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">额定 COP / 效率 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.copOrEff}
                  onChange={e => setFormData({ ...formData, copOrEff: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-blue-400 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold text-xs">部分负荷 IPLV (选填)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="如 11.2"
                  value={formData.iplvOrPartLoadCop || ''}
                  onChange={e => setFormData({ ...formData, iplvOrPartLoadCop: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-purple-400 font-bold text-sm"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="text-slate-300 block mb-1 font-semibold text-xs">产品特色与工程描述 (Description)</label>
                <input
                  type="text"
                  placeholder="例如：无油磁悬浮轴承，50%部分负荷下COP突破10.8，适用于高效绿建冷站"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm"
                />
              </div>

              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm shadow-md transition-all cursor-pointer"
                >
                  {formMode === 'edit' ? '保存修改' : '保存入库'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('none');
                    setEditingId(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  取消
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Controls (大字号，flex-shrink-0) */}
        <div className="flex-shrink-0 px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索品牌 (海尔/格力/约克/开利...)、型号 (MX/YZ/19DV...) 或参数..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-3 text-slate-300 text-sm">
            <span>按品牌过滤:</span>
            <select
              value={selectedBrandFilter}
              onChange={e => setSelectedBrandFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-bold text-sm focus:outline-none"
            >
              <option value="all">全部品牌 ({availableBrands.length}个)</option>
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Table (增加下方水平与右侧垂直滚动条，表头置顶粘性锁定) */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-950/40 custom-scroll">
            <table className="w-full min-w-[1450px] text-left border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-800 shadow-md">
                <tr className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700 text-xs sm:text-sm">
                  <th className="py-3.5 px-4">所属分类</th>
                  <th className="py-3.5 px-4">品牌 (Brand)</th>
                  <th className="py-3.5 px-4">产品型号 (Model)</th>
                  <th className="py-3.5 px-4 text-white">产品中文全称</th>
                  <th className="py-3.5 px-4 text-emerald-400">额定容量/流量</th>
                  <th className="py-3.5 px-4 text-amber-400">铭牌真实功率</th>
                  <th className="py-3.5 px-4 text-blue-400">额定 COP/效率</th>
                  <th className="py-3.5 px-4 text-purple-400">部分负荷 IPLV</th>
                  <th className="py-3.5 px-4">参考单价</th>
                  <th className="py-3.5 px-4">产品特色说明</th>
                  <th className="py-3.5 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                      未检索到匹配的设备型号，您可以点击右上角【➕ 补充新设备型号】录入！
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold whitespace-nowrap">
                            {CATEGORY_TABS.find(t => t.id === item.category)?.name.split(' (')[0] || item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap text-sm">
                          {item.brand}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300 font-semibold whitespace-nowrap text-sm">
                          {item.model}
                        </td>
                        <td className="py-3 px-4 font-bold text-white text-sm">
                          <div className="flex items-center space-x-2">
                            <span>{item.name}</span>
                            {item.isCustom && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-xs font-bold">
                                已自定义
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-300 whitespace-nowrap text-base">
                          {item.ratedCapacitykW} <span className="text-xs font-normal text-slate-400">{item.category === 'pump' || item.category === 'cooling_tower' ? 'm³/h' : 'kW'}</span>
                        </td>
                        <td className="py-3 px-4 font-black text-amber-300 whitespace-nowrap text-base">
                          {item.ratedPowerkW} <span className="text-xs font-normal text-slate-400">kW</span>
                        </td>
                        <td className="py-3 px-4 font-black text-blue-300 whitespace-nowrap text-base">
                          {item.copOrEff > 20 ? `${item.copOrEff}%` : item.copOrEff.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-black text-purple-300 whitespace-nowrap text-base">
                          {item.iplvOrPartLoadCop ? item.iplvOrPartLoadCop.toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-300 whitespace-nowrap text-sm">
                          {item.priceRmbTenThousand ? `¥${item.priceRmbTenThousand}万` : '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400 max-w-sm truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600/30 rounded-lg transition-colors cursor-pointer"
                              title="修改设备参数"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors cursor-pointer"
                              title="删除此设备型号"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer (flex-shrink-0) */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-slate-400">
            * 每个品类严格保留 2 大主流标杆品牌。所有型号支持任意【编辑修改】与【删除】，也可随时点击【恢复默认库】重置。
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold border border-slate-700 transition-all cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
