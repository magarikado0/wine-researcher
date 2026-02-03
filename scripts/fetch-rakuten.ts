import 'dotenv/config';

interface RakutenItem {
  itemName: string;
  itemPrice: number;
  itemCaption: string;
  mediumImageUrls: { imageUrl: string }[];
  itemUrl: string;
}

interface RakutenResponse {
  Items: { Item: RakutenItem }[];
}

type WineType = 'Red' | 'White' | 'Rose' | 'Sparkling' | 'Dessert';

interface WineAttributes {
  type: WineType;
  region: string;
  flavor_profile: string;
  country: string;
}

interface AIWineCheckResult {
  is_wine: boolean;
  alcohol_type: string;
  type?: WineType;
  region?: string;
  flavor_profile?: string;
  country?: string;
}

// デフォルト値
const DEFAULT_ATTRIBUTES: WineAttributes = {
  type: 'Red',
  region: '不明',
  flavor_profile: 'フルボディ',
  country: 'フランス',
};

const TYPE_NORMALIZATION: Record<string, WineType> = {
  Red: 'Red',
  White: 'White',
  Rose: 'Rose',
  Sparkling: 'Sparkling',
  Dessert: 'Dessert',
  赤: 'Red',
  白: 'White',
  ロゼ: 'Rose',
  スパークリング: 'Sparkling',
  デザート: 'Dessert',
};

// 第1フィルタ: 正規表現による除外キーワード
const EXCLUDE_KEYWORDS_REGEX = /ビール|日本酒|ウィスキー|ウイスキー|リキュール|グラス|セット|おつまみ|空き瓶|コルク|保存|ラック|冷蔵|空瓶|ボトルホルダー|デキャンタ|栓|ストッパー|ワインセラー|ソムリエ|本セット|本まとめ|ケース買い|オープナー|しゃもじ/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function sanitizeJsonString(input: string): string {
  let output = input.trim();

  // Normalize smart quotes
  output = output
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Quote unquoted keys like: type: "Red"
  output = output.replace(/(^|[,{\n\r\t\s])([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Remove trailing commas before } or ]
  output = output.replace(/,\s*([}\]])/g, '$1');

  // Replace single quotes with double quotes for JSON keys/values
  // This is a best-effort fix for model outputs like {'key': 'value'}
  if (output.includes("'")) {
    output = output
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  }

  return output;
}

function parseKeyValueLines(input: string): Partial<AIWineCheckResult> {
  const result: Partial<AIWineCheckResult> = {};
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^(is_wine|alcohol_type|type|region|flavor_profile|country)\s*[:=]\s*(.+)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    let value = match[2].trim();

    // Remove surrounding quotes
    value = value.replace(/^"(.+)"$/, '$1').replace(/^'(.+)'$/, '$1');

    if (key === 'is_wine') result.is_wine = value.toLowerCase() === 'true';
    if (key === 'alcohol_type') result.alcohol_type = value;
    if (key === 'type') result.type = value as WineType;
    if (key === 'region') result.region = value;
    if (key === 'flavor_profile') result.flavor_profile = value;
    if (key === 'country') result.country = value;
  }

  return result;
}

/**
 * Cloudflare Workers AI を使用してワイン判定と属性推論を同時に実施
 */
