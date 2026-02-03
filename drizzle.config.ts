import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv"; // 追加

dotenv.config(); // 環境変数を読み込む
console.log(process.env.CLOUDFLARE_ACCOUNT_ID)

export default defineConfig({
  schema: "./app/db/schema.ts", // スキーマファイルの場所（Copilotが作った場所に合わせて調整）
  out: "./drizzle",            // マイグレーションファイルの出力先
  dialect: "sqlite",           // Cloudflare D1はSQLite互換
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "767f6cb5-a01f-493b-b6cd-a271479c7baf",
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});