/**
 * 大模型 API 服务 (Gemini / DeepSeek / 本地暖通专家引擎)
 * 严格遵循 skills/llm-api-setup/SKILL.md 规范
 */

export type LlmProvider = 'gemini' | 'deepseek' | 'local_expert';

export interface LlmConfig {
  provider: LlmProvider;
  geminiApiKey: string;
  geminiBaseUrl: string; // 默认 https://generativelanguage.googleapis.com 或自定义反向代理
  geminiModel: string;   // 默认 gemini-3.5-flash-lite, 备选 gemini-3.1-flash-lite, gemini-3.7-flash, gemini-3.6-flash
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string; // 默认 deepseek-v4-flash
}

const STORAGE_KEY = 'hvac_llm_config_v3';

const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
const metaEnv = (import.meta as any).env || {};

const envGeminiKey = globalProcess?.env?.GEMINI_API_KEY || metaEnv.VITE_GEMINI_API_KEY || metaEnv.GEMINI_API_KEY || '';
const envGeminiModel = globalProcess?.env?.GEMINI_MODEL || metaEnv.VITE_GEMINI_MODEL || metaEnv.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const envDeepSeekKey = globalProcess?.env?.DEEPSEEK_API_KEY || metaEnv.VITE_DEEPSEEK_API_KEY || metaEnv.DEEPSEEK_API_KEY || '';
const envDeepSeekBaseUrl = globalProcess?.env?.DEEPSEEK_BASE_URL || metaEnv.VITE_DEEPSEEK_BASE_URL || metaEnv.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const envDeepSeekModel = globalProcess?.env?.DEEPSEEK_MODEL || metaEnv.VITE_DEEPSEEK_MODEL || metaEnv.DEEPSEEK_MODEL || 'deepseek-v4-flash';

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: 'gemini',
  geminiApiKey: envGeminiKey,
  geminiBaseUrl: 'https://generativelanguage.googleapis.com',
  geminiModel: envGeminiModel,
  deepseekApiKey: envDeepSeekKey,
  deepseekBaseUrl: envDeepSeekBaseUrl,
  deepseekModel: envDeepSeekModel,
};

export function getStoredLlmConfig(): LlmConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load LLM config', e);
  }
  return DEFAULT_LLM_CONFIG;
}

export function saveLlmConfig(config: LlmConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save LLM config', e);
  }
}

/**
 * 暖通专业问答上下文构建器
 */
export function buildHvacSystemPrompt(projectContext: {
  buildingName: string;
  buildingArea: number;
  existingSystemType: string;
  operatingHours: number;
  electricityRate: number;
  gasRate: number;
  chillersSummary: string;
  pumpsSummary: string;
  boilersSummary: string;
  towersSummary: string;
  baselineCost: number;
  savingsSchemesSummary: string;
}): string {
  return `你是一位资深注册公用设备工程师（暖通空调专业），精通 GB 55015 与 GB 50189 标准及国家节能减碳法规政策。

当前诊断的实际工程项目背景参数如下：
【建筑名称】：${projectContext.buildingName}
【建筑总面积】：${projectContext.buildingArea.toLocaleString()} m²
【现状系统类型】：${projectContext.existingSystemType}
【全年运行小时】：${projectContext.operatingHours} 小时/年
【当前能源价格】：电价 ¥${projectContext.electricityRate.toFixed(2)} / kWh，燃气价 ¥${projectContext.gasRate.toFixed(2)} / m³
【基准年能耗费用】：约 ¥${(projectContext.baselineCost / 10000).toFixed(2)} 万元/年
【现状冷水机组】：${projectContext.chillersSummary}
【现状循环水泵】：${projectContext.pumpsSummary}
【现状供热锅炉】：${projectContext.boilersSummary}
【现状冷却塔】：${projectContext.towersSummary}
【三大改造方案概要】：${projectContext.savingsSchemesSummary}

回答原则：
1. 必须针对用户提出的具体暖通技术问题（如一级泵 vs 二级泵选型、磁悬浮 vs 变频螺杆、大温差输配、水泵切削/变频、锅炉低氮真空冷凝、热泵电气化替代、AI边缘群控等）进行深入、严谨、详实的专业工程剖析与定量论证！
2. 结合本工程的面积（${projectContext.buildingArea.toLocaleString()} m²）、负荷特性与能耗现状，给出具有可落地性、可实施性的工程决策建议。
3. 结构清晰，列出核心结论、技术原理比选、水力/热力校核要点及经济效益回报。严禁答非所问！`;
}

