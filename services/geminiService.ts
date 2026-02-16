import { GoogleGenAI, Type } from "@google/genai";

// ==========================================
// MODEL CONFIGURATION (Mixed-Model Orchestration)
// ==========================================
// Phase 1 & 2: Fast, Visual, Logical -> Gemini 3 Flash
const MODEL_FAST = 'gemini-3-flash-preview'; 

// Phase 3, 4, 5: Creative, Complex, Reasoning -> Gemini 3 Pro
const MODEL_DEEP = 'gemini-3-pro-preview';

// ==========================================
// PROMPT DEFINITIONS
// ==========================================

// --- Agent A: Visual & Semantic Extraction ---
const AGENT_A_SYSTEM = `
# Role: 资深图像分析师与语用学专家 (Senior Image Analyst)
# Task
精确描述输入图片中的核心事实。
# Requirements
1. 识别主体、动作、背景及微妙的情感表达。
2. 找出题目中潜在的“不一致点” (Incongruity) 或逻辑漏洞。
3. 严禁任何幽默尝试，仅提供客观事实。
# Output Format (JSON)
{
  "subject_state": "主体状态描述",
  "scene_conflict": "场景冲突描述",
  "hidden_details": "隐含细节描述"
}
`;

// --- Agent B: Strategy Judgment ---
const AGENT_B_SYSTEM = `
# Role: 幽默理论家 (Humor Theorist)
# Task
基于分析结果，从以下理论中选择最匹配的一种幽默触发策略：
- [对象类比]: 将物体比作有情感的人或特定职业。
- [良性违背]: 模拟一个尴尬但无害的社会冲突。
- [反差讽刺]: 这种情境下“最不该出现”的反应是什么？
- [叙事外推]: 建立一个 Gen Z 产生共鸣的现代生活场景（如：小组作业、职场内卷）。
# Output
只输出策略名称和一句话理由。
`;

// --- Agent C: Insight-Augmented Generation ---
const AGENT_C_SYSTEM = `
# Role: Z世代幽默博主 / 大喜利资深玩家 (Gen Z Humorist)
# Task
请为题目创作 10 个令人惊讶且幽默的回答 (Candidates)。
# Core Insights
1. [简短性]: 越短越好，减少铺垫时间，建议15字以内。
2. [视角转换]: 尝试从非生物或旁观者的视角说话。
3. [思维飞跃]: 不要直接描述，要进行非线性的逻辑跳跃。
4. [歧义利用]: 挖掘题目中词汇的双关含义。
# Constraints
- 严禁AI式说教，严禁平庸的描述。
- 风格：犀利、自黑、荒诞。
- 语言：简体中文。
`;

// --- Agent D: 6-D Evaluation ---
const AGENT_D_SYSTEM = `
# Role: 冷酷的幽默批评家 (Ruthless Humor Critic)
# Task
请根据以下维度对候选回答进行 0-4 分的量化评分：
1. [原创性 Novelty]: 视角是否独特，是否难以预测？
2. [共鸣感 Empathy]: (关键项) 是否触及人类真实情感或“あるある”(共鸣)？
3. [简洁度 Brevity]: 字数是否精炼，是否有即时冲击力？
4. [关联距离 Distance]: 逻辑跳跃是否适度（太近无趣，太远看不懂）？
5. [智力感 Intelligence]: 是否体现了机智和高级的反讽？
6. [不一致解决 Incongruity]: 这种解释是否完美解决了起初的违和感？
`;

// --- Agent E: Final Ranking ---
const AGENT_E_SYSTEM = `
# Role: Z世代幽默评审员 (Gen Z Curator)
# Task
参考评分结果，选出 Top 1 的神回复。
# Criteria
- [共鸣感] > [原创性]。
- [会心一笑] > [不明觉厉]。
- 剔除任何带有AI味、太像冷笑话或逻辑解释过剩的回答。
- **IMPORTANT**: 输出内容严禁包含句号。
`;

// ==========================================
// SERVICE IMPLEMENTATION
// ==========================================

export type ProgressCallback = (stage: string) => void;

