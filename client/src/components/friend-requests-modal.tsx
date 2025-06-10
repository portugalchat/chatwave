import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Friendship } from "@shared/schema";

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export default function FriendRequestsModal({ isOpen, onClose, userId }: FriendRequestsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friendRequests = [] } = useQuery<Friendship[]>({
    queryKey: [`/api/friends/requests/${userId}`],
    enabled: isOpen,
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/friends/request/${requestId}`, { status });
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/friends/requests/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/friends/${userId}`] });
      toast({
        title: status === "accepted" ? "Request accepted" : "Request declined",
        description: status === "accepted" 
          ? "User has been added to your friends." 
          : "Request has been declined.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not respond to request. Please try again.",
      });
    },
  });

  const handleAccept = (requestId: number) => {
    respondToRequestMutation.mutate({ requestId, status: "accepted" });
  };

  const handleDecline = (requestId: number) => {
    respondToRequestMutation.mutate({ requestId, status: "declined" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md" aria-describedby="friend-requests-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Friend Requests</DialogTitle>
        </DialogHeader>
        <div id="friend-requests-description" className="sr-only">
          Manage pending friend requests. You can accept or decline each request.
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-h-96 overflow-y-auto"
        >
          {friendRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No pending friend requests.
            </p>
          ) : (
            friendRequests.map((request: Friendship) => (
              <motion.div 
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-3 bg-gray-700 rounded-xl"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    U
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Utilizador #{request.requesterId}</h4>
                  <p className="text-sm text-gray-400">Wants to be your friend</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAccept(request.id)}
                    disabled={respondToRequestMutation.isPending}
                    className="bg-green-500 hover:bg-green-600 p-2 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDecline(request.id)}
                    disabled={respondToRequestMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
