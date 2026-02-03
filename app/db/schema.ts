
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Wines Table: Contains all information about the wines.
 * The 'description' column is used for Vectorize embeddings.
 */
export const wines = sqliteTable('wines', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['Red', 'White', 'Sparkling', 'Rose'] }).notNull(),
  region: text('region').notNull(),
  flavorProfile: text('flavor_profile').notNull(),
  price_range: text('price_range').notNull(),
  country: text('country').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  affiliateUrl: text('affiliate_url').notNull(),
});

// Types for querying and inserting into the 'wines' table
export type SelectWine = InferSelectModel<typeof wines>;
export type InsertWine = InferInsertModel<typeof wines>;

/**
 * Tasting Logs Table: Stores user's diagnostic history and wine suggestions.
 */
export const tastingLogs = sqliteTable('tasting_logs', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  selectedTags: text('selected_tags'), // Storing as a JSON string or comma-separated values
  freeText: text('free_text'),
  suggestedWineId: integer('suggested_wine_id').references(() => wines.id),
});

// Types for querying and inserting into the 'tasting_logs' table
export type SelectTastingLog = InferSelectModel<typeof tastingLogs>;
export type InsertTastingLog = InferInsertModel<typeof tastingLogs>;
