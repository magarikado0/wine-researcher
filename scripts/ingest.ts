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
      return new Response('Use POST to trigger ingestion', { status: 405 });
    }

    try {
      // バインディングの存在確認
      if (!env.DB || !env.AI || !env.VECTORIZE) {
        throw new Error('Missing bindings. Check your wrangler.toml');
      }

      const db = drizzle(env.DB);
      
      // 1. D1の wines テーブルから全ワインデータを取得
      console.log('Fetching wines from D1...');
      const allWines = await db.select().from(wines);
      console.log(`Fetched ${allWines.length} wines.`);

      if (allWines.length === 0) {
        return new Response('No wines found in D1.', { status: 200 });
      }

      const BATCH_SIZE = 20; // Workers AI の同時処理制限を考慮
      let processedCount = 0;

      for (let i = 0; i < allWines.length; i += BATCH_SIZE) {
        const batch = allWines.slice(i, i + BATCH_SIZE);
        const vectors = [];

        for (const wine of batch) {
          console.log(`Vectorizing [${i + 1}/${allWines.length}]: ${wine.name}`);

          // description と flavorProfile を組み合わせてより精度の高いベクトルを作成
          const textToVectorize = `${wine.name} ${wine.description} ${wine.flavorProfile || ''}`;

          const aiResponse = await env.AI.run('@cf/baai/bge-small-en-v1.5', {
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

        // 3. Vectorize にバッチごとに upsert
        if (vectors.length > 0) {
          await env.VECTORIZE.upsert(vectors);
          processedCount += vectors.length;
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully ingested ${processedCount} wines.` 
      }), { headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
      console.error('Ingestion failed:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};