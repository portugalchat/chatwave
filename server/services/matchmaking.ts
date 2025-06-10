import { upstashRedis, REDIS_KEYS, CACHE_TTL, RedisUtils, MatchmakingEntry, ioRedis, PUBSUB_CHANNELS } from '../redis';
import { storage } from '../storage';

export class MatchmakingService {
  private static instance: MatchmakingService;
  private serverId: string;

  constructor() {
    this.serverId = process.env.SERVER_ID!;
  }

  static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }

  // Add user to matchmaking queue
  async joinQueue(userId: number, preferences: string): Promise<void> {
    const entry: MatchmakingEntry = {
      userId,
      preferences,
      timestamp: Date.now(),
      serverId: this.serverId
    };

    // Add to appropriate queue based on preferences
    const queueKey = this.getQueueKey(preferences);
    await RedisUtils.addToSortedSet(queueKey, JSON.stringify(entry), entry.timestamp);
    
    // Add to general queue for monitoring
    await RedisUtils.addToSortedSet(REDIS_KEYS.MATCHMAKING_QUEUE, JSON.stringify(entry), entry.timestamp);
    
    // Set user's queue status
    await RedisUtils.setWithTTL(`user:queue:${userId}`, { preferences, joinedAt: Date.now() }, CACHE_TTL.MATCHMAKING_QUEUE);
    
    console.log(`User ${userId} joined matchmaking queue with preferences: ${preferences}`);
  }

  // Remove user from queue
  async leaveQueue(userId: number): Promise<void> {
    // Remove from all possible queues
    const queues = [
      REDIS_KEYS.MATCHMAKING_MALE,
      REDIS_KEYS.MATCHMAKING_FEMALE,
      REDIS_KEYS.MATCHMAKING_BOTH,
      REDIS_KEYS.MATCHMAKING_QUEUE
    ];

    for (const queueKey of queues) {
      const members = await RedisUtils.getSortedSetMembers(queueKey);
      for (const member of members) {
        try {
          const entry: MatchmakingEntry = JSON.parse(member);
          if (entry.userId === userId) {
            await RedisUtils.removeFromSortedSet(queueKey, member);
          }
        } catch (error) {
          // Invalid entry, remove it
          await RedisUtils.removeFromSortedSet(queueKey, member);
        }
      }
    }

    // Remove user's queue status
    await upstashRedis.del(`user:queue:${userId}`);
    
    console.log(`User ${userId} left matchmaking queue`);
  }

  // Find match for user
  async findMatch(userId: number, preferences: string): Promise<MatchmakingEntry | null> {
    // Get potential matches based on preferences
    const potentialMatches = await this.getPotentialMatches(preferences);
    
    // Filter out the current user and find best match
    const availableMatches = potentialMatches.filter(match => {
      try {
        const entry: MatchmakingEntry = JSON.parse(match);
        return entry.userId !== userId && this.isCompatible(preferences, entry.preferences);
      } catch {
        return false;
      }
    });

    if (availableMatches.length === 0) {
      return null;
    }

    // Get the oldest match (first in queue)
    const matchEntry: MatchmakingEntry = JSON.parse(availableMatches[0]);
    
    // Remove BOTH users from all queues when match is found
    await this.leaveQueue(matchEntry.userId);
    await this.leaveQueue(userId);
    
    return matchEntry;
  }

  // Get potential matches based on user preferences
  private async getPotentialMatches(preferences: string): Promise<string[]> {
    const matches: string[] = [];
    
    switch (preferences) {
      case 'male':
        // Get users looking for 'female' or 'both'
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_FEMALE));
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_BOTH));
        break;
      case 'female':
        // Get users looking for 'male' or 'both'
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_MALE));
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_BOTH));
        break;
      case 'both':
        // Get users with any preference
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_MALE));
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_FEMALE));
        matches.push(...await RedisUtils.getSortedSetMembers(REDIS_KEYS.MATCHMAKING_BOTH));
        break;
    }
    
    // Sort by timestamp (oldest first)
    return matches.sort((a, b) => {
      try {
        const entryA: MatchmakingEntry = JSON.parse(a);
        const entryB: MatchmakingEntry = JSON.parse(b);
        return entryA.timestamp - entryB.timestamp;
      } catch {
        return 0;
      }
    });
  }

  // Check if two preferences are compatible
  private isCompatible(pref1: string, pref2: string): boolean {
    if (pref1 === 'both' || pref2 === 'both') return true;
    return (pref1 === 'male' && pref2 === 'female') || (pref1 === 'female' && pref2 === 'male');
  }

  // Get queue key based on preferences
  private getQueueKey(preferences: string): string {
    switch (preferences) {
      case 'male': return REDIS_KEYS.MATCHMAKING_MALE;
      case 'female': return REDIS_KEYS.MATCHMAKING_FEMALE;
      case 'both': return REDIS_KEYS.MATCHMAKING_BOTH;
      default: return REDIS_KEYS.MATCHMAKING_BOTH;
    }
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

  // Clean expired entries from queues
  async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const maxAge = CACHE_TTL.MATCHMAKING_QUEUE * 1000; // Convert to milliseconds
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

    console.log(`Cleaned expired matchmaking entries older than ${CACHE_TTL.MATCHMAKING_QUEUE}s`);
  }

  // Process match creation
  async createMatch(user1Id: number, user2Id: number): Promise<number> {
    try {
      // Create chat session in database
      const session = await storage.createChatSession({
        user1Id,
        user2Id,
        status: 'active'
      });

      // Cache the session in Redis
      const redisSession = {
        id: session.id,
        user1Id,
        user2Id,
        status: 'active',
        createdAt: Date.now()
      };

      await RedisUtils.setWithTTL(REDIS_KEYS.CHAT_SESSION(session.id), redisSession, CACHE_TTL.CHAT_SESSION);
      
      // Add to active sessions set
      await upstashRedis.sadd(REDIS_KEYS.ACTIVE_CHAT_SESSIONS, session.id.toString());
      
      // Set user active chat mapping
      await RedisUtils.setWithTTL(REDIS_KEYS.USER_ACTIVE_CHAT(user1Id), session.id, CACHE_TTL.CHAT_SESSION);
      await RedisUtils.setWithTTL(REDIS_KEYS.USER_ACTIVE_CHAT(user2Id), session.id, CACHE_TTL.CHAT_SESSION);

      // Publish match found event
      await ioRedis.publish(PUBSUB_CHANNELS.MATCH_FOUND, JSON.stringify({
        sessionId: session.id,
        user1Id,
        user2Id,
        timestamp: Date.now()
      }));

      console.log(`Match created: Session ${session.id} between users ${user1Id} and ${user2Id}`);
      return session.id;

    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }
}

// Start background job to clean expired entries
setInterval(async () => {
  try {
    await MatchmakingService.getInstance().cleanExpiredEntries();
  } catch (error) {
    console.error('Error cleaning expired matchmaking entries:', error);
  }
}, 60000); // Clean every minute