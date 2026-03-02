# ぴったりわいん (Pittari Wine)

AIソムリエが、今のあなたに「ぴったり」な一杯をセレクトするワイン診断アプリです。

## サービス概要

「今日の夕食に合うワインは？」「自分好みの味を見つけたい」
そんな悩みを最新のAI（Gemini 3 Flash）が解決します。直感的なインターフェースでいくつかの質問に答えるだけで、あなたの好みやシチュエーションに最適なワインを提案し、ソムリエのように優雅な解説を添えます。

## 主な機能

- **AIワイン診断**: 質問への回答と自由入力から、AIがユーザーの好みを精密に解析。
- **エレガントなリコメンド**: 選ばれたワインに対して、AIソムリエが期待感を高める魅力的なストーリーを生成。
- **モダンなUI/UX**: 高級感のあるデザインとスムーズなアニメーション（Glassmorphism / Micro-animations）。
- **レスポンシブ対応**: PCでもスマートフォンでも美しく表示。

## 技術スタック

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS (Modern CSS properties), Tailwind CSS
- **AI**: Google Gemini API (gemini-3-flash-preview)
- **Database**: Cloudflare D1 (Drizzle ORM)
- **Infrastructure**: Cloudflare Workers / Pages

## セットアップ

### 1. 前提条件
- Node.js (v18以上推奨)
- Google Gemini API キー

### 2. インストール
```bash
git clone <repository-url>
cd wine-researcher
npm install
```

### 3. 環境設定
`.env.local` ファイルを作成し、Gemini APIキーを設定します。
```env
VITE_API_KEY=YOUR_GEMINI_API_KEY
```

### 4. 起動
```bash
npm run dev
```

## ディレクトリ構成
- `components/`: UIコンポーネント
- `services/`: AI連携ロジック（GeminiSommelier）
- `constants.tsx`: 定数、モックデータ
- `types.ts`: TypeScript型定義
- `style.css`: デザインシステム、アニメーション定義
