
import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationRequest, Wine } from "../types";

export class GeminiSommelier {
  private ai: GoogleGenAI;

  constructor() {
    // Vite環境(import.meta.env)と標準環境(process.env)の両方に対応
    const apiKey = (import.meta as any).env?.VITE_API_KEY || (process.env as any).API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateCommentary(request: RecommendationRequest, selectedWines: Wine[]): Promise<string> {
    if (!this.ai) return "申し訳ありません。現在ソムリエが不在です。";

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

    // Retry with exponential backoff for 503 errors
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            temperature: 0.8,
            topP: 0.9,
          }
        });
        return response.text || "あなたにぴったりの一本を選び抜きました。素敵なひとときをお楽しみください。";
      } catch (e: any) {
        const isOverloaded = e?.message?.includes('503') || e?.message?.includes('overloaded');
        const isLastAttempt = attempt === maxRetries - 1;
        
        if (isOverloaded && !isLastAttempt) {
          // Wait with exponential backoff: 1s, 2s, 4s
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`Gemini API overloaded, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        console.error(e);
        return "選りすぐりのワインをご提案します。どれもあなたにぴったりの味わいです。";
      }
    }
    
    return "選りすぐりのワインをご提案します。どれもあなたにぴったりの味わいです。";
  }

  async parseSearchIntent(userPrompt: string): Promise<{ type?: string, flavor?: string }> {
    try {
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
      return JSON.parse(response.text || '{}');
    } catch {
      return {};
    }
  }
}
