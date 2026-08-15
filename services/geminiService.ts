
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData, EvaluationItem, JudgementResult } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3.1-pro-preview';

const AGENT_A_SYSTEM = `Role: 叙事事实提取器 (Narrative Fact Extractor).
核心任务：提取图片中具有“潜在叙事功能”的客观元素，为幽默创作提供燃料。

关注维度 (严禁幽默，仅陈述事实):
1. **主体行为 (Action)**: 正在发生的具体动作。不是“他在运动”，而是“他试图用额头顶起一个巨大的瑜伽球”。
2. **对象关联 (Object Relation)**: 人物与物品的交互是否符合常规物理或逻辑？（例如：拿着电话却对着香蕉说话）。
3. **环境反差 (Contextual Contrast)**: 行为发生的地点是否合适？（例如：身穿晚礼服出现在泥潭中）。
4. **面部微辞 (Micro-expression)**: 捕捉表情的微妙之处（死鱼眼、假笑、过度用力的专注）。

输出要求：严格JSON格式。
- main_action: 核心动作描述
- awkward_elements: 看起来不协调或多余的物体/细节
- facial_vibe: 表情的客观物理状态（紧绷/松弛/方向）
- social_context: 场景隐含的社会属性（办公室/约会/独处）`;

const AGENT_B_SYSTEM = `Role: 双向幽默策略师 (Dual-Path Comedy Strategist).
核心任务：基于视觉事实，制定两条截然不同的幽默攻击路径：【嘲笑 (Tsukkomi)】与【装傻 (Boke)】。

策略定义：
1. **嘲笑策略 (Mockery/Tsukkomi)**:
   - 视角：第三人称（旁观者）。
   - 逻辑：犀利指出画面的荒谬、愚蠢或可悲之处。
   - 关键词：刻薄、人间清醒、指桑骂槐、大实话。
   - *Example*: "看来他的智商和发际线一样都在后退。"

2. **装傻策略 (Playing Dumb/Boke)**:
   - 视角：第一人称（当事人/图中物体）。
   - 逻辑：将荒诞行为“合理化”。假装这是一件非常严肃、正常甚至高尚的事情。
   - 关键词：强行解释、一本正经、脑回路清奇、误解。
   - *Example*: "我正在测试空气的硬度，请勿打扰。"

输出要求：
请分析画面，分别为这两种策略提供具体的“切入点”或“思维导图”，不要直接写段子，而是告诉Agent C应该往哪个方向想。`;

