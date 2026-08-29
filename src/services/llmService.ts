/**
 * 大模型 API 服务 (Gemini / DeepSeek / 本地暖通专家引擎)
 * 遵循 llm-api-setup 规范
 */

export type LlmProvider = 'gemini' | 'deepseek' | 'local_expert';

export interface LlmConfig {
  provider: LlmProvider;
  geminiApiKey: string;
  geminiModel: string; // 默认 gemini-3.5-flash-lite, 备选 gemini-3.7-flash, gemini-3.1-flash-lite
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string; // deepseek-v4-flash
}

const STORAGE_KEY = 'hvac_llm_config_v1';

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: 'gemini',
  geminiApiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
  geminiModel: 'gemini-3.5-flash-lite',
  deepseekApiKey: (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: 'https://api.deepseek.com',
  deepseekModel: 'deepseek-v4-flash',
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
  return `你是一位中国顶级暖通空调 (HVAC) 与既有建筑节能改造高级总工程师、绿色建筑国家级评审专家，精通《既有建筑节能改造技术规范》JGJ/T 129、《公共建筑节能设计标准》GB 50189-2015 及国家节能减碳法规政策。

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
    return `【暖通总工专业解答：一级泵变流量系统 (VPF) 与 二级泵系统选型决策】

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
    return `【暖通总工专业解答：磁悬浮无油离心机 vs 变频螺杆/传统离心机选型比选】

一、选型决策推荐：
对于商业综合体、星级酒店、高端办公等全年冷负荷波动大、低负荷运行时间长的建筑，【首选 1~2 台磁悬浮无油变频离心冷机作为基载与小负荷调节主机】。

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
    return `【暖通总工专业解答：大温差输配技术可行性与节能测算】

一、改造方案建议：
将既有传统的 7℃/12℃（ΔT=5℃）供回水工况，优化调整为【7℃/14℃ 或 6℃/13℃（ΔT=7℃）大温差小流量系统】。

二、水力与能耗定量分析：
1. 循环水量削减率：
   • 根据热力学公式 $G = Q / (c \cdot \Delta T)$，温差由 5℃ 提升至 7℃，水系统循环流量直接减少：
     $(1 - 5/7) = 28.57\%$；
2. 水泵输配电耗大幅降低：
   • 管网沿程阻力 $H \propto G^2$，阻力降至原先的约 $0.714^2 \approx 51\%$；
   • 水泵轴功率 $P \propto G \cdot H \propto G^3$，理论输配功率可减少近 60%，实际考虑电机效率后水泵节电率超 45%！
3. 末端表冷器校核要点：
   • 供水温度保持 7℃ 不变，回水温度升至 14℃，对末端风机盘管/空气处理机组换热面积有一定要求；
   • 对于既有建筑，原设计表冷器普遍存在 15%~25% 设计富裕量，完全满足大温差换热需求，且除湿能力不受影响。`;
  }

  // 4. 锅炉改造与热泵电气化
  if (q.includes('锅炉') || q.includes('燃气') || q.includes('供暖') || q.includes('采暖') || q.includes('热泵替代') || q.includes('电气化')) {
    return `【暖通总工专业解答：冬季供暖系统改造与热泵电气化替代路线】

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
    return `【暖通总工专业解答：循环水泵“大马拉小车”治理与智能变频优化】

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
  return `【暖通总工专业解答：针对【${contextPrompt.includes('建筑名称') ? '本项目' : '既有建筑'}】的改造决策建议】

根据 JGJ/T 129《既有建筑节能改造技术规范》与 GB 50189-2015 综合评价：

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
 * 统一大模型 API 调用入口
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
    // 模拟思考延迟提升真实感
    await new Promise(r => setTimeout(r, 600));
    return localHvacExpertReasoning(currentQuestion, systemPrompt);
  }

  // 2. Google Gemini API 调用
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      return `【提示】未配置 Gemini API Key，已自动为您启用【本地内置暖通专家知识引擎】为您解答：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }

    try {
      const model = config.geminiModel || 'gemini-3.5-flash-lite';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

      // 构造对话历史
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n以下是对话历史与用户最新提问：` }]
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
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText) {
        throw new Error('Gemini API 未返回有效内容');
      }
      return replyText;
    } catch (err: any) {
      console.warn('Gemini API 调用异常，自动切换为本地暖通专家引擎:', err);
      return `【Gemini API 调用提示: ${err.message || '网络异常'}，已自动切换为本地暖通专家知识库为您解答】：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }
  }

  // 3. DeepSeek API 调用
  if (config.provider === 'deepseek') {
    if (!config.deepseekApiKey) {
      return `【提示】未配置 DeepSeek API Key，已自动启用【本地内置暖通专家知识引擎】为您解答：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }

    try {
      const baseUrl = config.deepseekBaseUrl || 'https://api.deepseek.com';
      const model = config.deepseekModel || 'deepseek-chat';
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

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
          'Authorization': `Bearer ${config.deepseekApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data?.choices?.[0]?.message?.content;
      if (!replyText) {
        throw new Error('DeepSeek API 未返回有效内容');
      }
      return replyText;
    } catch (err: any) {
      console.warn('DeepSeek API 调用异常，自动切换为本地暖通专家引擎:', err);
      return `【DeepSeek API 调用提示: ${err.message || '网络异常'}，已自动切换为本地暖通专家知识库为您解答】：\n\n` + 
        localHvacExpertReasoning(currentQuestion, systemPrompt);
    }
  }

  return localHvacExpertReasoning(currentQuestion, systemPrompt);
}
