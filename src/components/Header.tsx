import React, { useState, useEffect } from 'react';
import { Building2, Zap, DollarSign, RefreshCw, FileText, Leaf, Maximize2, Minimize2, Wrench, Sparkles } from 'lucide-react';
import type { ProjectEnergySummary } from '../types/hvac';

interface HeaderProps {
  summary: ProjectEnergySummary;
  activeTab: string;
  onSelectTab: (tab: 'subItems' | 'equipment' | 'schematic' | 'analysis' | 'retrofit') => void;
  onResetSample: () => void;
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ summary, activeTab, onSelectTab, onResetSample, onExportReport }) => {
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                建筑能耗分析与空调选型系统
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                桌面宽屏专业版 v4.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              面向新建与既有建筑的自动化设备容量配比、红字偏差预警、系统改造与 AI 智能寻优
            </p>
          </div>
        </div>

        {/* Global Summary Stats Cards */}
        <div className="hidden xl:flex items-center space-x-5">
          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">总建筑面积</div>
              <div className="text-xs font-bold text-white">
                {summary.totalArea.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">m²</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">系统装机电功率</div>
              <div className="text-xs font-bold text-amber-300">
                {summary.totalInstalledPowerkW.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">kW</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">年能耗运行费用</div>
              <div className="text-xs font-bold text-emerald-400">
                {(summary.annualCostRmb / 10000).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">万元/年</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">年二氧化碳排放</div>
              <div className="text-xs font-bold text-teal-300">
                {summary.annualCarbonTons.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">tCO₂</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons & Top-Right Retrofit Button */}
        <div className="flex items-center space-x-3">
          
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
            onClick={onResetSample}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            title="加载商业综合体示例数据"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>示例工程</span>
          </button>

          <button
            onClick={onExportReport}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 border border-blue-400/30 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>导出分析报告</span>
          </button>
        </div>

      </div>
    </header>
  );
};
