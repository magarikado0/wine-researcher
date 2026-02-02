
-- Cloudflare D1 Schema (SQLite)
CREATE TABLE IF NOT EXISTS wines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Red', 'White', 'Rose', 'Sparkling'
  region TEXT NOT NULL,
  flavor_profile TEXT NOT NULL, -- JSON string: { "body": 1-5, "tannin": 1-5, "acidity": 1-5, "sweetness": 1-5 }
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price_range TEXT NOT NULL, -- 'Budget', 'Mid', 'Premium', 'Luxury'
  affiliate_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk/Auth0 ID or UUID
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasting_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  wine_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  vector_id TEXT, -- Reference to Vectorize index ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (wine_id) REFERENCES wines(id)
);

-- Cloudflare Vectorize Definition
-- Index Name: wine_descriptions_index
-- Dimensions: 768 (Recommended for @cf/baai/bge-large-en-v1.5 or Gemini embeddings)
-- Metric: cosine
