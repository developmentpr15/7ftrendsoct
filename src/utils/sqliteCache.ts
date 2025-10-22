/**
 * SQLite Cache Utility
 * Local storage caching for wardrobe items with offline support
 */

import * as SQLite from 'expo-sqlite';
import { WardrobeItem } from '@/store/wardrobeStore';

export interface CachedWardrobeItem extends WardrobeItem {
  cached_at: string;
  sync_status: 'synced' | 'pending' | 'conflict';
}

class SQLiteCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = '7ftrends_wardrobe.db';
  private readonly CACHE_VERSION = 1;

  /**
   * Initialize database connection and create tables
   */
  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);

      // Create wardrobe_items table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS wardrobe_items (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          subcategory TEXT,
          brand TEXT,
          color TEXT NOT NULL,
          secondary_colors TEXT,
          size TEXT,
          material TEXT,
          style TEXT,
          occasion TEXT,
          season TEXT,
          pattern TEXT,
          images TEXT,
          tags TEXT,
          purchase_date TEXT,
          purchase_price REAL,
          purchase_location TEXT,
          care_instructions TEXT,
          is_favorite INTEGER DEFAULT 0,
          is_available INTEGER DEFAULT 1,
          is_clean INTEGER DEFAULT 1,
          last_worn TEXT,
          wear_count INTEGER DEFAULT 0,
          condition TEXT,
          quality_score INTEGER DEFAULT 5,
          sustainability_score INTEGER,
          metadata TEXT,
          ai_tags TEXT,
          ai_category TEXT,
          ai_colors TEXT,
          ai_occasions TEXT,
          ai_seasons TEXT,
          ai_style TEXT,
          ai_materials TEXT,
          ai_confidence REAL,
          ai_processed_at TEXT,
          ai_status TEXT,
          ai_error_message TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          cached_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);

      // Create indexes for performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON wardrobe_items(category);
        CREATE INDEX IF NOT EXISTS idx_wardrobe_items_cached_at ON wardrobe_items(cached_at);
        CREATE INDEX IF NOT EXISTS idx_wardrobe_items_sync_status ON wardrobe_items(sync_status);
      `);

      console.log('✅ SQLite cache initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite cache:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  private getDB(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Store wardrobe items in cache
   */
  async cacheWardrobeItems(items: WardrobeItem[], userId: string): Promise<void> {
    try {
      const db = this.getDB();
      const cachedAt = new Date().toISOString();

      // Start transaction for batch operation
      await db.withTransactionAsync(async () => {
        // Clear existing cached items for this user
        await db.runAsync(
          'DELETE FROM wardrobe_items WHERE user_id = ?',
          [userId]
        );

        // Insert new items
        for (const item of items) {
          await this.insertItem(db, item, cachedAt);
        }
      });

      console.log(`✅ Cached ${items.length} wardrobe items for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to cache wardrobe items:', error);
      throw error;
    }
  }

  /**
   * Insert a single item into cache
   */
  private async insertItem(
    db: SQLite.SQLiteDatabase,
    item: WardrobeItem,
    cachedAt: string
  ): Promise<void> {
    await db.runAsync(`
      INSERT OR REPLACE INTO wardrobe_items (
        id, user_id, name, description, category, subcategory, brand, color,
        secondary_colors, size, material, style, occasion, season, pattern,
        images, tags, purchase_date, purchase_price, purchase_location,
        care_instructions, is_favorite, is_available, is_clean, last_worn,
        wear_count, condition, quality_score, sustainability_score, metadata,
        ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons, ai_style,
        ai_materials, ai_confidence, ai_processed_at, ai_status, ai_error_message,
        created_at, updated_at, cached_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.id,
      item.user_id,
      item.name,
      item.description || null,
      item.category,
      item.subcategory || null,
      item.brand || null,
      item.color,
      JSON.stringify(item.secondary_colors || []),
      item.size || null,
      item.material || null,
      item.style || null,
      JSON.stringify(item.occasion || []),
      JSON.stringify(item.season || []),
      item.pattern || null,
      JSON.stringify(item.images || []),
      JSON.stringify(item.tags || []),
      item.purchase_date || null,
      item.purchase_price || null,
      item.purchase_location || null,
      JSON.stringify(item.care_instructions || []),
      item.is_favorite ? 1 : 0,
      item.is_available ? 1 : 0,
      item.is_clean ? 1 : 0,
      item.last_worn || null,
      item.wear_count,
      item.condition,
      item.quality_score,
      item.sustainability_score || null,
      JSON.stringify(item.metadata || {}),
      JSON.stringify(item.ai_tags || []),
      item.ai_category || null,
      JSON.stringify(item.ai_colors || []),
      JSON.stringify(item.ai_occasions || []),
      JSON.stringify(item.ai_seasons || []),
      item.ai_style || null,
      JSON.stringify(item.ai_materials || []),
      item.ai_confidence || null,
      item.ai_processed_at || null,
      item.ai_status || null,
      item.ai_error_message || null,
      item.created_at,
      item.updated_at,
      cachedAt,
      'synced'
    ]);
  }

  /**
   * Get cached wardrobe items for a user
   */
  async getCachedWardrobeItems(userId: string): Promise<CachedWardrobeItem[]> {
    try {
      const db = this.getDB();
      const rows = await db.getAllAsync(`
        SELECT * FROM wardrobe_items
        WHERE user_id = ?
        ORDER BY created_at DESC
      `, [userId]);

      const items = rows.map(this.parseRow);
      console.log(`✅ Retrieved ${items.length} cached items for user ${userId}`);
      return items;
    } catch (error) {
      console.error('❌ Failed to get cached wardrobe items:', error);
      return [];
    }
  }

  /**
   * Get items by category
   */
  async getItemsByCategory(userId: string, category: string): Promise<CachedWardrobeItem[]> {
    try {
      const db = this.getDB();
      const rows = await db.getAllAsync(`
        SELECT * FROM wardrobe_items
        WHERE user_id = ? AND category = ?
        ORDER BY created_at DESC
      `, [userId, category]);

      return rows.map(this.parseRow);
    } catch (error) {
      console.error(`❌ Failed to get cached items for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Parse database row to WardrobeItem object
   */
  private parseRow = (row: any): CachedWardrobeItem => {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      brand: row.brand,
      color: row.color,
      secondary_colors: JSON.parse(row.secondary_colors || '[]'),
      size: row.size,
      material: row.material,
      style: row.style,
      occasion: JSON.parse(row.occasion || '[]'),
      season: JSON.parse(row.season || '[]'),
      pattern: row.pattern,
      images: JSON.parse(row.images || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      purchase_date: row.purchase_date,
      purchase_price: row.purchase_price,
      purchase_location: row.purchase_location,
      care_instructions: JSON.parse(row.care_instructions || '[]'),
      is_favorite: Boolean(row.is_favorite),
      is_available: Boolean(row.is_available),
      is_clean: Boolean(row.is_clean),
      last_worn: row.last_worn,
      wear_count: row.wear_count,
      condition: row.condition,
      quality_score: row.quality_score,
      sustainability_score: row.sustainability_score,
      metadata: JSON.parse(row.metadata || '{}'),
      ai_tags: JSON.parse(row.ai_tags || '[]'),
      ai_category: row.ai_category,
      ai_colors: JSON.parse(row.ai_colors || '[]'),
      ai_occasions: JSON.parse(row.ai_occasions || '[]'),
      ai_seasons: JSON.parse(row.ai_seasons || '[]'),
      ai_style: row.ai_style,
      ai_materials: JSON.parse(row.ai_materials || '[]'),
      ai_confidence: row.ai_confidence,
      ai_processed_at: row.ai_processed_at,
      ai_status: row.ai_status,
      ai_error_message: row.ai_error_message,
      created_at: row.created_at,
      updated_at: row.updated_at,
      cached_at: row.cached_at,
      sync_status: row.sync_status,
    };
  };

  /**
   * Check if cache is stale (older than specified minutes)
   */
  async isCacheStale(userId: string, maxAgeMinutes: number = 30): Promise<boolean> {
    try {
      const db = this.getDB();
      const result = await db.getFirstAsync(`
        SELECT cached_at FROM wardrobe_items
        WHERE user_id = ?
        ORDER BY cached_at DESC
        LIMIT 1
      `, [userId]);

      if (!result) return true;

      const cachedAt = new Date(result.cached_at);
      const now = new Date();
      const ageMinutes = (now.getTime() - cachedAt.getTime()) / (1000 * 60);

      return ageMinutes > maxAgeMinutes;
    } catch (error) {
      console.error('❌ Failed to check cache staleness:', error);
      return true;
    }
  }

  /**
   * Clear cache for a user
   */
  async clearCache(userId: string): Promise<void> {
    try {
      const db = this.getDB();
      await db.runAsync(
        'DELETE FROM wardrobe_items WHERE user_id = ?',
        [userId]
      );
      console.log(`✅ Cleared cache for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(userId: string): Promise<{
    totalItems: number;
    itemsByCategory: Record<string, number>;
    lastUpdated: string | null;
    isStale: boolean;
  }> {
    try {
      const db = this.getDB();

      // Get total items and last updated
      const stats = await db.getFirstAsync(`
        SELECT
          COUNT(*) as total_items,
          MAX(cached_at) as last_updated
        FROM wardrobe_items
        WHERE user_id = ?
      `, [userId]);

      // Get items by category
      const categoryStats = await db.getAllAsync(`
        SELECT category, COUNT(*) as count
        FROM wardrobe_items
        WHERE user_id = ?
        GROUP BY category
      `, [userId]);

      const itemsByCategory = categoryStats.reduce((acc, row) => {
        acc[row.category] = row.count;
        return acc;
      }, {} as Record<string, number>);

      const isStale = await this.isCacheStale(userId);

      return {
        totalItems: stats?.total_items || 0,
        itemsByCategory,
        lastUpdated: stats?.last_updated || null,
        isStale,
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalItems: 0,
        itemsByCategory: {},
        lastUpdated: null,
        isStale: true,
      };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('✅ SQLite cache connection closed');
    }
  }
}

// Export singleton instance
export const sqliteCache = new SQLiteCache();
export default sqliteCache;