import React, { useState, useEffect } from 'react';
import { Building2, Zap, DollarSign, Leaf, Maximize2, Minimize2, Wrench, Sparkles, Moon, SlidersHorizontal, Layers, BookOpen } from 'lucide-react';
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
      <div className="w-full px-5 lg:px-8 min-h-[72px] h-auto py-2 flex items-center justify-between gap-4 overflow-x-auto">
        
        {/* Brand & Logo (干净大标题，已按要求删除副标题灰字与绿建低碳版v5.0标签) */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-blue-500 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-300 bg-clip-text text-transparent whitespace-nowrap">
            建筑能耗分析与既有系统改造
          </h1>
        </div>

        {/* Global Summary Stats Cards (统一高度 h-11、等高居中对齐、文本不折行) */}
        <div className="hidden xl:flex items-center space-x-3 flex-shrink-0">
          <div className="h-11 flex items-center space-x-2.5 bg-slate-800/85 px-3 rounded-xl border border-slate-700/60 whitespace-nowrap shadow-xs">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium leading-none">总建筑面积</span>
              <span className="text-xs font-bold text-white mt-1 leading-none">
                {summary.totalArea.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">m²</span>
              </span>
            </div>
          </div>

          {/* Quick Tariff Trigger Pill (严格统一等高 h-11，防止电价气价框突兀换行) */}
          <button
            onClick={onOpenTariffModal}
            className="h-11 flex items-center space-x-2.5 bg-slate-800/90 hover:bg-emerald-950/60 px-3 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition-all text-left group shadow-xs cursor-pointer whitespace-nowrap"
            title="点击设定分时电价(峰谷平)与天然气单价"
          >
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1 leading-none">
                <span>能源单价 (峰谷平)</span>
                <SlidersHorizontal className="w-2.5 h-2.5 text-emerald-400" />
              </div>
              <div className="text-xs font-bold text-amber-300 mt-1 leading-none">
                电 ¥{tariffConfig.averageElectricityPrice.toFixed(2)}/度 <span className="text-slate-400 font-normal">| 气 ¥{tariffConfig.gasPrice.toFixed(2)}/m³</span>
              </div>
            </div>
          </button>

          <div className="h-11 flex items-center space-x-2.5 bg-slate-800/85 px-3 rounded-xl border border-slate-700/60 whitespace-nowrap shadow-xs">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium leading-none">年能耗运行费用</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 leading-none">
                {(summary.annualCostRmb / 10000).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">万元/年</span>
              </span>
            </div>
          </div>

          <div className="h-11 flex items-center space-x-2.5 bg-slate-800/85 px-3 rounded-xl border border-slate-700/60 whitespace-nowrap shadow-xs">
            <div className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium leading-none">年碳排放当量</span>
              <span className="text-xs font-bold text-teal-300 mt-1 leading-none">
                {summary.annualCarbonTons.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">tCO₂</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Top-Right Controls (统一高颜值圆角与高度 h-9.5，整齐平齐) */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          
          {/* Theme Palette Switcher Button */}
          <button
            onClick={onToggleTheme}
            className={`h-9.5 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer whitespace-nowrap ${
              theme === 'light'
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300 shadow-emerald-500/10'
                : 'bg-slate-800 hover:bg-slate-750 text-emerald-300 border-slate-700'
            }`}
            title="切换界面色调（深邃科技蓝 / 绿建低碳生态雅致）"
          >
            {theme === 'light' ? (
              <>
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>绿建生态白</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>深邃科技蓝</span>
              </>
            )}
          </button>

          {/* Top-Right Retrofit Button (既有系统改造) */}
          <button
            onClick={() => onSelectTab('retrofit')}
            className={`h-9.5 flex items-center space-x-1.5 px-3.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
              activeTab === 'retrofit'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>既有系统改造 & AI 优化</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="h-9.5 flex items-center space-x-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
            title="一键全屏展示"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-400" />}
            <span>{isFullscreen ? '退出全屏' : '全屏模式'}</span>
          </button>

          <button
            onClick={onOpenBrandCatalog}
            className="h-9.5 flex items-center space-x-1.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-emerald-300 text-xs font-bold border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-xs group cursor-pointer whitespace-nowrap"
            title="打开设备品牌型号库，查看或自主新增扩充设备参数"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>设备品牌表</span>
          </button>

          <button
            onClick={onOpenPresentationModal}
            className="h-9.5 flex items-center space-x-1.5 px-3 rounded-xl bg-slate-800 hover:bg-purple-950/60 text-purple-300 text-xs font-bold border border-purple-500/40 hover:border-purple-400 transition-all shadow-xs group cursor-pointer whitespace-nowrap"
            title="打开 13 页项目汇报 PPT 交互演示模式"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>项目汇报 PPT</span>
          </button>

          <button
            onClick={onExportReport}
            className="h-9.5 flex items-center space-x-1.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 border border-emerald-300/60 transition-all cursor-pointer whitespace-nowrap animate-pulse hover:animate-none"
            title="生成由 Gemini 大模型赋能的工程级 AI 深度分析报告"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>AI分析报告</span>
          </button>
        </div>

      </div>
    </header>
  );
};
