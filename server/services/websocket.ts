import { WebSocket } from 'ws';
import { upstashRedis, ioRedis, REDIS_KEYS, CACHE_TTL, RedisUtils, PUBSUB_CHANNELS, RedisWebSocketSession } from '../redis';
import { storage } from '../storage';

export interface WebSocketClient extends WebSocket {
  userId?: number;
  isAlive?: boolean;
  serverId?: string;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connectedClients: Map<number, WebSocketClient> = new Map();
  private serverId: string;
  private subscriber: any;

  constructor() {
    this.serverId = process.env.SERVER_ID!;
    this.initializeSubscriber();
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Initialize Redis subscriber for pub/sub (using polling for Upstash REST)
  private async initializeSubscriber(): Promise<void> {
    // Use polling mechanism for pub/sub with Upstash REST API
    this.startPollingForMessages();
    console.log('WebSocket manager initialized with Redis polling');
  }

  // Polling mechanism for cross-server communication
  private startPollingForMessages(): void {
    setInterval(async () => {
      try {
        await this.pollForServerMessages();
      } catch (error) {
        console.error('Error polling for messages:', error);
      }
    }, 1000); // Poll every second
  }

  private async pollForServerMessages(): Promise<void> {
    const serverMessageKey = `server:${this.serverId}:messages`;
    const messages = await upstashRedis.lrange(serverMessageKey, 0, -1);
    
    if (messages.length > 0) {
      // Clear the list
      await upstashRedis.del(serverMessageKey);
      
      // Process each message
      for (const messageStr of messages) {
        try {
          const message = JSON.parse(messageStr as string);
          await this.handleCrossServerMessage(message);
        } catch (error) {
          console.error('Error processing cross-server message:', error);
        }
      }
    }
  }

  // Send message to specific server
  private async sendMessageToServer(serverId: string, message: any): Promise<void> {
    const serverMessageKey = `server:${serverId}:messages`;
    await upstashRedis.lpush(serverMessageKey, JSON.stringify(message));
    await upstashRedis.expire(serverMessageKey, 300); // Expire after 5 minutes
  }

  // Notify other servers about events
  private async notifyOtherServers(type: string, data: any): Promise<void> {
    // Get list of active servers
    const activeServers = await upstashRedis.smembers('active_servers');
    
    for (const serverId of activeServers) {
      if (serverId !== this.serverId) {
        await this.sendMessageToServer(serverId, { type, ...data });
      }
    }
  }

  // Handle cross-server messages
  private async handleCrossServerMessage(data: any): Promise<void> {
    try {
      switch (data.type) {
        case 'chat_message':
          await this.handleChatMessage(data);
          break;
        case 'match_found':
          await this.handleMatchFound(data);
          break;
        case 'chat_skipped':
          await this.handleChatSkipped(data);
          break;
        case 'break_ice':
          await this.handleBreakIce(data);
          break;
        case 'direct_message':
          await this.sendToUser(data.userId, data.message);
          break;
      }
    } catch (error) {
      console.error('Error handling cross-server message:', error);
    }
  }

  // Register WebSocket client
  async registerClient(ws: WebSocketClient, userId: number): Promise<void> {
    ws.userId = userId;
    ws.serverId = this.serverId;
    ws.isAlive = true;
    
    this.connectedClients.set(userId, ws);

    // Register this server as active
    await upstashRedis.sadd('active_servers', this.serverId);
    await upstashRedis.expire('active_servers', 300); // Keep servers list fresh

    // Store session in Redis
    const session: RedisWebSocketSession = {
      userId,
      serverId: this.serverId,
      connectedAt: Date.now(),
      lastSeen: Date.now()
    };

    await RedisUtils.setWithTTL(REDIS_KEYS.WS_SESSION(userId), session, CACHE_TTL.USER_ONLINE);
    await upstashRedis.sadd(REDIS_KEYS.WS_ACTIVE_SESSIONS, userId.toString());
    await RedisUtils.setWithTTL(REDIS_KEYS.USER_ONLINE(userId), true, CACHE_TTL.USER_ONLINE);
    
    // Update database
    await storage.updateUserOnlineStatus(userId, true);
    
    // Increment online users counter
    await RedisUtils.incrementCounter(REDIS_KEYS.ONLINE_USERS_COUNT);
    
    // Notify other servers about user connection
    await this.notifyOtherServers('user_connected', { userId, serverId: this.serverId });
    
    console.log(`User ${userId} connected to server ${this.serverId}`);
  }

  // Unregister WebSocket client
  async unregisterClient(userId: number): Promise<void> {
    this.connectedClients.delete(userId);

    // Remove from Redis
    await upstashRedis.del(REDIS_KEYS.WS_SESSION(userId));
    await upstashRedis.srem(REDIS_KEYS.WS_ACTIVE_SESSIONS, userId.toString());
    await upstashRedis.del(REDIS_KEYS.USER_ONLINE(userId));
    
    // Update database
    await storage.updateUserOnlineStatus(userId, false);
    
    // Decrement online users counter
    await upstashRedis.decr(REDIS_KEYS.ONLINE_USERS_COUNT);
    
    // Notify other servers about user disconnection
    await this.notifyOtherServers('user_disconnected', { userId, serverId: this.serverId });
    
    console.log(`User ${userId} disconnected from server ${this.serverId}`);
  }

  // Send message to specific user
  async sendToUser(userId: number, message: any): Promise<boolean> {
    // Try local connection first
    const localClient = this.connectedClients.get(userId);
    if (localClient && localClient.readyState === WebSocket.OPEN) {
      localClient.send(JSON.stringify(message));
      return true;
    }

    // Check if user is connected to another server
    const session = await RedisUtils.getJSON<RedisWebSocketSession>(REDIS_KEYS.WS_SESSION(userId));
    if (session && session.serverId !== this.serverId) {
      // User is on another server, send message to that server
      await this.sendMessageToServer(session.serverId, {
        type: 'direct_message',
        userId,
        message
      });
      return true;
    }

    return false; // User not connected
  }

  // Broadcast message to all users in a chat session
  async broadcastToSession(sessionId: number, message: any, excludeUserId?: number): Promise<void> {
    const session = await RedisUtils.getJSON<{ user1Id: number; user2Id: number }>(REDIS_KEYS.CHAT_SESSION(sessionId));
    if (!session) return;

    const userIds = [session.user1Id, session.user2Id].filter(id => id !== excludeUserId);
    
    for (const userId of userIds) {
      await this.sendToUser(userId, message);
    }
  }

  // Handle chat message from pub/sub
  private async handleChatMessage(data: any): Promise<void> {
    const { sessionId, senderId, content, type, metadata } = data;
    
    const message = {
      type: 'random_message',
      data: {
        senderId,
        content,
        type: type || 'text',
        metadata
      }
    };

    await this.broadcastToSession(sessionId, message, senderId);
  }

  // Handle match found from pub/sub
  private async handleMatchFound(data: any): Promise<void> {
    const { sessionId, user1Id, user2Id } = data;
    
    // Get user info for both users
    const [user1, user2] = await Promise.all([
      this.getCachedUser(user1Id),
      this.getCachedUser(user2Id)
    ]);

    // Send match notifications
    await this.sendToUser(user1Id, {
      type: 'chat_matched',
      data: {
        sessionId,
        partnerId: user2Id,
        partnerInfo: {
          username: user2?.username,
          avatar: user2?.avatar
        }
      }
    });

    await this.sendToUser(user2Id, {
      type: 'chat_matched',
      data: {
        sessionId,
        partnerId: user1Id,
        partnerInfo: {
          username: user1?.username,
          avatar: user1?.avatar
        }
      }
    });
  }

  // Handle chat skipped from pub/sub
  private async handleChatSkipped(data: any): Promise<void> {
    const { sessionId, skippedBy } = data;
    
    await this.broadcastToSession(sessionId, {
      type: 'chat_skipped',
      data: { skippedBy }
    }, skippedBy);
  }

  // Handle break ice game from pub/sub
  private async handleBreakIce(data: any): Promise<void> {
    const { type, sessionId, ...gameData } = data;
    
    await this.broadcastToSession(sessionId, {
      type: `break_ice_${type}`,
      ...gameData
    });
  }

  // Get cached user info
  private async getCachedUser(userId: number): Promise<any> {
    let user = await RedisUtils.getJSON(REDIS_KEYS.USER_CACHE(userId));
    
    if (!user) {
      // Cache miss, fetch from database
      user = await storage.getUser(userId);
      if (user) {
        await RedisUtils.setWithTTL(REDIS_KEYS.USER_CACHE(userId), user, CACHE_TTL.USER_CACHE);
      }
    }
    
    return user;
  }

  // Update user's last seen timestamp
  async updateLastSeen(userId: number): Promise<void> {
    const session = await RedisUtils.getJSON<RedisWebSocketSession>(REDIS_KEYS.WS_SESSION(userId));
    if (session) {
      session.lastSeen = Date.now();
      await RedisUtils.setWithTTL(REDIS_KEYS.WS_SESSION(userId), session, CACHE_TTL.USER_ONLINE);
    }
  }

  // Get online users count
  async getOnlineUsersCount(): Promise<number> {
    const count = await upstashRedis.get(REDIS_KEYS.ONLINE_USERS_COUNT);
    return count ? parseInt(count as string) : 0;
  }

  // Check if user is online
  async isUserOnline(userId: number): Promise<boolean> {
    const online = await upstashRedis.get(REDIS_KEYS.USER_ONLINE(userId));
    return !!online;
  }

  // Get all connected clients (local server only)
  getLocalClients(): Map<number, WebSocketClient> {
    return this.connectedClients;
  }

  // Publish chat message to other servers
  async publishChatMessage(sessionId: number, senderId: number, content: string, type = 'text', metadata?: any): Promise<void> {
    await this.notifyOtherServers('chat_message', {
      sessionId,
      senderId,
      content,
      type,
      metadata,
      timestamp: Date.now()
    });
  }

  // Publish chat skip event
  async publishChatSkipped(sessionId: number, skippedBy: number): Promise<void> {
    await this.notifyOtherServers('chat_skipped', {
      sessionId,
      skippedBy,
      timestamp: Date.now()
    });
  }

  // Clean up inactive sessions
  async cleanInactiveSessions(): Promise<void> {
    const now = Date.now();
    const maxInactiveTime = CACHE_TTL.USER_ONLINE * 1000; // Convert to milliseconds
    
    const activeUserIds = await upstashRedis.smembers(REDIS_KEYS.WS_ACTIVE_SESSIONS);
    
    for (const userIdStr of activeUserIds) {
      const userId = parseInt(userIdStr);
      const session = await RedisUtils.getJSON<RedisWebSocketSession>(REDIS_KEYS.WS_SESSION(userId));
      
      if (!session || (now - session.lastSeen) > maxInactiveTime) {
        await this.unregisterClient(userId);
      }
    }
    
    console.log(`Cleaned inactive WebSocket sessions`);
  }
}

// Start background job to clean inactive sessions
setInterval(async () => {
  try {
    await WebSocketManager.getInstance().cleanInactiveSessions();
  } catch (error) {
    console.error('Error cleaning inactive sessions:', error);
  }
}, 60000); // Clean every minute