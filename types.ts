
export type WineType = 'Red' | 'White' | 'Rose' | 'Sparkling';
export type PriceRange = 'Budget' | 'Mid' | 'Premium' | 'Luxury';

export interface FlavorProfile {
  body: number;
  tannin: number;
  acidity: number;
  sweetness: number;
}

export interface Wine {
  id: number;
  name: string;
  type: WineType;
  region: string;
  flavor_profile: FlavorProfile;
  description: string;
  imageUrl: string;
  price_range: PriceRange;
  affiliateUrl: string;
}

export interface RecommendationRequest {
  typePreference?: WineType;
  occasion?: string;
  flavorTrend?: string;
  userPrompt?: string;
}

export interface RecommendationResponse {
  wines: Wine[];
  aiSommelierComment: string;
}
