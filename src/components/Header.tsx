import React, { useState, useEffect } from 'react';
import { Building2, Zap, DollarSign, FileText, Leaf, Maximize2, Minimize2, Wrench, Sparkles, Moon, SlidersHorizontal, Layers, BookOpen } from 'lucide-react';
import type { ProjectEnergySummary, EnergyTariffConfig } from '../types/hvac';

interface HeaderProps {
  summary: ProjectEnergySummary;
  activeTab: string;
  theme: 'dark' | 'light';
  tariffConfig: EnergyTariffConfig;
  onToggleTheme: () => void;
  onOpenTariffModal: () => void;
  onOpenBrandCatalog: () => void;
  onOpenPresentationModal: () => void;
  onSelectTab: (tab: 'subItems' | 'equipment' | 'schematic' | 'analysis' | 'retrofit') => void;
  onResetSample: () => void;
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  summary, 
  activeTab, 
  theme, 
  tariffConfig,
  onToggleTheme, 
  onOpenTariffModal,
  onOpenBrandCatalog,
  onOpenPresentationModal,
  onSelectTab, 
  onResetSample: _onResetSample, 
  onExportReport 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl backdrop-blur-md bg-opacity-95 w-full">
      <div className="w-full px-6 lg:px-10 h-20 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-300 bg-clip-text text-transparent">
                建筑能耗分析与既有系统改造
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                绿建低碳版 v5.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              面向新建与既有建筑的自动化设备容量配比、红字偏差预警、系统改造与 AI 智能寻优
            </p>
          </div>
        </div>

        {/* Global Summary Stats Cards */}
        <div className="hidden xl:flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">总建筑面积</div>
              <div className="text-sm font-bold text-white">
                {summary.totalArea.toLocaleString()} <span className="text-xs font-normal text-slate-400">m²</span>
              </div>
            </div>
          </div>

          {/* Quick Tariff Trigger Pill */}
          <button
            onClick={onOpenTariffModal}
            className="flex items-center space-x-2.5 bg-slate-800/90 hover:bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition-all text-left group shadow-sm cursor-pointer"
            title="点击设定分时电价(峰谷平)与天然气单价"
          >
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                <span>能源价格 (峰谷平/燃气)</span>
                <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-amber-300">
                电 ¥{tariffConfig.averageElectricityPrice.toFixed(2)}/度 <span className="text-slate-400 text-xs font-normal">| 气 ¥{tariffConfig.gasPrice.toFixed(2)}/m³</span>
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">年能耗运行费用</div>
              <div className="text-sm font-bold text-emerald-400">
                {(summary.annualCostRmb / 10000).toFixed(2)} <span className="text-xs font-normal text-slate-400">万元/年</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">年碳排放当量</div>
              <div className="text-sm font-bold text-teal-300">
                {summary.annualCarbonTons.toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO₂</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons & Top-Right Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Theme Palette Switcher Button */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              theme === 'light'
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300 shadow-emerald-500/10'
                : 'bg-slate-800 hover:bg-slate-750 text-emerald-300 border-slate-700'
            }`}
            title="切换界面色调（深邃科技蓝 / 绿建低碳生态雅致）"
          >
            {theme === 'light' ? (
              <>
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>绿建生态白</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span>深邃科技蓝</span>
              </>
            )}
          </button>

          {/* Top-Right Retrofit Button (既有系统改造) */}
          <button
            onClick={() => onSelectTab('retrofit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              activeTab === 'retrofit'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            <Wrench className="w-4 h-4 text-emerald-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>既有系统改造 & AI 优化</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            title="一键全屏展示"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-400" />}
            <span>{isFullscreen ? '退出全屏' : '全屏模式'}</span>
          </button>

          <button
            onClick={onOpenBrandCatalog}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-emerald-300 text-xs font-bold border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-sm group cursor-pointer"
            title="打开设备品牌型号库，查看或自主新增扩充设备参数"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>设备品牌表</span>
          </button>

          <button
            onClick={onOpenPresentationModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-purple-950/60 text-purple-300 text-xs font-bold border border-purple-500/40 hover:border-purple-400 transition-all shadow-sm group cursor-pointer"
            title="打开 13 页项目汇报 PPT 交互演示模式"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>项目汇报 PPT</span>
          </button>

          <button
            onClick={onExportReport}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 border border-emerald-400/30 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>导出分析报告</span>
          </button>
        </div>

      </div>
    </header>
  );
};
