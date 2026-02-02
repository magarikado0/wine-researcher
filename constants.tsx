
import React from 'react';

export const WINE_COLORS = {
  primary: '#4A0E0E',
  secondary: '#722F37',
  accent: '#D4AF37', // Gold
};

export const MOCK_WINES = [
  {
    id: 1,
    name: "シャトー・マルゴー 2015",
    type: "Red" as const,
    region: "Bordeaux, France",
    flavor_profile: { body: 5, tannin: 4, acidity: 3, sweetness: 1 },
    description: "ベルベットのような質感と、驚くほど長く続く余韻。特別な夜にふさわしい至高の一本です。",
    image_url: "https://picsum.photos/seed/wine1/400/600",
    price_range: "Luxury" as const,
    affiliate_url: "https://example.com/wine1"
  },
  {
    id: 2,
    name: "クラウディ・ベイ ソーヴィニヨン・ブラン",
    type: "White" as const,
    region: "Marlborough, New Zealand",
    flavor_profile: { body: 2, tannin: 1, acidity: 5, sweetness: 1 },
    description: "パッションフルーツのみずみずしい香りと、キレのある酸味が特徴。シーフード料理との相性は抜群です。",
    image_url: "https://picsum.photos/seed/wine2/400/600",
    price_range: "Mid" as const,
    affiliate_url: "https://example.com/wine2"
  },
  {
    id: 3,
    name: "ルイ・ロデレール クリスタル",
    type: "Sparkling" as const,
    region: "Champagne, France",
    flavor_profile: { body: 4, tannin: 1, acidity: 4, sweetness: 2 },
    description: "最高級のシャンパーニュ。シルクのような泡立ちと、複雑で芳醇な香りが五感を刺激します。",
    image_url: "https://picsum.photos/seed/wine3/400/600",
    price_range: "Luxury" as const,
    affiliate_url: "https://example.com/wine3"
  }
];
