import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Camera, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { uploadImage, BUCKETS } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User } from "@shared/schema";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string; avatar?: string }) => {
      const response = await apiRequest("PUT", `/api/user/${user.id}`, data);
      return response.json();
    },
    onSuccess: async (updatedUser) => {
      // Fetch fresh user data from server to ensure we have the latest avatar URL
      try {
        const freshUserResponse = await apiRequest("GET", `/api/user/${user.id}`);
        const freshUserData = await freshUserResponse.json();
        
        // Update the auth store with fresh user data from server
        updateUser(freshUserData);
        
        // Update React Query cache
        queryClient.setQueryData([`/api/user/${user.id}`], { user: freshUserData });
        queryClient.invalidateQueries({ queryKey: [`/api/user/${user.id}`] });
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
        // Fallback to using the response data
        updateUser(updatedUser);
      }
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update profile. Please try again.",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({ username, avatar });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be maximum 5MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file, BUCKETS.AVATARS, user.id, 'profiles');
      setAvatar(imageUrl);
      toast({
        title: "Image uploaded",
        description: "Profile photo updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload error",
        description: "Could not upload image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800/95 via-purple-900/30 to-slate-800/95 border-purple-500/30 text-white backdrop-blur-xl" aria-describedby="profile-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Profile</DialogTitle>
        </DialogHeader>
        <div id="profile-description" className="sr-only">
          Edit your profile information, including username and profile photo.
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="relative inline-block">
              {(avatar || user.avatar) ? (
                <img 
                  src={avatar || user.avatar!} 
                  alt="Profile photo" 
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-full hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 cursor-pointer shadow-lg">
                {isUploading ? <Upload className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-primary mt-2"
                placeholder="Enter your username"
              />
            </div>
            
            {user.email && (
              <div>
                <Label>Email</Label>
                <Input
                  value={user.email}
                  disabled
                  className="input-primary mt-2 opacity-50"
                />
              </div>
            )}
            
            {user.isAnonymous && (
              <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-pink-500/20 border border-yellow-400/40 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-yellow-300 text-sm">
                  This is an anonymous account. Register to permanently save your changes.
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleSave}
              className="w-full btn-primary"
              disabled={updateProfileMutation.isPending || !username.trim()}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
