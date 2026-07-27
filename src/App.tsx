import { useState, useMemo } from 'react';
import type { BuildingSubItem } from './types/hvac';
import { INITIAL_SUB_ITEMS } from './data/initialProject';
import { calculateProjectSummary } from './hvacEngine/calculator';
import { Header } from './components/Header';
import { BuildingSubItemsManager } from './components/BuildingSubItemsManager';
import { EquipmentConfigTable } from './components/EquipmentConfigTable';
import { InteractiveSystemSchematic } from './components/InteractiveSystemSchematic';
import { EnergyAnalysisDashboard } from './components/EnergyAnalysisDashboard';
import { RetrofitOptimizer } from './components/RetrofitOptimizer';
import { 
  Building2, Sliders, Activity, BarChart3, AlertTriangle, Wrench, Sparkles 
} from 'lucide-react';

export function App() {
  const [subItems, setSubItems] = useState<BuildingSubItem[]>(INITIAL_SUB_ITEMS);
  const [activeItemId, setActiveItemId] = useState<string>(INITIAL_SUB_ITEMS[0].id);
  const [activeTab, setActiveTab] = useState<'subItems' | 'equipment' | 'schematic' | 'analysis' | 'retrofit'>('subItems');

  const summary = useMemo(() => {
    return calculateProjectSummary(subItems);
  }, [subItems]);

  const activeSubItem = useMemo(() => {
    return subItems.find(item => item.id === activeItemId) || subItems[0];
  }, [subItems, activeItemId]);

  const handleUpdateSubItem = (updatedItem: BuildingSubItem) => {
    setSubItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleAddSubItem = (newItem: BuildingSubItem) => {
    setSubItems(prev => [...prev, newItem]);
    setActiveItemId(newItem.id);
  };

  const handleDeleteSubItem = (id: string) => {
    if (subItems.length <= 1) return;
    const filtered = subItems.filter(item => item.id !== id);
    setSubItems(filtered);
    if (activeItemId === id) {
      setActiveItemId(filtered[0].id);
    }
  };

  const handleResetSample = () => {
    setSubItems(INITIAL_SUB_ITEMS);
    setActiveItemId(INITIAL_SUB_ITEMS[0].id);
  };

  const handleExportReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-16 w-full">
      
      {/* 1. Header with Top-Right Retrofit Entrance Button */}
      <Header
        summary={summary}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onResetSample={handleResetSample}
        onExportReport={handleExportReport}
      />

      {/* 2. Main Navigation Bar */}
      <div className="w-full px-6 lg:px-10 mt-6">
        <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex flex-wrap gap-3 shadow-lg backdrop-blur-md">
          
          <button
            onClick={() => setActiveTab('subItems')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'subItems'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. 建筑分类与面积 (Sub-items)</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-slate-950/60 rounded-full text-blue-200">
              {subItems.length} 个子项
            </span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'equipment'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. 设备自动配置与水温预警</span>
            {summary.discrepancies.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-red-500 text-white font-black rounded-full animate-bounce">
                {summary.discrepancies.length} 红字预警
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schematic')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'schematic'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>3. 动态系统原理图模拟</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>4. 全年能耗分析与汇总</span>
          </button>

          {/* 5. System Retrofit & AI Optimization Tab */}
          <button
            onClick={() => setActiveTab('retrofit')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'retrofit'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-500/30'
            }`}
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>5. 既有系统改造 & AI 方案诊断</span>
          </button>

        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <main className="w-full px-6 lg:px-10 mt-6">
        
        {summary.discrepancies.length > 0 && activeTab !== 'equipment' && activeTab !== 'retrofit' && (
          <div 
            onClick={() => setActiveTab('equipment')}
            className="mb-6 bg-red-950/70 border border-red-500/60 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-950/90 transition-all text-xs"
          >
            <div className="flex items-center space-x-3 text-red-300 font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              <span>
                系统提示：您有 {summary.discrepancies.length} 项水泵/机组选型容量与程序标准计算不一致，水泵偏大导致每年额外增加电费约 ¥{(summary.discrepancies.reduce((a, b) => a + b.extraAnnualCost, 0) / 10000).toFixed(2)} 万元！点击查看红字提醒...
              </span>
            </div>
            <span className="text-red-400 font-bold underline">前往调整 &rarr;</span>
          </div>
        )}

        {activeTab === 'subItems' && (
          <div className="space-y-6">
            <BuildingSubItemsManager
              subItems={subItems}
              activeItemId={activeItemId}
              onSelectSubItem={setActiveItemId}
              onUpdateSubItem={handleUpdateSubItem}
              onAddSubItem={handleAddSubItem}
              onDeleteSubItem={handleDeleteSubItem}
            />

            {activeSubItem && (
              <EquipmentConfigTable
                subItem={activeSubItem}
                allSubItems={subItems}
                onUpdateSubItem={handleUpdateSubItem}
              />
            )}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <span className="text-xs text-slate-400 font-medium">选择要校验的建筑子项：</span>
              {subItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    item.id === activeItemId
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {activeSubItem && (
              <EquipmentConfigTable
                subItem={activeSubItem}
                allSubItems={subItems}
                onUpdateSubItem={handleUpdateSubItem}
              />
            )}
          </div>
        )}

        {activeTab === 'schematic' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <span className="text-xs text-slate-400 font-medium">选择要模拟的系统拓扑图：</span>
              {subItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    item.id === activeItemId
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {activeSubItem && (
              <InteractiveSystemSchematic subItem={activeSubItem} />
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <EnergyAnalysisDashboard
            summary={summary}
            subItems={subItems}
          />
        )}

        {activeTab === 'retrofit' && (
          <RetrofitOptimizer />
        )}

      </main>

    </div>
  );
}

export default App;