async function inferWineCheckAndAttributes(
  itemName: string,
  itemCaption: string
): Promise<AIWineCheckResult> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    console.warn(
      'CLOUDFLARE_API_TOKEN または CLOUDFLARE_ACCOUNT_ID が設定されていません。デフォルト値を使用します。'
    );
    return {
      is_wine: false,
      alcohol_type: 'unknown',
      ...DEFAULT_ATTRIBUTES,
    };
  }

  const prompt = `以下の商品情報を分析し、それが飲料としてのワインボトルであるかを厳格に判定してください。

【重要な判定基準】
- ワイン: 赤、白、ロゼ、スパークリング、デザートワイン（単体ボトル）
- 除外: ビール、ウイスキー、日本酒、リキュール、ワイングラス、セット商品、グッズ、おつまみ、空き瓶など

【必須】応答は必ずJSON形式で、Markdown コードブロック(\`\`\`)を使用しないでください。

商品名: ${itemName}
説明: ${itemCaption.substring(0, 300)}

以下のJSON形式で返してください（JSONオブジェクトのみ、前後の説明や装飾なし）:
{
  "is_wine": true/false,
  "alcohol_type": "(ワイン、赤ワイン、白ワイン、スパークリング、ビール、日本酒、など)",
  "type": "赤|白|ロゼ|スパークリング|Dessert (ワインの場合のみ必須)",
  "region": "具体的な産地（例：ボルドー、キャンティ、カリフォルニア）",
  "flavor_profile": "味わいの特徴（例：フルボディ、ドライ、辛口）",
  "country": "国名（例：フランス、イタリア、日本）"
}`;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`AI API エラー: ${response.status}`);
      return {
        is_wine: false,
        alcohol_type: 'api_error',
      };
    }

    const data = (await response.json()) as {
      success?: boolean;
      result?: { response?: string } | string;
      errors?: Array<{ message: string }>;
    };

    if (!data.success && data.errors) {
      console.warn('AI API エラー:', data.errors.map((e) => e.message).join(', '));
      return {
        is_wine: false,
        alcohol_type: 'api_error',
      };
    }

    // レスポンス形式を柔軟に処理
    let aiResponse: string;
    if (typeof data.result === 'string') {
      aiResponse = data.result;
    } else if (typeof data.result === 'object' && data.result !== null) {
      if (typeof data.result.response === 'string') {
        aiResponse = data.result.response;
      } else if (typeof data.result.response === 'object') {
        // レスポンスがオブジェクトの場合は文字列化
        aiResponse = JSON.stringify(data.result.response);
      } else {
        // 他の形式の場合は全体を文字列化
        aiResponse = JSON.stringify(data.result);
      }
    } else {
      console.warn('AI レスポンスが空です。');
      return {
        is_wine: false,
        alcohol_type: 'empty_response',
      };
    }

    if (!aiResponse || aiResponse === 'undefined' || aiResponse === 'null') {
      console.warn('AI レスポンスが空です。');
      return {
        is_wine: false,
        alcohol_type: 'empty_response',
      };
    }

    // 文字列であることを確認してから処理
    const responseText = String(aiResponse);
    const jsonCandidate = extractJsonObject(responseText) ?? responseText.trim();

    let parsed: Partial<AIWineCheckResult> = {};
    try {
      parsed = JSON.parse(jsonCandidate) as Partial<AIWineCheckResult>;
    } catch (parseError) {
      try {
        const sanitized = sanitizeJsonString(jsonCandidate);
        parsed = JSON.parse(sanitized) as Partial<AIWineCheckResult>;
      } catch (sanitizedError) {
        const fallbackParsed = parseKeyValueLines(aiResponse);
        if (Object.keys(fallbackParsed).length === 0) {
          console.warn(`AI JSON解析失敗（${itemName}）`);
          return {
            is_wine: false,
            alcohol_type: 'parse_error',
          };
        }
        parsed = fallbackParsed;
      }
    }

    const is_wine = parsed.is_wine === true;
    const alcohol_type = parsed.alcohol_type || 'unknown';

    if (!is_wine) {
      return { is_wine: false, alcohol_type };
    }

    // ワインの場合のみ属性を正規化
    const rawType = typeof parsed.type === 'string' ? parsed.type.trim() : '';
    const type: WineType = TYPE_NORMALIZATION[rawType] ?? DEFAULT_ATTRIBUTES.type;

    return {
      is_wine: true,
      alcohol_type,
      type,
      region: parsed.region || DEFAULT_ATTRIBUTES.region,
      flavor_profile: parsed.flavor_profile || DEFAULT_ATTRIBUTES.flavor_profile,
      country: parsed.country || DEFAULT_ATTRIBUTES.country,
    };
  } catch (error) {
    console.warn(
      `AI 推論エラー（${itemName}）:`,
      error instanceof Error ? error.message : error
    );
    return {
      is_wine: false,
      alcohol_type: 'exception',
    };
  }
}


/**
 * 楽天商品検索APIから3ページ分（90件）取得し、
 * 多段フィルタリング + AI推論を実施して、
 * Cloudflare D1用のSQL INSERT文を生成
 */
