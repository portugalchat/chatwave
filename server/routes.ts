import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { supabase, BUCKETS } from "./supabase";
import { insertUserSchema, insertFriendshipSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { initializeRedis, shutdownRedis, upstashRedis, REDIS_KEYS } from "./redis";
import { MatchmakingService } from "./services/matchmaking";
import { OptimizedMatchmakingService } from "./services/matchmaking-optimized";
import { WebSocketManager } from "./services/websocket";
import { CacheService } from "./services/cache";

interface WebSocketClient extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

interface MatchmakingQueue {
  userId: number;
  preferences: string; // "male", "female", "both"
  timestamp: number;
}

interface BreakIceGame {
  gameId: string;
  sessionId: number;
  question: any;
  responses: Map<number, string>; // userId -> response
  initiatorId: number;
  isActive: boolean;
  ignoredBy?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Redis connections
  await initializeRedis();
  
  const httpServer = createServer(app);

  // Get service instances
  const matchmakingService = MatchmakingService.getInstance();
  const optimizedMatchmaking = OptimizedMatchmakingService.getInstance();
  const wsManager = WebSocketManager.getInstance();
  const cacheService = CacheService.getInstance();

  // Configure multer for file uploads with production limits
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for production
      files: 1,
      fieldSize: 1024 * 1024 // 1MB field size
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas'));
      }
    },
  });

  // Production WebSocket server configuration
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    maxPayload: 1024 * 1024, // 1MB max payload
    perMessageDeflate: true,
    clientTracking: true
  });

  // Legacy maps for backward compatibility (will be phased out)
  const connectedClients = new Map<number, WebSocketClient>();
  const matchmakingQueue: MatchmakingQueue[] = [];
  const activeChatSessions = new Map<number, { user1Id: number, user2Id: number }>(); // sessionId -> {user1Id, user2Id}
  const activeBreakIceGames = new Map<string, BreakIceGame>();

  // Helper function to generate random username
  function generateUsername(): string {
    const adjectives = ["Azul", "Verde", "Dourado", "Prateado", "Cristalino", "Brilhante", "Lunar", "Solar"];
    const nouns = ["Estrela", "Lua", "Sol", "Mar", "Montanha", "Rio", "Flor", "Vento"];
    const numbers = Math.floor(Math.random() * 9999) + 1;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}_${numbers}`;
  }

  // Helper function to hash password
  async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Helper function to verify password
  async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      console.log('Register request body:', req.body);
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e password são obrigatórios" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email!);
      if (existingUser) {
        return res.status(400).json({ error: "Utilizador já existe" });
      }

      const hashedPassword = await hashPassword(password!);
      const username = generateUsername();

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        isAnonymous: false,
        avatar: null,
      });

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username,
          avatar: user.avatar,
          isAnonymous: user.isAnonymous
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: "Erro ao criar utilizador: " + (error as Error).message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password || !(await verifyPassword(password, user.password))) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      await storage.updateUserOnlineStatus(user.id, true);

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username,
          avatar: user.avatar,
          isAnonymous: user.isAnonymous
        } 
      });
    } catch (error) {
      res.status(400).json({ error: "Erro no login" });
    }
  });

  app.post("/api/anonymous", async (req, res) => {
    try {
      const username = generateUsername();
      const user = await storage.createUser({
        username,
        isAnonymous: true,
      });

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username,
          isAnonymous: user.isAnonymous
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar sessão anónima" });
    }
  });

  app.post("/api/convert-anonymous", async (req, res) => {
    try {
      const { userId, email, password } = req.body;

      const user = await storage.getUser(userId);
      if (!user || !user.isAnonymous) {
        return res.status(400).json({ error: "Utilizador não encontrado ou não anónimo" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já existe" });
      }

      const hashedPassword = await hashPassword(password);
      const updatedUser = await storage.updateUser(userId, {
        email,
        password: hashedPassword,
        isAnonymous: false,
      });

      res.json({ 
        user: { 
          id: updatedUser!.id, 
          email: updatedUser!.email, 
          username: updatedUser!.username,
          avatar: updatedUser!.avatar,
          isAnonymous: updatedUser!.isAnonymous
        } 
      });
    } catch (error) {
      res.status(400).json({ error: "Erro ao converter conta" });
    }
  });

  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado" });
      }

      res.json({ 
        id: user.id, 
        email: user.email, 
        username: user.username,
        avatar: user.avatar,
        isAnonymous: user.isAnonymous,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/user/:id", async (req, res) => {
    try {
      const { username, avatar } = req.body;
      const userId = parseInt(req.params.id);

      const updatedUser = await storage.updateUser(userId, { username, avatar });
      if (!updatedUser) {
        return res.status(404).json({ error: "Utilizador não encontrado" });
      }

      res.json({ 
        id: updatedUser.id, 
        email: updatedUser.email, 
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        isAnonymous: updatedUser.isAnonymous
      });
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar utilizador" });
    }
  });

  // Friend routes
  app.post("/api/friends/request", async (req, res) => {
    try {
      const { requesterId, addresseeId } = insertFriendshipSchema.parse(req.body);

      // Check if friendship already exists
      const areFriends = await storage.areFriends(requesterId!, addresseeId!);
      if (areFriends) {
        return res.status(400).json({ error: "Já são amigos" });
      }

      const friendship = await storage.createFriendRequest({
        requesterId,
        addresseeId,
        status: "pending",
      });

      // Notify via WebSocket
      const addresseeClient = connectedClients.get(addresseeId!);
      if (addresseeClient && addresseeClient.readyState === WebSocket.OPEN) {
        addresseeClient.send(JSON.stringify({
          type: "friend_request",
          data: friendship
        }));
      }

      res.json(friendship);
    } catch (error) {
      res.status(400).json({ error: "Erro ao enviar pedido de amizade" });
    }
  });

  app.get("/api/friends/requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter pedidos de amizade" });
    }
  });

  app.put("/api/friends/request/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const requestId = parseInt(req.params.id);

      const friendship = await storage.updateFriendRequest(requestId, status);
      if (!friendship) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // Notify requester via WebSocket
      const requesterClient = connectedClients.get(friendship.requesterId!);
      if (requesterClient && requesterClient.readyState === WebSocket.OPEN) {
        requesterClient.send(JSON.stringify({
          type: "friend_request_response",
          data: { ...friendship, status }
        }));
      }

      res.json(friendship);
    } catch (error) {
      res.status(400).json({ error: "Erro ao responder pedido de amizade" });
    }
  });

  app.get("/api/friends/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter amigos" });
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);

      // Send to recipient via WebSocket
      const recipientClient = connectedClients.get(messageData.receiverId!);
      if (recipientClient && recipientClient.readyState === WebSocket.OPEN) {
        recipientClient.send(JSON.stringify({
          type: "private_message",
          data: message
        }));
      }

      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Erro ao enviar mensagem" });
    }
  });

  app.get("/api/messages/:user1Id/:user2Id", async (req, res) => {
    try {
      const user1Id = parseInt(req.params.user1Id);
      const user2Id = parseInt(req.params.user2Id);
      const messages = await storage.getMessagesBetweenUsers(user1Id, user2Id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter mensagens" });
    }
  });

  // Chat session routes
  app.get("/api/chat-history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getRecentChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter histórico de chat" });
    }
  });

  // File upload route for profile pictures and chat images
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const { bucket, fileName } = req.body;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: "Erro ao fazer upload da imagem" });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
  });

  // Delete image route
  app.delete("/api/upload", async (req, res) => {
    try {
      const { url } = req.body;

      // In a real implementation, you would delete from Supabase Storage here
      // For now, we'll just return success

      res.json({ success: true });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: "Erro ao deletar imagem" });
    }
  });

  // WebSocket handling
  wss.on('connection', (ws: WebSocketClient) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'authenticate':
            ws.userId = message.userId;
            // Register with both legacy and new WebSocket manager
            connectedClients.set(message.userId, ws);
            await wsManager.registerClient(ws, message.userId);
            break;

          case 'join_queue':
            if (ws.userId) {
              await wsManager.updateLastSeen(ws.userId);
              
              console.log(`🎯 User ${ws.userId} joining queue with preferences: ${message.preferences || 'both'}`);
              
              try {
                // First, try the optimized Redis matchmaking system
                const redisResult = await optimizedMatchmaking.findAndCreateMatch(
                  ws.userId, 
                  message.preferences || 'both'
                );

                if (redisResult.matched && redisResult.sessionId && redisResult.partnerId) {
                  console.log(`✅ REDIS MATCH SUCCESS: User ${ws.userId} matched with User ${redisResult.partnerId}`);
                  
                  // Add to legacy activeChatSessions for compatibility
                  activeChatSessions.set(redisResult.sessionId, { 
                    user1Id: ws.userId, 
                    user2Id: redisResult.partnerId 
                  });

                  // Get user info for both users
                  const currentUser = await cacheService.getCachedUser(ws.userId);
                  const partnerInfo = redisResult.partnerInfo || { username: 'Usuário', avatar: null };

                  // Notify partner
                  await wsManager.sendToUser(redisResult.partnerId, {
                    type: 'chat_matched',
                    data: { 
                      sessionId: redisResult.sessionId, 
                      partnerId: ws.userId,
                      partnerInfo: {
                        username: currentUser?.username || 'Usuário',
                        avatar: currentUser?.avatar
                      }
                    }
                  });

                  // Notify current user
                  ws.send(JSON.stringify({
                    type: 'chat_matched',
                    data: { 
                      sessionId: redisResult.sessionId, 
                      partnerId: redisResult.partnerId,
                      partnerInfo
                    }
                  }));
                  
                } else {
                  console.log(`⏳ User ${ws.userId} added to Redis queue - waiting for match`);
                  
                  // Fallback: Also add to legacy queue for immediate local matching
                  const existingIndex = matchmakingQueue.findIndex(q => q.userId === ws.userId);
                  if (existingIndex !== -1) {
                    matchmakingQueue.splice(existingIndex, 1);
                  }

                  matchmakingQueue.push({
                    userId: ws.userId,
                    preferences: message.preferences || 'both',
                    timestamp: Date.now()
                  });

                  // Check for immediate legacy match
                  const legacyMatch = matchmakingQueue.find((q, index) => 
                    q.userId !== ws.userId && 
                    index < matchmakingQueue.length - 1 &&
                    (q.preferences === 'both' || (message.preferences || 'both') === 'both' || 
                     q.preferences === (message.preferences || 'both'))
                  );

                  if (legacyMatch) {
                    console.log(`🔄 LEGACY FALLBACK MATCH: User ${ws.userId} matched with User ${legacyMatch.userId}`);
                    
                    // Remove both users from legacy queue
                    const matchIndex = matchmakingQueue.findIndex(q => q.userId === legacyMatch.userId);
                    const userIndex = matchmakingQueue.findIndex(q => q.userId === ws.userId);
                    matchmakingQueue.splice(Math.max(matchIndex, userIndex), 1);
                    matchmakingQueue.splice(Math.min(matchIndex, userIndex), 1);

                    // Remove from Redis queues
                    await optimizedMatchmaking.leaveQueue(ws.userId);
                    await optimizedMatchmaking.leaveQueue(legacyMatch.userId);

                    // Create chat session
                    const session = await storage.createChatSession({
                      user1Id: ws.userId,
                      user2Id: legacyMatch.userId,
                      status: 'active'
                    });

                    activeChatSessions.set(session.id, { 
                      user1Id: ws.userId, 
                      user2Id: legacyMatch.userId 
                    });

                    // Get user info for both users
                    const currentUser = await cacheService.getCachedUser(ws.userId);
                    const matchUser = await cacheService.getCachedUser(legacyMatch.userId);

                    // Notify both users
                    const matchClient = connectedClients.get(legacyMatch.userId);
                    if (matchClient && matchClient.readyState === WebSocket.OPEN) {
                      matchClient.send(JSON.stringify({
                        type: 'chat_matched',
                        data: { 
                          sessionId: session.id, 
                          partnerId: ws.userId,
                          partnerInfo: {
                            username: currentUser?.username || 'Usuário',
                            avatar: currentUser?.avatar
                          }
                        }
                      }));
                    }

                    ws.send(JSON.stringify({
                      type: 'chat_matched',
                      data: { 
                        sessionId: session.id, 
                        partnerId: legacyMatch.userId,
                        partnerInfo: {
                          username: matchUser?.username || 'Usuário',
                          avatar: matchUser?.avatar
                        }
                      }
                    }));
                  } else {
                    console.log(`⏳ User ${ws.userId} waiting in both Redis and legacy queues`);
                  }
                }
              } catch (error) {
                console.error(`❌ Error in matchmaking for User ${ws.userId}:`, error);
                
                // Complete fallback to legacy system only
                const existingIndex = matchmakingQueue.findIndex(q => q.userId === ws.userId);
                if (existingIndex !== -1) {
                  matchmakingQueue.splice(existingIndex, 1);
                }

                matchmakingQueue.push({
                  userId: ws.userId,
                  preferences: message.preferences || 'both',
                  timestamp: Date.now()
                });
                
                console.log(`🆘 Fallback: User ${ws.userId} added to legacy queue only`);
              }
            }
            break;

          case 'leave_queue':
            if (ws.userId) {
              // Remove from Redis-based queue
              await matchmakingService.leaveQueue(ws.userId);
              
              // Also remove from legacy queue for backward compatibility
              const index = matchmakingQueue.findIndex(q => q.userId === ws.userId);
              if (index !== -1) {
                matchmakingQueue.splice(index, 1);
              }
            }
            break;

          case 'break_ice_start':
            // Criar novo jogo e repassar para o parceiro
            if (message.sessionId) {
              const session = activeChatSessions.get(message.sessionId);
              if (session) {
                const partnerId = session.user1Id === ws.userId ? session.user2Id : session.user1Id;
                const partnerClient = connectedClients.get(partnerId);
                
                // Criar novo jogo no servidor
                const game: BreakIceGame = {
                  gameId: message.gameId,
                  sessionId: message.sessionId,
                  question: message.question,
                  responses: new Map(),
                  initiatorId: message.initiatorId,
                  isActive: true
                };
                
                activeBreakIceGames.set(message.gameId, game);
                
                if (partnerClient && partnerClient.readyState === WebSocket.OPEN) {
                  partnerClient.send(JSON.stringify({
                    type: 'break_ice_question_received',
                    gameId: message.gameId,
                    question: message.question,
                    initiatorId: message.initiatorId
                  }));
                }
              }
            }
            break;

          case 'break_ice_response':
            // Armazenar resposta e verificar se ambos responderam
            if (message.gameId && message.sessionId) {
              const game = activeBreakIceGames.get(message.gameId);
              if (game && game.isActive && !game.ignoredBy) {
                // Verificar se o utilizador já respondeu
                if (game.responses.has(ws.userId!)) {
                  // Utilizador já respondeu - ignorar
                  break;
                }
                
                // Armazenar a resposta do utilizador
                game.responses.set(ws.userId!, message.response);
                
                const session = activeChatSessions.get(message.sessionId);
                if (session) {
                  const partnerId = session.user1Id === ws.userId ? session.user2Id : session.user1Id;
                  const partnerClient = connectedClients.get(partnerId);
                  
                  // Verificar se ambos os utilizadores responderam
                  if (game.responses.size === 2) {
                    // Ambos responderam - revelar resultados para ambos
                    const userResponse = game.responses.get(ws.userId!);
                    const partnerResponse = game.responses.get(partnerId);
                    
                    // Determinar o tipo de resultado baseado nas respostas
                    const sameAnswer = userResponse === partnerResponse;
                    
                    const revealData = {
                      type: 'break_ice_reveal_results',
                      gameId: message.gameId,
                      question: game.question,
                      userResponse,
                      partnerResponse,
                      sameAnswer,
                      yourResponse: userResponse,
                      theirResponse: partnerResponse
                    };
                    
                    // Marcar jogo como inativo
                    game.isActive = false;
                    
                    // Enviar para o utilizador atual
                    ws.send(JSON.stringify({
                      ...revealData,
                      yourResponse: userResponse,
                      theirResponse: partnerResponse
                    }));
                    
                    // Enviar para o parceiro
                    if (partnerClient && partnerClient.readyState === WebSocket.OPEN) {
                      partnerClient.send(JSON.stringify({
                        ...revealData,
                        yourResponse: partnerResponse,
                        theirResponse: userResponse
                      }));
                    }
                    
                    // Remover o jogo da memória após um delay
                    setTimeout(() => {
                      activeBreakIceGames.delete(message.gameId);
                    }, 1000);
                  } else {
                    // Apenas um respondeu - notificar o parceiro que o outro está à espera
                    if (partnerClient && partnerClient.readyState === WebSocket.OPEN) {
                      partnerClient.send(JSON.stringify({
                        type: 'break_ice_partner_responded_waiting',
                        gameId: message.gameId,
                        message: 'O teu parceiro já respondeu, estás quase!'
                      }));
                    }
                  }
                }
              }
            }
            break;

          case 'break_ice_ignore':
            // Notificar o parceiro que o jogo foi ignorado e limpar o jogo
            if (message.sessionId && message.gameId) {
              const game = activeBreakIceGames.get(message.gameId);
              if (game && game.isActive) {
                // Marcar jogo como ignorado e inativo
                game.isActive = false;
                game.ignoredBy = ws.userId;
                
                const session = activeChatSessions.get(message.sessionId);
                if (session) {
                  const partnerId = session.user1Id === ws.userId ? session.user2Id : session.user1Id;
                  const partnerClient = connectedClients.get(partnerId);
                  
                  if (partnerClient && partnerClient.readyState === WebSocket.OPEN) {
                    partnerClient.send(JSON.stringify({
                      type: 'break_ice_ignored',
                      gameId: message.gameId,
                      userId: message.userId
                    }));
                  }
                }
                
                // Remover o jogo da memória após um delay
                setTimeout(() => {
                  activeBreakIceGames.delete(message.gameId);
                }, 1000);
              }
            }
            break;

          case 'random_message':
            if (message.sessionId && message.content && ws.userId) {
              // Rate limiting: max 30 messages per minute
              const rateLimit = await cacheService.checkRateLimit(ws.userId, 'chat_message', 30, 60);
              if (!rateLimit.allowed) {
                ws.send(JSON.stringify({
                  type: 'rate_limit_exceeded',
                  data: { 
                    resetTime: rateLimit.resetTime,
                    message: 'Muitas mensagens. Aguarde um momento.'
                  }
                }));
                break;
              }

              await wsManager.updateLastSeen(ws.userId);
              
              // Use WebSocket manager to broadcast message
              await wsManager.publishChatMessage(
                message.sessionId,
                ws.userId,
                message.content,
                message.messageType || 'text',
                message.metadata
              );

              // Store message in database for history
              await storage.createMessage({
                sessionId: message.sessionId,
                senderId: ws.userId,
                content: message.content,
                type: message.messageType || 'text'
              });

              // Legacy support - also broadcast locally
              const session = activeChatSessions.get(message.sessionId);
              if (session) {
                const partnerId = session.user1Id === ws.userId ? session.user2Id : session.user1Id;
                const partnerClient = connectedClients.get(partnerId);
                if (partnerClient && partnerClient.readyState === WebSocket.OPEN) {
                  partnerClient.send(JSON.stringify({
                    type: 'random_message',
                    data: {
                      senderId: ws.userId,
                      content: message.content,
                      type: message.messageType || 'text',
                      metadata: message.metadata
                    }
                  }));
                }
                
                ws.send(JSON.stringify({
                  type: 'random_message',
                  data: {
                    senderId: ws.userId,
                    content: message.content,
                    type: message.messageType || 'text',
                    metadata: message.metadata
                  }
                }));
              }
            }
            break;

          case 'skip_chat':
            if (message.sessionId) {
              const session = activeChatSessions.get(message.sessionId);
              if (session) {
                const partnerId = session.user1Id === ws.userId ? session.user2Id : session.user1Id;
                const partnerClient = connectedClients.get(partnerId);
                if (partnerClient && partnerClient.readyState === WebSocket.OPEN) {
                  partnerClient.send(JSON.stringify({
                    type: 'chat_skipped',
                    data: { skippedBy: ws.userId }
                  }));
                }
                activeChatSessions.delete(message.sessionId);
                await storage.endChatSession(message.sessionId);
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.userId) {
        // Unregister from WebSocket manager
        await wsManager.unregisterClient(ws.userId);
        
        // Legacy cleanup
        connectedClients.delete(ws.userId);

        // Remove from matchmaking queues
        await matchmakingService.leaveQueue(ws.userId);
        const index = matchmakingQueue.findIndex(q => q.userId === ws.userId);
        if (index !== -1) {
          matchmakingQueue.splice(index, 1);
        }
      }
    });
  });

  // Heartbeat to detect broken connections
  setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return httpServer;
}