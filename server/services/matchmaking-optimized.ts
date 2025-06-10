import { upstashRedis, REDIS_KEYS, CACHE_TTL, RedisUtils, MatchmakingEntry } from '../redis';
import { storage } from '../storage';

export class OptimizedMatchmakingService {
  private static instance: OptimizedMatchmakingService;
  private serverId: string;

  constructor() {
    this.serverId = process.env.SERVER_ID!;
  }

  static getInstance(): OptimizedMatchmakingService {
    if (!OptimizedMatchmakingService.instance) {
      OptimizedMatchmakingService.instance = new OptimizedMatchmakingService();
    }
    return OptimizedMatchmakingService.instance;
  }

  // Optimized atomic matchmaking operation
  async findAndCreateMatch(userId: number, preferences: string): Promise<{
    matched: boolean;
    sessionId?: number;
    partnerId?: number;
    partnerInfo?: any;
  }> {
    try {
      // Use Redis Lua script for atomic matchmaking
      const luaScript = `
        local userId = ARGV[1]
        local preferences = ARGV[2]
        local serverId = ARGV[3]
        local timestamp = ARGV[4]
        
        -- Define queue keys
        local queueKeys = {
          "matchmaking:male",
          "matchmaking:female", 
          "matchmaking:both",
          "matchmaking:queue"
        }
        
        -- Find potential matches based on preferences
        local potentialMatches = {}
        
        if preferences == "male" then
          -- Look in female and both queues
          for _, match in ipairs(redis.call('ZRANGE', 'matchmaking:female', 0, -1)) do
            table.insert(potentialMatches, match)
          end
          for _, match in ipairs(redis.call('ZRANGE', 'matchmaking:both', 0, -1)) do
            table.insert(potentialMatches, match)
          end
        elseif preferences == "female" then
          -- Look in male and both queues
          for _, match in ipairs(redis.call('ZRANGE', 'matchmaking:male', 0, -1)) do
            table.insert(potentialMatches, match)
          end
          for _, match in ipairs(redis.call('ZRANGE', 'matchmaking:both', 0, -1)) do
            table.insert(potentialMatches, match)
          end
        else
          -- Look in all queues
          for _, queueKey in ipairs(queueKeys) do
            if queueKey ~= "matchmaking:queue" then
              for _, match in ipairs(redis.call('ZRANGE', queueKey, 0, -1)) do
                table.insert(potentialMatches, match)
              end
            end
          end
        end
        
        -- Find first valid match
        for _, matchStr in ipairs(potentialMatches) do
          local matchData = cjson.decode(matchStr)
          if matchData.userId ~= tonumber(userId) then
            -- Remove matched user from all queues
            for _, queueKey in ipairs(queueKeys) do
              redis.call('ZREM', queueKey, matchStr)
            end
            
            -- Return match info
            return {matchData.userId, matchData.preferences, matchData.serverId}
          end
        end
        
        -- No match found, add user to appropriate queues
        local userEntry = cjson.encode({
          userId = tonumber(userId),
          preferences = preferences,
          timestamp = tonumber(timestamp),
          serverId = serverId
        })
        
        -- Add to specific preference queue
        local queueKey = "matchmaking:" .. preferences
        redis.call('ZADD', queueKey, timestamp, userEntry)
        
        -- Add to general queue
        redis.call('ZADD', 'matchmaking:queue', timestamp, userEntry)
        
        return nil
      `;

      const result = await upstashRedis.eval(
        luaScript,
        [],
        [userId.toString(), preferences, this.serverId, Date.now().toString()]
      ) as any;

      if (result && Array.isArray(result) && result.length >= 2) {
        // Match found! Create chat session
        const partnerId = result[0];
        const partnerPreferences = result[1];
        
        console.log(`🎯 REDIS MATCH: User ${userId} (${preferences}) matched with User ${partnerId} (${partnerPreferences})`);

        // Create chat session in database
        const session = await storage.createChatSession({
          user1Id: userId,
          user2Id: partnerId,
          status: 'active'
        });

        // Cache the session in Redis
        const redisSession = {
          id: session.id,
          user1Id: userId,
          user2Id: partnerId,
          status: 'active',
          createdAt: Date.now()
        };

        await RedisUtils.setWithTTL(REDIS_KEYS.CHAT_SESSION(session.id), redisSession, CACHE_TTL.CHAT_SESSION);
        await upstashRedis.sadd(REDIS_KEYS.ACTIVE_CHAT_SESSIONS, session.id.toString());
        
        // Set user active chat mapping
        await RedisUtils.setWithTTL(REDIS_KEYS.USER_ACTIVE_CHAT(userId), session.id, CACHE_TTL.CHAT_SESSION);
        await RedisUtils.setWithTTL(REDIS_KEYS.USER_ACTIVE_CHAT(partnerId), session.id, CACHE_TTL.CHAT_SESSION);

        return {
          matched: true,
          sessionId: session.id,
          partnerId,
          partnerInfo: await this.getUserInfo(partnerId)
        };
      } else {
        console.log(`⏳ No match found for User ${userId} (${preferences}). Added to queue.`);
        return { matched: false };
      }

    } catch (error) {
      console.error('Error in optimized matchmaking:', error);
      return { matched: false };
    }
  }