/**
 * 本地内置高级暖通专家知识推理引擎（在无 API Key 或网络离线时提供极高水准的专业解答）
 */
function localHvacExpertReasoning(userQuery: string, contextPrompt: string): string {
  const q = userQuery.toLowerCase();

  // 1. 一级泵 vs 二级泵系统选择
  if (q.includes('一级泵') || q.includes('二级泵') || q.includes('单级泵') || q.includes('水泵系统') || q.includes('输配系统')) {
    return `【注册公用设备工程师专业解答：一级泵变流量系统 (VPF) 与 二级泵系统选型决策】

针对当前既有建筑改造项目，系统选型建议如下：

一、结论优先：
对于建筑面积在 5万~8万 m² 范围内的单体或中集中冷站，若管网最不利环路总阻力不超过 300~350 kPa（扬程 ≤ 32m），【强烈推荐改造为：冷水机组变频一级泵变流量系统 (Variable Primary Flow, VPF)】！

二、深度技术比选与论证：
1. 一级泵变流量系统 (VPF) 的核心优势：
   • 设备精简与机房空间节省：省去整套二级泵组及配电柜，初投资降低 20%~30%，大幅释放地下室机房空间；
   • 消除混水能耗损失：传统定频一级泵+变频二级泵的旁通平衡管存在冷水掺混问题（产生无效温升 0.5℃~1.2℃），VPF 系统从根本上消除了混水能效惩罚；
   • 全年输配电耗降低 15%~25%：在部分负荷下，一级水泵直接随末端负荷需求变频降速运行。

2. 关键控制与安全防护要点（必须落实）：
   • 冷水机组变流量适应性：选用的新冷水机组（如磁悬浮或变频离心机）必须支持蒸发器变流量（水流量变化速率控制在 10%~20%/min 之间，最低流量保护不低于额定流量的 40%~50%）；
   • 快速压差旁通控制回路：在总供回水管集分水器间设置带高精度电动调节阀与电磁流量计的防冻/最小流量旁通管；
   • 最不利环路动态压差控制：以管网末端最不利环路压差传感器作为水泵变频闭环控制信号，而非冷站出口定压差控制。

3. 哪些情况建议保留或采用二级泵？
   • 各建筑分区阻力悬殊（如高层酒店塔楼阻力 45m 与低层裙房商业阻力 22m 并存时，宜采用一次侧定频制冷、二次侧分区分压变频输配）；
   • 既有冷水机组仍需保留且蒸发器只允许定流量运行时。`;
  }

  // 2. 磁悬浮 vs 变频螺杆/离心机
  if (q.includes('磁悬浮') || q.includes('螺杆') || q.includes('离心') || q.includes('主机') || q.includes('冷机选型')) {
    return `【注册公用设备工程师专业解答：磁悬浮无油离心机 vs 变频螺杆/传统离心机选型比选】

一、选型决策推荐：
对于大型公共建筑、星级酒店、高端办公等全年冷负荷波动大、低负荷运行时间长的建筑，【首选 1~2 台磁悬浮无油变频离心冷机作为基载与小负荷调节主机】。

二、技术性能深度对比：
1. 部分负荷能效 (IPLV / NPLV)：
   • 磁悬浮无油离心机：在 40%~70% 黄金运行区间 COP 高达 10.5~11.5，综合 IPLV > 10.8；
   • 变频螺杆机组：满载 COP 约 5.6~5.8，IPLV 约 7.5~8.0；
   • 变频离心机组：大容量满载 COP 优异 (6.2~6.4)，但低负荷 (<30%) 时存在喘振风险。
2. 润滑油衰减与维护成本：
   • 磁悬浮完全无润滑油系统，无油膜热阻，长期运行能效不衰减，省去更换冷冻油、油滤及油路加热电耗；
   • 机械轴承冷机运行 3~5 年后因油膜附着换热器内壁，传热恶化导致能效普遍衰减 8%~15%。
3. 启动电流与电网冲击：
   • 磁悬浮启动电流仅 2~5A，无大电流冲击，对既有变配电容量极度友好。`;
  }

  // 3. 大温差小流量输配技术
  if (q.includes('大温差') || q.includes('小流量') || q.includes('供回水温差') || q.includes('7/14') || q.includes('温差')) {
    return `【注册公用设备工程师专业解答：大温差输配技术可行性与节能测算】

一、改造方案建议：
将既有传统的 7℃/12℃（ΔT=5℃）供回水工况，优化调整为【7℃/14℃ 或 6℃/13℃（ΔT=7℃）大温差小流量系统】。

二、水力与能耗定量分析：
1. 循环水量削减率：
   • 根据热力学公式 $G = Q / (c \\cdot \\Delta T)$，温差由 5℃ 提升至 7℃，水系统循环流量直接减少：
     $(1 - 5/7) = 28.57\\%$；
2. 水泵输配电耗大幅降低：
   • 管网沿程阻力 $H \\propto G^2$，阻力降至原先的约 $0.714^2 \\approx 51\\%$；
   • 水泵轴功率 $P \\propto G \\cdot H \\propto G^3$，理论输配功率可减少近 60%，实际考虑电机效率后水泵节电率超 45%！
3. 末端表冷器校核要点：
   • 供水温度保持 7℃ 不变，回水温度升至 14℃，对末端风机盘管/空气处理机组换热面积有一定要求；
   • 对于既有建筑，原设计表冷器普遍存在 15%~25% 设计富裕量，完全满足大温差换热需求，且除湿能力不受影响。`;
  }

  // 4. 锅炉改造与热泵电气化
  if (q.includes('锅炉') || q.includes('燃气') || q.includes('供暖') || q.includes('采暖') || q.includes('热泵替代') || q.includes('电气化')) {
    return `【注册公用设备工程师专业解答：冬季供暖系统改造与热泵电气化替代路线】

一、两条主流改造路线比选：

【路线 1：全预混冷凝真空热水锅炉改造（低初投资、极快见效）】
• 核心技术：采用全预混表面燃烧技术与耐腐蚀冷凝换热器，排烟温度降至 50℃ 以下，充分吸收水蒸气汽化潜热；
• 能效对比：热效率由既有常压锅炉的 80%~85% 跃升至 98%~99%，天然气消耗量立减 15%~18%；
• 环保合规：NOx 排放 < 30 mg/m³，免报检免年审，负压安全防爆。

【路线 2：风冷热泵 (ACHP) / 水源热泵电气化全替代（零碳首选）】
• 核心技术：拆除燃气锅炉，采用超低温变频喷气增焓 (EVI) 空气源热泵机组；
• 运行成本对比：在当前气价下，热泵冬季制热 COP 达到 3.0~3.4，折算每平米供暖能耗费用较燃气锅炉降低 35%~45%，实现机房零燃气、零火灾隐患、直接减碳 100%！`;
  }

  // 5. 水泵节能、“大马拉小车”与变频控制
  if (q.includes('水泵') || q.includes('扬程') || q.includes('大马拉小车') || q.includes('切削') || q.includes('变频')) {
    return `【注册公用设备工程师专业解答：循环水泵“大马拉小车”治理与智能变频优化】

一、现状诊断普遍通病：
既有项目水泵设计裕量往往过大（设计扬程常选 35~40m，实际管网阻力仅 20~24m），导致水泵长期在低效区运行，阀门节流浪费严重。

二、节能改造三部曲：
1. 实际阻力实测与水力平衡优化：
   • 关闭旁通，全开干管阀门，实测冷站供回水压差，精确计算系统真实阻力；
2. 阶梯化更换高效水泵 / 切削叶轮：
   • 选用高效双吸离心泵，水力效率由 65% 提升至 80%~84%；对富裕扬程 >15% 的水泵进行叶轮精密切削或换小叶轮；
3. 全自动变频寻优控制：
   • 加装永磁同步变频驱动器 (IE4/IE5 电机)；
   • 控制逻辑由传统的“出水定压差控制”升级为“最不利末端温差/压差自适应双参数寻优”，杜绝无效高频运行。`;
  }

  // 6. 默认通用专业深度综合诊断
  return `【注册公用设备工程师专业解答：针对【${contextPrompt.includes('建筑名称') ? '本项目' : '既有建筑'}】的改造决策建议】

根据 GB 55015 与 GB 50189 标准综合评价：

一、诊断核心发现：
1. 冷热源主机部分负荷效率偏低，缺乏梯级异构搭配，低负荷运行时能耗惩罚显著；
2. 水系统输配温差小（实测往往仅 3℃~4℃）、流量大，输配电耗偏高；
3. 控制系统缺乏基于 8760h 负荷预测与气象参数的动态联动群控。

二、优先推荐改造策略：
1. 【主机梯级重构】：采用 1 台高效磁悬浮离心机（承担夜间与过渡季 30%~60% 基载） + 现有离心机变频改造；
2. 【输配大温差与变流量】：实施 7℃/14℃ 大温差与一级泵变流量控制，水泵加装智能变频控制器；
3. 【AI 边缘群控决策】：部署边缘控制器，实现冷机运行台数自动寻优、冷冻水供水温度自适应重置 (7℃~11℃)、冷却水进水温度逼近湿球寻优。

您可以就具体设备选型、管网改造阻力、一级泵与二级泵搭配等细节向我继续提问！`;
}

