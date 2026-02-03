import { drizzle } from 'drizzle-orm/d1';
import { wines } from './app/db/schema';

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
      const db = drizzle(env.DB);
      
      // 1. D1の wines テーブルから全ワインデータを取得
      console.log('Fetching wines from D1...');
      const allWines = await db.select().from(wines).all();
      console.log(`Fetched ${allWines.length} wines.`);

      const vectors = [];

      for (const wine of allWines) {
        console.log(`Vectorizing: ${wine.name}`);

        // 2. Workers AI (@cf/baai/bge-small-en-v1.5) でベクトル化
        // ※ 日本語データの場合、本来は多言語モデルが望ましいですが、指定に従い bge-small-en を使用します
        const aiResponse = await env.AI.run('@cf/baai/bge-small-en-v1.5', {
          text: [wine.description]
        });

        const values = aiResponse.data[0];

        vectors.push({
          id: wine.id.toString(),
          values: values,
          metadata: {
            name: wine.name,
            type: wine.type,
            price_range: wine.price_range,
              country: wine.country,
              region: wine.region
          }
        });
      }

      // 3. Vectorize (wine-index) に upsert
      if (vectors.length > 0) {
        console.log(`Upserting ${vectors.length} vectors to Vectorize...`);
        await env.VECTORIZE.upsert(vectors);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully ingested ${vectors.length} wines.` 
      }), { headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
      console.error('Ingestion failed:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
};