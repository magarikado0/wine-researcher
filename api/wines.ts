import { drizzle } from 'drizzle-orm/d1';
import { inArray } from 'drizzle-orm';
import { wines } from '../app/db/schema';

interface SemanticSearchRequest {
  query: string;
  limit?: number;
}

/**
 * Cloudflare Workers エンドポイント: /api/wines
 * GET: D1からすべてのワインデータを取得して返す
 * POST: セマンティック検索でワインを検索
 */
export default {
  async fetch(request: Request, env: any) {
    // CORS ヘッダーを設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // プリフライトリクエストへの対応
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (!env.DB) {
        throw new Error('DB binding not found');
      }

      if (request.method === 'GET') {
        const db = drizzle(env.DB);
        const allWines = await db.select().from(wines);

        return new Response(JSON.stringify(allWines), {
          headers: corsHeaders,
        });
      }

      if (request.method === 'POST') {
        const body = (await request.json()) as SemanticSearchRequest;
        const { query, limit = 3 } = body;

        if (!query) {
          return new Response(
            JSON.stringify({ error: 'query parameter is required' }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        if (!env.AI) {
          throw new Error('AI binding not found');
        }

        if (!env.VECTORIZE) {
          throw new Error('VECTORIZE binding not found');
        }

        // クエリをベクトル化（配列として渡す）
        const embeddingResponse = await env.AI.run(
          '@cf/baai/bge-base-en-v1.5',
          {
            text: [query],
          }
        );

        const queryEmbedding = embeddingResponse.data[0];

        // Vectorizeでセマンティック検索
        const searchResults = await env.VECTORIZE.query(queryEmbedding, {
          topK: limit,
          returnValues: false,
          returnMetadata: 'all',
        });

        if (!searchResults.matches || searchResults.matches.length === 0) {
          return new Response(JSON.stringify([]), {
            headers: corsHeaders,
          });
        }

        // メタデータからワインIDを取得（数値に変換、重複を排除）
        const wineIds = [...new Set(
          searchResults.matches.map((match: any) => parseInt(match.id, 10))
        )];

        // D1からワインデータを取得
        const db = drizzle(env.DB);
        const matchedWines = await db
          .select()
          .from(wines)
          .where(inArray(wines.id, wineIds));

        // Vectorizeの順序を保持（重複排除済み）
        const orderedWines = wineIds
          .map((id: number) =>
            matchedWines.find((w: any) => w.id === id)
          )
          .filter(Boolean);

        return new Response(JSON.stringify(orderedWines), {
          headers: corsHeaders,
        });
      }

      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    } catch (error: any) {
      console.error('Error in wines endpoint:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process request',
          message: error?.message || 'Unknown error',
          stack: error?.stack || ''
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};
