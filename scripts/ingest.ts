import { drizzle } from 'drizzle-orm/d1';
import { wines } from '../app/db/schema';

/**
 * このスクリプトは Cloudflare Workers 環境で実行することを想定しています。
 * `wrangler dev` を使用して、ローカルからリモートの D1/AI/Vectorize にアクセスします。
 */

export default {
  async fetch(request: Request, env: any) {
    // POSTリクエストのみ受け付ける（誤動作防止）
    if (request.method !== 'POST') {
      return new Response('Use POST to trigger ingestion. Add ?offset=0&limit=10 to control batch.', { status: 405 });
    }

    try {
      // バインディングの存在確認
      if (!env.DB || !env.AI || !env.VECTORIZE) {
        throw new Error('Missing bindings. Check your wrangler.toml');
      }

      // クエリパラメータでオフセットと件数を指定可能
      const url = new URL(request.url);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10); // デフォルト10件ずつ

      const db = drizzle(env.DB);
      
      // 1. D1の wines テーブルから全ワインデータを取得
      console.log('Fetching wines from D1...');
      const allWines = await db.select().from(wines);
      console.log(`Total wines: ${allWines.length}, Processing offset=${offset}, limit=${limit}`);

      if (allWines.length === 0) {
        return new Response(JSON.stringify({ message: 'No wines found in D1.' }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // オフセットとリミットでスライス
      const batch = allWines.slice(offset, offset + limit);

      if (batch.length === 0) {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'All wines have been processed.',
          total: allWines.length,
          processed: 0
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      const vectors = [];

      for (let i = 0; i < batch.length; i++) {
        const wine = batch[i];
        console.log(`Vectorizing [${offset + i + 1}/${allWines.length}]: ${wine.name}`);

        // description と flavorProfile を組み合わせてより精度の高いベクトルを作成
        const textToVectorize = `${wine.name} ${wine.description} ${wine.flavorProfile || ''}`;

        const aiResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: [textToVectorize]
        });

        const values = aiResponse.data[0];

        vectors.push({
          id: wine.id.toString(),
          values: values,
          metadata: {
            name: wine.name,
            type: wine.type,
            price_range: wine.price_range,
            country: wine.country
          }
        });
      }

      // Vectorize に upsert
      if (vectors.length > 0) {
        await env.VECTORIZE.upsert(vectors);
      }

      const nextOffset = offset + limit;
      const hasMore = nextOffset < allWines.length;

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Processed ${vectors.length} wines (${offset + 1} to ${offset + vectors.length} of ${allWines.length}).`,
        processed: vectors.length,
        total: allWines.length,
        nextOffset: hasMore ? nextOffset : null,
        hasMore: hasMore,
        nextUrl: hasMore ? `?offset=${nextOffset}&limit=${limit}` : null
      }), { headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
      console.error('Ingestion failed:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};