  // Get cached user info
  private async getUserInfo(userId: number): Promise<any> {
    let user = await RedisUtils.getJSON(REDIS_KEYS.USER_CACHE(userId));
    
    if (!user) {
      user = await storage.getUser(userId);
      if (user) {
        await RedisUtils.setWithTTL(REDIS_KEYS.USER_CACHE(userId), user, CACHE_TTL.USER_CACHE);
      }
    }
    
    return user ? {
      username: (user as any).username,
      avatar: (user as any).avatar
    } : null;
  }

  // Remove user from all queues
  async leaveQueue(userId: number): Promise<void> {
    const luaScript = `
      local userId = ARGV[1]
      
      local queueKeys = {
        "matchmaking:male",
        "matchmaking:female", 
        "matchmaking:both",
        "matchmaking:queue"
      }
      
      local removed = 0
      
      for _, queueKey in ipairs(queueKeys) do
        local members = redis.call('ZRANGE', queueKey, 0, -1)
        for _, member in ipairs(members) do
          local data = cjson.decode(member)
          if data.userId == tonumber(userId) then
            redis.call('ZREM', queueKey, member)
            removed = removed + 1
          end
        end
      end
      
      -- Remove user queue status
      redis.call('DEL', 'user:queue:' .. userId)
      
      return removed
    `;

    const removed = await upstashRedis.eval(luaScript, [], [userId.toString()]) as number;
    console.log(`🚪 User ${userId} removed from ${removed} queues`);
  }

  // Get queue statistics
  async getQueueStats(): Promise<{
    total: number;
    male: number;
    female: number;
    both: number;
  }> {
    const [total, male, female, both] = await Promise.all([
      upstashRedis.zcard(REDIS_KEYS.MATCHMAKING_QUEUE),
      upstashRedis.zcard(REDIS_KEYS.MATCHMAKING_MALE),
      upstashRedis.zcard(REDIS_KEYS.MATCHMAKING_FEMALE),
      upstashRedis.zcard(REDIS_KEYS.MATCHMAKING_BOTH)
    ]);

    return { total, male, female, both };
  }

  // Clean expired entries
  async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const maxAge = CACHE_TTL.MATCHMAKING_QUEUE * 1000;
    const cutoff = now - maxAge;

    const queues = [
      REDIS_KEYS.MATCHMAKING_QUEUE,
      REDIS_KEYS.MATCHMAKING_MALE,
      REDIS_KEYS.MATCHMAKING_FEMALE,
      REDIS_KEYS.MATCHMAKING_BOTH
    ];

    for (const queueKey of queues) {
      await upstashRedis.zremrangebyscore(queueKey, 0, cutoff);
    }
  }
}

// Background cleanup job
setInterval(async () => {
  try {
    await OptimizedMatchmakingService.getInstance().cleanExpiredEntries();
  } catch (error) {
    console.error('Error cleaning expired optimized matchmaking entries:', error);
  }
}, 60000);