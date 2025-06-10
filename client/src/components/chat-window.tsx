import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Loader, Send, Image, Smile, SkipForward, UserPlus, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { getRandomQuestion } from "@/data/breakIceQuestions";
import type { User } from "@shared/schema";

interface ChatWindowProps {
  user: User;
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

interface ChatMessage {
  id: string;
  senderId: number;
  content: string;
  type: 'text' | 'image' | 'gif' | 'break_ice_question' | 'break_ice_waiting' | 'break_ice_reveal';
  timestamp: Date;
  gameData?: {
    questionId: string;
    question: string;
    options: string[];
    userResponse?: string;
    partnerResponse?: string;
    gameId: string;
    sameAnswer?: boolean;
  };
}

export default function ChatWindow({ user: propUser, isConnected, sendMessage }: ChatWindowProps) {
  const { user } = useAuth(); // Get updated user from auth store
  const currentUser = user || propUser; // Fallback to prop user if auth user is null
  const [chatState, setChatState] = useState<'initial' | 'searching' | 'active' | 'skipped'>('initial');
  const [selectedFilter, setSelectedFilter] = useState<'both' | 'male' | 'female'>('both');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<{ username: string; avatar: string | null } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showIceAnimation, setShowIceAnimation] = useState(false);
  const [showSparkAnimation, setShowSparkAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isConnected) return;

    // Listen for WebSocket messages through the parent window
    const handleMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      switch (data.type) {
        case 'chat_matched':
          setChatState('active');
          setCurrentSessionId(data.data.sessionId);
          setPartnerId(data.data.partnerId);
          setPartnerInfo(data.data.partnerInfo || null);
          setMessages([]);
          break;
          
        case 'random_message':
          const newMessage: ChatMessage = {
            id: `${data.data.senderId}-${Date.now()}`,
            senderId: data.data.senderId,
            content: data.data.content,
            type: data.data.type || 'text',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, newMessage]);
          break;
          
        case 'break_ice_question_received':
          // Receber pergunta do parceiro
          const gameMessage: ChatMessage = {
            id: `break_ice_received_${Date.now()}`,
            senderId: 0,
            content: data.question.question,
            type: 'break_ice_question',
            timestamp: new Date(),
            gameData: {
              questionId: data.question.id,
              question: data.question.question,
              options: data.question.options,
              gameId: data.gameId,
              sameAnswer: undefined
            }
          };
          
          setMessages(prev => [...prev, gameMessage]);
          setActiveGame(data.gameId);
          break;
          
