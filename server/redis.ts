import { Redis } from '@upstash/redis';

// Upstash Redis client for all operations (REST API is more reliable in serverless environments)
export const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// For pub/sub we'll use polling mechanism with Upstash REST API
export const ioRedis = upstashRedis;

// Redis keys constants
export const REDIS_KEYS = {
  // WebSocket sessions
  WS_SESSION: (userId: number) => `ws:session:${userId}`,
  WS_ACTIVE_SESSIONS: 'ws:active_sessions',
  
  // Chat sessions
  CHAT_SESSION: (sessionId: number) => `chat:session:${sessionId}`,
  ACTIVE_CHAT_SESSIONS: 'chat:active_sessions',
  USER_ACTIVE_CHAT: (userId: number) => `user:chat:${userId}`,
  
  // Matchmaking queue
  MATCHMAKING_QUEUE: 'matchmaking:queue',
  MATCHMAKING_MALE: 'matchmaking:male',
  MATCHMAKING_FEMALE: 'matchmaking:female',
  MATCHMAKING_BOTH: 'matchmaking:both',
  
  // User cache
  USER_CACHE: (userId: number) => `user:cache:${userId}`,
  USER_ONLINE: (userId: number) => `user:online:${userId}`,
  ONLINE_USERS_COUNT: 'stats:online_users',
  
  // Friends cache
  USER_FRIENDS: (userId: number) => `user:friends:${userId}`,
  FRIEND_REQUESTS: (userId: number) => `user:friend_requests:${userId}`,
  
  // Rate limiting
  RATE_LIMIT: (userId: number, action: string) => `rate:${action}:${userId}`,
  
  // Break ice games
  BREAK_ICE_GAME: (gameId: string) => `game:break_ice:${gameId}`,
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  USER_CACHE: 3600, // 1 hour
  USER_ONLINE: 1800, // 30 minutes
  CHAT_SESSION: 7200, // 2 hours
  MATCHMAKING_QUEUE: 300, // 5 minutes
  FRIENDS_LIST: 1800, // 30 minutes
  RATE_LIMIT: 60, // 1 minute
  BREAK_ICE_GAME: 1800, // 30 minutes
} as const;

// Pub/Sub channels
export const PUBSUB_CHANNELS = {
  CHAT_MESSAGE: 'chat:message',
  USER_CONNECTED: 'user:connected',
  USER_DISCONNECTED: 'user:disconnected',
  MATCH_FOUND: 'match:found',
  CHAT_SKIPPED: 'chat:skipped',
  BREAK_ICE: 'break_ice',
} as const;

// WebSocket session interface for Redis storage
export interface RedisWebSocketSession {
  userId: number;
  serverId: string;
  connectedAt: number;
  lastSeen: number;
}

// Chat session interface for Redis storage
export interface RedisChatSession {
  id: number;
  user1Id: number;
  user2Id: number;
  status: string;
  createdAt: number;
}

// Matchmaking queue entry
export interface MatchmakingEntry {
  userId: number;
  preferences: string;
  timestamp: number;
  serverId: string;
}

// Redis utilities
export class RedisUtils {
  // Set with TTL
  static async setWithTTL(key: string, value: any, ttl: number): Promise<void> {
    await upstashRedis.setex(key, ttl, JSON.stringify(value));
  }
  
  // Get and parse JSON
  static async getJSON<T>(key: string): Promise<T | null> {
    const value = await upstashRedis.get(key);
    if (!value) return null;
    
    try {
      // If value is already an object, return it directly
      if (typeof value === 'object') return value as T;
      // Otherwise parse as JSON string
      return JSON.parse(value as string);
    } catch (error) {
      console.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }
  
  // Add to sorted set with timestamp score
  static async addToSortedSet(key: string, member: string, score?: number): Promise<void> {
    await upstashRedis.zadd(key, { score: score || Date.now(), member });
  }
  
  // Get from sorted set
  static async getSortedSetMembers(key: string, start = 0, end = -1): Promise<string[]> {
    return await upstashRedis.zrange(key, start, end);
  }
  
  // Remove from sorted set
  static async removeFromSortedSet(key: string, member: string): Promise<void> {
    await upstashRedis.zrem(key, member);
  }
  
  // Increment counter
  static async incrementCounter(key: string, ttl?: number): Promise<number> {
    const count = await upstashRedis.incr(key);
    if (ttl && count === 1) {
      await upstashRedis.expire(key, ttl);
    }
    return count;
  }
  
  // Set if not exists
  static async setNX(key: string, value: any, ttl?: number): Promise<boolean> {
    if (ttl) {
      const result = await upstashRedis.set(key, JSON.stringify(value), { nx: true, ex: ttl });
      return result === 'OK';
    } else {
      const result = await upstashRedis.set(key, JSON.stringify(value), { nx: true });
      return result === 'OK';
    }
  }
}

// Initialize Redis connections
export async function initializeRedis(): Promise<void> {
  try {
    // Test Upstash connection
    await upstashRedis.ping();
    console.log('✅ Upstash Redis connected successfully');
    
    // Initialize server ID for this instance
    process.env.SERVER_ID = process.env.SERVER_ID || `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚀 Server ID: ${process.env.SERVER_ID}`);
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function shutdownRedis(): Promise<void> {
  try {
    // Upstash REST API doesn't need explicit connection closing
    console.log('Redis connections closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
}