
import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationRequest, Wine } from "../types";

export class GeminiSommelier {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateCommentary(request: RecommendationRequest, selectedWines: Wine[]): Promise<string> {
    const prompt = `
      あなたは一流のソムリエです。ユーザーの要望に基づき、選ばれたワインのリコメンド理由を、日本語でエレガントかつ親しみやすく説明してください。
      
      ユーザーの要望:
      - 好みのタイプ: ${request.typePreference || '指定なし'}
      - シチュエーション: ${request.occasion || '日常の楽しみ'}
      - 好みの傾向: ${request.flavorTrend || 'バランス重視'}
      - 自由入力: ${request.userPrompt || 'なし'}

      選ばれたワイン:
      ${selectedWines.map(w => `- ${w.name} (${w.region}): ${w.description}`).join('\n')}

      制約事項:
      - 250文字程度で、期待感を高める文章にすること。
      - 「ぴったりわいん」というサービス名に触れ、ユーザーに「ぴったり」な選択であることを強調すること。
      - 親しみやすさと高級感を両立させること。
    `;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "あなたにぴったりの一本を選び抜きました。素敵なひとときをお楽しみください。";
  }

  async parseSearchIntent(userPrompt: string): Promise<{ type?: string, flavor?: string }> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ユーザーの入力を解析して、ワインのタイプや味の好みを抽出してください。
      入力: "${userPrompt}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Red, White, Rose, Sparkling or undefined" },
            flavor: { type: Type.STRING, description: "Flavor keywords (dry, sweet, heavy, light, etc.)" }
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch {
      return {};
    }
  }
}