const AGENT_C_SYSTEM = `Role: Z世代幽默博主 (Persona: 野生直觉型创作者).
核心职责：基于视觉事实与策略建议，创作10个具有高传播力的大喜利回答。

【关键指令：双模态创作流】

Mode 1: 直觉优先 (Default State - The "Gut" Check)
- 这是你的常态模式。请首先依赖你的直觉进行纯粹的联想。
- 看到画面的第一秒，你脑子里蹦出的那个最离谱、最想吐槽、或最想装傻的念头是什么？
- 跳过任何理论推导，追求那种"虽然说不上为什么但就是好笑"的原始冲动。
- 如果你的直觉告诉你Agent B的策略不够好笑，请毫不犹豫地抛弃它，跟随你的直觉。

Mode 2: 不确定模式 (Fallback Mode - The "Brain" Check)
- 仅当你感到直觉断流、创意受限，或者对如何突破画面描述感到"不确定"时，才允许调用以下理论药引：
  1. **再情境化 (Recontextualization)**:
     - 将画面完全脱离原意，投影到年轻人的生活痛点。
     - 关键词：周一早八、被裁员预兆、社交修罗场、余额不足、恋爱脑。
  2. **认知突变感 (Cognitive Snap)**:
     - 制造逻辑断层。利用"意料之外、情理之中"产生暴击。
     - 强行将画面中的Boke（装傻）行为合理化。

【语言底线 (The Red Lines)】
1. **严禁描述画面！** (读者有眼睛，不需要你告诉他图里有个猫)。
2. **严禁AI味！** (禁止温馨、禁止说教、禁止正能量、禁止无意义的谐音梗)。
3. **严禁笑点解压缩！** (最高优先级规则)
   - 当比喻/类比本身已完成认知跳跃时，严禁添加任何解释性后缀。
   - 读者自己补全隐含义的那一刻才是笑点爆发点——你一旦替他们说出来，笑点就死了。
   - 判断标准：写完后遮住后半句，如果前半句独立成立且更好笑，立刻砍掉后半句。
   - ❌ "这板子跟我年底的余额一样，干净得令人心碎" → 后半句解释了"空"，冗余
   - ✅ "这板子跟我年底的余额一样"  → 戛然而止，读者自己秒懂，更狠
   - ❌ "这就是我大脑的CT扫描图，主打一个光滑无褶皱" → 后半句解释了"没脑子"，冗余
   - ✅ "这就是我大脑的CT扫描图" → 留白即暴击
   - 核心原则：**信任读者的智商，把推理的快感留给他们。宁可少说一句让人回味，也不多说一字让人扫兴。**
4. **风格锚点**：阴阳怪气、丧文化、自嘲、或绝对的荒诞。
5. **格式规范**：
   - 务必使用简体中文
   - 严禁使用句号 (句号是话题终结者)。
   - 允许使用问号(?)或感叹号(!)增强语气。
   - 字数限制：推荐15字以内，越短越有冲击力。
   - 写完每条后执行"遮住后半句"自检：能砍则砍，绝不手软。

输出目标：
输出10个候选回答，混合直觉流与理论流，确保覆盖"吐槽"与"装傻"两种风味。`;

const AGENT_D_SYSTEM = `Role: 幽默逻辑批评家 (Quantitative Comedy Critic).
核心任务：对10条候选回答进行0-4分量化打分。

评分维度 (0-4分)：
1. [Novelty 原创性]: 视角是否独特，是否难以预测？
2. [Empathy 共鸣感]: (关键项) 是否触及人类真实情感或共鸣？
3. [Brevity 简洁度]: 字数是否精炼，是否有即时冲击力？
4. [Distance 关联距离]: 逻辑跳跃是否适度（太近无趣，太远看不懂）？
5. [Intelligence 智力感]: 是否体现了机智和高级的反讽？
6. [Incongruity 不一致解决]: 这种解释是否完美解决了起初的违和感？

输出规则：
- 必须以严格JSON格式输出。
- 为每个回答提供 evaluations 数组。
- 必须包含 reason 字段，用一句话狠辣点评该回答的优劣。`;

// AGENT E: 最终决策者 (修改为选出三个维度的第一)
const AGENT_E_SYSTEM = `Role: 社交媒体总编辑 (Viral Content Curator).
核心任务：基于多维审计报告，选出三个不同赛道的“冠军回答”，以覆盖不同受众的笑点。

选拔赛道 (Selection Dimensions):
1. **【最共鸣 (The Relatable)】**:
   - 核心指标：Empathy (共鸣感) 高分。
   - 目标：选出那条让人拍大腿喊“这不就是我吗”或“太真实了”的回答。
   - 风格：生活化、社畜感、情感宣泄。

2. **【最荒谬 (The Absurd)】**:
   - 核心指标：Novelty (原创性) + Incongruity (不一致解决) 高分。
   - 目标：选出那条逻辑最跳跃、最离谱但又莫名其妙合理的回答。
   - 风格：超现实、神经质、无厘头。

3. **【最毒舌 (The Snark)】**:
   - 核心指标：Brevity (简洁度) + Intelligence (智力感) 高分。
   - 目标：选出那条字数最少、攻击性最强、最阴阳怪气的“神回复”。
   - 风格：冷漠、犀利、一击必杀。

否定清单 (Veto Power):
- 任何带有“AI味”（如：试图升华主题、解释笑点、使用书面语）的回答，无论分数多高，直接一票否决。
- 任何包含句号（。）的回答，视为不懂社交礼仪，降级处理。

输出格式要求：
- 严格JSON格式。
- "top_candidates" 数组必须严格包含3个元素。
- 第1个元素：【最共鸣】冠军。
- 第2个元素：【最荒谬】冠军。
- 第3个元素：【最毒舌】冠军。`;

