import { upstashRedis, REDIS_KEYS, CACHE_TTL, RedisUtils } from '../redis';
import { storage } from '../storage';
import type { User, Friendship, Message, ChatSession } from '@shared/schema';

export class CacheService {
  private static instance: CacheService;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // User caching
  async getCachedUser(userId: number): Promise<User | null> {
    // Try cache first
    let user = await RedisUtils.getJSON<User>(REDIS_KEYS.USER_CACHE(userId));
    
    if (!user) {
      // Cache miss, fetch from database
      const dbUser = await storage.getUser(userId);
      if (dbUser) {
        await RedisUtils.setWithTTL(REDIS_KEYS.USER_CACHE(userId), dbUser, CACHE_TTL.USER_CACHE);
        return dbUser;
      }
    }
    
    return user;
  }

  async invalidateUserCache(userId: number): Promise<void> {
    await upstashRedis.del(REDIS_KEYS.USER_CACHE(userId));
  }

  async updateUserCache(userId: number, updates: Partial<User>): Promise<void> {
    const cachedUser = await RedisUtils.getJSON<User>(REDIS_KEYS.USER_CACHE(userId));
    if (cachedUser) {
      const updatedUser = { ...cachedUser, ...updates };
      await RedisUtils.setWithTTL(REDIS_KEYS.USER_CACHE(userId), updatedUser, CACHE_TTL.USER_CACHE);
    }
  }

  // Friends caching
  async getCachedFriends(userId: number): Promise<User[]> {
    let friends = await RedisUtils.getJSON<User[]>(REDIS_KEYS.USER_FRIENDS(userId));
    
    if (!friends) {
      // Cache miss, fetch from database
      friends = await storage.getFriends(userId);
      await RedisUtils.setWithTTL(REDIS_KEYS.USER_FRIENDS(userId), friends, CACHE_TTL.FRIENDS_LIST);
    }
    
    return friends || [];
  }

  async invalidateFriendsCache(userId: number): Promise<void> {
    await upstashRedis.del(REDIS_KEYS.USER_FRIENDS(userId));
  }

  async getCachedFriendRequests(userId: number): Promise<Friendship[]> {
    let requests = await RedisUtils.getJSON<Friendship[]>(REDIS_KEYS.FRIEND_REQUESTS(userId));
    
    if (!requests) {
      // Cache miss, fetch from database
      requests = await storage.getFriendRequests(userId);
      await RedisUtils.setWithTTL(REDIS_KEYS.FRIEND_REQUESTS(userId), requests, CACHE_TTL.FRIENDS_LIST);
    }
    
    return requests || [];
  }

  async invalidateFriendRequestsCache(userId: number): Promise<void> {
    await upstashRedis.del(REDIS_KEYS.FRIEND_REQUESTS(userId));
  }

  // Chat session caching
  async getCachedChatSession(sessionId: number): Promise<ChatSession | null> {
    return await RedisUtils.getJSON<ChatSession>(REDIS_KEYS.CHAT_SESSION(sessionId));
  }

  async setCachedChatSession(session: ChatSession): Promise<void> {
    await RedisUtils.setWithTTL(REDIS_KEYS.CHAT_SESSION(session.id), session, CACHE_TTL.CHAT_SESSION);
  }

  async invalidateChatSession(sessionId: number): Promise<void> {
    await upstashRedis.del(REDIS_KEYS.CHAT_SESSION(sessionId));
  }

  // Rate limiting
  async checkRateLimit(userId: number, action: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = REDIS_KEYS.RATE_LIMIT(userId, action);
    const current = await RedisUtils.incrementCounter(key, windowSeconds);
    
    const resetTime = Date.now() + (windowSeconds * 1000);
    
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime
    };
  }

  // Hot data preloading for high-traffic scenarios
  async preloadUserData(userIds: number[]): Promise<void> {
    const promises = userIds.map(async (userId) => {
      // Preload user info
      const user = await storage.getUser(userId);
      if (user) {
        await RedisUtils.setWithTTL(REDIS_KEYS.USER_CACHE(userId), user, CACHE_TTL.USER_CACHE);
      }

      // Preload friends list
      const friends = await storage.getFriends(userId);
      await RedisUtils.setWithTTL(REDIS_KEYS.USER_FRIENDS(userId), friends, CACHE_TTL.FRIENDS_LIST);

      // Preload friend requests
      const requests = await storage.getFriendRequests(userId);
      await RedisUtils.setWithTTL(REDIS_KEYS.FRIEND_REQUESTS(userId), requests, CACHE_TTL.FRIENDS_LIST);
    });

    await Promise.all(promises);
    console.log(`Preloaded data for ${userIds.length} users`);
  }

  // Cache statistics
  async getCacheStats(): Promise<{
    totalKeys: number;
    userCacheHits: number;
    friendsCacheHits: number;
    memoryUsage: string;
  }> {
    // Note: These stats would need to be tracked separately in a production environment
    // This is a simplified version for monitoring
    
    return {
      totalKeys: await upstashRedis.dbsize(),
      userCacheHits: 0, // Would need separate tracking
      friendsCacheHits: 0, // Would need separate tracking
      memoryUsage: 'N/A' // Upstash doesn't expose memory info via REST API
    };
  }

  // Warm up cache with frequently accessed data
  async warmUpCache(): Promise<void> {
    try {
      // Get most active users (this would be based on your analytics)
      // For now, we'll warm up based on recent chat sessions
      const recentSessions = await storage.getRecentChatSessions(1, 100); // Get recent sessions
      const userIds = new Set<number>();
      
      recentSessions.forEach(session => {
        if (session.user1Id !== null) userIds.add(session.user1Id);
        if (session.user2Id !== null) userIds.add(session.user2Id);
      });

      await this.preloadUserData(Array.from(userIds));
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }

  // Cache cleanup for expired or unused data
  async cleanupCache(): Promise<void> {
    try {
      // This would typically involve analyzing cache access patterns
      // For now, we rely on Redis TTL for automatic cleanup
      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  // Bulk cache operations for performance
  async bulkGetUsers(userIds: number[]): Promise<Map<number, User>> {
    const results = new Map<number, User>();
    const uncachedIds: number[] = [];

    // First, try to get all from cache
    const cachePromises = userIds.map(async (userId) => {
      const cached = await RedisUtils.getJSON<User>(REDIS_KEYS.USER_CACHE(userId));
      if (cached) {
        results.set(userId, cached);
      } else {
        uncachedIds.push(userId);
      }
    });

    await Promise.all(cachePromises);

    // Fetch uncached users from database
    if (uncachedIds.length > 0) {
      const dbPromises = uncachedIds.map(async (userId) => {
        const user = await storage.getUser(userId);
        if (user) {
          results.set(userId, user);
          // Cache for next time
          await RedisUtils.setWithTTL(REDIS_KEYS.USER_CACHE(userId), user, CACHE_TTL.USER_CACHE);
        }
      });

      await Promise.all(dbPromises);
    }

    return results;
  }
}

// Initialize cache warming on startup
setTimeout(async () => {
  try {
    await CacheService.getInstance().warmUpCache();
  } catch (error) {
    console.error('Error during initial cache warming:', error);
  }
}, 5000); // Wait 5 seconds after startup

// Periodic cache cleanup
setInterval(async () => {
  try {
    await CacheService.getInstance().cleanupCache();
  } catch (error) {
    console.error('Error during periodic cache cleanup:', error);
  }
}, 300000); // Every 5 minutes