async function fetchRakutenWines() {
  const appId = process.env.VITE_RAKUTEN_APP_ID;

  if (!appId) {
    throw new Error('VITE_RAKUTEN_APP_ID が .env に設定されていません');
  }

//   const totalPages = 3;
//   const hitsPerPage = 30;
  const totalPages = 1;
  const hitsPerPage = 30;
  let processedCount = 0;
  let wineCount = 0;

  console.error(`=== ワイン取得開始 (${totalPages}ページ × ${hitsPerPage}件) ===\n`);

  for (let page = 1; page <= totalPages; page++) {
    const params = new URLSearchParams({
      applicationId: appId,
      genreId: '510915', // ワインジャンルID
      keyword: 'ワイン', // キーワード検索でワインに絞り込み
      hits: hitsPerPage.toString(),
      page: page.toString(),
      sort: '-reviewAverage', // レビュー順
    });

    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?${params}`;

    console.error(`\n--- ページ ${page}/${totalPages} を取得中 ---`);

    try {
      const response = await fetch(url);

      // HTTPステータスチェック
      if (!response.ok) {
        console.error(`ページ ${page}: HTTP ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`  エラー内容: ${errorText.substring(0, 200)}`);
        break;
      }

      const data = (await response.json()) as RakutenResponse;

      if (!data.Items || data.Items.length === 0) {
        console.error(`ページ ${page}: 結果なし`);
        break;
      }

      console.error(`ページ ${page}: ${data.Items.length}件取得`);

      for (const item of data.Items) {
        const wine = item.Item;
        processedCount++;

        // 第1フィルタ: 正規表現による高速フィルタリング
        if (EXCLUDE_KEYWORDS_REGEX.test(wine.itemName)) {
          console.error(`  [除外] ${wine.itemName.substring(0, 50)}... (Regex一致)`);
          continue;
        }

        // 第2フィルタ: AI判定
        console.error(`  [判定中] ${wine.itemName.substring(0, 50)}...`);
        const checkResult = await inferWineCheckAndAttributes(wine.itemName, wine.itemCaption);

        if (!checkResult.is_wine) {
          console.error(`  [除外] ${wine.itemName.substring(0, 50)}... (${checkResult.alcohol_type})`);
          console.log(`-- 除外: ${wine.itemName.substring(0, 70)} (${checkResult.alcohol_type})\n`);
          continue;
        }

        wineCount++;
        console.error(`  [確定] ${wine.itemName.substring(0, 50)}... (ワイン)`);

        // 名前を適度にカット（100文字以内）
        const name =
          wine.itemName.length > 100
            ? wine.itemName.substring(0, 100) + '...'
            : wine.itemName;

        // 価格を整形
        const priceRange = `${wine.itemPrice.toLocaleString()}円`;

        // 説明文を150文字にカット、HTMLタグを除去、シングルクォートをエスケープ
        let description = wine.itemCaption
          .replace(/<[^>]*>/g, '') // HTMLタグを除去
          .replace(/\r?\n/g, ' ') // 改行を空白に
          .trim();

        if (description.length > 150) {
          description = description.substring(0, 150) + '...';
        }

        // シングルクォートをエスケープ
        description = description.replace(/'/g, "''");
        const escapedName = name.replace(/'/g, "''");
        const escapedImageUrl =
          wine.mediumImageUrls && wine.mediumImageUrls.length > 0
            ? wine.mediumImageUrls[0].imageUrl.replace(/'/g, "''")
            : '';
        const escapedUrl = wine.itemUrl.replace(/'/g, "''");

        // SQL INSERT文を出力
        console.log(
          `INSERT INTO wines (name, type, region, flavor_profile, price_range, country, description, image_url, affiliate_url) VALUES ('${escapedName}', '${checkResult.type}', '${checkResult.region}', '${checkResult.flavor_profile}', '${priceRange}', '${checkResult.country}', '${description}', '${escapedImageUrl}', '${escapedUrl}');`
        );
      }

      // ページ間に1秒の待機（レートリミット対策）
      if (page < totalPages) {
        console.error(`\n次ページまで1秒待機中...`);
        await sleep(1000);
      }
    } catch (error) {
      console.error(`ページ ${page} 取得エラー:`, error);
    }
  }

  console.error(`\n=== 完了 ===`);
  console.error(`処理件数: ${processedCount} / ワイン確定: ${wineCount}`);
}

// スクリプト実行
fetchRakutenWines().catch(console.error);