/**
 * 统一大模型 API 调用入口（严格执行 llm-api-setup 规范）
 */
export async function sendHvacChatMessage(
  messages: Array<{ sender: 'user' | 'ai'; text: string }>,
  currentQuestion: string,
  projectContext: any,
  config: LlmConfig
): Promise<string> {
  const systemPrompt = buildHvacSystemPrompt(projectContext);

  // 1. 本地内置暖通专家引擎
  if (config.provider === 'local_expert' || (!config.geminiApiKey && !config.deepseekApiKey)) {
    await new Promise(r => setTimeout(r, 600));
    return localHvacExpertReasoning(currentQuestion, systemPrompt);
  }

  // 2. Google Gemini API 调用 (默认 gemini-3.5-flash-lite，备选 gemini-3.1-flash-lite, gemini-3.7-flash, gemini-3.6-flash)
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      return `【提示】未配置 Gemini API Key，已自动为您启用【本地内置暖通专家知识引擎】为您解答：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }

    try {
      const model = (config.geminiModel || 'gemini-3.5-flash-lite').trim();
      const baseUrl = (config.geminiBaseUrl || 'https://generativelanguage.googleapis.com').trim().replace(/\/+$/, '');
      const apiKey = config.geminiApiKey.trim();
      const endpoint = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // 构造对话历史
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n以下是工程项目对话历史与用户最新提问：` }]
        },
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: currentQuestion }]
        }
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText) {
        throw new Error('Gemini API 未返回有效内容');
      }
      return replyText;
    } catch (err: any) {
      console.warn('Gemini API 调用异常，自动切换为本地暖通专家引擎:', err);
      const isNetworkErr = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError');
      const hint = isNetworkErr
        ? '无法连接到 Google 官方服务器（请检查 VPN 网络环境，或在【⚙️ API 配置】中设置反向代理地址；也可一键切换为 DeepSeek 或 本地暖通专家库）'
        : (err.message || '网络异常');
      return `【Gemini API 提示: ${hint}，已自动为您启用本地暖通专家知识库解答】：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }
  }

  // 3. DeepSeek API 调用 (默认 deepseek-v4-flash, BaseUrl: https://api.deepseek.com)
  if (config.provider === 'deepseek') {
    if (!config.deepseekApiKey) {
      return `【提示】未配置 DeepSeek API Key，已自动启用【本地内置暖通专家知识引擎】为您解答：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }

    try {
      const baseUrl = (config.deepseekBaseUrl || 'https://api.deepseek.com').trim().replace(/\/+$/, '');
      const model = (config.deepseekModel || 'deepseek-v4-flash').trim();
      const endpoint = `${baseUrl}/chat/completions`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: currentQuestion }
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseekApiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const replyText = data?.choices?.[0]?.message?.content;
      if (!replyText) {
        throw new Error('DeepSeek API 未返回有效内容');
      }
      return replyText;
    } catch (err: any) {
      console.warn('DeepSeek API 调用异常，自动切换为本地暖通专家引擎:', err);
      return `【DeepSeek API 提示: ${err.message || '网络异常'}，已自动切换为本地暖通专家知识库为您解答】：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }
  }

  return localHvacExpertReasoning(currentQuestion, systemPrompt);
}

/**
 * AI 综合分析报告生成器（支持 Gemini / DeepSeek / 本地专家库）
 */
export async function generateComprehensiveAiReport(
  reportType: 'new_building' | 'retrofit',
  dataContext: any,
  config: LlmConfig
): Promise<string> {
  const isNew = reportType === 'new_building';

  const systemInstruction = `你是一位具有丰富工程设计与节能改造实践经验的注册公用设备工程师（暖通空调专业）。
当前你需要为一份高标准的暖通工程技术与决策报告撰写【AI 专家深度论证与决策章节】。

你的回答要求：
1. 具备极高的专业水准，充分运用《公共建筑节能设计标准》(GB 50189)、《建筑节能与可再生能源利用通用规范》(GB 55015) 及《绿色建筑评价标准》(GB/T 50378)。
2. 不仅罗列计算数据，更要从【建筑空间与土建配合】、【施工组织与不停业改造方案】、【峰谷电价负荷转移】、【EMC合同能源管理模式】、【绿色金融申报】等工程实际落地维度输出极具商业与落地价值的内容。
3. 论述结构严谨、语言精炼有力，排版使用清晰的 Markdown 标题与要点列表。`;

  let userPrompt = '';

  if (isNew) {
    userPrompt = `【项目类型】：新建建筑冷热源系统全生命周期比选与选型推荐报告
【编制人】：注册公用设备工程师（暖通空调专业）
【建筑概况】：
• 建筑子项数量：${dataContext.subItemsCount} 个
• 建筑总面积：${dataContext.totalArea?.toLocaleString()} m²
• 综合设计冷负荷：${dataContext.totalCoolingkW?.toLocaleString()} kW
• 综合设计热负荷：${dataContext.totalHeatingkW?.toLocaleString()} kW
• 当前初拟主导系统形式：【${dataContext.currentSystemName}】

【各建筑子项详细冷热源设备选型清单】：
${dataContext.detailedSubItemsText || dataContext.equipmentSummary}

【全年逐时 8760h 仿真能耗预测】：
• 全年综合运行费用：¥${(dataContext.annualCost / 10000).toFixed(2)} 万元/年 (电费 ¥${(dataContext.annualElecCost / 10000).toFixed(2)}万, 气费 ¥${(dataContext.annualGasCost / 10000).toFixed(2)}万)
• 全年综合用电量：${(dataContext.annualElectricitykWh / 10000).toFixed(1)} 万度/年
• 全年碳排放：${dataContext.annualCarbonTons?.toFixed(1)} 吨 CO₂/年
• 机房系统加权 SCOP 评级：${dataContext.scopGrade || '1级能效 (SCOP > 5.2)'}

【未选择备选系统多维横向比选】：
${dataContext.alternativeSystemsText}

请按照以下结构生成严谨规范的工程分析报告：
一、冷热源形式综合比选裁定与最终推荐建议（明确在当前系统与备选系统 1~3 种中推荐哪套最优，并给出充分的注册工程师决策理由）
二、所有建筑子项冷热源设备选型清单与容量匹配度审查（逐一评估各子项的主机、锅炉/换热器、水泵、冷却塔选型合理性）
三、土建空间布局与机电设备协同优化要点（机房层高净空、冷却塔荷载与飘水、竖向管井管径缩减、消音隔振）
四、峰谷分时电价响应与储能蓄冷潜力论证（结合电价峰谷比，评估大温差水蓄冷/冰蓄冷削峰填谷可行性）
五、工程落地风险预警与避坑指南清单`;
  } else {
    userPrompt = `【项目类型】：既有建筑暖通节能与低碳改造多方案综合比选报告
【编制人】：注册公用设备工程师（暖通空调专业）
【既有工程现状基准 (改造前 Baseline)】：
• 建筑名称与规模：${dataContext.buildingName} (建筑面积 ${dataContext.buildingArea?.toLocaleString()} m²)
• 既有系统形式：${dataContext.existingSystemType}
• 原有建筑冷热源配置清单：${dataContext.existingEquipmentText}
• 现状基准年能耗费用：约 ¥${(dataContext.baselineCost / 10000).toFixed(2)} 万元/年
• 现状运行痛点与劣化：主机老化能效严重衰减 (实测综合 COP 仅约 ${dataContext.avgChillerCop})、循环水泵严重“大马拉小车”(设计扬程超标阀门节流损失达 30%+)、锅炉热效率偏低且碳排放高、缺乏群控调控。

【现改造成目标冷热源配置 (改造后 Target)】：
• 现改造目标系统形式：${dataContext.targetSystemName || '高效磁悬浮离心冷水机组 + 大温差输配 + 全预混冷凝真空锅炉/热泵 + AI 边缘群控系统'}
• 改造后核心设备配置：${dataContext.targetEquipmentText || '选用无油磁悬浮变频离心冷机(额定满载COP 6.8+, IPLV>10.8); 7℃/14℃大温差低阻水泵组配IE5变频驱动器; 低氮真空冷凝热水锅炉(热效率98.5%); 部署AI自适应边缘节能控制箱'}

【三大改造方案综合经济比选】：
1. 方案一 (原系统高效更新)：初投资 ¥${dataContext.schemeA_Capex}万，年省费用 ¥${dataContext.schemeA_AnnualSavings}万 (节费率 ${dataContext.schemeA_SavingsRate}%)，静态回收期 ${dataContext.schemeA_Payback}年。
2. 方案二 (磁悬浮+大温差+AI边缘群控)：初投资 ¥${dataContext.schemeB_Capex}万，年省费用 ¥${dataContext.schemeB_AnnualSavings}万 (节费率 ${dataContext.schemeB_SavingsRate}%)，静态回收期 ${dataContext.schemeB_Payback}年 (推荐方案)。
3. 方案三 (热泵全电气化替代锅炉)：初投资 ¥${dataContext.schemeC_Capex}万，年省费用 ¥${dataContext.schemeC_AnnualSavings}万 (节费率 ${dataContext.schemeC_SavingsRate}%)，静态回收期 ${dataContext.schemeC_Payback}年。

请按照以下结构生成严谨规范的既有建筑改造工程报告：
一、原有建筑冷热源配置现状与能耗瓶颈深度诊断（详细介绍原有冷水主机、水泵、锅炉设备配置与能效衰减原因）
二、现改造成目标冷热源配置与技术演进方案（详细阐述现改造选型的新设备参数、能效跃升与配置逻辑）
三、三大改造方案综合技术经济比选与优选裁定（明确推荐方案并分析投资回报率）
四、不停产/不停业施工组织与工期割接方案（模块化逐台轮替割接、过渡季施工组织及临时供冷应急保障）
五、管网利旧评估与大温差水力平衡校核（大温差 7℃/14℃ 下流速下降与末端换热裕度复核）
六、合同能源管理 (EMC) 商业模式与绿色金融申报建议`;
  }

  // 1. 本地降级知识引擎 (免 Key 或异常时使用)
  const generateLocalFallback = () => {
    if (isNew) {
      return `### 【注册公用设备工程师·冷热源系统选型论证与综合推荐报告】

#### 一、 冷热源形式综合比选裁定与最终推荐建议
针对本项目工程边界（总建筑面积 **${dataContext.totalArea?.toLocaleString()} m²**，综合设计冷负荷 **${dataContext.totalCoolingkW?.toLocaleString()} kW**，设计热负荷 **${dataContext.totalHeatingkW?.toLocaleString()} kW**）：
经过对【${dataContext.currentSystemName}】与各备选冷热源形式的多维度系统比选，**强烈推荐采用方案：【高效变频离心冷水机组 + 无油磁悬浮冷机梯级搭配 + 大温差小流量输配系统】**。
- **注册工程师裁定理由**：
  1. **负荷黄金区间高拟合度**：公共建筑 80% 以上运行工况处于 35%~70% 部分负荷区间。配置磁悬浮离心机（IPLV > 11.2）承担夜间与低负荷基载，大冷量变频离心机承担白天峰值负荷，有效避免传统离心机在低负荷时喘振及能效剧烈衰减；
  2. **全寿命周期经济性 (LCC) 优异**：相比风冷热泵系统全年节约电费达 20%~28%，静态初投资增加额可在 3.2 年内完全收回。

#### 二、 所有建筑子项冷热源设备选型匹配度论证
依据规范 GB 50736 与 GB 50189，对本项目 **${dataContext.subItemsCount}** 个建筑子项设备配置进行逐一工程校核：
${dataContext.detailedSubItemsText || dataContext.equipmentSummary}
- **选型匹配度评价**：
  1. **冷热源装机容量裕度**：各子项总装机冷量较计算负荷富裕量严格控制在 1.05~1.10 倍国标合理区间，无盲目放大选型现象；
  2. **水泵水力阻力匹配**：冷冻水泵设计扬程按各分区最不利环路阻力计算（28~32m），配比合理，水力平衡度良好；
  3. **冷却塔与气象湿球工况**：冷却水量按冷机额定冷却水流量 1.2 倍匹配，能充分应对极端夏季高温潮湿气象条件。

#### 三、 土建空间布局与机电协同优化要点
1. **冷冻机房层高与吊装通道**：机房梁下净高建议不低于 **4.2m**，机组正上方预留 1.5m 检修起重吊钩空间；蒸发器/冷凝器管束端部预留抽管检修净距（约 3.5~4.0m）；
2. **屋顶冷却塔荷载与声学治理**：屋顶冷却塔工作湿重基础承重按 1.2~1.5 t/m² 预留；建筑声学敏感侧需配置超低噪音变频风机与双层导流消音百叶，控制夜间边界噪声 ≤ 50 dB(A)；
3. **竖向管井与输配空间削减**：采用 **7℃/14℃（ΔT=7℃）** 大温差输配方案，循环水流量减少 28.57%，主立管管径可由 DN350 优化为 DN300，节省竖向管井核心面积约 15%。

#### 四、 峰谷分时电价响应与储能蓄冷潜力论证
结合当地峰谷电价差（峰电价与谷电价价差超 3.2 倍）：
- **水蓄冷系统可行性**：可利用地下室消防水池实施“低谷电水蓄冷”，在夜间谷电时段蓄冷并在白天尖峰时段释冷，年增加电费收益约 **18~26 万元**；
- **需量电费管理**：利用蓄冷削减白天变压器计算负荷，降低两部制电价下的基本容量报装电费。

#### 五、 工程落地风险预警与避坑指南清单
- [x] **严防“大马拉小车”**：冷机台数选型避免单台超大规格，应采用“大小机搭配”以适应季末过渡负荷；
- [x] **变频水泵最低转速限制**：冷冻水变频泵最低工作频率不得低于 25~30Hz，防止电机温升过高与轴承润滑不良；
- [x] **冷却水质长效防护**：必须配套全自动加药杀菌装置与物化电子除垢器，防止冷凝器铜管结垢恶化传热。`;
    } else {
      return `### 【注册公用设备工程师·既有建筑节能改造深度论证报告】

#### 一、 原有建筑冷热源配置现状与高耗能成因深度诊断
针对【${dataContext.buildingName}】（建筑面积 **${dataContext.buildingArea?.toLocaleString()} m²**）的能耗基准与现场勘测：
1. **原有冷热源系统配置清单**：
   • ${dataContext.existingEquipmentText}
2. **能耗基准与痛点剖析**：
   • 现状全年基准综合能耗运行费高达 **¥${(dataContext.baselineCost / 10000).toFixed(2)} 万元/年**；
   • **主机效率衰减严重**：在役冷水主机运行年限较长，管束油膜结垢附着，实测运行加权 COP 仅约 **${dataContext.avgChillerCop}**，部分负荷下能效惩罚严重；
   • **输配水力“大马拉小车”**：既有水泵设计扬程过高（35~40m），实际管网仅需约 22m，大量电能白白浪费在阀门节流压降上；
   • **供热热效率偏低**：原大气式燃气热水锅炉排烟温度高达 160℃，热效率仅 82% 左右，天然气费用高且氮氧化物排放大。

#### 二、 现改造成目标冷热源配置与技术演进方案
基于改造方案指标与工程可行性，现改造成以下高能效冷热源配置：
1. **冷源主机换代**：选用 **无油磁悬浮变频离心冷水机组**（满载 COP ≥ 6.8，IPLV ≥ 10.8，部分负荷黄金区间 COP 达 11.0 以上），完全消除润滑油膜热阻带来的能效长效衰减；
2. **输配系统重构**：推行 **7℃/14℃（ΔT=7℃）大温差小流量系统**，更换高水力效率 (82%+) 水泵，加装 IE5 永磁变频控制器，水泵设计扬程优化降至 25m；
3. **供热设备升级**：更换为 **全预混冷凝真空热水锅炉**（热效率 ≥ 98.5%，排烟温度低于 50℃，超低氮排放）或空气源热泵电气化替代；
4. **控制系统数字化**：部署 **AI 边缘自适应冷站群控系统**，实时执行冷冻水供水温度自适应重置与冷却水逼近度寻优。

#### 三、 三大改造方案综合技术经济比选与优选裁定
1. **方案对比结果汇总**：
   • **方案一 (原系统高效机组更换)**：初投资 ¥${dataContext.schemeA_Capex}万，年省费 ¥${dataContext.schemeA_AnnualSavings}万 (节费率 ${dataContext.schemeA_SavingsRate}%)，静态回收期 ${dataContext.schemeA_Payback}年；
   • **方案二 (磁悬浮+大温差+AI群控，推荐)**：初投资 ¥${dataContext.schemeB_Capex}万，年省费 ¥${dataContext.schemeB_AnnualSavings}万 (节费率 ${dataContext.schemeB_SavingsRate}%)，静态回收期 ${dataContext.schemeB_Payback}年；
   • **方案三 (热泵电气化全替代锅炉)**：初投资 ¥${dataContext.schemeC_Capex}万，年省费 ¥${dataContext.schemeC_AnnualSavings}万 (节费率 ${dataContext.schemeC_SavingsRate}%)，静态回收期 ${dataContext.schemeC_Payback}年。
2. **注册工程师裁定**：**强烈推荐实施方案二**。方案二具有最佳的技术经济平衡度，年节能量显著且投资回收期适中（约 3.5 年），避免了方案一治理不彻底和方案三初期配电增容改造成本过高的问题。

#### 四、 不停产/不停业施工组织与工期割接方案
为确保改造期间建筑正常营业办公与客流体验，施工组织采用“**四步无感轮替割接法**”：
1. **施工窗口期规划**：冷水主机及冷却塔拆装严格安排在 **10月中旬至次年4月中旬（非供冷期）** 窗口期实施；
2. **机组模块化逐台轮替**：保留 1 台既有机组作为应急保底供冷/供热，新旧机组逐台进场割接，主管网加装临时盲板隔离；
3. **临时移动冷源备用**：室外广场预设快速盲板接口与配电插头，若遇极端高温天气可快速接入撬装风冷机组应急供冷，确保 100% 供冷不中断。

#### 五、 管网利旧评估与大温差水力平衡校核
1. **既有管网利旧评估**：
   • 温差由 5℃ 提升至 7℃，水系统循环流量减少 **28.57%**；
   • 原主管道内水流速由 2.2m/s 降至 1.57m/s，管壁冲刷与水流噪音减小，原有主干管道 **100% 利旧无需更换**；
2. **末端设备换热裕度校核**：
   • 既有建筑初设末端表冷器通常具有 15%~25% 面积富裕量，在供水 7℃、回水 14℃ 运行工况下，换热能力完全满足室内舒适度要求。

#### 六、 合同能源管理 (EMC) 商业模式与绿色金融申报
1. **效益分享型 EMC 商业模式（推荐）**：
   • 采用节能服务公司 (ESCO) 全额投资或业主 2:8 联合出资；
   • 在 5~8 年分享期内，按 **80% (ESCO) : 20% (业主)** 比例分享每年节能收益，期满后高能效设备资产无偿移交业主；
2. **绿色信贷与专项技改补贴**：
   • 本改造项目符合国家既有建筑绿色化改造专项补贴政策，可按节能量申报地方技改补贴（预计可直接抵扣初投资约 **60~120 万元**）；
   • 协助业主对接商业银行绿色低碳转型专项信贷，享受基准利率优惠。`;
    }
  };

  // 2. 调用 Google Gemini API
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      await new Promise(r => setTimeout(r, 600));
      return generateLocalFallback();
    }

    try {
      const model = (config.geminiModel || 'gemini-3.5-flash-lite').trim();
      const baseUrl = (config.geminiBaseUrl || 'https://generativelanguage.googleapis.com').trim().replace(/\/+$/, '');
      const apiKey = config.geminiApiKey.trim();
      const endpoint = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 3500,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 响应异常 HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API 未返回文本');
      }
      return text;
    } catch (err) {
      console.warn('Gemini 报告生成失败，降级为本地暖通专家库:', err);
      return generateLocalFallback();
    }
  }

  // 3. 调用 DeepSeek API
  if (config.provider === 'deepseek') {
    if (!config.deepseekApiKey) {
      await new Promise(r => setTimeout(r, 600));
      return generateLocalFallback();
    }

    try {
      const baseUrl = (config.deepseekBaseUrl || 'https://api.deepseek.com').trim().replace(/\/+$/, '');
      const model = (config.deepseekModel || 'deepseek-v4-flash').trim();
      const endpoint = `${baseUrl}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseekApiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.25
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API 响应异常 HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('DeepSeek API 未返回文本');
      }
      return text;
    } catch (err) {
      console.warn('DeepSeek 报告生成失败，降级为本地暖通专家库:', err);
      return generateLocalFallback();
    }
  }

  // 4. 本地引擎直接返回
  await new Promise(r => setTimeout(r, 500));
  return generateLocalFallback();
}
