import React, { useState } from 'react';
import { X, Check, Search, ShieldCheck, Cpu } from 'lucide-react';
import { getMergedEquipmentCatalog } from '../data/equipmentCatalog';
import type { EquipmentCategory, CatalogEquipmentItem } from '../data/equipmentCatalog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category: EquipmentCategory;
  categoryTitle: string;
  targetSingleValue: number; // 理论计算出的单台容量/流量
  selectedCatalogId?: string;
  onSelectProduct: (item: CatalogEquipmentItem) => void;
}

export const EquipmentCatalogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  category,
  categoryTitle,
  targetSingleValue,
  selectedCatalogId,
  onSelectProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  if (!isOpen) return null;

  const allItems = getMergedEquipmentCatalog();
  const categoryItems = allItems.filter(item => item.category === category);

  // 获取该类别下的所有可选品牌
  const availableBrands = Array.from(new Set(categoryItems.map(item => item.brand)));

  // 筛选过滤
  const filteredItems = categoryItems.filter(item => {
    const matchBrand = selectedBrandFilter === 'all' || item.brand === selectedBrandFilter;
    const matchSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBrand && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>市场真实品牌设备参数选型库 — 【{categoryTitle}】</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                理论计算折算单台需 <span className="text-emerald-400 font-bold">{targetSingleValue.toFixed(1)}</span> {category === 'pump' || category === 'cooling_tower' ? 'm³/h' : 'kW'}，请选择真实主流品牌规格（电量取自设备真实铭牌电功率）：
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-300 font-semibold whitespace-nowrap">品牌筛选:</span>
            <button
              onClick={() => setSelectedBrandFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedBrandFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              全部品牌 ({categoryItems.length})
            </button>
            {availableBrands.map(b => (
              <button
                key={b}
                onClick={() => setSelectedBrandFilter(b)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedBrandFilter === b
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索品牌或产品型号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Products Table List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/90 text-slate-200 font-bold border-b border-slate-700">
                  <th className="py-3 px-3">品牌厂商</th>
                  <th className="py-3 px-3">产品型号与名称</th>
                  <th className="py-3 px-3 text-emerald-300">额定物理容量/流量</th>
                  <th className="py-3 px-3 text-amber-300">真实铭牌电功率 (kW)</th>
                  <th className="py-3 px-3 text-blue-300">
                    {category === 'vrf' ? '全年能效比 (APF)' : (category === 'boiler' || category === 'vacuum_boiler' ? '锅炉热效率' : '额定 COP / 效率')}
                  </th>
                  {category === 'boiler' && <th className="py-3 px-3 text-rose-300">额定耗气量 (m³/h)</th>}
                  <th className="py-3 px-3">产品余量匹配状态</th>
                  <th className="py-3 px-3 text-center">操作选型</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredItems.map(item => {
                  const isSelected = selectedCatalogId === item.id;
                  const ratio = targetSingleValue > 0 ? item.ratedCapacitykW / targetSingleValue : 1;
                  const diffPercent = ((item.ratedCapacitykW - targetSingleValue) / targetSingleValue) * 100;

                  const isIdealMatch = ratio >= 1.0 && ratio <= 1.15;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/60 transition-colors ${
                        isSelected ? 'bg-blue-950/40 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {item.brand}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">型号: {item.model}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        {item.ratedCapacitykW} {category === 'pump' || category === 'cooling_tower' ? 'm³/h' : 'kW'}
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-300 text-sm">
                        {item.ratedPowerkW} kW
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-300">
                        {category === 'vrf' ? (
                          <span className="text-emerald-400 font-black">{item.copOrEff.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">(APF)</span></span>
                        ) : category === 'boiler' || category === 'vacuum_boiler' ? (
                          `${item.copOrEff}%`
                        ) : (
                          item.copOrEff
                        )}
                      </td>
                      {category === 'boiler' && (
                        <td className="py-3 px-3 font-bold text-rose-400">
                          {item.gasFlowm3h || '-'} m³/h
                        </td>
                      )}
                      <td className="py-3 px-3">
                        {isIdealMatch ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>推荐黄金匹配 (+{diffPercent.toFixed(1)}%)</span>
                          </span>
                        ) : ratio < 1.0 ? (
                          <span className="text-rose-400 font-semibold text-[11px]">
                            负荷偏低 ({diffPercent.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-amber-300 font-semibold text-[11px]">
                            安全余量较足 (+{diffPercent.toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            onSelectProduct(item);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>已选型</span>
                            </>
                          ) : (
                            <span>选用此型号</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>* 提示：选定具体物理产品后，系统将依据设备真实铭牌输入电功率与耗气量精准计算项目年能耗费用！</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
          >
            关闭选型窗口
          </button>
        </div>

      </div>
    </div>
  );
};
