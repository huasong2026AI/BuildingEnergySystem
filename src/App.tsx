import { useState, useMemo } from 'react';
import type { BuildingSubItem, EnergyTariffConfig } from './types/hvac';
import { INITIAL_SUB_ITEMS } from './data/initialProject';
import { calculateProjectSummary } from './hvacEngine/calculator';
import { DEFAULT_TARIFF_CONFIG } from './hvacEngine/constants';
import { Header } from './components/Header';
import { EnergyTariffModal } from './components/EnergyTariffModal';
import { EquipmentBrandManagerModal } from './components/EquipmentBrandManagerModal';
import { ProjectPresentationModal } from './components/ProjectPresentationModal';
import { AiAnalysisReportModal } from './components/AiAnalysisReportModal';
import { BuildingSubItemsManager } from './components/BuildingSubItemsManager';
import { EquipmentConfigTable } from './components/EquipmentConfigTable';
import { InteractiveSystemSchematic } from './components/InteractiveSystemSchematic';
import { EnergyAnalysisDashboard } from './components/EnergyAnalysisDashboard';
import { RetrofitOptimizer } from './components/RetrofitOptimizer';
import { 
  Building2, Sliders, Activity, BarChart3, AlertTriangle, Wrench, Sparkles 
} from 'lucide-react';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tariffConfig, setTariffConfig] = useState<EnergyTariffConfig>(DEFAULT_TARIFF_CONFIG);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isBrandCatalogModalOpen, setIsBrandCatalogModalOpen] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [isAiReportModalOpen, setIsAiReportModalOpen] = useState(false);

  const [subItems, setSubItems] = useState<BuildingSubItem[]>(INITIAL_SUB_ITEMS);
  const [activeItemId, setActiveItemId] = useState<string>(INITIAL_SUB_ITEMS[0].id);
  const [activeTab, setActiveTab] = useState<'subItems' | 'equipment' | 'schematic' | 'analysis' | 'retrofit'>('subItems');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const summary = useMemo(() => {
    return calculateProjectSummary(subItems, tariffConfig);
  }, [subItems, tariffConfig]);

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
    setIsAiReportModalOpen(true);
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'theme-light bg-[#f2f6f4] text-[#132a1e]' : 'bg-slate-950 text-slate-100'} font-sans selection:bg-emerald-500 selection:text-white pb-16 w-full transition-colors duration-200`}>
      
      {/* 0. Global Energy Tariff Configuration Modal */}
      <EnergyTariffModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
        tariffConfig={tariffConfig}
        onSaveTariffConfig={setTariffConfig}
      />

      {/* 0.1 Equipment Brand & Model Database Manager Modal */}
      <EquipmentBrandManagerModal
        isOpen={isBrandCatalogModalOpen}
        onClose={() => setIsBrandCatalogModalOpen(false)}
      />

      {/* 0.2 Interactive 13-Slide Project Presentation Modal */}
      <ProjectPresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
      />

      {/* 0.3 AI Engineering Analysis & Decision Report Modal (Gemini 3.5 Engine) */}
      <AiAnalysisReportModal
        isOpen={isAiReportModalOpen}
        onClose={() => setIsAiReportModalOpen(false)}
        subItems={subItems}
        projectSummary={summary}
        tariffConfig={tariffConfig}
        initialTab={activeTab === 'retrofit' ? 'retrofit' : 'new_building'}
      />

      {/* 1. Header with Top-Right Retrofit Entrance Button, Tariff Pill, Brand Catalog, Presentation PPT & Theme Switcher */}
      <Header
        summary={summary}
        activeTab={activeTab}
        theme={theme}
        tariffConfig={tariffConfig}
        onToggleTheme={toggleTheme}
        onOpenTariffModal={() => setIsTariffModalOpen(true)}
        onOpenBrandCatalog={() => setIsBrandCatalogModalOpen(true)}
        onOpenPresentationModal={() => setIsPresentationModalOpen(true)}
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
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. 建筑分类与面积 (Sub-items)</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-slate-950/60 rounded-full text-emerald-200">
              {subItems.length} 个子项
            </span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'equipment'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40'
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
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40'
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
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40'
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeItemId === item.id
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <EquipmentConfigTable
              subItem={activeSubItem}
              allSubItems={subItems}
              onUpdateSubItem={handleUpdateSubItem}
            />
          </div>
        )}

        {activeTab === 'schematic' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <span className="text-xs text-slate-400 font-medium">切换查看子项拓扑图：</span>
              {subItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeItemId === item.id
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <InteractiveSystemSchematic
              subItem={activeSubItem}
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <EnergyAnalysisDashboard
              summary={summary}
              subItems={subItems}
              tariffConfig={tariffConfig}
              onOpenTariffModal={() => setIsTariffModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'retrofit' && (
          <div className="space-y-6">
            <RetrofitOptimizer
              tariffConfig={tariffConfig}
              onUpdateTariffConfig={setTariffConfig}
            />
          </div>
        )}

      </main>

    </div>
  );
}

export default App;
