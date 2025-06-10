import { motion } from "framer-motion";
import { UserPlus, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChatSession, User } from "@shared/schema";

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

interface EnrichedChatSession extends ChatSession {
  partnerInfo?: {
    id: number;
    username: string;
    avatar: string | null;
  };
  isAlreadyFriends?: boolean;
}

export default function ChatHistoryModal({ isOpen, onClose, userId }: ChatHistoryModalProps) {
  const { toast } = useToast();

  const { data: chatHistory = [] } = useQuery<ChatSession[]>({
    queryKey: [`/api/chat-history/${userId}`],
    enabled: isOpen,
  });

  const { data: friends = [] } = useQuery({
    queryKey: [`/api/friends/${userId}`],
    enabled: isOpen,
  });

  // Enrich chat history with partner info and friendship status
  const { data: enrichedChatHistory = [] } = useQuery<EnrichedChatSession[]>({
    queryKey: [`/api/chat-history-enriched/${userId}`],
    enabled: isOpen && chatHistory.length > 0,
    queryFn: async () => {
      const enrichedSessions = await Promise.all(
        chatHistory.map(async (session: ChatSession) => {
          const partnerId = session.user1Id === userId ? session.user2Id : session.user1Id;
          
          try {
            // Get partner info
            const partnerResponse = await apiRequest("GET", `/api/user/${partnerId}`);
            const partnerInfo = await partnerResponse.json();
            
            // Check if already friends
            const isAlreadyFriends = friends.some((friend: any) => friend.id === partnerId);
            
            return {
              ...session,
              partnerInfo: {
                id: partnerInfo.id,
                username: partnerInfo.username,
                avatar: partnerInfo.avatar
              },
              isAlreadyFriends
            };
          } catch (error) {
            console.error('Error fetching partner info:', error);
            return {
              ...session,
              partnerInfo: {
                id: partnerId!,
                username: 'Unknown User',
                avatar: null
              },
              isAlreadyFriends: false
            };
          }
        })
      );
      
      return enrichedSessions;
    },
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (addresseeId: number) => {
      const response = await apiRequest("POST", "/api/friends/request", {
        requesterId: userId,
        addresseeId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your request was sent successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send friend request.",
      });
    },
  });

  const handleSendFriendRequest = (partnerId: number) => {
    sendFriendRequestMutation.mutate(partnerId);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'A few minutes ago';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md" aria-describedby="chat-history-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chat History</DialogTitle>
        </DialogHeader>
        <div id="chat-history-description" className="sr-only">
          View history of your recent random conversations and send friend requests.
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 max-h-96 overflow-y-auto"
        >
          {enrichedChatHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No random conversations yet.
            </p>
          ) : (
            enrichedChatHistory.map((session: EnrichedChatSession, index: number) => {
              return (
                <motion.div 
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-xl cursor-pointer transition-colors"
                >
                  {/* Partner Avatar */}
                  {session.partnerInfo?.avatar ? (
                    <img 
                      src={session.partnerInfo.avatar} 
                      alt="Partner Avatar" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {session.partnerInfo?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  
                  {/* Session Info */}
                  <div className="flex-1">
                    <h4 className="font-medium">
                      Conversation with {session.partnerInfo?.username || 'Unknown User'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {session.createdAt ? formatTimeAgo(session.createdAt) : 'Recent'}
                    </p>
                  </div>
                  
                  {/* Friend Request Button or Status */}
                  {session.isAlreadyFriends ? (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-600 rounded-lg">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Already friends</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSendFriendRequest(session.partnerInfo!.id)}
                      disabled={sendFriendRequestMutation.isPending}
                      className="bg-purple-500 hover:bg-purple-600 p-2 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
