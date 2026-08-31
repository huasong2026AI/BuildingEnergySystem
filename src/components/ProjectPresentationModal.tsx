import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Grid, 
  Building2, Cpu, Zap, TrendingUp, Sparkles, ShieldCheck, 
  Award, Layers, BarChart3, CheckCircle2, AlertTriangle, Bot,
  Leaf, Flame, Wind
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Slide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  content: React.ReactNode;
}

export const ProjectPresentationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOverviewMode, setIsOverviewMode] = useState(false);

  const slides: Slide[] = [
    // ----------------------------------------------------
    // Slide 1: 封面 (超大字号版)
    // ----------------------------------------------------
    {
      id: 1,
      badge: 'GREEN BUILDING & HVAC AI PLATFORM',
      title: '商业综合体暖通空调能效分析与 AI 智能改造决策系统',
      subtitle: '基于 GB 50189-2015 与 JGJ/T 129 标准的全生命周期暖通工程数字化赋能平台',
      icon: Leaf,
      content: (
        <div className="flex flex-col justify-between h-full space-y-4 py-2 text-base">
          <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-emerald-100/90 border-2 border-emerald-300 text-emerald-950 text-base font-black shadow-xs">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              <span>国家“双碳”战略引领 · 公共建筑超低能耗暖通数字化解决方案</span>
            </div>
            <span className="text-sm font-mono text-emerald-800 bg-white px-3.5 py-1 rounded-xl border border-emerald-200 font-bold">标准：GB 50189 / JGJ/T 129</span>
          </div>

          <div className="text-center space-y-3 py-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-950 tracking-tight leading-tight">
              商业综合体与公共建筑暖通空调<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">
                全生命周期能效分析与 AI 改造决策系统
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-emerald-900/90 font-semibold max-w-5xl mx-auto">
              新建负荷动态推导 · 四步闭环自动化联动 · 8760h Bin 频次模拟 · GB 50189 SCOP 评级 · Gemini / DeepSeek 专家决策
            </p>
          </div>

          {/* 4 大核心维度指标卡 (超大字号) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center space-x-2.5 text-emerald-700 font-bold text-base">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <span>工程规范标准</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950">GB 50189 / JGJ/T 129</div>
              <p className="text-sm text-slate-600 leading-snug">严格依据国家与行业节能设计评价技术规范</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-200 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center space-x-2.5 text-teal-700 font-bold text-base">
                <BarChart3 className="w-6 h-6 text-teal-600" />
                <span>8760h 能效模拟</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-teal-950">Bin 负荷频次直方图</div>
              <p className="text-sm text-slate-600 leading-snug">精准捕捉 40%~80% 黄金部分负荷运行区间</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center space-x-2.5 text-emerald-700 font-bold text-base">
                <Bot className="w-6 h-6 text-emerald-600" />
                <span>AI 大模型专家</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950">Gemini 3.5 / DeepSeek</div>
              <p className="text-sm text-slate-600 leading-snug">全量工程上下文注入，专业技术无障碍对答</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center space-x-2.5 text-emerald-700 font-bold text-base">
                <Cpu className="w-6 h-6 text-emerald-600" />
                <span>顶级设备品牌库</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-950">磁悬浮/离心/真空锅炉</div>
              <p className="text-sm text-slate-600 leading-snug">海尔/格力/约克/开利/方快自主录入与选型</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base font-bold text-emerald-900 py-1">
            <span className="px-4 py-1.5 bg-emerald-100 rounded-full border border-emerald-300">🌱 绿色低碳雅致设计</span>
            <span className="px-4 py-1.5 bg-emerald-100 rounded-full border border-emerald-300">⚡ 输配大温差节能</span>
            <span className="px-4 py-1.5 bg-emerald-100 rounded-full border border-emerald-300">🎯 Pareto 多目标决策</span>
            <span className="px-4 py-1.5 bg-emerald-100 rounded-full border border-emerald-300">📊 出版级高分辨率报告</span>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 2: 行业痛点与开发背景 (超大字号版)
    // ----------------------------------------------------
    {
      id: 2,
      badge: 'INDUSTRY PAIN POINTS',
      title: '既有建筑暖通空调系统三大高能耗痛点',
      subtitle: '设备能效衰减、水系统“大马拉小车”、缺乏动态能耗评估模型',
      icon: AlertTriangle,
      content: (
        <div className="flex flex-col justify-between h-full space-y-3.5 py-1 text-base">
          {/* 痛点 1 横向通栏 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-red-200 shadow-xs flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4 w-[60%]">
              <div className="p-4 bg-red-100 text-red-700 rounded-2xl flex-shrink-0">
                <Flame className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-black rounded-lg">痛点一 · 主机衰减</span>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">冷水机组能效衰减严重 (实测 COP &lt; 3.8)</h4>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  既有大型商业冷站运行 5~10 年后，受压缩机机械磨损、润滑油膜污染换热壁面结垢影响，实测 COP 普遍衰减超 25%，年运行电费居高不下。
                </p>
              </div>
            </div>

            <div className="w-[40%] bg-red-50/90 p-4 rounded-xl border border-red-200 space-y-2">
              <div className="flex justify-between text-base font-black text-red-950">
                <span>实测加权 COP: <b className="text-red-600 text-lg sm:text-xl">3.5 ~ 3.8</b></span>
                <span className="text-sm text-red-700 font-bold">较标准低 35%</span>
              </div>
              <div className="w-full bg-red-200 h-3 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-[45%]" />
              </div>
              <span className="text-xs sm:text-sm text-red-800 font-mono font-bold block">加权能效衰减率: 20% ~ 35%</span>
            </div>
          </div>

          {/* 痛点 2 横向通栏 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-amber-200 shadow-xs flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4 w-[60%]">
              <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl flex-shrink-0">
                <Wind className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-black rounded-lg">痛点二 · 输配浪费</span>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">水泵“大马拉小车”与小温差大流量运行</h4>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  原设计扬程与流量冗余超 30%，实际供回水温差仅 3℃~4℃。水泵长期定频低效或关阀节流，输配电耗占冷站总电耗高达 25%~35%。
                </p>
              </div>
            </div>

            <div className="w-[40%] bg-amber-50/90 p-4 rounded-xl border border-amber-200 space-y-2">
              <div className="flex justify-between text-base font-black text-amber-950">
                <span>水泵输配能耗占比: <b className="text-amber-600 text-lg sm:text-xl">30% ~ 35%</b></span>
                <span className="text-sm text-amber-700 font-bold">节电空间大</span>
              </div>
              <div className="w-full bg-amber-200 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[70%]" />
              </div>
              <span className="text-xs sm:text-sm text-amber-800 font-mono font-bold block">存在 40% 以上变频调速节电空间</span>
            </div>
          </div>

          {/* 痛点 3 横向通栏 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4 w-[60%]">
              <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl flex-shrink-0">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-black rounded-lg">痛点三 · 盲区经验</span>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">缺乏 8760h 动态频次与技术经济量化支撑</h4>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  传统改造仅凭经验粗放估算，脱离真实设备铭牌特性、分时电价与气象频次，导致投资回报期测算失准、方案风险高难以决策。
                </p>
              </div>
            </div>

            <div className="w-[40%] bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex justify-between text-base font-black text-emerald-950">
                <span>系统数字化赋能度: <b className="text-emerald-700 text-lg sm:text-xl">100%</b></span>
                <span className="text-sm text-emerald-700 font-bold">精准闭环</span>
              </div>
              <div className="w-full bg-emerald-200 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full w-[95%]" />
              </div>
              <span className="text-xs sm:text-sm text-emerald-800 font-mono font-bold block">8760h 动态模拟 + 全生命周期经济模型</span>
            </div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 3: 系统总体架构与技术链路 (超大字号版)
    // ----------------------------------------------------
    {
      id: 3,
      badge: 'SYSTEM ARCHITECTURE',
      title: '系统总体架构与五步全景业务闭环',
      subtitle: '实现从建筑子项负荷推导、水力联动、8760h 能效模拟到既有 AI 改造的完整链路',
      icon: Layers,
      content: (
        <div className="flex flex-col justify-between h-full space-y-4 py-2 text-base">
          {/* 5 步流程大卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-300 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-base shadow-xs">1</div>
                <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">业态建模</span>
              </div>
              <div>
                <h4 className="font-black text-emerald-950 text-base sm:text-lg">建筑分项管理</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">商场/办公/酒店多业态子项与气候区负荷动态推导</p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 p-2 rounded-xl text-center">冷热源合并计算</span>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-300 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-base shadow-xs">2</div>
                <span className="text-xs sm:text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">水力热力</span>
              </div>
              <div>
                <h4 className="font-black text-teal-950 text-base sm:text-lg">四步闭环选型</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">冷机梯级搭配、水温水泵流量热力联动、实际配比率</p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-teal-800 bg-teal-100 p-2 rounded-xl text-center">GB 50736 规范约束</span>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-cyan-300 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white font-black flex items-center justify-center text-base shadow-xs">3</div>
                <span className="text-xs sm:text-sm font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg">管网拓扑</span>
              </div>
              <div>
                <h4 className="font-black text-cyan-950 text-base sm:text-lg">水力原理拓扑</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">系统拓扑图、供回水温差、水流流向动态交互展示</p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-cyan-800 bg-cyan-100 p-2 rounded-xl text-center">温差动态交互</span>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-400 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-base shadow-xs">4</div>
                <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">8760h模拟</span>
              </div>
              <div>
                <h4 className="font-black text-emerald-950 text-base sm:text-lg">8760h 能耗分析</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">Bin 负荷频次直方图、逐月电费气耗、GB 50189 SCOP</p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-200 p-2 rounded-xl text-center">五星高效冷站评定</span>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-purple-300 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-base shadow-xs">5</div>
                <span className="text-xs sm:text-sm font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg">AI 专家</span>
              </div>
              <div>
                <h4 className="font-black text-purple-950 text-base sm:text-lg">既有 AI 改造诊断</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">JGJ/T 129 方案比选、5大边缘群控、Gemini/DeepSeek</p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-purple-800 bg-purple-100 p-2 rounded-xl text-center">全量工程上下文对答</span>
            </div>
          </div>

          {/* 底部横幅 (超大字号) */}
          <div className="bg-emerald-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3 text-base sm:text-lg font-black">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              <span>数据流 100% 贯通：设备选型与品牌铭牌参数直接驱动 8760h 模拟与大模型诊断引擎！</span>
            </div>
            <span className="text-sm font-mono text-emerald-300 hidden sm:inline font-bold">TypeScript · Vite · ECharts · Tailwind</span>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 4: 建筑子项动态负荷建模与多场景拓展 (超大字号版)
    // ----------------------------------------------------
    {
      id: 4,
      badge: 'LOAD MODELING & TARIFF',
      title: '多业态建筑子项动态负荷建模与价格机制',
      subtitle: '支持商业、办公、酒店等复合业态独立核算，能源价格全开放可配',
      icon: Building2,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-stretch py-1 text-base">
          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2.5 text-emerald-900 font-black text-lg sm:text-xl">
                <Building2 className="w-7 h-7 text-emerald-600" />
                <span>多业态子项管理与负荷推导体系</span>
              </div>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-black text-lg">●</span>
                  <span><b>多业态指标预置</b>：商业购物中心 (110W/m²)、甲级办公 (90W/m²)、五星酒店 (85W/m²)、餐饮影院等；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-teal-600 font-black text-lg">●</span>
                  <span><b>气候区动态修正</b>：针对上海、北京、广州等主要气候区，结合气象特征自动修正设计负荷；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-600 font-black text-lg">●</span>
                  <span><b>集中共用冷源合并</b>：多个建筑子项勾选“共用冷站”，系统自动合并总冷负荷推导主机配置。</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-sm sm:text-base font-mono text-emerald-950 flex justify-between items-center">
              <span>典型商业综合体示例:</span>
              <b className="text-emerald-700 text-base sm:text-lg">总面积 55,000 m² (商场 35k + 办公 20k)</b>
            </div>
          </div>

          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2.5 text-emerald-900 font-black text-lg sm:text-xl">
                <Zap className="w-7 h-7 text-amber-500" />
                <span>能源价格体系 (商业电价/燃气价/分时电价)</span>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                能源价格均开放支持用户自主输入，精准测算运行成本：
              </p>
              <div className="grid grid-cols-2 gap-3.5 font-mono text-base">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-xs sm:text-sm font-bold">工商业电价基准</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">¥0.85 / kWh</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-xs sm:text-sm font-bold">天然气商业单价</span>
                  <span className="text-xl sm:text-2xl font-black text-rose-600">¥3.50 / m³</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                支持峰平谷三段式分时电价录入，与 8760h 逐时负荷无缝契合，保障经济测算高度可靠。
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-sm sm:text-base font-mono text-amber-950 text-center font-bold">
              实时联动：调节电价/气价立即触发全生命周期经济模型重算
            </div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 5: 四步闭环设备自动化选型联动 (超大字号版)
    // ----------------------------------------------------
    {
      id: 5,
      badge: 'AUTOMATED SIZING LOGIC',
      title: '四步闭环设备自动化选型联动推导逻辑',
      subtitle: '依据 GB 50736 规范，冷热主机、水泵流量、锅炉与实际配比率严密关联',
      icon: Cpu,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full items-stretch py-1 text-base">
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-300 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-black rounded-lg">第 1 步 · 主机配置</span>
              <h4 className="text-base sm:text-lg font-black text-slate-900">冷水机组梯级推荐</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                • ≤2500kW: 2台变频螺杆<br />
                • 2500~5500kW: 3台高效离心<br />
                • &gt;5500kW: 3大1小 异构梯级
              </p>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl text-center">
              满足低负荷高 COP 运行
            </span>
          </div>

          <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-300 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs sm:text-sm font-black rounded-lg">第 2 步 · 水力联动</span>
              <h4 className="text-base sm:text-lg font-black text-slate-900">水温与流量热力推导</h4>
              <p className="text-xs sm:text-sm font-mono text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                G = Q·3.6 / (4.186·ΔT)<br />
                冷水泵: 7/12℃ (ΔT=5℃)<br />
                冷却塔: 冷却泵流量 × 1.15
              </p>
            </div>
            <span className="text-xs sm:text-sm font-bold text-teal-800 bg-teal-50 p-2.5 rounded-xl text-center">
              微调水温自动重算水泵
            </span>
          </div>

          <div className="bg-white/95 p-4 rounded-2xl border-2 border-cyan-300 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-xs sm:text-sm font-black rounded-lg">第 3 步 · 供热匹配</span>
              <h4 className="text-base sm:text-lg font-black text-slate-900">真空锅炉与热水泵</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                根据总热负荷匹配全预混真空锅炉（效率 98.5%），按 60/50℃ 温差自动联动热水泵。
              </p>
            </div>
            <span className="text-xs sm:text-sm font-bold text-cyan-800 bg-cyan-50 p-2.5 rounded-xl text-center">
              低氮冷凝潜热深度回收
            </span>
          </div>

          <div className="bg-white/95 p-4 rounded-2xl border-2 border-purple-300 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs sm:text-sm font-black rounded-lg">第 4 步 · 配比校核</span>
              <h4 className="text-base sm:text-lg font-black text-slate-900">实际配比率智能反馈</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="font-bold text-purple-900">配比率 = 配置总值 ÷ 推荐值</span><br />
                95%~105% 翡翠绿合规；偏离触发红字预警！
              </p>
            </div>
            <span className="text-xs sm:text-sm font-bold text-purple-800 bg-purple-50 p-2.5 rounded-xl text-center">
              杜绝超量选型造成浪费
            </span>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 6: 8760h Bin Analysis 负荷频次分布 (超大字号版)
    // ----------------------------------------------------
    {
      id: 6,
      badge: 'BIN ANALYSIS & LOAD PROFILE',
      title: '8760h 全年负荷频次分布 (Bin Analysis)',
      subtitle: '揭示建筑全年 >70% 运行小时处于 40%~80% 黄金部分负荷区间',
      icon: BarChart3,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center py-1 text-base">
          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <h4 className="font-black text-emerald-950 text-base sm:text-lg">8760h 负荷区间分布柱状直方图规律</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                公共建筑满负荷（&gt;80%）运行小时数极短（仅约 15%），绝大部分时间处于部分负荷状态：
              </p>
              
              <div className="space-y-2 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs sm:text-sm font-mono">
                <div>
                  <div className="flex justify-between text-slate-700 mb-0.5">
                    <span>0% ~ 20% 极低负荷</span>
                    <span className="font-bold">120 小时 (5.0%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full"><div className="bg-emerald-400 h-full w-[10%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-0.5">
                    <span>20% ~ 40% 低负荷</span>
                    <span className="font-bold">240 小时 (10.0%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full"><div className="bg-teal-500 h-full w-[20%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-emerald-950 font-black mb-0.5">
                    <span>40% ~ 60% 黄金负荷区 (主要)</span>
                    <span className="font-black text-emerald-700 text-base">864 小时 (36.0%)</span>
                  </div>
                  <div className="w-full bg-emerald-200 h-3 rounded-full"><div className="bg-emerald-600 h-full w-[72%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-emerald-950 font-black mb-0.5">
                    <span>60% ~ 80% 高负荷区</span>
                    <span className="font-black text-emerald-700 text-base">816 小时 (34.0%)</span>
                  </div>
                  <div className="w-full bg-emerald-200 h-3 rounded-full"><div className="bg-emerald-600 h-full w-[68%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-0.5">
                    <span>80% ~ 100% 尖峰满载</span>
                    <span className="font-bold">360 小时 (15.0%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full"><div className="bg-amber-500 h-full w-[30%]" /></div>
                </div>
              </div>
            </div>
            <span className="text-sm sm:text-base font-black text-emerald-800 text-center block bg-emerald-100/80 p-2.5 rounded-xl">40%~80% 区间累计运行小时占比超 70%！</span>
          </div>

          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <h4 className="font-black text-emerald-950 text-base sm:text-lg">对主机选型与能耗计算的深远指导</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-black text-base">✔</span>
                  <span><b>重视 IPLV 综合部分负荷性能</b>：不可仅按满载 COP 评价主机，必须考量 50%~75% 负荷能效；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-black text-base">✔</span>
                  <span><b>异构梯级配置最大化节电</b>：配置 1 台小容量磁悬浮冷机作为基载，可在 70% 的运行时间内实现 COP &gt; 10.0；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-black text-base">✔</span>
                  <span><b>采暖天然气消耗动态推导</b>：基于逐时室外气温频次与供热负荷动态积分，彻底摆脱粗放的满负荷简单相乘。</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-900 text-white p-3.5 rounded-xl text-sm sm:text-base font-black text-center shadow-xs">
              8760h Bin 分析是高效冷站与低碳改造决策的科学基石
            </div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 7: GB 50189 SCOP 评价体系 (超大字号版)
    // ----------------------------------------------------
    {
      id: 7,
      badge: 'GB 50189-2015 SCOP STANDARDS',
      title: 'GB 50189-2015 第4.2.12条 SCOP 评价体系',
      subtitle: '冷源系统综合制冷性能系数全口径核算与绿建星级达标评价',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 h-full flex flex-col justify-between py-1 text-base">
          {/* 公式 Banner */}
          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-2.5 text-center">
            <span className="text-sm sm:text-base font-black text-emerald-800 block">《公共建筑节能设计标准》GB 50189-2015 第 4.2.12 条核心指标</span>
            <div className="bg-emerald-50 py-3 px-8 rounded-xl border border-emerald-200 font-mono text-lg sm:text-xl lg:text-2xl font-black text-emerald-950 inline-block shadow-inner">
              SCOP = ∑ Q_cooling / ∑( E_chiller + E_CHWP + E_CWP + E_Tower )
            </div>
            <p className="text-xs sm:text-sm text-slate-700 max-w-4xl mx-auto leading-relaxed">
              分子为全年累计制冷量 (kWh)，分母为<b>冷水机组电耗 + 冷水泵电耗 + 冷却泵电耗 + 冷却塔风机电耗</b>四大部分全口径电耗之和。
            </p>
          </div>

          {/* 4 级能效星级卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-sm">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 text-center space-y-1">
              <span className="text-slate-500 block text-xs sm:text-sm font-black">国标准入强制底线</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">SCOP ≥ 3.50</span>
              <span className="text-xs text-slate-600 block font-semibold">基础节能合格</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-teal-300 text-center space-y-1">
              <span className="text-teal-700 block text-xs sm:text-sm font-black">三星级高效冷站</span>
              <span className="text-lg sm:text-xl font-black text-teal-900 font-mono">SCOP ≥ 4.50</span>
              <span className="text-xs text-teal-700 block font-semibold">主流优质商业项目</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 text-center space-y-1">
              <span className="text-emerald-700 block text-xs sm:text-sm font-black">四星级高效冷站</span>
              <span className="text-lg sm:text-xl font-black text-emerald-900 font-mono">SCOP ≥ 5.00</span>
              <span className="text-xs text-emerald-700 block font-semibold">行业标杆绿色建筑</span>
            </div>

            <div className="bg-emerald-800 text-white p-4 rounded-2xl border-2 border-emerald-500 text-center space-y-1 shadow-xs">
              <span className="text-emerald-200 block text-xs sm:text-sm font-black">五星级卓越高效冷站</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">SCOP ≥ 5.50</span>
              <span className="text-xs text-emerald-100 block font-bold">本系统优化达成目标</span>
            </div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 8: 暖通主流设备品牌与规格参数库 (超大字号版)
    // ----------------------------------------------------
    {
      id: 8,
      badge: 'EQUIPMENT CATALOG & CRUD',
      title: '暖通主流设备品牌与规格参数库',
      subtitle: '每品类精选 2 大主流顶级标杆品牌，全量支持自定义录入、修改与删除',
      icon: Layers,
      content: (
        <div className="space-y-3.5 h-full flex flex-col justify-between py-1 text-base">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 text-sm">
            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 space-y-1 shadow-xs">
              <span className="text-emerald-800 font-black block text-sm sm:text-base">1. 磁悬浮冷水机组</span>
              <span className="text-slate-950 font-black text-base sm:text-lg">海尔 (Haier) / 格力 (Gree)</span>
              <p className="text-slate-600 text-xs sm:text-sm leading-snug">无油轴承，IPLV 10.8~11.5，使用寿命长达30年</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-200 space-y-1 shadow-xs">
              <span className="text-teal-800 font-black block text-sm sm:text-base">2. 变频水冷螺杆/离心机</span>
              <span className="text-slate-950 font-black text-base sm:text-lg">开利 (Carrier) / 约克 (York)</span>
              <p className="text-slate-600 text-xs sm:text-sm leading-snug">开利 30XW-V 变频螺杆，超国标1级能效，COP 6.33</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-rose-200 space-y-1 shadow-xs">
              <span className="text-rose-800 font-black block text-sm sm:text-base">3. 全预混真空热水锅炉</span>
              <span className="text-slate-950 font-black text-base sm:text-lg">方快 (Fangkuai) / 双良</span>
              <p className="text-slate-600 text-xs sm:text-sm leading-snug">超低氮冷凝真空技术，热效率高达 98%~99%</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-cyan-200 space-y-1 shadow-xs">
              <span className="text-cyan-800 font-black block text-sm sm:text-base">4. 风冷螺杆/模块热泵 (ACHP)</span>
              <span className="text-slate-950 font-black text-base sm:text-lg">特灵 (Trane) / 麦克维尔</span>
              <p className="text-slate-600 text-xs sm:text-sm leading-snug">特灵 RTXG 超高效双1级风冷螺杆，COP 3.63，免机房</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 space-y-1 shadow-xs">
              <span className="text-emerald-800 font-black block text-sm sm:text-base">5. 循环水泵 (冷/热/冷却)</span>
              <span className="text-slate-950 font-black text-base sm:text-lg">威乐 (Wilo) / 凯泉 (Kaiquan)</span>
              <p className="text-slate-600 text-xs sm:text-sm leading-snug">IE4 超高效电机，双吸中开，水力效率达 83%</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-purple-200 space-y-1 shadow-xs">
              <span className="text-purple-800 font-black block text-sm sm:text-base">6. 冷却塔 / VRF 变频多联机</span>
              <span className="text-slate-950 font-black text-base sm:text-lg">金日 (King Sun) / 东芝 / 大金</span>
              <p className="text-slate-600 text-xs sm:text-sm leading-snug">东芝 SMMS 单模块多联机 (IPLV 9.10) 与超低噪冷却塔</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 flex items-center justify-between text-xs sm:text-sm text-emerald-950 font-bold">
            <span>💡 <b>品牌库开放性机制</b>：支持在前端随时【➕ 补充新设备型号】、【✏️ 修改铭牌参数】与【🗑️ 删除】，数据永久持久化。</span>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 9: 既有建筑节能改造三大 Pareto 方案比选 (超大字号版)
    // ----------------------------------------------------
    {
      id: 9,
      badge: 'RETROFIT COMPARISON (JGJ/T 129)',
      title: '既有建筑节能改造三大 Pareto 方案比选',
      subtitle: '依据 JGJ/T 129 规范，兼顾初投资规模、节费率与静态投资回收期',
      icon: TrendingUp,
      content: (
        <div className="flex flex-col justify-between h-full space-y-3.5 py-1 text-base">
          {/* 方案 A 横向通栏 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-slate-300 shadow-xs flex items-center justify-between gap-6">
            <div className="w-[56%] space-y-1">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs sm:text-sm font-black rounded-lg">方案 A · 快速常规改造</span>
                <h4 className="text-base sm:text-lg font-black text-slate-900">高效变频主机 + 水泵变频</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                保留原有管网工况，替换老旧冷机为一级能效变频螺杆/离心机，水泵加装变频器。
              </p>
            </div>
            <div className="w-[44%] bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-around text-sm font-mono">
              <div><span className="text-slate-500 block text-xs">节费率</span><b className="text-emerald-700 text-lg sm:text-xl">22.5%</b></div>
              <div><span className="text-slate-500 block text-xs">预估初投资</span><b className="text-slate-900 text-lg sm:text-xl">¥160 万元</b></div>
              <div><span className="text-slate-500 block text-xs">静态回收期</span><b className="text-teal-700 text-lg sm:text-xl">3.8 年</b></div>
            </div>
          </div>

          {/* 方案 B 横向通栏 (高亮推荐) */}
          <div className="bg-emerald-900 text-white p-4 rounded-2xl border-2 border-emerald-400 shadow-sm flex items-center justify-between gap-6">
            <div className="w-[56%] space-y-1">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-emerald-700 text-emerald-100 text-xs sm:text-sm font-black rounded-lg">方案 B · 全面升级 (首选)</span>
                <span className="text-xs sm:text-sm font-black text-emerald-300">★ 最佳经济性</span>
                <h4 className="text-base sm:text-lg font-black text-emerald-300">磁悬浮冷机 + 7/14℃大温差 + AI群控</h4>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                无油磁悬浮搭配大温差（水泵流量削减 28.5%），部署 AI 边缘动态负荷自适应寻优控制。
              </p>
            </div>
            <div className="w-[44%] bg-emerald-950/80 p-3 rounded-xl border border-emerald-700 flex justify-around text-sm font-mono">
              <div><span className="text-emerald-300/80 block text-xs">节费率</span><b className="text-emerald-300 text-lg sm:text-xl">34.8%</b></div>
              <div><span className="text-emerald-300/80 block text-xs">年省费用</span><b className="text-emerald-300 text-lg sm:text-xl">¥256.4 万</b></div>
              <div><span className="text-emerald-300/80 block text-xs">静态回收期</span><b className="text-emerald-400 font-black text-xl sm:text-2xl">仅 3.2 年</b></div>
            </div>
          </div>

          {/* 方案 C 横向通栏 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-purple-200 shadow-xs flex items-center justify-between gap-6">
            <div className="w-[56%] space-y-1">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs sm:text-sm font-black rounded-lg">方案 C · 零碳电气化</span>
                <h4 className="text-base sm:text-lg font-black text-slate-900">超低温热泵彻底替代锅炉</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                拆除燃气锅炉，换装超低温风冷/地源热泵夏冬两用，实现机房零燃气、零直接碳排放。
              </p>
            </div>
            <div className="w-[44%] bg-purple-50 p-3 rounded-xl border border-purple-200 flex justify-around text-sm font-mono">
              <div><span className="text-purple-600 block text-xs">节费率</span><b className="text-purple-700 text-lg sm:text-xl">41.2%</b></div>
              <div><span className="text-purple-600 block text-xs">年减碳效益</span><b className="text-purple-800 text-lg sm:text-xl">&gt; 1800 吨</b></div>
              <div><span className="text-purple-600 block text-xs">静态回收期</span><b className="text-purple-800 text-lg sm:text-xl">4.5 年</b></div>
            </div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 10: 四大 AI 边缘计算落地措施 (四个方框版)
    // ----------------------------------------------------
    {
      id: 10,
      badge: 'AI EDGE COMPUTING & CONTROL',
      title: '四大 AI 边缘计算与智能群控落地措施',
      subtitle: '即插即用边缘控制器，实现基于负荷预测的毫秒级自适应寻优',
      icon: Cpu,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-stretch py-1 text-base">
          {/* 方框 1 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-xs font-black rounded-md">措施 1 · 供水优化</span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">7℃ → 8.5~11℃</span>
              </div>
              <h4 className="font-black text-emerald-950 text-base sm:text-lg">冷水供水温度自适应重置 (Supply Temp Reset)</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                在部分负荷与过渡季工况下，根据室外湿球气象与末端实际阀门开度，将冷水供水温度动态提升至 8.5℃~11℃，主机每提升 1℃ 供水温度，制冷 COP 提升约 3.0%~3.5%。
              </p>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-950 flex justify-between items-center">
              <span>节能效益:</span>
              <b className="text-emerald-700 font-mono">冷机能效提升 6% ~ 12%</b>
            </div>
          </div>

          {/* 方框 2 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-200 shadow-xs flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-teal-100 text-teal-900 text-xs font-black rounded-md">措施 2 · 逼近度寻优</span>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">逼近湿球 2.5~3.0℃</span>
              </div>
              <h4 className="font-black text-teal-950 text-base sm:text-lg">冷却水进水温度逼近度寻优 (Approach Optimization)</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                基于室外湿球温度预测，动态联动冷却塔风机频率与冷却泵流量，保持进水温度稳定逼近湿球 2.5℃~3.0℃，降低冷凝压力与压缩机压缩比，大幅降低主机能耗。
              </p>
            </div>
            <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200 text-xs sm:text-sm font-bold text-teal-950 flex justify-between items-center">
              <span>节能效益:</span>
              <b className="text-teal-700 font-mono">冷凝电耗降低 6% ~ 10%</b>
            </div>
          </div>

          {/* 方框 3 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-cyan-200 shadow-xs flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 text-xs font-black rounded-md">措施 3 · 负荷分配</span>
                <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">锁定 50%~75% 高效区</span>
              </div>
              <h4 className="font-black text-cyan-950 text-base sm:text-lg">多台主机非等比加减机寻优 (Load Dispatching)</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                基于磁悬浮与离心机各自的 COP-负荷特性曲线，实时计算系统总电耗最低的启停组合与负荷分配，使各机组始终工作在各自的 50%~75% 黄金高效区。
              </p>
            </div>
            <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-200 text-xs sm:text-sm font-bold text-cyan-950 flex justify-between items-center">
              <span>节能效益:</span>
              <b className="text-cyan-700 font-mono">群控调度综合节电 8% ~ 15%</b>
            </div>
          </div>

          {/* 方框 4 */}
          <div className="bg-white/95 p-4 rounded-2xl border-2 border-purple-200 shadow-xs flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 text-xs font-black rounded-md">措施 4 · 动态压差</span>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">水泵转速降 15%~25%</span>
              </div>
              <h4 className="font-black text-purple-950 text-base sm:text-lg">最不利环路动态压差闭环控制 (Critical Zone DP)</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                取末端最不利环路压差作为主控信号，摒弃传统的出水总管定压差控制，消除管网阻力冗余浪费，避免阀门节流损失，大幅降低输配电耗。
              </p>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm font-bold text-purple-950 flex justify-between items-center">
              <span>节能效益:</span>
              <b className="text-purple-700 font-mono">输配水泵节电 20% ~ 35%</b>
            </div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 11: 深度接入大模型 (Gemini / DeepSeek 超大字号版)
    // ----------------------------------------------------
    {
      id: 11,
      badge: 'LLM INTEGRATION & EXPERT Q&A',
      title: '深度接入大模型 (Gemini 3.5 / DeepSeek)',
      subtitle: '全量暖通工程上下文注入，打造专业级专家交互对答系统（彻底杜绝答非所问）',
      icon: Bot,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-stretch py-1 text-base">
          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2.5">
              <h4 className="font-black text-emerald-950 text-base sm:text-lg">多模型引擎自主切换与本地安全</h4>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-600 font-black">●</span>
                  <span><b>Google Gemini</b>：默认首选 <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-emerald-800 font-bold">gemini-3.5-flash-lite</code>，支持 <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-emerald-800 font-bold">gemini-3.7-flash</code>；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-black">●</span>
                  <span><b>DeepSeek</b>：专属加速模型 <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-blue-800 font-bold">deepseek-v4-flash</code>；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 font-black">●</span>
                  <span><b>本地暖通专家引擎</b>：免 API Key 离线可用，内置暖通总工级工程推理；</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 font-black">●</span>
                  <span><b>API Key 安全保障</b>：用户配置仅保存在本地浏览器中，绝不上载。</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-sm sm:text-base font-mono text-emerald-950 text-center font-bold">
              遵循 llm-api-setup 标准规范
            </div>
          </div>

          <div className="bg-white/95 p-5 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="font-black text-emerald-950 text-base sm:text-lg">全量工程上下文注入与精准解答</h4>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-sm sm:text-base">
                <div className="font-black text-slate-900">💬 现场提问：“使用一级泵系统还是二级泵系统？”</div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-slate-800 space-y-1.5 leading-relaxed text-xs sm:text-sm">
                  <span className="text-emerald-700 font-black block text-sm">👉 AI 专家定量回答要点：</span>
                  <p>1. 针对本工程 55,000 m² 商业综合体，管网阻力 ≤300kPa 下<b>强烈推荐变频一级泵 (VPF)</b>；</p>
                  <p>2. 省去二级泵降低初投资 20%~30%，消除旁通混水温升 (0.5~1.2℃)，输配节电 15%~25%；</p>
                  <p>3. 落实冷机 10%~20%/min 变流量适应性与末端最不利动态压差控制。</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-500 font-bold text-center">输入任何暖通技术疑问，均可获得严谨定量论证</div>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 12: 商业工程实测案例与经济环境效益 (超大字号版)
    // ----------------------------------------------------
    {
      id: 12,
      badge: 'COMMERCIAL CASE STUDY & ROI',
      title: '商业工程实测案例与经济环境效益',
      subtitle: '华东某 58,000 m² 商业综合体冷站实测：年节电 42.8 万 kWh，投资回收期 3.2 年',
      icon: Award,
      content: (
        <div className="space-y-4 h-full flex flex-col justify-between py-1 text-base">
          {/* 4 大实测 KPI 卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-center">
            <div className="bg-white/95 p-4 rounded-2xl border-2 border-red-200 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 font-bold block mb-1">改造前年冷站电耗</span>
              <span className="text-xl sm:text-2xl font-black text-red-600 font-mono">191.2 万 kWh</span>
              <span className="text-xs text-slate-400 block mt-0.5">COP 仅 3.8</span>
            </div>

            <div className="bg-emerald-900 text-white p-4 rounded-2xl border-2 border-emerald-400 shadow-xs">
              <span className="text-xs sm:text-sm text-emerald-200 font-bold block mb-1">改造后实测年电耗</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">148.4 万 kWh</span>
              <span className="text-xs text-emerald-100 block mt-0.5">COP 跃升至 5.8</span>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-200 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 font-bold block mb-1">实测年节电量 / 节电率</span>
              <span className="text-xl sm:text-2xl font-black text-teal-700 font-mono">42.8万 kWh (22.4%)</span>
              <span className="text-xs text-teal-600 block mt-0.5">节电效果极其显著</span>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-amber-200 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 font-bold block mb-1">年省电费 / 静态回收期</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">¥36.4 万元 / 3.2 年</span>
              <span className="text-xs text-amber-700 block mt-0.5">年减碳 378 吨</span>
            </div>
          </div>

          <div className="bg-white/95 p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-2 text-sm sm:text-base text-slate-700 leading-relaxed">
            <span className="font-black text-slate-900 text-base sm:text-lg block">实施落地举措总结：</span>
            <p>1. 拆除 2 台老旧定频螺杆机，换装 2 台 1200kW 磁悬浮无油变频离心机组，冷源加权 COP 由 3.8 升至 5.8；</p>
            <p>2. 循环水泵实施最不利环路温差自适应变频控制，水泵年电耗降低 38.5%；</p>
            <p>3. 每年直接减少二氧化碳排放 378 吨，获得当地绿色低碳示范项目专项节能补贴。</p>
          </div>
        </div>
      )
    },

    // ----------------------------------------------------
    // Slide 13: 总结与未来展望 (超大字号版)
    // ----------------------------------------------------
    {
      id: 13,
      badge: 'CONCLUSION & OUTLOOK',
      title: '总结与展望：数字智能赋能绿色低碳建筑',
      subtitle: '打造暖通空调从规划设计、动态模拟到智能改造的一体化标杆解决方案',
      icon: Award,
      content: (
        <div className="flex flex-col justify-between h-full py-2 space-y-4 text-center text-base">
          <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md mx-auto">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-950">
              数字化与 AI 深度融合，驱动建筑能效全生命周期跃升
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              本系统实现了从负荷推导、四步自动化设备联动、8760h 频次模拟到既有 AI 改造决策的完整工程闭环，为设计院、节能服务公司 (EMCO) 与楼宇业主提供强有力的数字化工具。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto text-left text-base">
            <div className="bg-white/95 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-1.5">
              <span className="font-black text-emerald-800 text-base sm:text-lg block">高精准度</span>
              <p className="text-slate-600 text-xs sm:text-sm">基于 8760h 频次与设备真实铭牌功率，计算结果高度契合工程实际。</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-teal-200 shadow-xs space-y-1.5">
              <span className="font-black text-teal-800 text-base sm:text-lg block">高合规性</span>
              <p className="text-slate-600 text-xs sm:text-sm">严格遵守 GB 50189 SCOP 五星级评价与 JGJ/T 129 既有改造标准。</p>
            </div>

            <div className="bg-white/95 p-4 rounded-2xl border-2 border-purple-200 shadow-xs space-y-1.5">
              <span className="font-black text-purple-800 text-base sm:text-lg block">高智能化</span>
              <p className="text-slate-600 text-xs sm:text-sm">全量工程上下文无缝对接 Gemini 3.5 / DeepSeek 大模型专家咨询。</p>
            </div>
          </div>

          <div className="text-sm sm:text-base text-emerald-800 font-black">
            感谢聆听 · 欢迎交流与工程合作
          </div>
        </div>
      )
    }
  ];

  // 键盘快捷键监听 (左右键翻页，空格翻页，Esc退出)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        if (isOverviewMode) {
          setIsOverviewMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isOverviewMode, slides.length, onClose]);

  if (!isOpen) return null;

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      {/* 节能环保淡绿主题容器 - 超大字号大屏展演模式 */}
      <div className="bg-gradient-to-br from-[#f4f9f6] via-[#edf6f1] to-[#e6f3eb] border-2 border-emerald-400/80 rounded-2xl w-[92vw] max-w-[1450px] h-[82vh] max-h-[82vh] shadow-2xl overflow-hidden flex flex-col my-auto text-slate-900">
        
        {/* Top Control Bar (flex-shrink-0 绝对锁定在顶部) */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-white/95 border-b border-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-emerald-950 flex items-center space-x-2.5">
                <span>项目汇报 PPT 演示系统 (Eco-Green Edition)</span>
                <span className="px-3 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">超大字展演版</span>
              </h3>
              <span className="text-xs sm:text-sm text-emerald-800/80 font-mono font-bold">
                第 {currentSlide + 1} / {slides.length} 页 · 支持键盘 ← / → 键翻页
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsOverviewMode(!isOverviewMode)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                isOverviewMode 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-300'
              }`}
              title="切换所有幻灯片缩略图视图"
            >
              <Grid className="w-4 h-4" />
              <span>{isOverviewMode ? '返回主演示' : '幻灯片总览'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-sm font-black border border-emerald-300 transition-all cursor-pointer shadow-xs"
            >
              <span>导出/打印全部页面</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presentation Stage / Overview */}
        {isOverviewMode ? (
          // 幻灯片缩略图总览视图
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 custom-scroll">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentSlide(idx);
                  setIsOverviewMode(false);
                }}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-44 transition-all cursor-pointer ${
                  currentSlide === idx 
                    ? 'bg-emerald-100 border-emerald-600 shadow-md ring-2 ring-emerald-500/40' 
                    : 'bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-black rounded-md border border-emerald-200">
                      PAGE {idx + 1}
                    </span>
                    <span className="text-xs text-emerald-700 font-black truncate max-w-[140px]">{s.badge}</span>
                  </div>
                  <h4 className="font-black text-emerald-950 text-sm sm:text-base line-clamp-2">{s.title}</h4>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{s.subtitle}</p>
              </button>
            ))}
          </div>
        ) : (
          // 主演示视图
          <div className="flex-1 min-h-0 flex flex-col p-6 sm:p-7 overflow-y-auto custom-scroll justify-between">
            {/* Slide Header (超大字号) */}
            <div className="flex-shrink-0 border-b border-emerald-200/80 pb-3 mb-2.5">
              <div className="flex items-center space-x-3">
                <span className="px-3.5 py-1 bg-emerald-200/90 text-emerald-950 text-xs sm:text-sm font-black tracking-wider rounded-full border border-emerald-300">
                  {current.badge}
                </span>
                <span className="text-sm text-emerald-800 font-mono font-bold">SLIDE {current.id} OF {slides.length}</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-950 mt-2 tracking-tight">
                {current.title}
              </h2>
              <p className="text-sm sm:text-base text-emerald-900/90 font-semibold mt-1">
                {current.subtitle}
              </p>
            </div>

            {/* Slide Body */}
            <div className="flex-1 min-h-0 my-auto py-1">
              {current.content}
            </div>

            {/* Slide Navigation Footer (flex-shrink-0 锁定在底部) */}
            <div className="flex-shrink-0 pt-3 border-t border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-emerald-50 disabled:opacity-40 text-emerald-900 rounded-xl text-sm font-black border border-emerald-300 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>上一页</span>
                </button>

                <button
                  onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-sm font-black transition-all shadow-xs cursor-pointer"
                >
                  <span>下一页</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Slide Progress Dots */}
              <div className="hidden sm:flex items-center space-x-2.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-3 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? 'w-10 bg-emerald-600' : 'w-3 bg-emerald-200 hover:bg-emerald-300'
                    }`}
                    title={`第 ${idx + 1} 页`}
                  />
                ))}
              </div>

              <span className="text-sm sm:text-base text-emerald-950 font-mono font-black">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
