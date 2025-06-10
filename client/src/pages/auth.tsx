import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft, UserX } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const shouldOpenRegister = searchParams.get('register') === 'true';
  const [isRegisterMode, setIsRegisterMode] = useState(shouldOpenRegister);
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      navigate("/chat");
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Login error",
        description: "Invalid credentials. Please try again.",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/register", {
        email: data.email,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      navigate("/chat");
      toast({
        title: "Account created successfully",
        description: "Welcome to ChatWave!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Registration error",
        description: "Could not create account. Please try again.",
      });
    },
  });

  const anonymousMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/anonymous", {});
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      navigate("/chat");
      toast({
        title: "Anonymous session started",
        description: "You are chatting anonymously.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start anonymous session.",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleAnonymousChat = () => {
    anonymousMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <motion.button 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          onClick={() => navigate("/")}
          className="mb-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="card-glass"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-bg rounded-2xl mx-auto mb-6 flex items-center justify-center animate-glow">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold gradient-text">Welcome to ChatRandom</h2>
            <p className="text-gray-300 mt-2">
              {isRegisterMode ? "Create an account to get started" : "Sign in or create an account to get started"}
            </p>
          </div>

          {/* Login Form */}
          {!isRegisterMode && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="o.seu@email.com" 
                          className="input-primary"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="input-primary"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          )}

          {/* Register Form */}
          {isRegisterMode && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="o.seu@email.com" 
                          className="input-primary"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="input-primary"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="input-primary"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {isRegisterMode 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Create Account"
              }
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <Button 
              onClick={handleAnonymousChat}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
              disabled={anonymousMutation.isPending}
            >
              <UserX className="w-5 h-5" />
              <span>
                {anonymousMutation.isPending ? "Starting..." : "Chat Anonymously"}
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
