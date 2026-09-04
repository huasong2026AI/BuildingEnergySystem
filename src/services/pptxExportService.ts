import pptxgen from 'pptxgenjs';

export async function exportProjectPptx(): Promise<void> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'HVAC AI Platform';
  pres.company = 'Building Energy System';
  pres.title = '公共建筑暖通空调能效分析与 AI 智能改造决策系统';

  const C_DARK = '064E3B';
  const C_EMERALD = '059669';
  const C_LIGHT_BG = 'F4F9F6';
  const C_TEXT = '0F291E';
  const C_MUTED = '475569';
  const C_WHITE = 'FFFFFF';
  const C_CARD_BORDER = 'A7F3D0';
  const C_AMBER = 'D97706';

  const addHeader = (slide: any, badge: string, title: string, subtitle?: string, slideNum?: number) => {
    slide.background = { color: C_LIGHT_BG };
    slide.addText(badge, {
      x: 0.8, y: 0.4, w: 4.5, h: 0.32,
      fontSize: 10, bold: true, color: '064E3B',
      fill: { color: 'D1FAE5' }, rectRadius: 0.15, align: 'center'
    });
    slide.addText(title, {
      x: 0.8, y: 0.82, w: 11.5, h: 0.55,
      fontSize: 22, bold: true, color: C_TEXT
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.4, w: 11.5, h: 0.35,
        fontSize: 11.5, color: C_MUTED
      });
    }
    slide.addText('https://buildingenergysystem.pages.dev', {
      x: 0.8, y: 7.05, w: 6.0, h: 0.3,
      fontSize: 10, color: C_EMERALD, bold: true
    });
    if (slideNum) {
      slide.addText(`SLIDE ${slideNum} / 13`, {
        x: 10.5, y: 7.05, w: 2.0, h: 0.3,
        fontSize: 10, color: C_MUTED, bold: true, align: 'right'
      });
    }
  };

  // Slide 1: 封面
  {
    const s = pres.addSlide();
    s.background = { color: C_LIGHT_BG };
    s.addText('国家“双碳”战略引领 · 公共建筑超低能耗暖通数字化解决方案', {
      x: 1.0, y: 0.8, w: 11.3, h: 0.45,
      fontSize: 13, bold: true, color: '064E3B', fill: { color: 'D1FAE5' },
      align: 'center', rectRadius: 0.2
    });
    s.addText('公共建筑暖通空调\n全生命周期能效分析与 AI 改造决策系统', {
      x: 1.0, y: 1.55, w: 11.3, h: 1.55,
      fontSize: 32, bold: true, color: C_DARK, align: 'center', lineSpacingMultiple: 1.15
    });
    s.addText('基于 GB 50189 与 GB 55015 标准的全生命周期数字化赋能平台', {
      x: 1.0, y: 3.25, w: 11.3, h: 0.4,
      fontSize: 13.5, color: C_MUTED, align: 'center'
    });
    const cards = [
      { t: '工程规范标准', v: 'GB 50189 / GB 55015', d: '依据国家节能通用规范全生命周期评价' },
      { t: '8760h 能效模拟', v: 'Bin 负荷频次直方图', d: '精准捕捉 40%~80% 黄金部分负荷运行区间' },
      { t: 'AI 大模型专家', v: 'Gemini 3.7 / DeepSeek', d: '全量工程上下文注入，专业技术无障碍对答' },
      { t: '顶级设备品牌库', v: '各大品类单一顶级品牌', d: '特灵/凌擎/大金/力聚/威乐 177款真实铭牌数据' }
    ];
    cards.forEach((c, idx) => {
      const xPos = 0.8 + idx * 2.95;
      s.addShape(pres.ShapeType.roundRect, {
        x: xPos, y: 4.1, w: 2.75, h: 2.15,
        fill: { color: C_WHITE }, line: { color: C_CARD_BORDER, width: 1.5 }, rectRadius: 0.15
      });
      s.addText(c.t, { x: xPos + 0.15, y: 4.3, w: 2.45, h: 0.35, fontSize: 11, bold: true, color: C_EMERALD });
      s.addText(c.v, { x: xPos + 0.15, y: 4.75, w: 2.45, h: 0.65, fontSize: 13, bold: true, color: C_TEXT });
      s.addText(c.d, { x: xPos + 0.15, y: 5.45, w: 2.45, h: 0.65, fontSize: 10, color: C_MUTED });
    });
    s.addText('在线系统体验网址：https://buildingenergysystem.pages.dev', {
      x: 1.0, y: 6.75, w: 11.3, h: 0.35,
      fontSize: 11, bold: true, color: C_EMERALD, align: 'center'
    });
  }

  // Slide 2: 痛点
  {
    const s = pres.addSlide();
    addHeader(s, 'INDUSTRY PAIN POINTS', '既有公共建筑暖通空调系统四大高能耗痛点', '老旧设备衰减、水力失调小温差、缺乏动态仿真与群控粗放', 2);
    const items = [
      { num: '01', title: '老旧主机能效严重衰减', desc: '传统机械轴承机组运行数年后油膜热阻累积，冷凝器结垢严重，实际 COP 普遍由 5.0+ 衰减至 3.5 甚至更低，长期承受高电费惩罚。' },
      { num: '02', title: '“大流量、小温差”水系统严重浪费', desc: '原设计 5℃ 供回水温差实际运行往往仅 2.5℃~3.5℃，循环水泵常年在高频甚至工频运行，输配电耗占冷站总能耗比例高达 25%~35%。' },
      { num: '03', title: '缺乏 8760h 动态负荷模拟与梯级搭配', desc: '设计按极端峰值负荷放大裕量选型，机组全年 >70% 时间处于 40%~80% 甚至更低的部分负荷，单一大机“大马拉小车”，卸载损耗巨大。' },
      { num: '04', title: '系统调度粗放，无气象与负荷自适应寻优', desc: '出水温度定温设定、冷却水进水缺乏湿球逼近度寻优、未取最不利环路动态压差闭环控制，造成阀门节流与冷却风机冗余电耗累积。' }
    ];
    items.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 2.0 + row * 2.35;
      s.addShape(pres.ShapeType.roundRect, {
        x, y, w: 5.6, h: 2.1,
        fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
      });
      s.addText(item.num, { x: x + 0.3, y: y + 0.2, w: 0.8, h: 0.4, fontSize: 16, bold: true, color: 'DC2626' });
      s.addText(item.title, { x: x + 1.1, y: y + 0.2, w: 4.2, h: 0.4, fontSize: 14, bold: true, color: C_TEXT });
      s.addText(item.desc, { x: x + 0.3, y: y + 0.7, w: 5.0, h: 1.2, fontSize: 10.5, color: C_MUTED });
    });
  }

  // Slide 3: 五步闭环
  {
    const s = pres.addSlide();
    addHeader(s, 'SYSTEM ARCHITECTURE', '五步全业务闭环数字化系统架构', '从多业态负荷建模、设备自动配比、原理图模拟、8760h能耗分析到既有AI改造闭环', 3);
    const steps = [
      { s: '1', name: '动态负荷建模', desc: '多业态子项划分、冷热指标自定义、使用时段与共用冷站智能合并。' },
      { s: '2', name: '多系统自动配比', desc: '冷机梯级推荐、水泵水温流量热力联动推导、实际配比率红字预警。' },
      { s: '3', name: '水力原理拓扑', desc: '系统拓扑图交互模拟、供回水温差、水流流向动态可视化呈现。' },
      { s: '4', name: '8760h 能耗分析', desc: '逐时逐月能耗精算、峰谷平分时电费、GB 50189 SCOP 五星级评级。' },
      { s: '5', name: '既有 AI 改造诊断', desc: '三大 Pareto 方案比选、四大边缘群控落地、Gemini 3.7 专家对答。' }
    ];
    steps.forEach((st, idx) => {
      const x = 0.8 + idx * 2.35;
      s.addShape(pres.ShapeType.roundRect, {
        x, y: 2.1, w: 2.2, h: 4.5,
        fill: { color: C_WHITE }, line: { color: C_CARD_BORDER, width: 1.5 }, rectRadius: 0.15
      });
      s.addShape(pres.ShapeType.ellipse, {
        x: x + 0.75, y: 2.4, w: 0.7, h: 0.7,
        fill: { color: C_EMERALD }, line: { color: '047857', width: 1 }
      });
      s.addText(st.s, { x: x + 0.75, y: 2.45, w: 0.7, h: 0.6, fontSize: 16, bold: true, color: C_WHITE, align: 'center' });
      s.addText(st.name, { x: x + 0.1, y: 3.35, w: 2.0, h: 0.5, fontSize: 13, bold: true, color: C_TEXT, align: 'center' });
      s.addText(st.desc, { x: x + 0.15, y: 4.05, w: 1.9, h: 2.2, fontSize: 10.5, color: C_MUTED });
    });
  }

  // Slide 4: 多业态建模
  {
    const s = pres.addSlide();
    addHeader(s, 'LOAD MODELING & TARIFF', '多业态子项动态负荷建模与能源参数配置', '支持办公、商业、酒店等多业态自定义指标，多子项合并冷站与峰谷平电价', 4);
    const box1 = [
      '• 灵活子项划分：支持新建酒店、办公、商场、大型卖场等多种功能子项；',
      '• 复合系统支持：涵盖常规冷水机组+锅炉、水冷磁悬浮、特灵风冷热泵 (ACHP)、大金 VRV 多联机；',
      '• 集中共用冷源合并：多个建筑子项勾选“共用冷站”，系统自动合并总冷负荷智能推导主机配置；',
      '• 典型工程示例：总面积 55,000 m²（商场 35,000 m² + 办公 20,000 m²）。'
    ].join('\n');
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 2.0, w: 5.6, h: 4.6,
      fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
    });
    s.addText('多业态子项与复合冷热源', { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: C_TEXT });
    s.addText(box1, { x: 1.1, y: 2.8, w: 5.0, h: 3.5, fontSize: 11, color: C_MUTED, lineSpacingMultiple: 1.25 });
    const box2 = [
      '• 峰谷平分时电价精准测算：尖峰、高峰、平时、低谷时段独立计费；',
      '• 天然气单价联动：支持天然气单价自由输入，精准计算燃气锅炉耗气成本；',
      '• 默认基准价格：平均电价 ¥0.85/度，天然气价 ¥3.50/m³；',
      '• 8760h 逐时匹配：系统将每小时模拟电耗与对应时刻电价严格相乘求和，真实还原商业账单。'
    ].join('\n');
    s.addShape(pres.ShapeType.roundRect, {
      x: 6.7, y: 2.0, w: 5.6, h: 4.6,
      fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
    });
    s.addText('分时电价与能源价格体系', { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: C_TEXT });
    s.addText(box2, { x: 7.0, y: 2.8, w: 5.0, h: 3.5, fontSize: 11, color: C_MUTED, lineSpacingMultiple: 1.25 });
  }

  // Slide 5: 设备自动配比与平衡
  {
    const s = pres.addSlide();
    addHeader(s, 'EQUIPMENT SIZING & BALANCE', '全系统设备自动化配置与多系统水力平衡逻辑', '依据 GB 50736 规范，涵盖冷水机组、水泵流量、真空锅炉、风冷热泵 (ACHP) 与大金 VRV 多联机', 5);
    const modules = [
      { m: '模块 1 · 主机配置', t: '冷热源容量梯级匹配', d: '• 水冷离心/螺杆：特灵 CVHE/G 与 RTHD\n• 无油磁悬浮：凌擎 125~2200RT\n• 风冷热泵：特灵双一级能效\n• 多联机：大金 VRV 8~48HP' },
      { m: '模块 2 · 水力联动', t: '流量与水塔热力推导', d: '• G = Q·3.6 / (4.186·ΔT)\n• 冷冻水温差 7/12℃ (ΔT=5℃)\n• 金日冷却塔按冷却水流量×1.15\n• ACHP/VRV 无冷却水冗余' },
      { m: '模块 3 · 供热匹配', t: '力聚超低氮真空锅炉', d: '• 按总热负荷匹配力聚水冷预混冷凝真空热水机组\n• 热效率 104.5%~106.2%\n• 联动威乐热水循环水泵\n• 微负压运行永无爆炸隐患' },
      { m: '模块 4 · 配比校核', t: '实际配比率红字预警', d: '• 配比率 = 配置总容量 ÷ 理论推荐值\n• 95%~105% 翡翠绿合规标准\n• 严重偏离触发醒目红字预警\n• 实时量化额外浪费电费' }
    ];
    modules.forEach((mod, idx) => {
      const x = 0.8 + idx * 2.95;
      s.addShape(pres.ShapeType.roundRect, {
        x, y: 2.1, w: 2.75, h: 4.5,
        fill: { color: C_WHITE }, line: { color: C_CARD_BORDER, width: 1.5 }, rectRadius: 0.15
      });
      s.addText(mod.m, { x: x + 0.15, y: 2.3, w: 2.45, h: 0.35, fontSize: 11, bold: true, color: C_EMERALD });
      s.addText(mod.t, { x: x + 0.15, y: 2.75, w: 2.45, h: 0.5, fontSize: 13, bold: true, color: C_TEXT });
      s.addText(mod.d, { x: x + 0.15, y: 3.4, w: 2.45, h: 2.8, fontSize: 10.5, color: C_MUTED, lineSpacingMultiple: 1.2 });
    });
  }

  // Slide 6: 8760h Bin Analysis
  {
    const s = pres.addSlide();
    addHeader(s, 'BIN ANALYSIS & LOAD PROFILE', '8760h 全年逐时负荷频次分布 (Bin Analysis)', '揭示全年 >70% 运行小时处于 40%~80% 黄金部分负荷区间，杜绝满负荷单一选型误区', 6);
    const pts = [
      { t: '负荷分布核心特征', d: '公共建筑负荷受室外气象与室内人员启闭动态影响，全年 8760 小时呈现典型的偏态分布。满载工况仅占 3%~5%，超过 70% 的运行时间集中在 40%~80% 的中低负荷段。' },
      { t: '部分负荷能效是节能关键', d: '冷水机组与水系统的节能决战在“部分负荷区间”。必须重点考核 IPLV、APF 与综合系统能效比 SCOP，而非仅仅关注名义额定满载 COP。' },
      { t: '大机与小机异构搭配收益', d: '通过配置 1 台小容量磁悬浮离心机承担夜间、过渡季低负荷，搭配 2~3 台大型高效变频冷水机组，可确保机组全周期处于 50%~75% 的最高 COP 黄金工况区。' }
    ];
    pts.forEach((p, idx) => {
      const y = 2.1 + idx * 1.5;
      s.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y, w: 11.5, h: 1.35,
        fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
      });
      s.addText(p.t, { x: 1.1, y: y + 0.15, w: 10.8, h: 0.35, fontSize: 13, bold: true, color: C_EMERALD });
      s.addText(p.d, { x: 1.1, y: y + 0.55, w: 10.8, h: 0.7, fontSize: 10.5, color: C_MUTED });
    });
  }

  // Slide 7: GB 50189 SCOP
  {
    const s = pres.addSlide();
    addHeader(s, 'GB 50189 SCOP BENCHMARK', 'GB 50189 规范 SCOP 综合制冷能效评级体系', '综合制冷系统全年能效比评星标准，推动冷源系统迈向 5.0+ 卓越能效', 7);
    const stars = [
      { star: '★☆☆☆☆', level: '1 星级基准', scop: 'SCOP 3.50 ~ 3.79', d: '传统老旧冷站常见水平，常开工频泵，无群控优化' },
      { star: '★★☆☆☆', level: '2 星级标准', scop: 'SCOP 3.80 ~ 4.19', d: '国家节能设计规范合格基准线' },
      { star: '★★★☆☆', level: '3 星级良好', scop: 'SCOP 4.20 ~ 4.59', d: '一级能效变频主机 + 水泵变频初步调控' },
      { star: '★★★★☆', level: '4 星级优秀', scop: 'SCOP 4.60 ~ 4.99', d: '大温差小流量系统 + 高效磁悬浮 + 智能群控' },
      { star: '★★★★★', level: '5 星级卓越', scop: 'SCOP ≥ 5.00', d: '超高效机房，零油阻磁悬浮 + AI 边缘毫秒级自适应寻优' }
    ];
    stars.forEach((st, idx) => {
      const y = 2.05 + idx * 0.95;
      s.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y, w: 11.5, h: 0.85,
        fill: { color: C_WHITE }, line: { color: idx === 4 ? '10B981' : 'E2E8F0', width: idx === 4 ? 2 : 1 }, rectRadius: 0.12
      });
      s.addText(st.star, { x: 1.1, y: y + 0.22, w: 2.0, h: 0.4, fontSize: 13, bold: true, color: C_AMBER });
      s.addText(st.level, { x: 3.2, y: y + 0.22, w: 2.0, h: 0.4, fontSize: 12, bold: true, color: C_TEXT });
      s.addText(st.scop, { x: 5.3, y: y + 0.22, w: 2.2, h: 0.4, fontSize: 12, bold: true, color: C_EMERALD });
      s.addText(st.d, { x: 7.6, y: y + 0.22, w: 4.4, h: 0.4, fontSize: 10.5, color: C_MUTED });
    });
  }

  // Slide 8: 单品牌顶级设备库
  {
    const s = pres.addSlide();
    addHeader(s, 'TOP-BRAND EQUIPMENT CATALOG', '暖通主流设备规格参数库（各大品类单一顶级品牌）', '各大品类严格精选单一主流标杆品牌，全库共 177 款设备，全量基于真实物理铭牌电功率精算', 8);
    const eqList = [
      { name: '1. 磁悬浮冷水机组 (30款)', brand: '凌擎 (Lingqing) LSBLX全系列', spec: '125RT~2200RT (440~7737kW)，无油磁悬浮，COP高达7.04，零机械摩擦，30年免大修' },
      { name: '2. 变频水冷螺杆/离心冷机 (42款)', brand: '特灵 (Trane) CVHE/G 与 RTHD', spec: 'CVHE/G 离心机 16款 (400~1400冷吨) + RTHD 双螺杆 26款 (151~413冷吨)，三级离心高效' },
      { name: '3. 全预混真空热水机组 (10款)', brand: '力聚 (Liju) 水冷预混超低氮', spec: '0.35MW~7.0MW (30~600万大卡)，热效率超105%，微负压运行永无爆炸隐患' },
      { name: '4. 风冷螺杆/模块热泵 (48款)', brand: '特灵 (Trane) 双1级模块热泵', spec: 'RTWD / CXAX / CGAM / RTXG 全系列，超高制冷COP 3.64，夏冷冬热一体化' },
      { name: '5. 循环水泵 (14款)', brand: '威乐 (Wilo) 中开双吸离心泵', spec: '流量 60~1200 m³/h，水力效率高达86.5%，精准覆盖 100RT~1500RT 各级工况' },
      { name: '6. 冷却塔 (13款) & VRV (18款)', brand: '金日 (King Sun) / 大金 (Daikin)', spec: '金日超低噪横流塔 (100~1500 m³/h)；大金VRV (8~48HP) 全面标称 GB 21454 APF (5.50~4.80)' }
    ];
    eqList.forEach((eq, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 3.9;
      const y = 2.1 + row * 2.3;
      s.addShape(pres.ShapeType.roundRect, {
        x, y, w: 3.7, h: 2.1,
        fill: { color: C_WHITE }, line: { color: C_CARD_BORDER, width: 1.5 }, rectRadius: 0.15
      });
      s.addText(eq.name, { x: x + 0.2, y: y + 0.2, w: 3.3, h: 0.35, fontSize: 11, bold: true, color: C_EMERALD });
      s.addText(eq.brand, { x: x + 0.2, y: y + 0.6, w: 3.3, h: 0.45, fontSize: 13, bold: true, color: C_TEXT });
      s.addText(eq.spec, { x: x + 0.2, y: y + 1.1, w: 3.3, h: 0.85, fontSize: 10, color: C_MUTED });
    });
  }

  // Slide 9: 节能改造三大 Pareto 比选
  {
    const s = pres.addSlide();
    addHeader(s, 'RETROFIT COMPARISON (GB 55015)', '既有建筑节能改造三大 Pareto 方案比选', '依据 GB 55015 规范，兼顾初投资规模、节费率与静态投资回收期', 9);
    const plans = [
      { tag: '方案 A · 快速常规改造', title: '高效变频螺杆/离心主机 + 水泵加装变频器', roi: '静态回收期: 2.5 年', save: '年节约电费: 15% ~ 20%', d: '保留原有管网工况与水塔，仅替换老旧高耗能冷机为一级能效变频机组，循环水泵加装常规变频器。初投资较小，见效快，适合预算有限的项目。' },
      { tag: '方案 B · 深度系统重构', title: '高效磁悬浮离心机 + 大温差小流量 + 高效泵塔', roi: '静态回收期: 3.2 年', save: '年节约电费: 28% ~ 35%', d: '采用磁悬浮离心机承担基载，实施 7℃/14℃ 大温差输配，同步更换高效水泵与低噪冷却塔。彻底解决小温差大流量顽疾，实现水力热力深度节能。' },
      { tag: '方案 C · 全面智慧赋能', title: '磁悬浮离心基载 + AI 边缘群控 + 动态压差闭环', roi: '静态回收期: 3.8 年', save: '年节约电费: 35% ~ 45%', d: '在方案 B 基础上植入即插即用 AI 边缘控制器，执行供水温度自适应重置、冷却水逼近湿球寻优与末端最不利压差闭环，打造超低能耗智慧标杆冷站。' }
    ];
    plans.forEach((p, idx) => {
      const y = 2.05 + idx * 1.55;
      s.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y, w: 11.5, h: 1.4,
        fill: { color: C_WHITE }, line: { color: idx === 2 ? '10B981' : 'E2E8F0', width: idx === 2 ? 2 : 1 }, rectRadius: 0.15
      });
      s.addText(p.tag, { x: 1.1, y: y + 0.15, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: idx === 2 ? C_EMERALD : C_MUTED });
      s.addText(p.title, { x: 1.1, y: y + 0.45, w: 7.0, h: 0.4, fontSize: 13, bold: true, color: C_TEXT });
      s.addText(p.d, { x: 1.1, y: y + 0.85, w: 7.2, h: 0.45, fontSize: 10, color: C_MUTED });
      s.addText(p.save, { x: 8.8, y: y + 0.25, w: 3.2, h: 0.35, fontSize: 12, bold: true, color: 'DC2626', align: 'right' });
      s.addText(p.roi, { x: 8.8, y: y + 0.65, w: 3.2, h: 0.35, fontSize: 11, bold: true, color: C_EMERALD, align: 'right' });
    });
  }

  // Slide 10: 四大 AI 边缘群控措施
  {
    const s = pres.addSlide();
    addHeader(s, 'AI EDGE COMPUTING & CONTROL', '四大 AI 边缘计算与智能群控落地措施', '即插即用边缘控制器，实现基于负荷预测与室外气象的毫秒级自适应寻优', 10);
    const aiMeasures = [
      { m: '措施 1 · 供水优化', t: '冷水供水温度自适应重置 (Supply Temp Reset)', d: '在部分负荷与过渡季工况下，根据室外湿球气象与末端实际阀门开度，将冷水供水温度由 7℃ 动态提升至 8.5℃~11℃。冷机每提升 1℃ 出水温度，COP 提升约 3.0%~3.5%。', kpi: '冷机节电 6% ~ 12%' },
      { m: '措施 2 · 逼近度寻优', t: '冷却水进水温度逼近度寻优 (Approach Optimization)', d: '基于室外湿球温度预测，动态联动冷却塔风机频率与冷却泵流量，保持进水温度稳定逼近湿球 2.5℃~3.0℃，降低冷凝压力与压缩比，大幅降低压缩机功耗。', kpi: '冷凝电耗降低 6% ~ 10%' },
      { m: '措施 3 · 负荷分配', t: '多台主机非等比加减机寻优 (Load Dispatching)', d: '基于磁悬浮与离心机各自的 COP-负荷特性曲线，实时计算系统总电耗最低的启停组合与负荷分配，使各机组始终工作在各自的 50%~75% 黄金高效区。', kpi: '群控调度节电 8% ~ 15%' },
      { m: '措施 4 · 动态压差', t: '最不利环路动态压差闭环控制 (Critical Zone DP)', d: '取末端最不利环路压差作为主控信号，摒弃传统的出水总管定压差控制，消除管网阻力冗余浪费，避免阀门节流损失，大幅降低输配电耗。', kpi: '输配水泵节电 20% ~ 35%' }
    ];
    aiMeasures.forEach((am, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 2.0 + row * 2.35;
      s.addShape(pres.ShapeType.roundRect, {
        x, y, w: 5.6, h: 2.1,
        fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
      });
      s.addText(am.m, { x: x + 0.3, y: y + 0.15, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: C_EMERALD });
      s.addText(am.kpi, { x: x + 2.8, y: y + 0.15, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: 'DC2626', align: 'right' });
      s.addText(am.t, { x: x + 0.3, y: y + 0.5, w: 5.0, h: 0.45, fontSize: 12, bold: true, color: C_TEXT });
      s.addText(am.d, { x: x + 0.3, y: y + 0.95, w: 5.0, h: 1.0, fontSize: 10, color: C_MUTED });
    });
  }

  // Slide 11: 大模型接入
  {
    const s = pres.addSlide();
    addHeader(s, 'LLM INTEGRATION & EXPERT Q&A', '深度接入大模型 (Gemini 3.7 / DeepSeek)', '全量暖通工程上下文注入，打造专业级专家交互对答系统（彻底杜绝答非所问）', 11);
    const box1 = [
      '• Google Gemini 3.7：原生支持 Gemini 3.7 旗舰专家模型与 3.5 系列，毫秒级流式响应；',
      '• DeepSeek V4：专属加速模型，深度融合工程经济学与物理能效计算；',
      '• 本地暖通专家引擎：无需配置 API Key 离线可用，内置暖通总工级工程推理；',
      '• 安全隐私保护：用户配置的 API Key 仅保存在本地浏览器 LocalStorage 中，绝不上传服务器。'
    ].join('\n');
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 2.0, w: 5.6, h: 4.6,
      fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
    });
    s.addText('多模型引擎自主切换与本地安全', { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: C_TEXT });
    s.addText(box1, { x: 1.1, y: 2.8, w: 5.0, h: 3.5, fontSize: 11, color: C_MUTED, lineSpacingMultiple: 1.25 });
    const box2 = [
      '• 现场实问：“针对 55,000 m² 公共建筑，管网阻力 ≤300kPa 下该选一级泵还是二级泵？”',
      '• AI 定量论证回答要点：',
      '  1. 强烈推荐变频一级泵系统 (VPF)，省去二级泵机组与配电，降低初投资 20%~30%；',
      '  2. 消除旁通集分水器混水温升 (0.5℃~1.2℃)，输配综合节电 15%~25%；',
      '  3. 严格校核主机 10%~20%/min 变流量适应性与末端最不利环路动态压差闭环控制。'
    ].join('\n');
    s.addShape(pres.ShapeType.roundRect, {
      x: 6.7, y: 2.0, w: 5.6, h: 4.6,
      fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
    });
    s.addText('全量工程上下文注入与定量分析', { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: C_TEXT });
    s.addText(box2, { x: 7.0, y: 2.8, w: 5.0, h: 3.5, fontSize: 11, color: C_MUTED, lineSpacingMultiple: 1.25 });
  }

  // Slide 12: 实测案例
  {
    const s = pres.addSlide();
    addHeader(s, 'PUBLIC BUILDING CASE STUDY', '公共建筑工程实测案例与经济环境效益', '华东某 58,000 m² 公共建筑冷站实测：年节电 42.8 万 kWh，投资回收期 3.2 年', 12);
    const kpis = [
      { t: '改造前冷站年电耗', v: '191.2 万 kWh', sub: '系统 COP 仅 3.8', c: 'DC2626' },
      { t: '改造后实测年电耗', v: '148.4 万 kWh', sub: '系统 COP 跃升至 5.1', c: C_EMERALD },
      { t: '实测年节电量 / 节电率', v: '42.8 万 kWh', sub: '节电率高达 22.4%', c: '0284C7' },
      { t: '年节省电费 / 回收期', v: '¥36.4 万元/年', sub: '静态回收期 3.2 年', c: C_AMBER }
    ];
    kpis.forEach((k, idx) => {
      const x = 0.8 + idx * 2.95;
      s.addShape(pres.ShapeType.roundRect, {
        x, y: 2.1, w: 2.75, h: 1.8,
        fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
      });
      s.addText(k.t, { x: x + 0.15, y: 2.3, w: 2.45, h: 0.3, fontSize: 11, color: C_MUTED, align: 'center' });
      s.addText(k.v, { x: x + 0.15, y: 2.65, w: 2.45, h: 0.6, fontSize: 16, bold: true, color: k.c, align: 'center' });
      s.addText(k.sub, { x: x + 0.15, y: 3.35, w: 2.45, h: 0.35, fontSize: 10.5, color: C_MUTED, align: 'center' });
    });
    const caseDesc = [
      '• 改造核心措施：置换 1 台 2800kW 老旧高耗能离心冷机为凌擎高效水冷磁悬浮机组（COP 7.04），水系统实施 7℃/13℃ 大温差变流量改造，更换 3 台威乐超高效双吸循环水泵，部署 AI 边缘群控；',
      '• 环境效益：每年直接减少二氧化碳碳排放当量约 372.4 吨 (tCO₂)，相当于植树 20,500 棵；',
      '• 运维收益：磁悬浮无油系统省去冷冻润滑油、油过滤器更换及油路电加热费用，设备寿命延长 10 年以上。'
    ].join('\n');
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 4.2, w: 11.5, h: 2.4,
      fill: { color: C_WHITE }, line: { color: C_CARD_BORDER, width: 1.5 }, rectRadius: 0.15
    });
    s.addText('改造方案落地实施路径与环境减碳效益', { x: 1.1, y: 4.4, w: 10.8, h: 0.35, fontSize: 13, bold: true, color: C_TEXT });
    s.addText(caseDesc, { x: 1.1, y: 4.85, w: 10.8, h: 1.6, fontSize: 10.5, color: C_MUTED, lineSpacingMultiple: 1.25 });
  }

  // Slide 13: 总结
  {
    const s = pres.addSlide();
    addHeader(s, 'CONCLUSION & OUTLOOK', '总结与展望：数字智能赋能绿色低碳建筑', '打造暖通空调从规划设计、动态模拟到智能改造的一体化标杆解决方案', 13);
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 2.1, w: 11.5, h: 2.2,
      fill: { color: C_WHITE }, line: { color: C_CARD_BORDER, width: 2 }, rectRadius: 0.15
    });
    s.addText('数字化与 AI 深度融合，驱动建筑能效全生命周期跃升', {
      x: 1.1, y: 2.4, w: 10.8, h: 0.5,
      fontSize: 18, bold: true, color: C_DARK, align: 'center'
    });
    s.addText('本系统实现了从负荷推导、设备全系统自动配比联动、8760h 频次模拟到既有 AI 改造决策的完整工程闭环，为设计院、节能服务公司 (EMCO) 与楼宇业主提供强有力的数字化工具。', {
      x: 1.5, y: 3.0, w: 10.0, h: 1.0,
      fontSize: 12, color: C_MUTED, align: 'center', lineSpacingMultiple: 1.2
    });
    const pillars = [
      { t: '高精准度', d: '基于 8760h 频次与设备真实铭牌功率，计算结果高度契合工程实际。' },
      { t: '高合规性', d: '严格遵守 GB 50189 SCOP 评级与 GB 55015 规范标准。' },
      { t: '高智能化', d: '全量工程上下文无缝对接 Gemini 3.7 / DeepSeek 大模型专家咨询。' }
    ];
    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 3.95;
      s.addShape(pres.ShapeType.roundRect, {
        x, y: 4.55, w: 3.75, h: 1.3,
        fill: { color: C_WHITE }, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.15
      });
      s.addText(p.t, { x: x + 0.2, y: 4.7, w: 3.35, h: 0.3, fontSize: 12, bold: true, color: C_EMERALD });
      s.addText(p.d, { x: x + 0.2, y: 5.05, w: 3.35, h: 0.65, fontSize: 10, color: C_MUTED });
    });
    s.addText('感谢聆听 · 欢迎交流与工程合作', {
      x: 1.0, y: 6.1, w: 11.3, h: 0.4,
      fontSize: 14, bold: true, color: C_DARK, align: 'center'
    });
    s.addText('在线系统体验网址：https://buildingenergysystem.pages.dev', {
      x: 1.0, y: 6.55, w: 11.3, h: 0.35,
      fontSize: 11, bold: true, color: C_EMERALD, align: 'center'
    });
  }

  // 保存并触发浏览器直接下载 PPTX 文件
  await pres.writeFile({ fileName: '公共建筑暖通空调能效分析与AI智能改造决策系统_项目汇报.pptx' });
}