        case 'break_ice_partner_responded_waiting':
          // Parceiro respondeu mas ainda está à espera da nossa resposta
          const waitingNotification: ChatMessage = {
            id: `waiting_notification_${Date.now()}`,
            senderId: 0,
            content: data.message,
            type: 'text',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, waitingNotification]);
          break;
          
        case 'break_ice_reveal_results':
          // Ambos responderam - mostrar resultados finais com diferentes animações
          const revealMessage: ChatMessage = {
            id: `reveal_${Date.now()}`,
            senderId: 0,
            content: data.sameAnswer ? "🧊 O gelo foi quebrado!" : "🧊 Plot twist!",
            type: 'break_ice_reveal',
            timestamp: new Date(),
            gameData: {
              questionId: data.gameId,
              question: data.question.question,
              options: [],
              userResponse: data.yourResponse,
              partnerResponse: data.theirResponse,
              gameId: data.gameId,
              sameAnswer: data.sameAnswer
            }
          };
          
          // Remover mensagens de espera antes de adicionar o resultado
          setMessages(prev => {
            const filteredMessages = prev.filter(m => 
              !(m.type === 'break_ice_waiting' && m.gameData?.gameId === data.gameId)
            );
            return [...filteredMessages, revealMessage];
          });
          setActiveGame(null);
          
          // Trigger animations based on answer type
          if (data.sameAnswer) {
            setShowIceAnimation(true);
            setTimeout(() => setShowIceAnimation(false), 5000); // 5 seconds total
          } else {
            setShowSparkAnimation(true);
            setTimeout(() => setShowSparkAnimation(false), 3000); // 3 seconds
          }
          break;
          
        case 'break_ice_ignored':
          // Parceiro ignorou o jogo - desativar pergunta ativa
          const ignoreMessage: ChatMessage = {
            id: `partner_ignore_${Date.now()}`,
            senderId: 0,
            content: "Your partner decided to not break the ice 😔",
            type: 'text',
            timestamp: new Date()
          };
          
          // Marcar a pergunta como ignorada nas mensagens
          setMessages(prev => prev.map(msg => {
            if (msg.gameData?.gameId === data.gameId && msg.type === 'break_ice_question') {
              return {
                ...msg,
                gameData: {
                  ...msg.gameData,
                  userResponse: 'IGNORED_BY_PARTNER'
                } as any
              };
            }
            return msg;
          }));
          
          setMessages(prev => [...prev, ignoreMessage]);
          setActiveGame(null);
          break;
          
        case 'chat_skipped':
          setChatState('skipped');
          break;
      }
    };

    window.addEventListener('websocket-message', handleMessage as EventListener);
    
    return () => {
      window.removeEventListener('websocket-message', handleMessage as EventListener);
    };
  }, [isConnected]);

  const handleStartChat = () => {
    if (!isConnected) return;
    
    setChatState('searching');
    sendMessage({
      type: 'join_queue',
      preferences: selectedFilter,
    });

    // Real matchmaking will be handled by the server
    // The server will send a 'chat_matched' event when a real user is found
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentSessionId) return;

    const messageContent = messageInput;
    setMessageInput(''); // Clear input immediately
    
    // Send via WebSocket - don't add to local messages yet
    sendMessage({
      type: 'random_message',
      sessionId: currentSessionId,
      content: messageContent,
      messageType: 'text',
    });
  };

  const handleSkipChat = () => {
    if (!currentSessionId) return;
    
    sendMessage({
      type: 'skip_chat',
      sessionId: currentSessionId,
    });
    
    // User who skips goes directly to searching state
    setChatState('searching');
    setCurrentSessionId(null);
    setPartnerId(null);
    setPartnerInfo(null);
    setMessages([]);
    
    // Auto-join queue again
    sendMessage({
      type: 'join_queue',
      preferences: selectedFilter,
    });
  };

  const handleAddFriend = async () => {
    if (!partnerId) return;
    
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: currentUser.id,
          addresseeId: partnerId,
        }),
      });
      
      if (response.ok) {
        // Request sent successfully
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleBreakTheIce = () => {
    if (activeGame) return; // Só um jogo ativo de cada vez
    
    const question = getRandomQuestion();
    const gameId = `game_${Date.now()}_${currentUser.id}`;
    
    setActiveGame(gameId);
    
    const gameMessage: ChatMessage = {
      id: `break_ice_${Date.now()}`,
      senderId: 0, // Sistema
      content: question.question,
      type: 'break_ice_question',
      timestamp: new Date(),
      gameData: {
        questionId: question.id,
        question: question.question,
        options: question.options,
        gameId: gameId,
        sameAnswer: undefined
      }
    };
    
    setMessages(prev => [...prev, gameMessage]);
    
    // Enviar para o parceiro via WebSocket
    sendMessage({
      type: 'break_ice_start',
      sessionId: currentSessionId,
      gameId: gameId,
      question: question,
      initiatorId: currentUser.id
    });
  };

  const handleGameResponse = (gameId: string, response: string) => {
    const gameMessage = messages.find(m => 
      m.type === 'break_ice_question' && 
      m.gameData?.gameId === gameId
    );
    
    if (!gameMessage || !gameMessage.gameData) return;
    
    // Atualizar a mensagem com a resposta do utilizador
    setMessages(prev => prev.map(msg => {
      if (msg.id === gameMessage.id) {
        return {
          ...msg,
          gameData: {
            ...msg.gameData!,
            userResponse: response
          }
        };
      }
      return msg;
    }));
    
    // Apenas adicionar mensagem de espera se não recebermos notificação que o parceiro já respondeu
    // Esta mensagem será substituída automaticamente pelos resultados se ambos já tiverem respondido
    setTimeout(() => {
      setMessages(prev => {
        const hasResults = prev.some(m => m.type === 'break_ice_reveal' && m.gameData?.gameId === gameId);
        if (!hasResults && gameMessage.gameData) {
          const waitingMessage: ChatMessage = {
            id: `waiting_${Date.now()}`,
            senderId: 0,
            content: "Waiting response from your chat partner... 🧊",
            type: 'break_ice_waiting',
            timestamp: new Date(),
            gameData: {
              questionId: gameMessage.gameData.questionId,
              question: gameMessage.gameData.question,
              options: gameMessage.gameData.options,
              userResponse: response,
              gameId: gameId,
              sameAnswer: undefined
            }
          };
          return [...prev, waitingMessage];
        }
        return prev;
      });
    }, 100); // Small delay to allow for instant results
    
    // Enviar resposta via WebSocket
    sendMessage({
      type: 'break_ice_response',
      sessionId: currentSessionId,
      gameId: gameId,
      response: response,
      userId: currentUser.id
    });
  };

  const handleIgnoreGame = (gameId: string) => {
    setActiveGame(null);
    
    const ignoreMessage: ChatMessage = {
      id: `ignore_${Date.now()}`,
      senderId: 0,
      content: "You decided to not break the ice 😅",
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, ignoreMessage]);
    
    sendMessage({
      type: 'break_ice_ignore',
      sessionId: currentSessionId,
      gameId: gameId,
      userId: currentUser.id
    });
  };

  const handleNewChat = () => {
    setChatState('initial');
    setCurrentSessionId(null);
    setPartnerId(null);
    setPartnerInfo(null);
    setMessages([]);
  };

  const FilterButton = ({ filter, label }: { filter: typeof selectedFilter; label: string }) => {
    const getIcon = () => {
      switch (filter) {
        case 'male':
          return <span className="text-sm">♂️</span>;
        case 'female':
          return <span className="text-sm">♀️</span>;
        case 'both':
          return <Users className="w-4 h-4" />;
        default:
          return null;
      }
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedFilter(filter)}
        className={`flex-1 px-2 py-2 rounded-lg font-medium transition-all duration-300 border text-xs flex flex-col items-center gap-1 ${
          selectedFilter === filter
            ? 'bg-gradient-to-r from-purple-500/80 to-cyan-500/80 text-white border-purple-400/50 shadow-lg backdrop-blur-sm'
            : 'bg-slate-800/60 text-gray-300 hover:bg-slate-700/60 border-slate-600/50 hover:border-purple-400/30 backdrop-blur-sm'
        }`}
      >
        {getIcon()}
        <span className="text-[10px] leading-tight">{label}</span>
      </motion.button>
    );
  };

  if (chatState === 'initial') {
    return (
      <div className="flex-1 p-3 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/70 via-purple-900/20 to-slate-900/70 backdrop-blur-sm min-h-0">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center w-full max-w-xs mx-auto"
        >
          <motion.div 
            className="w-12 h-12 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl"
            animate={{ 
              boxShadow: [
                "0 0 15px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(147, 51, 234, 0.4)",
                "0 0 15px rgba(236, 72, 153, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.4)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Users className="w-6 h-6 text-white" />
          </motion.div>
          
          <h2 className="text-lg font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Ready to chat?
          </h2>
          <p className="text-gray-400 mb-4 text-xs leading-relaxed px-2">
            Choose your preferences and find someone interesting to chat with.
          </p>
          
          {/* Filters */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 text-gray-300">Looking to chat with:</label>
            <div className="grid grid-cols-3 gap-2">
              <FilterButton filter="both" label="Both" />
              <FilterButton filter="male" label="Man" />
              <FilterButton filter="female" label="Woman" />
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={handleStartChat} 
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg border-0 transition-all duration-300 text-sm"
              disabled={!isConnected}
            >
              {!isConnected ? 'Connecting...' : 'Find Conversation'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (chatState === 'searching') {
    return (
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/50 to-gray-800/50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm sm:max-w-md w-full"
        >
          <motion.div 
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl"
            animate={{ 
              rotate: 360,
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.5)",
                "0 0 30px rgba(147, 51, 234, 0.5)",
                "0 0 20px rgba(34, 211, 238, 0.5)",
                "0 0 30px rgba(59, 130, 246, 0.5)"
              ]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 3, repeat: Infinity }
            }}
          >
            <Loader className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>
          
          <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Looking for someone...
          </h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base leading-relaxed">
            Please wait while we find the perfect person to chat with.
          </p>
          
          <motion.div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => {
                  sendMessage({ type: 'leave_queue' });
                  setChatState('initial');
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-slate-700/80 to-slate-800/80 hover:from-slate-600/80 hover:to-slate-700/80 text-white border border-slate-500/50 hover:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (chatState === 'skipped') {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="bg-red-500/20 p-8 rounded-2xl border border-red-500/30">
            <h2 className="text-2xl font-bold mb-4 text-red-300">Chat Ended</h2>
            <p className="text-gray-300 mb-6">Your chat partner skipped this conversation</p>
            
            <div className="flex flex-col space-y-3">
              <Button onClick={handleAddFriend} className="bg-green-500 hover:bg-green-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Send Friend Request
              </Button>
              <Button onClick={handleNewChat} className="btn-primary">
                New Conversation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-slate-900/40 via-purple-900/10 to-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col min-h-0 p-2 sm:p-4"
      >
        <div className="bg-gradient-to-br from-slate-800/80 via-purple-900/20 to-slate-800/80 backdrop-blur-xl rounded-2xl flex flex-col flex-1 min-h-0 shadow-2xl border border-purple-500/20">
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-purple-500/30 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-700/60 via-purple-800/30 to-slate-700/60 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {partnerInfo?.avatar ? (
                  <img 
                    src={partnerInfo.avatar} 
                    alt="Partner Avatar" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-green-400/50"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-green-400/50">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {partnerInfo?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-white text-sm sm:text-base truncate block">
                  {partnerInfo?.username || 'Connected User'}
                </span>
                <span className="text-xs text-green-400 font-medium">Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBreakTheIce}
                disabled={!!activeGame}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  activeGame 
                    ? 'text-gray-500 cursor-not-allowed bg-gray-700/30' 
                    : 'text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 bg-cyan-500/10'
                }`}
                title="Break the Ice"
              >
                <Snowflake className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddFriend}
                className="p-2 sm:p-3 rounded-xl transition-all duration-300 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 bg-purple-500/10"
                title="Add Friend"
              >
                <UserPlus className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSkipChat}
                className="p-2 sm:p-3 rounded-xl transition-all duration-300 text-red-400 hover:bg-red-500/20 hover:text-red-300 bg-red-500/10"
                title="Pular Conversa"
              >
                <SkipForward className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 min-h-0">
            <div className="space-y-3">
              {messages.map((message) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start space-x-3 ${
                    message.senderId === currentUser.id ? 'justify-end' : ''
                  }`}
                >
                  {/* Avatar para mensagens não do utilizador */}
                  {message.senderId !== currentUser.id && message.senderId !== 0 && (
                    partnerInfo?.avatar ? (
                      <img 
                        src={partnerInfo.avatar} 
                        alt="Partner Avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {partnerInfo?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )
                  )}
                  
                  {/* Ícone de sistema para mensagens do jogo */}
                  {message.senderId === 0 && (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Snowflake className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Renderizar mensagem baseada no tipo */}
                  {message.type === 'break_ice_question' && message.gameData ? (
                    <div className="bg-blue-500/20 border border-blue-500/30 p-2 sm:p-3 rounded-xl max-w-[280px] sm:max-w-md">
                      <h4 className="font-medium text-blue-300 mb-2 text-xs sm:text-sm">{message.gameData.question}</h4>
                      {!message.gameData.userResponse ? (
                        <div className="space-y-1.5">
                          {message.gameData.options.map((option, index) => (
                            <Button
                              key={index}
                              onClick={() => handleGameResponse(message.gameData!.gameId, option)}
                              variant="outline"
                              size="sm"
                              className="w-full text-left justify-start bg-transparent border-blue-500/50 text-white hover:bg-blue-500/20 text-xs sm:text-sm py-1.5 h-auto min-h-0"
                            >
                              <span className="truncate">{option}</span>
                            </Button>
                          ))}
                          <Button
                            onClick={() => handleIgnoreGame(message.gameData!.gameId)}
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 bg-transparent border-gray-500/50 text-gray-400 hover:bg-gray-500/20 text-xs py-1.5 h-auto"
                          >
                            Ignore
                          </Button>
                        </div>
                      ) : message.gameData.userResponse === 'IGNORED_BY_PARTNER' ? (
                        <div className="text-center p-2 bg-gray-500/10 rounded-lg">
                          <p className="text-gray-400 font-medium text-xs sm:text-sm">Game cancelled by partner</p>
                          <p className="text-xs text-gray-500 mt-1">You can no longer respond</p>
                        </div>
                      ) : (
                        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                          <p className="text-blue-300 font-medium text-xs sm:text-sm">You answered: {message.gameData.userResponse}</p>
                          <p className="text-xs text-blue-400 mt-1">Game ended</p>
                        </div>
                      )}
                    </div>
                  ) : message.type === 'break_ice_waiting' ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-2 sm:p-3 rounded-xl max-w-[280px] sm:max-w-xs">
                      <p className="text-xs sm:text-sm text-blue-300">{message.content}</p>
                      {message.gameData?.userResponse && (
                        <p className="text-xs text-blue-400 mt-1">
                          Your answer: {message.gameData.userResponse}
                        </p>
                      )}
                    </div>
                  ) : message.type === 'break_ice_reveal' ? (
                    <div className={`border p-2 sm:p-3 rounded-xl max-w-[280px] sm:max-w-md ${
                      message.gameData?.sameAnswer 
                        ? 'bg-green-500/20 border-green-500/30' 
                        : 'bg-purple-500/20 border-purple-500/30'
                    }`}>
                      <div className="text-center mb-2">
                        {message.gameData?.sameAnswer ? (
                          // Respostas iguais - celebração
                          <div>
                            <div className="text-2xl sm:text-3xl mb-1 animate-bounce">🎉</div>
                            <p className="text-green-300 font-medium text-xs sm:text-sm">🧊 The ice is broken!</p>
                            <p className="text-xs text-green-400 mt-1">You think alike! 💚</p>
                          </div>
                        ) : (
                          // Respostas diferentes - plot twist divertido
                          <div>
                            <div className="text-2xl sm:text-3xl mb-1">🎭</div>
                            <p className="text-purple-300 font-medium text-xs sm:text-sm">🧊 Plot twist!</p>
                            <p className="text-xs text-purple-400 mt-1">Opposites attract! ⚡</p>
                          </div>
                        )}
                      </div>
                      {message.gameData && (
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          <div className={`p-1.5 sm:p-2 rounded ${
                            message.gameData.sameAnswer 
                              ? 'bg-green-500/10' 
                              : 'bg-blue-500/10'
                          }`}>
                            <p className="truncate"><strong>You:</strong> {message.gameData.userResponse}</p>
                          </div>
                          <div className={`p-1.5 sm:p-2 rounded ${
                            message.gameData.sameAnswer 
                              ? 'bg-green-500/10' 
                              : 'bg-red-500/10'
                          }`}>
                            <p className="truncate"><strong>Partner:</strong> {message.gameData.partnerResponse}</p>
                          </div>
                          {message.gameData.sameAnswer ? (
                            <p className="text-center text-xs text-green-400 mt-1">
                              ✨ Perfect connection! ✨
                            </p>
                          ) : (
                            <p className="text-center text-xs text-purple-400 mt-1">
                              🔥 Interesting differences! 🔥
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-3 rounded-2xl max-w-xs chat-bubble ${
                      message.senderId === currentUser.id 
                        ? 'bg-gradient-to-r from-purple-500/80 to-indigo-500/80 backdrop-blur-sm border border-purple-400/30 rounded-tr-md' 
                        : message.senderId === 0
                        ? 'bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm'
                        : 'bg-slate-700/80 backdrop-blur-sm border border-slate-500/30 rounded-tl-md'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  {/* Avatar do utilizador */}
                  {message.senderId === currentUser.id && (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {currentUser.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Message Input */}
          <div className="p-3 sm:p-4 border-t border-purple-500/30 flex-shrink-0 bg-gradient-to-r from-slate-800/60 via-purple-800/20 to-slate-800/60 rounded-b-2xl">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-slate-800/90 backdrop-blur-xl rounded-xl border border-purple-500/30"
              >
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 text-xl">
                  {['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤝', '👋', '🙏'].map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setMessageInput(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 hover:bg-gray-600/50 rounded-lg transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 sm:p-3 hover:bg-purple-500/20 rounded-xl transition-colors text-purple-400 hidden sm:block"
              >
                <Image className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  showEmojiPicker 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'hover:bg-yellow-500/20 text-yellow-400'
                }`}
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Write your message..."
                className="flex-1 bg-gray-800/50 border-gray-600/50 rounded-xl px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all duration-300"
              />
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 p-2 sm:p-3 rounded-xl transition-all duration-300 border-0 shadow-lg"
                  disabled={!messageInput.trim()}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ice Melting Animation - Same Answers */}
      {showIceAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20">
          <div className="ice-cube-container">
            <div className="ice-cube">
              🧊
            </div>
            <div className="water-drops"></div>
            <div className="wet-screen"></div>
          </div>
        </div>
      )}

      {/* Spark Animation - Different Answers */}
      {showSparkAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="sparks-container">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`spark spark-${i + 1}`}>
                ⚡
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