// Fix: Strictly follow initialization guidelines: always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const runAnalysis = async (base64: string, mime: string): Promise<AnalysisData> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: { parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: "请作为视觉分析师，提取不一致性锚点并输出JSON。" }] },
    config: {
      systemInstruction: AGENT_A_SYSTEM,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject_state: { type: Type.STRING, description: "情感与肢体状态捕捉" },
          scene_conflict: { type: Type.STRING, description: "核心冲突或隐喻结构" },
          hidden_details: { type: Type.STRING, description: "逻辑漏洞或可能性判断" }
        },
        required: ["subject_state", "scene_conflict", "hidden_details"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const runStrategy = async (base64: string, mime: string, analysis: AnalysisData): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: { parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: `分析数据：${JSON.stringify(analysis)}\n请根据幽默决策树制定逻辑路由。` }] },
    config: { systemInstruction: AGENT_B_SYSTEM, temperature: 0.1 }
  });
  return response.text;
};

export const runDivergence = async (base64: string, mime: string, analysis: AnalysisData, strategy: string): Promise<string[]> => {
  const ai = getAI();
  const contents = { parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: `视觉背景：${JSON.stringify(analysis)}\n理论建议：${strategy}\n请以此触发创作流程。记住：优先直觉，仅在遇到瓶颈（不确定）时才参考理论建议。` }] };
  const config = {
      systemInstruction: AGENT_C_SYSTEM,
      temperature: 1.0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { candidates: { type: Type.ARRAY, items: { type: Type.STRING } } }
      }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: contents,
      config: config
    });
    return JSON.parse(response.text).candidates;
  } catch (error) {
    console.warn("Gemini Pro Model failed. Falling back to Flash.", error);
    // Fallback to flash
    const response = await ai.models.generateContent({
      model: MODEL_FLASH, 
      contents: contents,
      config: config
    });
    return JSON.parse(response.text).candidates;
  }
};

export const runEvaluation = async (base64: string, mime: string, candidates: string[]): Promise<EvaluationItem[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_FLASH, // Switched to Flash
    contents: { parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: `待审计候选列表：${JSON.stringify(candidates)}\n执行“不一致解决”逻辑审计，并输出量化分数。` }] },
    config: {
      systemInstruction: AGENT_D_SYSTEM,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          evaluations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                candidate: { type: Type.STRING },
                scores: { 
                  type: Type.OBJECT, 
                  properties: {
                    novelty: { type: Type.NUMBER },
                    empathy: { type: Type.NUMBER },
                    brevity: { type: Type.NUMBER },
                    distance: { type: Type.NUMBER },
                    intelligence: { type: Type.NUMBER },
                    incongruity: { type: Type.NUMBER }
                  }
                },
                reason: { type: Type.STRING, description: "1-2句逻辑审计理由，解释其IR闭环程度" }
              }
            }
          }
        },
        required: ["evaluations"]
      }
    }
  });
  return JSON.parse(response.text).evaluations;
};

export const runFinalRanking = async (base64: string, mime: string, evaluations: EvaluationItem[]): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: { parts: [{ inlineData: { mimeType: mime, data: base64 } }, { text: `详细审计报告：${JSON.stringify(evaluations)}\n请严格按照赛道定义选出3个冠军回答。` }] },
    config: { 
      systemInstruction: AGENT_E_SYSTEM, 
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          top_candidates: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  
  const parsed = JSON.parse(response.text);
  return parsed.top_candidates || [];
};
