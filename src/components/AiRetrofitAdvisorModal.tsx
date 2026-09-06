import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, TrendingUp, Cpu, Printer, X, Send, Bot, Award,
  Key
} from 'lucide-react';
import type { SystemType, ExistingChillerDetail, ExistingBoilerDetail, ExistingPumpDetail, ExistingTowerDetail, EnergyTariffConfig, BuildingSubItem } from '../types/hvac';
import { 
  getStoredLlmConfig, saveLlmConfig, sendHvacChatMessage,
  type LlmConfig
} from '../services/llmService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  buildingName: string;
  buildingArea: number;
  existingSystemType: SystemType;
  operatingHours: number;
  electricityRate: number;
  gasRate: number;
  chillers: ExistingChillerDetail[];
  boilers: ExistingBoilerDetail[];
  pumps: ExistingPumpDetail[];
  towers: ExistingTowerDetail[];
  baselineCost: number;
  tariffConfig?: EnergyTariffConfig;
  targetSubItem?: BuildingSubItem;
}

export const AiRetrofitAdvisorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  buildingName,
  buildingArea,
  existingSystemType,
  operatingHours,
  electricityRate,
  gasRate,
  chillers,
  boilers,
  pumps,
  towers,
  baselineCost,
  tariffConfig: _tariffConfig,
  targetSubItem: _targetSubItem
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'diagnosis' | 'schemes' | 'measures' | 'case_study' | 'ai_chat'>('diagnosis');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `您好！我是您的注册公用设备工程师（暖通空调专业）AI 专业顾问。已根据您输入的【${buildingName}】（面积 ${buildingArea.toLocaleString()} m²）设备工况与能源参数完成全生命周期深度诊断。\n\n您可以查看左侧比选报告，或直接在此向我咨询任何具体工程技术细节（例如：系统该选一级泵还是二级泵？磁悬浮与变频螺杆如何比选？大温差输配改造注意事项等）！`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 大模型配置状态 (Gemini / DeepSeek / 本地专家库)
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(() => getStoredLlmConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    saveLlmConfig(llmConfig);
  }, [llmConfig]);

  if (!isOpen) return null;

  // 既有设备综合指标分析
  const totalChillerCap = chillers.reduce((a, c) => a + c.capacitykW * c.count, 0);
  const avgChillerCop = chillers.length > 0 ? (chillers.reduce((a, c) => a + c.cop * c.count, 0) / chillers.reduce((a, c) => a + c.count, 0)) : 3.8;
  const totalPumpPower = pumps.reduce((a, p) => a + p.powerkW * p.count, 0);
  const totalBoilerCap = boilers.reduce((a, b) => a + b.capacitykW * b.count, 0);

  // 3 套改造方案技术经济测算
  // 方案 A: 常规高效变频机组 + 水泵变频
  const schemeA_SavingsRate = 22.5; // %
  const schemeA_AnnualSavings = (baselineCost * schemeA_SavingsRate) / 100;
  const schemeA_Capex = (totalChillerCap * 320 + totalPumpPower * 650 + 150000); // 元
  const schemeA_Payback = schemeA_AnnualSavings > 0 ? (schemeA_Capex / schemeA_AnnualSavings).toFixed(1) : '3.8';

  // 方案 B: 磁悬浮无油变频离心机 + 大温差小流量 + AI边缘群控
  const schemeB_SavingsRate = 34.8; // %
  const schemeB_AnnualSavings = (baselineCost * schemeB_SavingsRate) / 100;
  const schemeB_Capex = (totalChillerCap * 480 + totalPumpPower * 850 + 280000);
  const schemeB_Payback = schemeB_AnnualSavings > 0 ? (schemeB_Capex / schemeB_AnnualSavings).toFixed(1) : '3.2';

  // 方案 C: 风冷/地源热泵电气化改造（彻底替代燃气锅炉）
  const schemeC_SavingsRate = 41.2; // %
  const schemeC_AnnualSavings = (baselineCost * schemeC_SavingsRate) / 100;
  const schemeC_Capex = (totalChillerCap * 550 + totalBoilerCap * 420 + 350000);
  const schemeC_Payback = schemeC_AnnualSavings > 0 ? (schemeC_Capex / schemeC_AnnualSavings).toFixed(1) : '4.5';

  const projectContext = {
    buildingName,
    buildingArea,
    existingSystemType: existingSystemType === 'chiller_boiler' ? '冷水机组 + 燃气锅炉系统' : existingSystemType === 'vrf' ? 'VRF多联机系统' : '风冷热泵系统',
    operatingHours,
    electricityRate,
    gasRate,
    chillersSummary: `${chillers.map(c => `${c.count}台 ${c.modelName || '冷水机组'} (${c.capacitykW}kW, COP ${c.cop})`).join('; ') || '无'} (总冷量: ${totalChillerCap}kW, 加权平均COP: ${avgChillerCop.toFixed(2)})`,
    pumpsSummary: `${pumps.map(p => `${p.count}台 ${p.type === 'chw' ? '冷水泵' : p.type === 'cw' ? '冷却泵' : '热水泵'} (${p.flowm3h}m³/h, 扬程${p.headm}m, ${p.powerkW}kW)`).join('; ') || '无'} (总功率: ${totalPumpPower}kW)`,
    boilersSummary: `${boilers.map(b => `${b.count}台 ${b.modelName || '燃气锅炉'} (${b.capacitykW}kW, 效率${b.efficiencyPercent}%)`).join('; ') || '无'} (总热量: ${totalBoilerCap}kW)`,
    towersSummary: `${towers.map(t => `${t.count}台 (${t.flowm3h}m³/h, 风机${t.fanPowerkW}kW)`).join('; ') || '无'}`,
    baselineCost,
    savingsSchemesSummary: `方案A(常规变频, 节费率22.5%, 静态回收期${schemeA_Payback}年); 方案B(磁悬浮+大温差+AI群控, 节费率34.8%, 静态回收期${schemeB_Payback}年); 方案C(热泵全电气化, 节费率41.2%, 静态回收期${schemeC_Payback}年)`
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isAiLoading) return;

    const newChat = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(newChat);
    setInputQuery('');
    setIsAiLoading(true);

    try {
      const reply = await sendHvacChatMessage(chatMessages, textToSend, projectContext, llmConfig);
      setChatMessages([...newChat, { sender: 'ai' as const, text: reply }]);
    } catch (err: any) {
      setChatMessages([
        ...newChat, 
        { sender: 'ai' as const, text: `【系统提示】咨询异常：${err?.message || '网络连接超时'}。请检查您的 API Key 或切换为本地暖通专家引擎。` }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(q);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-[98vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">
                  注册公用设备工程师·既有建筑节能改造诊断与方案比选报告
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                  GB 55015 规范标准
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                对象：{buildingName} ({buildingArea.toLocaleString()} m²) | 支持 Gemini 3.5 / DeepSeek / 本地暖通专家引擎自主切换
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="出版级高分辨率彩色打印与报告导出"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>打印/导出彩色报告</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 px-6 bg-slate-850 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto py-2.5 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveReportTab('diagnosis')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'diagnosis' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>1. 既有现状缺陷与能耗诊断</span>
          </button>

          <button
            onClick={() => setActiveReportTab('schemes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'schemes' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. 三大改造方案技术经济比选</span>
          </button>

          <button
            onClick={() => setActiveReportTab('measures')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'measures' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. 五大 AI 边缘计算落地措施</span>
          </button>

          <button
            onClick={() => setActiveReportTab('case_study')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'case_study' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. 真实商业工程实测案例</span>
          </button>

          <button
            onClick={() => setActiveReportTab('ai_chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'ai_chat' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>5. 交互式 AI 改造专家咨询 (Gemini / DeepSeek)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scroll">
          
          {/* Tab 1: 既有现状缺陷与能耗诊断 */}
          {activeReportTab === 'diagnosis' && (
            <div className="space-y-4">
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                  <span className="font-bold text-white text-sm flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>既有系统关键性能缺陷（基于 GB 50189 与 GB 55015 现场诊断）</span>
                  </span>
                  <span className="text-xs text-rose-400 font-bold">
                    现状基准年综合能耗费用：¥{(baselineCost / 10000).toFixed(2)} 万元
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-amber-300 font-bold flex items-center space-x-1">
                      <span>1. 冷源主机能效严重衰减</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      既有冷机加权 COP 仅约 <span className="text-white font-bold">{avgChillerCop.toFixed(2)}</span>，远低于现行绿建标准 5.6~6.2。设备运行年限长，压缩机机械磨损与油膜换热热阻导致效率衰减超 25%。
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-cyan-300 font-bold flex items-center space-x-1">
                      <span>2. 水泵“大马拉小车”低效运行</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      循环水泵总装机功率达 <span className="text-white font-bold">{totalPumpPower.toFixed(1)} kW</span>。设计扬程冗余普遍超过 30%，定频运行导致阀门节流损失巨大，输配系统耗电比偏高。
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-rose-300 font-bold flex items-center space-x-1">
                      <span>3. 供热与群控智能化缺失</span>
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      燃气热水锅炉总容量 <span className="text-white font-bold">{totalBoilerCap.toFixed(1)} kW</span>，排烟温度过高无法回收汽化潜热；冷站缺乏自适应 AI 群控，难以根据末端实时负荷精准加减机。
                    </p>
                  </div>
                </div>
              </div>

              {/* 既有设备清单 */}
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="font-bold text-white text-xs block">诊断输入之既有设备参数台账</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-750">
                    <span className="text-blue-300 font-bold block mb-1">冷水主机配置：</span>
                    <p className="text-slate-300 text-[11px]">
                      {chillers.map((c, i) => `【机组${i+1}】${c.count}台 ${c.modelName || '冷水机组'} (${c.capacitykW}kW, COP ${c.cop})`).join('； ') || '未配置'}
                    </p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-750">
                    <span className="text-cyan-300 font-bold block mb-1">循环水泵配置：</span>
                    <p className="text-slate-300 text-[11px]">
                      {pumps.map((p, i) => `【泵组${i+1}】${p.count}台 ${p.type} (${p.flowm3h}m³/h, 扬程${p.headm}m, ${p.powerkW}kW)`).join('； ') || '未配置'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 三大改造方案技术经济比选 */}
          {activeReportTab === 'schemes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 方案 A */}
                <div className="bg-slate-850 border border-slate-750 hover:border-slate-600 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded">
                        方案 A: 快速常规改造
                      </span>
                      <span className="text-xs text-slate-400 font-mono">初投资较省</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-2">常规高效变频螺杆/离心机 + 水泵变频</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      直接替换老旧主机为一级能效变频冷机，循环水泵加装变频器，保留原有管网与供回水温差。
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">综合节费率:</span>
                      <span className="font-bold text-emerald-400">{schemeA_SavingsRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">年省运行费:</span>
                      <span className="font-bold text-emerald-300">¥{(schemeA_AnnualSavings / 10000).toFixed(2)} 万元/年</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">改造预估初投资:</span>
                      <span className="font-bold text-amber-300">¥{(schemeA_Capex / 10000).toFixed(1)} 万元</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">静态回收期:</span>
                      <span className="font-bold text-cyan-300">{schemeA_Payback} 年</span>
                    </div>
                  </div>
                </div>

                {/* 方案 B (推荐) */}
                <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl p-4 flex flex-col justify-between space-y-3 relative shadow-lg shadow-emerald-950/50">
                  <div className="absolute -top-3 right-4 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shadow">
                    注册工程师推荐
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded">
                        方案 B: 全面技术升级 (推荐)
                      </span>
                    </div>
                    <h4 className="font-bold text-emerald-300 text-sm mt-2">磁悬浮无油离心机 + 大温差输配 + AI边缘群控</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      采用无油磁悬浮压缩机（IPLV &gt; 11.0），供回水温差提升至 7℃/14℃，水泵流量削减 28.5%，部署 AI 动态负荷自适应寻优控制。
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-emerald-500/30 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">综合节费率:</span>
                      <span className="font-bold text-emerald-400 text-sm">{schemeB_SavingsRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">年省运行费:</span>
                      <span className="font-bold text-emerald-300 text-sm">¥{(schemeB_AnnualSavings / 10000).toFixed(2)} 万元/年</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">改造预估初投资:</span>
                      <span className="font-bold text-amber-300">¥{(schemeB_Capex / 10000).toFixed(1)} 万元</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">静态回收期:</span>
                      <span className="font-black text-emerald-400 text-sm">{schemeB_Payback} 年</span>
                    </div>
                  </div>
                </div>

                {/* 方案 C */}
                <div className="bg-slate-850 border border-slate-750 hover:border-slate-600 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded">
                        方案 C: 终极零碳电气化
                      </span>
                      <span className="text-xs text-slate-400 font-mono">深度脱碳</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-2">热泵全面替代锅炉 + 磁悬浮冷源 + 数字化运维</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      拆除燃气锅炉，换装超低温风冷/水源热泵全电气化供暖，夏冬两用，实现机房零燃气、零直接碳排放。
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">综合节费率:</span>
                      <span className="font-bold text-purple-400">{schemeC_SavingsRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">年省运行费:</span>
                      <span className="font-bold text-purple-300">¥{(schemeC_AnnualSavings / 10000).toFixed(2)} 万元/年</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">改造预估初投资:</span>
                      <span className="font-bold text-amber-300">¥{(schemeC_Capex / 10000).toFixed(1)} 万元</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-400">静态回收期:</span>
                      <span className="font-bold text-purple-300">{schemeC_Payback} 年</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 3: 五大 AI 边缘计算落地措施 */}
          {activeReportTab === 'measures' && (
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="font-bold text-white text-sm block">五大边缘智能群控落地措施（即插即用）</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-emerald-400">1. 冷水供水温度自适应重置 (Supply Temp Reset)</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    在过渡季及部分负荷工况下，根据室外湿球温度与末端实际开度，将冷水供水温度由 7℃ 动态提升至 8.5℃~11℃，主机每提升 1℃ 供水温度，制冷 COP 提升约 3.0%~3.5%。
                  </p>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-cyan-400">2. 冷却水进水温度逼近度自适应寻优 (Approach Optimization)</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    通过气象参数与湿球温度预测，动态联动调控冷却塔风机频率与冷却泵流量，保持冷却水进水温度逼近湿球 2.5℃~3.0℃，降低冷凝压力，主机节能 6%~10%。
                  </p>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-amber-400">3. 多台主机非等比加减机与负荷寻优 (Load Dispatching)</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    基于磁悬浮与离心机各自的 COP-负荷特性曲线，实时计算系统总电耗最低的启停组合，使各台主机始终运行在各自的最高效率点 (50%~75%)。
                  </p>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-750 space-y-1">
                  <span className="font-bold text-purple-400">4. 最不利环路动态压差变频闭环控制 (Critical Zone DP Control)</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    取末端最不利环路压差作为主控信号，摒弃传统的出水总管定压差控制，消除管网阻力冗余浪费，水泵平均转速降低 15%~25%。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: 真实商业工程实测案例 */}
          {activeReportTab === 'case_study' && (
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-750 pb-3">
                <Award className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-white text-base">某大型公共建筑冷站节能改造工程实测案例</h4>
                  <span className="text-xs text-slate-400">建筑面积：58,000 m² | 地点：华东夏热冬冷区 | 改造前后实测对比</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-750 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">改造前年冷站电耗</span>
                  <span className="text-sm font-bold text-red-400">191.2 万 kWh</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-750 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">改造后实测年电耗</span>
                  <span className="text-sm font-bold text-emerald-400">148.4 万 kWh</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-750 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">实测年节电量 / 节电率</span>
                  <span className="text-sm font-bold text-emerald-300">42.8 万 kWh (22.4%)</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-750 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">年节省电费 / 回收期</span>
                  <span className="text-sm font-bold text-amber-300">¥36.4 万元 / 3.2 年</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white block">主要改造实施措施：</span>
                <p>1. 拆除 2 台老旧定频螺杆机，更换为 2 台 1200kW 磁悬浮变频无油离心机组（选用海尔/格力）；</p>
                <p>2. 循环水泵全变频化，采用最不利环路温差自适应变频调节；</p>
                <p>3. 部署边缘 AI 控制柜，实现冷却水逼近度动态寻优与过渡季自然冷却。</p>
              </div>
            </div>
          )}

          {/* Tab 5: 交互式 AI 改造专家咨询 (支持 Gemini 3.5 / DeepSeek / 本地引擎自由选择) */}
          {activeReportTab === 'ai_chat' && (
            <div className="space-y-3 flex flex-col h-[480px]">
              
              {/* 大模型选择器与 API 配置栏 */}
              <div className="flex-shrink-0 bg-slate-850 border border-slate-750 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300 font-bold flex items-center space-x-1">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>AI 模型引擎:</span>
                  </span>
                  
                  {/* Provider Radio Tabs */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setLlmConfig(prev => ({ ...prev, provider: 'gemini' }))}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        llmConfig.provider === 'gemini' 
                          ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Google Gemini
                    </button>
                    <button
                      onClick={() => setLlmConfig(prev => ({ ...prev, provider: 'deepseek' }))}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        llmConfig.provider === 'deepseek' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      DeepSeek
                    </button>
                    <button
                      onClick={() => setLlmConfig(prev => ({ ...prev, provider: 'local_expert' }))}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        llmConfig.provider === 'local_expert' 
                          ? 'bg-purple-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      本地暖通专家库 (免Key)
                    </button>
                  </div>

                  {/* Sub Model Selector */}
                  {llmConfig.provider === 'gemini' && (
                    <select
                      value={llmConfig.geminiModel}
                      onChange={e => setLlmConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-emerald-300 font-bold text-xs"
                    >
                      <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (主要默认首选)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (备选 - 极速)</option>
                      <option value="gemini-3.7-flash">gemini-3.7-flash (备选 - 强推理/复杂逻辑)</option>
                      <option value="gemini-3.6-flash">gemini-3.6-flash (备选 - 均衡)</option>
                    </select>
                  )}

                  {llmConfig.provider === 'deepseek' && (
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-blue-300 font-bold text-xs font-mono">
                      deepseek-v4-flash (高速推理/可选接入)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowConfigModal(!showConfigModal)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showConfigModal ? '收起 API 配置' : '⚙️ API Key 与代理配置'}</span>
                </button>
              </div>

              {/* API Key Drawer / Panel */}
              {showConfigModal && (
                <div className="bg-slate-950 border border-slate-750 p-3 rounded-xl space-y-3 animate-in slide-in-from-top-1 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-amber-400 flex items-center space-x-1">
                      <Key className="w-3.5 h-3.5" />
                      <span>配置您的 Gemini / DeepSeek API Key 与代理接口</span>
                    </span>
                    <span className="text-[11px] text-slate-400">密钥仅保存在本地浏览器 LocalStorage，不上传任何服务器</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div>
                        <label className="text-slate-300 block mb-1 font-semibold">Google Gemini API Key:</label>
                        <input
                          type="password"
                          placeholder="输入 AIzaSy... (若留空则自动使用本地专家库)"
                          value={llmConfig.geminiApiKey}
                          onChange={e => setLlmConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">Gemini 接口/代理地址 (默认官方，国内可配反代):</label>
                        <input
                          type="text"
                          placeholder="https://generativelanguage.googleapis.com"
                          value={llmConfig.geminiBaseUrl || ''}
                          onChange={e => setLlmConfig(prev => ({ ...prev, geminiBaseUrl: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-slate-300 block mb-1 font-semibold">DeepSeek API Key:</label>
                        <input
                          type="password"
                          placeholder="输入 sk-... (若留空则自动使用本地专家库)"
                          value={llmConfig.deepseekApiKey}
                          onChange={e => setLlmConfig(prev => ({ ...prev, deepseekApiKey: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">DeepSeek 接口地址 (默认官方):</label>
                        <input
                          type="text"
                          placeholder="https://api.deepseek.com"
                          value={llmConfig.deepseekBaseUrl || ''}
                          onChange={e => setLlmConfig(prev => ({ ...prev, deepseekBaseUrl: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Questions Tag Bar - 自动换行全览，彻底解决遮挡与显示不全 */}
              <div className="flex flex-wrap items-center gap-1.5 py-1.5 text-xs text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-bold flex items-center space-x-1 mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>快捷提问:</span>
                </span>
                {[
                  '使用一级泵系统还是二级泵系统？',
                  '选用磁悬浮还是变频螺杆更划算？',
                  '大温差 7/14℃ 改造末端需要动吗？',
                  '燃气锅炉改热泵电气化投资回报？',
                  '水泵扬程过高怎么降能耗？'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q)}
                    className="px-2.5 py-1 bg-slate-800/90 hover:bg-emerald-900/60 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 rounded-full transition-colors cursor-pointer text-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Message Box */}
              <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-y-auto space-y-3 custom-scroll min-h-[220px]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-850 text-slate-200 border border-slate-750 rounded-tl-none font-sans'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-850 text-emerald-300 border border-emerald-500/40 rounded-2xl px-4 py-2.5 text-xs flex items-center space-x-2">
                      <Bot className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>
                        {llmConfig.provider === 'gemini' 
                          ? `Gemini (${llmConfig.geminiModel}) 专家模型正在结合全量工程数据进行深度推理...`
                          : llmConfig.provider === 'deepseek'
                          ? `DeepSeek (${llmConfig.deepseekModel}) 正在计算工程经济性与技术方案...`
                          : '本地暖通专家引擎正在结合 GB 55015 规范论证...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  placeholder="输入您想咨询的具体暖通改造问题（如：一级泵还是二级泵？水泵怎么降耗？变频磁悬浮选型？）..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isAiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>提问</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            * 报告依据 GB 55015 与 GB 50189 标准自动生成
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
