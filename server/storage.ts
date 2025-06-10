import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, friendships, messages, chatSessions, type User, type InsertUser, type Friendship, type InsertFriendship, type Message, type InsertMessage, type ChatSession, type InsertChatSession } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  
  // Friend operations
  createFriendRequest(friendship: InsertFriendship): Promise<Friendship>;
  getFriendRequests(userId: number): Promise<Friendship[]>;
  updateFriendRequest(id: number, status: string): Promise<Friendship | undefined>;
  getFriends(userId: number): Promise<User[]>;
  areFriends(user1Id: number, user2Id: number): Promise<boolean>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  
  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  endChatSession(id: number): Promise<void>;
  getRecentChatSessions(userId: number, limit?: number): Promise<ChatSession[]>;
}

// PostgreSQL connection setup
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export class PostgresStorage implements IStorage {
  constructor() {}

  private async connectAndMigrate() {
    // This would normally run migrations, but we'll assume the tables exist
    console.log('Connected to PostgreSQL database');
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values({
        email: insertUser.email || null,
        password: insertUser.password || null,
        username: insertUser.username,
        avatar: insertUser.avatar || null,
        isAnonymous: insertUser.isAnonymous || false,
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    try {
      await db.update(users)
        .set({ isOnline, lastSeen: new Date() })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  async createFriendRequest(insertFriendship: InsertFriendship): Promise<Friendship> {
    try {
      const result = await db.insert(friendships).values({
        requesterId: insertFriendship.requesterId,
        addresseeId: insertFriendship.addresseeId,
        status: insertFriendship.status || "pending",
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating friend request:', error);
      throw error;
    }
  }

  async getFriendRequests(userId: number): Promise<Friendship[]> {
    try {
      const result = await db.select().from(friendships)
        .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
      return result;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return [];
    }
  }

  async updateFriendRequest(id: number, status: string): Promise<Friendship | undefined> {
    try {
      const result = await db.update(friendships)
        .set({ status })
        .where(eq(friendships.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating friend request:', error);
      return undefined;
    }
  }

  async getFriends(userId: number): Promise<User[]> {
    try {
      const friendshipResult = await db.select().from(friendships)
        .where(and(
          eq(friendships.status, "accepted"),
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
        ));

      const friendIds = friendshipResult.map(f => 
        f.requesterId === userId ? f.addresseeId : f.requesterId
      ).filter(Boolean) as number[];

      if (friendIds.length === 0) return [];

      const friendsResult = await db.select().from(users)
        .where(or(...friendIds.map(id => eq(users.id, id))));
      
      return friendsResult;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }

  async areFriends(user1Id: number, user2Id: number): Promise<boolean> {
    try {
      const result = await db.select().from(friendships)
        .where(and(
          eq(friendships.status, "accepted"),
          or(
            and(eq(friendships.requesterId, user1Id), eq(friendships.addresseeId, user2Id)),
            and(eq(friendships.requesterId, user2Id), eq(friendships.addresseeId, user1Id))
          )
        ))
        .limit(1);
      return result.length > 0;
    } catch (error) {
      console.error('Error checking if users are friends:', error);
      return false;
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      const result = await db.insert(messages).values({
        senderId: insertMessage.senderId,
        receiverId: insertMessage.receiverId,
        content: insertMessage.content,
        type: insertMessage.type || "text",
        metadata: insertMessage.metadata,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    try {
      const result = await db.select().from(messages)
        .where(or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        ))
        .orderBy(messages.createdAt);
      return result;
    } catch (error) {
      console.error('Error getting messages between users:', error);
      return [];
    }
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    try {
      const result = await db.insert(chatSessions).values({
        user1Id: insertSession.user1Id,
        user2Id: insertSession.user2Id,
        status: insertSession.status || "active",
        createdAt: new Date(),
        endedAt: null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  async endChatSession(id: number): Promise<void> {
    try {
      await db.update(chatSessions)
        .set({ status: "ended", endedAt: new Date() })
        .where(eq(chatSessions.id, id));
    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  }

  async getRecentChatSessions(userId: number, limit: number = 20): Promise<ChatSession[]> {
    try {
      const result = await db.select().from(chatSessions)
        .where(or(eq(chatSessions.user1Id, userId), eq(chatSessions.user2Id, userId)))
        .orderBy(desc(chatSessions.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error('Error getting recent chat sessions:', error);
      return [];
    }
  }
}

export const storage = new PostgresStorage();
