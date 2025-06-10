import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Menu, X, Users, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  onProfileClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = memo(function Sidebar({ user: propUser, onProfileClick, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user || propUser);
  const isMobile = useIsMobile();
  
  const { data: friends = [] } = useQuery<User[]>({
    queryKey: [`/api/friends/${currentUser.id}`],
    staleTime: 5 * 60 * 1000, // 5 minutes to prevent unnecessary refetches
  });

  // Listen ONLY for profile updates - ignore all other WebSocket events
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      // Only update if it's actually different to prevent unnecessary re-renders
      const newUser = event.detail;
      setCurrentUser(prevUser => {
        if (prevUser.id === newUser.id && 
            prevUser.username === newUser.username && 
            prevUser.avatar === newUser.avatar &&
            prevUser.isOnline === newUser.isOnline) {
          return prevUser; // No change, return same object
        }
        return newUser;
      });
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  // Update currentUser when auth user changes (but only if actually different)
  useEffect(() => {
    if (user && user.id !== currentUser.id) {
      setCurrentUser(user);
    }
  }, [user?.id, currentUser.id]); // Only depend on ID changes

  // Mobile overlay backdrop
  const MobileBackdrop = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
      onClick={onToggleCollapse}
    />
  );

  // Sidebar content
  const SidebarContent = () => (
    <motion.div
      {...(isMobile && {
        initial: { x: -300 },
        animate: { x: 0 },
        exit: { x: -300 },
        transition: { type: "spring", damping: 25, stiffness: 200 }
      })}
      className={`
        ${isMobile ? 'fixed left-0 top-0 bottom-0 z-50' : 'relative'}
        ${isCollapsed && !isMobile ? 'w-20' : isMobile ? 'w-80' : 'w-80'}
        bg-gradient-to-b from-slate-900/90 via-purple-900/30 to-slate-900/90 
        border-r border-purple-500/30 flex flex-col
        shadow-2xl backdrop-blur-xl
      `}
    >
      {/* Header with toggle */}
      <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                ChatWave
              </span>
            </motion.div>
          )}
          
          {onToggleCollapse && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleCollapse}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobile ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : isCollapsed ? (
                <Menu className="w-5 h-5 text-gray-300" />
              ) : (
                <X className="w-5 h-5 text-gray-300" />
              )}
            </motion.button>
          )}
        </div>
      </div>
      {/* User Profile */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-b border-indigo-500/30 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20`}>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={`flex items-center cursor-pointer hover:bg-white/10 p-3 rounded-xl transition-all duration-300 ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}
          onClick={onProfileClick}
        >
          <div className="relative">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt="Foto de perfil" 
                className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover ring-2 ring-cyan-500/50`}
              />
            ) : (
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-cyan-500/50`}>
                <span className="text-white font-bold text-lg">
                  {currentUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
              currentUser.isOnline ? 'bg-green-400' : 'bg-gray-500'
            }`}></div>
          </div>
          
          {!isCollapsed && (
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="font-bold text-white">{currentUser.username}</h3>
              <p className={`text-sm ${currentUser.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                {currentUser.isOnline ? "Online" : "Offline"}
              </p>
            </motion.div>
          )}
          
          {!isCollapsed && <Settings className="w-5 h-5 text-gray-400 hover:text-cyan-400 transition-colors" />}
        </motion.div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Friends</h3>
              </div>
              <span className="text-sm text-gray-400 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 px-3 py-1 rounded-full border border-purple-500/30">
                {friends.length}
              </span>
            </div>
          </motion.div>
        )}
        
        <div className={`space-y-2 ${isCollapsed ? 'p-2' : 'px-4 pb-4'} min-h-0`}>
          {friends.length === 0 ? (
            !isCollapsed && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400 text-sm text-center py-8 leading-relaxed"
              >
                No friends yet.<br />
                Start chatting to make new friends!
              </motion.p>
            )
          ) : (
            friends.map((friend: User, index) => (
              <motion.div 
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`flex items-center cursor-pointer hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 ${
                  isCollapsed ? 'p-2 justify-center' : 'space-x-3 p-3'
                }`}
              >
                <div className="relative">
                  {friend.avatar ? (
                    <img 
                      src={friend.avatar} 
                      alt="Avatar do amigo" 
                      className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover ring-2 ${
                        friend.isOnline ? 'ring-green-400/50' : 'ring-gray-500/50'
                      }`}
                    />
                  ) : (
                    <div className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center ring-2 ${
                      friend.isOnline ? 'ring-green-400/50' : 'ring-gray-500/50'
                    }`}>
                      <span className="text-white font-bold text-sm">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                    friend.isOnline ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                </div>
                
                {!isCollapsed && (
                  <motion.div 
                    className="flex-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <h4 className="font-semibold text-white">{friend.username}</h4>
                    <p className={`text-sm ${friend.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                      {friend.isOnline ? "Online" : "Offline"}
                    </p>
                  </motion.div>
                )}
                
                {!isCollapsed && friend.isOnline && (
                  <motion.div 
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && !isCollapsed && <MobileBackdrop />}
      </AnimatePresence>
      
      <AnimatePresence>
        {(!isMobile || !isCollapsed) && <SidebarContent />}
      </AnimatePresence>
    </>
  );
});

export default Sidebar;
