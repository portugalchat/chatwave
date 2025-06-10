import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Clock, Menu, Sparkles, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/sidebar";
import ChatWindow from "@/components/chat-window";
import ProfileModal from "@/components/profile-modal";
import FriendRequestsModal from "@/components/friend-requests-modal";
import ChatHistoryModal from "@/components/chat-history-modal";
import type { Friendship } from "@shared/schema";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showAnonymousWarning, setShowAnonymousWarning] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const { isConnected, sendMessage } = useWebSocket();

  const { data: friendRequests = [] } = useQuery<Friendship[]>({
    queryKey: [`/api/friends/requests/${user?.id}`],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  if (!user) {
    return null;
  }

  const handleConvertAnonymous = () => {
    navigate("/auth");
  };

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleProfileClick = useCallback(() => {
    setShowProfileModal(true);
  }, []);

  return (
    <div className="chat-page-container relative min-h-screen text-white flex flex-col overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div 
          className="absolute inset-0 transition-all ease-in-out"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)
            `,
            transitionDuration: '120s'
          }}
        />
        
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(45deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(219, 39, 119, 0.1) 100%)",
              "linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(219, 39, 119, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)",
              "linear-gradient(45deg, rgba(219, 39, 119, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)",
              "linear-gradient(45deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(219, 39, 119, 0.1) 100%)"
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating orbs for chat page */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="floating-ball floating-ball-1" style={{ top: '10%', left: '5%' }} />
          <div className="floating-ball floating-ball-2" style={{ top: '20%', right: '10%' }} />
          <div className="floating-ball floating-ball-3" style={{ top: '70%', left: '15%' }} />
          <div className="floating-ball floating-ball-4" style={{ top: '50%', right: '20%' }} />
          <div className="floating-ball floating-ball-5" style={{ top: '80%', left: '80%' }} />
        </div>
      </div>
      {/* Anonymous Warning Banner */}
      <AnimatePresence>
        {user.isAnonymous && showAnonymousWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="relative bg-gradient-to-r from-yellow-600/90 via-orange-500/90 to-pink-500/90 backdrop-blur-md border-b border-orange-400/30 text-black px-4 py-3 z-50 flex items-center justify-between flex-shrink-0 shadow-2xl"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Anonymous account</span>
              <span className="text-sm font-medium">
                You are using an anonymous account, register this account to save conversations and add friends permanently.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConvertAnonymous}
                className="bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm text-yellow-300 px-4 py-2 rounded-lg text-sm font-bold hover:from-gray-800/80 hover:to-gray-900/80 transition-all duration-300 shadow-lg border border-yellow-400/20"
              >
                Create account
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAnonymousWarning(false)}
                className="text-black hover:text-gray-800 transition-colors p-1"
              >
                ✕
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 relative z-10">
        <Sidebar 
          user={user} 
          onProfileClick={handleProfileClick}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Top Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-r from-slate-900/80 via-purple-900/20 to-slate-900/80 border-b border-purple-500/30 backdrop-blur-xl flex-shrink-0 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isMobile && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors lg:hidden flex-shrink-0"
                  >
                    <Menu className="w-4 h-4 text-gray-300" />
                  </motion.button>
                )}
                
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    <motion.div
                      className="absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                  </div>
                  <h1 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent truncate">
                    ChatWave
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <motion.div
                  className={`px-2 py-1 rounded-full text-xs font-medium border hidden sm:block ${
                    isConnected 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                  animate={{ scale: isConnected ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 2, repeat: isConnected ? Infinity : 0 }}
                >
                  {isConnected ? 'connected' : 'disconnected'}
                </motion.div>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFriendRequests(true)}
                  className="relative p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-gray-300 hover:text-cyan-400 transition-colors" />
                  {friendRequests.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                    >
                      {friendRequests.length}
                    </motion.span>
                  )}
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowChatHistory(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-300 hover:text-purple-400 transition-colors" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          <ChatWindow 
            user={user} 
            isConnected={isConnected}
            sendMessage={sendMessage}
          />
        </div>
      </div>

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />

      <FriendRequestsModal 
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        userId={user.id}
      />

      <ChatHistoryModal 
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        userId={user.id}
      />
    </div>
  );
}