export const generateBokeCaption = async (
  base64Image: string, 
  mimeType: string, 
  onProgress: ProgressCallback
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Clean base64 string
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  const imagePart = { inlineData: { mimeType, data: cleanBase64 } };

  try {
    // ---------------------------------------------------------
    // STEP 1: PRECISION ANALYSIS
    // Model: Flash (Fast, Efficient) | Temp: 0.2
    // ---------------------------------------------------------
    onProgress("Phase 1: Precision Analysis (Gemini 3 Flash)...");
    
    const analysisResponse = await ai.models.generateContent({
      model: MODEL_FAST, 
      contents: {
        parts: [
          imagePart,
          { text: "请执行第一阶段：视觉与语义细节提取。" }
        ]
      },
      config: {
        systemInstruction: AGENT_A_SYSTEM,
        temperature: 0.2, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject_state: { type: Type.STRING },
            scene_conflict: { type: Type.STRING },
            hidden_details: { type: Type.STRING }
          },
          required: ["subject_state", "scene_conflict"]
        }
      }
    });
    
    const analysisData = analysisResponse.text;
    console.log("[Agent A Output]", analysisData);

    // ---------------------------------------------------------
    // STEP 2: STRATEGY JUDGMENT
    // Model: Flash (Logic, Classification) | Temp: 0.1
    // ---------------------------------------------------------
    onProgress("Phase 2: Strategy Judgment (Gemini 3 Flash)...");

    const strategyResponse = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: {
        parts: [
          imagePart, // Keep context
          { text: `基于以下分析：${analysisData}\n请执行第二阶段：幽默策略匹配。` }
        ]
      },
      config: {
        systemInstruction: AGENT_B_SYSTEM,
        temperature: 0.1
      }
    });

    const strategyData = strategyResponse.text;
    console.log("[Agent B Output]", strategyData);

    // ---------------------------------------------------------
    // STEP 3: CREATIVE DIVERGENCE
    // Model: Pro (High Creativity) | Temp: 1.0
    // ---------------------------------------------------------
    onProgress("Phase 3: Creative Divergence (Gemini 3 Pro)...");

    const divergenceResponse = await ai.models.generateContent({
      model: MODEL_DEEP,
      contents: {
        parts: [
          imagePart,
          { text: `分析结论：${analysisData}\n采用策略：${strategyData}\n\n请执行第三阶段：生成10个候选回答。` }
        ]
      },
      config: {
        systemInstruction: AGENT_C_SYSTEM,
        temperature: 1.0, 
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidates: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const candidatesJson = divergenceResponse.text;
    console.log("[Agent C Output]", candidatesJson);

    // ---------------------------------------------------------
    // STEP 4: MULTI-DIMENSIONAL EVALUATION
    // Model: Pro (Complex Reasoning) | Temp: 0.0
    // ---------------------------------------------------------
    onProgress("Phase 4: 6-D Evaluation (Gemini 3 Pro)...");

    const evaluationResponse = await ai.models.generateContent({
      model: MODEL_DEEP,
      contents: {
        parts: [
          imagePart, // CRITICAL FIX: Pass image to Critic so they can see the context
          { text: `背景分析：${analysisData}\n\n候选列表：${candidatesJson}\n\n请执行第四阶段：六维度量化评分。重点关注[Incongruity]是否解决了图片中的违和感。` }
        ]
      },
      config: {
        systemInstruction: AGENT_D_SYSTEM,
        temperature: 0.0,
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
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const evaluationsJson = evaluationResponse.text;
    console.log("[Agent D Output]", evaluationsJson);

    // ---------------------------------------------------------
    // STEP 5: FINAL RANKING
    // Model: Pro (Alignment, Nuance) | Temp: 0.7
    // ---------------------------------------------------------
    onProgress("Phase 5: Final Ranking (Gemini 3 Pro)...");

    const rankingResponse = await ai.models.generateContent({
      model: MODEL_DEEP,
      contents: {
        parts: [
          // Pass context to final selector as well, although image is less critical here than reasoning
          { text: `原始背景：${analysisData}\n\n评分报告：${evaluationsJson}\n\n请执行第五阶段：专家排序与对齐。直接输出 Top 1 内容。` }
        ]
      },
      config: {
        systemInstruction: AGENT_E_SYSTEM,
        temperature: 0.7 
      }
    });

    const finalText = rankingResponse.text?.trim();

    if (!finalText) {
        throw new Error("Agent E failed to return a final caption.");
    }

    // Double check punctuation removal (Expert Filter should handle it, but safety first)
    return finalText.replace(/[。\.！!？\?~～]+$/, "");

  } catch (error) {
    console.error("Gemini Oogiri Workflow Error:", error);
    throw error;
  }
};