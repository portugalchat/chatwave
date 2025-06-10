import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Users, MessageCircle, Globe, Sparkles, Snowflake, Heart, Zap, Stars, ArrowRight, UserPlus, LogIn, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const chatExamples = [
    {
      id: 1,
      user1: "Sofia_Lisboa",
      user2: "Marco_Milano", 
      message: "Hello! How's the weather in Italy?",
      response: "Ciao! It's a beautiful day! And in Portugal?",
      theme: "from-blue-500 to-cyan-500",
      country1: "🇵🇹",
      country2: "🇮🇹"
    },
    {
      id: 2,
      user1: "João_Porto",
      user2: "Emma_London",
      message: "🧊 Break the Ice: What's your favorite food?",
      response: "Pizza! And you? 🍕",
      theme: "from-purple-500 to-pink-500",
      country1: "🇵🇹",
      country2: "🇬🇧",
      isBreakIce: true
    },
    {
      id: 3,
      user1: "Ana_Braga", 
      user2: "Yuki_Tokyo",
      message: "How interesting! I've never been to Japan",
      response: "You should visit! It's amazing! 🗾",
      theme: "from-emerald-500 to-teal-500",
      country1: "🇵🇹",
      country2: "🇯🇵"
    },
    {
      id: 4,
      user1: "Luis_Madrid",
      user2: "Sarah_NYC",
      message: "I love American culture!",
      response: "And I love Spain! 🇪🇸",
      theme: "from-orange-500 to-red-500",
      country1: "🇪🇸",
      country2: "🇺🇸"
    }
  ];

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Matching",
      description: "Connect with strangers worldwide in seconds. Our smart algorithm pairs you with interesting people ready to chat.",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Snowflake className="w-8 h-8" />,
      title: "Break the Ice",
      description: "Revolutionary ice-breaker games that reveal what you have in common, making conversations flow naturally.",
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Friend System",
      description: "Turn great conversations into lasting friendships. Add people you connect with and chat anytime.",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Community",
      description: "Experience cultures from around the world. Practice languages and discover new perspectives.",
      gradient: "from-green-400 to-emerald-500"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Smart Conversations",
      description: "AI-powered conversation suggestions help you keep discussions engaging and meaningful.",
      gradient: "from-indigo-400 to-purple-500"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Safe & Respectful",
      description: "Advanced moderation and reporting systems ensure a positive experience for everyone.",
      gradient: "from-rose-400 to-pink-500"
    }
  ];

  const anonymousMutation = useMutation({
    mutationFn: authApi.createAnonymousSession,
    onSuccess: (data) => {
      login(data.user);
      setLocation("/chat");
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Could not start anonymous session. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAnonymousJoin = () => {
    anonymousMutation.mutate();
  };

  useEffect(() => {
    const chatInterval = setInterval(() => {
      setCurrentChatIndex((prev) => (prev + 1) % chatExamples.length);
    }, 4000);

    const featureInterval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(featureInterval);
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Optimized Background for Better Performance */}
      <div className="fixed inset-0 will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-purple-600/15 via-cyan-600/15 to-pink-600/15" />
          <div className="absolute inset-0 opacity-15 bg-gradient-to-tl from-blue-600/10 via-indigo-600/10 to-purple-600/10" />
        </div>

        {/* Static Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />

        {/* Floating Balls - Above all background layers */}
        <div className="absolute inset-0 overflow-hidden z-50">
          <div className="floating-ball floating-ball-1" style={{ top: '5%', left: '8%' }} />
          <div className="floating-ball floating-ball-2" style={{ top: '15%', right: '12%' }} />
          <div className="floating-ball floating-ball-3" style={{ top: '65%', left: '18%' }} />
          <div className="floating-ball floating-ball-4" style={{ top: '35%', right: '25%' }} />
          <div className="floating-ball floating-ball-5" style={{ top: '85%', left: '65%' }} />
          <div className="floating-ball floating-ball-6" style={{ top: '25%', left: '75%' }} />
          <div className="floating-ball floating-ball-7" style={{ top: '55%', right: '5%' }} />
          <div className="floating-ball floating-ball-8" style={{ top: '75%', left: '40%' }} />
        </div>
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 p-6"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <motion.span 
                  className="block bg-gradient-to-r from-slate-300 via-rose-200 to-emerald-200 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundImage: [
                      "linear-gradient(45deg, #cbd5e1, #fecaca, #bbf7d0, #e9d5ff)",
                      "linear-gradient(45deg, #fed7aa, #cbd5e1, #bfdbfe, #fca5a5)", 
                      "linear-gradient(45deg, #bbf7d0, #ddd6fe, #fed7aa, #fbbf24)",
                      "linear-gradient(45deg, #bfdbfe, #bbf7d0, #cbd5e1, #c084fc)",
                      "linear-gradient(45deg, #fecaca, #e9d5ff, #bfdbfe, #fed7aa)",
                      "linear-gradient(45deg, #ddd6fe, #bbf7d0, #fca5a5, #cbd5e1)"
                    ]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ChatWave
                </motion.span>
          </motion.div>

          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 backdrop-blur-md border border-purple-400/30 text-white hover:bg-gradient-to-r hover:from-purple-500/30 hover:via-indigo-500/30 hover:to-cyan-500/30 px-6 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
              Sign In
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative z-10 px-4 py-4">
        <div className="max-w-6xl mx-auto text-center">

          {/* Centered Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 text-purple-300"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider font-medium">today is a great day to make new friends</span>
              </motion.div>

              <motion.h1 
                className="text-6xl md:text-8xl font-bold leading-none"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <motion.span 
                  className="block bg-gradient-to-r from-slate-300 via-rose-200 to-emerald-200 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundImage: [
                      "linear-gradient(45deg, #cbd5e1, #fecaca, #bbf7d0, #e9d5ff)",
                      "linear-gradient(45deg, #fed7aa, #cbd5e1, #bfdbfe, #fca5a5)", 
                      "linear-gradient(45deg, #bbf7d0, #ddd6fe, #fed7aa, #fbbf24)",
                      "linear-gradient(45deg, #bfdbfe, #bbf7d0, #cbd5e1, #c084fc)",
                      "linear-gradient(45deg, #fecaca, #e9d5ff, #bfdbfe, #fed7aa)",
                      "linear-gradient(45deg, #ddd6fe, #bbf7d0, #fca5a5, #cbd5e1)"
                    ]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ChatWave
                </motion.span>
                <motion.span 
                  className="block text-xl md:text-2xl bg-gradient-to-r from-orange-200 via-slate-300 to-green-200 bg-clip-text text-transparent font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    backgroundImage: [
                      "linear-gradient(45deg, #fed7aa, #cbd5e1, #bbf7d0, #ddd6fe)",
                      "linear-gradient(45deg, #fecaca, #fed7aa, #cbd5e1, #c084fc)", 
                      "linear-gradient(45deg, #bbf7d0, #fecaca, #e9d5ff, #fed7aa)",
                      "linear-gradient(45deg, #cbd5e1, #bbf7d0, #fca5a5, #ddd6fe)",
                      "linear-gradient(45deg, #e9d5ff, #fed7aa, #bfdbfe, #fecaca)",
                      "linear-gradient(45deg, #c084fc, #bbf7d0, #fed7aa, #cbd5e1)"
                    ]
                  }}
                  transition={{ 
                    delay: 0.8,
                    backgroundImage: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  Talk to Strangers
                </motion.span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto text-center"
              >
                Connect with real people from all over the world and make new friends! Turn awkward conversation starters into amazing ones with our revolutionary in-chat features! Be respectful and Friendly. Have fun!
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              {/* Login and Register always side by side */}
              <div className="flex gap-4">
                <Link href="/auth">
                  <Button className="group relative bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-blue-600/80 backdrop-blur-sm border border-purple-400/30 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 overflow-hidden opacity-70">
                    <span className="relative z-10 flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      Login
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-indigo-400/30 opacity-0 group-hover:opacity-50"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </Button>
                </Link>

                <Link href="/auth?register=true">
                  <Button className="group relative bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-pink-600/80 backdrop-blur-sm border border-indigo-400/30 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105 overflow-hidden opacity-70">
                    <span className="relative z-10 flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Register
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 opacity-0 group-hover:opacity-50"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </Button>
                </Link>
              </div>

              {/* Join Anonymously can wrap below on mobile */}
              <Button 
                onClick={handleAnonymousJoin}
                disabled={anonymousMutation.isPending}
                className="group relative bg-gradient-to-r from-cyan-600/80 via-blue-600/80 to-indigo-600/80 backdrop-blur-sm border border-cyan-400/30 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 transform hover:scale-105 overflow-hidden opacity-70"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  {anonymousMutation.isPending ? "Starting..." : "Join Anonymously"}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 opacity-0 group-hover:opacity-50"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </Button>
            </motion.div>
          </motion.div>

          {/* Optimized Chat Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative h-[400px] w-full max-w-4xl mx-auto mt-2"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {chatExamples.map((chat, index) => {
                const isActive = currentChatIndex === index;
                const isPrev = currentChatIndex === (index + 1) % chatExamples.length;
                const isNext = currentChatIndex === (index - 1 + chatExamples.length) % chatExamples.length;

                return (
                  <motion.div
                    key={chat.id}
                    className="absolute w-full max-w-2xl"
                    style={{ zIndex: isActive ? 10 : 1 }}
                    animate={{
                      opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                      scale: isActive ? 1 : isPrev || isNext ? 0.9 : 0.8,
                      x: isActive ? 0 : isPrev ? '-70%' : isNext ? '70%' : 0,
                    }}
                    transition={{ 
                      duration: 0.5, 
                      ease: "easeInOut"
                    }}
                  >
                    <div className={`relative bg-gradient-to-br ${chat.theme} p-1 rounded-3xl shadow-xl`}>
                      <div className="bg-gray-900 rounded-3xl p-6 space-y-4 border border-white/20">

                        {/* Chat Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <span className="text-white font-medium text-sm">{chat.user1}</span>
                            <span className="text-base">{chat.country1}</span>
                          </div>
                          <Globe className="w-4 h-4 text-gray-400" />
                        </div>

                        {/* Messages */}
                        <div className="space-y-3">
                          <div className="bg-white/15 rounded-xl p-3 ml-0 mr-8">
                            <p className="text-white text-sm leading-relaxed">{chat.message}</p>
                          </div>

                          <div className="bg-white/25 rounded-xl p-3 ml-8 mr-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-200">{chat.user2}</span>
                              <span className="text-sm">{chat.country2}</span>
                            </div>
                            <p className="text-white text-sm leading-relaxed">{chat.response}</p>
                          </div>
                        </div>

                        {/* Break the Ice Indicator */}
                        {chat.isBreakIce && isActive && (
                          <div className="flex justify-center items-center gap-2 pt-2">
                            <Snowflake className="w-4 h-4 text-cyan-400" />
                            <span className="text-cyan-300 text-xs">Break the Ice!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            
          </motion.div>
        </div>
      </div>

      {/* Gradient Line Separator */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative z-10 flex justify-center px-4 py-2"
      >
        <motion.div 
          className="h-1 w-full max-w-2xl rounded-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          animate={{ 
            backgroundImage: [
              "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
              "linear-gradient(90deg, transparent, #06b6d4, transparent)", 
              "linear-gradient(90deg, transparent, #ec4899, transparent)",
              "linear-gradient(90deg, transparent, #f59e0b, transparent)",
              "linear-gradient(90deg, transparent, #8b5cf6, transparent)"
            ]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Features Slideshow */}
      <div className="relative z-10 py-2 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center mb-6"
        >
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent mb-3">
            Futuristic Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Advanced technologies that make it easy to make friends!
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto relative h-80">
          {features.map((feature, index) => {
            const isActive = currentFeatureIndex === index;
            const isPrev = currentFeatureIndex === (index + 1) % features.length;
            const isNext = currentFeatureIndex === (index - 1 + features.length) % features.length;

            return (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: isActive ? 10 : 1 }}
                animate={{
                  opacity: isActive ? 1 : isPrev || isNext ? 0.3 : 0,
                  scale: isActive ? 1 : isPrev || isNext ? 0.8 : 0.6,
                  x: isActive ? 0 : isPrev ? '-60%' : isNext ? '60%' : 0,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className={`relative bg-gradient-to-br ${feature.gradient} p-1 rounded-3xl shadow-2xl w-full max-w-md`}>
                  <div className="bg-gray-900 rounded-3xl p-8 text-center border border-white/20">
                    <motion.div 
                      className="inline-flex p-4 rounded-2xl bg-white/10 mb-6"
                      animate={isActive ? { rotate: 360 } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </motion.div>

                    <h3 className="text-2xl font-bold text-white mb-4">
                      {feature.title}
                    </h3>

                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          
        </div>
      </div>

      {/* Break the Ice Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 py-8 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-cyan-900/30 via-blue-900/30 to-purple-900/30 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-6 overflow-hidden">
            {/* Simplified particle effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              <div className="absolute top-20 right-16 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="absolute bottom-16 left-20 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
              <div className="absolute bottom-10 right-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping animation-delay-1000"></div>
            </div>

            <div className="relative z-10 text-center">
              <div className="inline-block mb-6">
                <Snowflake className="w-16 h-16 text-cyan-400" />
              </div>

              <h3 className="text-4xl md:text-5xl font-bold text-white mb-3">
                Break the Ice
              </h3>

              <p className="text-xl text-cyan-200 mb-4 max-w-3xl mx-auto leading-relaxed">
                Our exclusive game that transforms awkward conversation starters into magical moments. 
                Discover what you have in common through fun questions with epic animations 
                and surprising interactive effects!
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 py-8 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-cyan-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative z-10">
              <motion.h3 
                className="text-4xl md:text-5xl font-bold text-white mb-3"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(255,255,255,0.5)",
                    "0 0 40px rgba(147,51,234,0.5)", 
                    "0 0 20px rgba(255,255,255,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Ready to make Friends?
              </motion.h3>

              <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
                Join thousands of people! Talk with strangers now!
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                {/* Login and Register always side by side */}
                <div className="flex gap-4">
                  <Link href="/auth">
                    <Button className="group relative bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-blue-600/80 backdrop-blur-sm border border-purple-400/30 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 overflow-hidden opacity-70">
                      <span className="relative z-10 flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Login
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-indigo-400/30 opacity-0 group-hover:opacity-50"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    </Button>
                  </Link>

                  <Link href="/auth?register=true">
                    <Button className="group relative bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-pink-600/80 backdrop-blur-sm border border-indigo-400/30 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105 overflow-hidden opacity-70">
                      <span className="relative z-10 flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Register
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 opacity-0 group-hover:opacity-50"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    </Button>
                  </Link>
                </div>

                {/* Join Anonymously can wrap below on mobile */}
                <Button 
                  onClick={handleAnonymousJoin}
                  disabled={anonymousMutation.isPending}
                  className="group relative bg-gradient-to-r from-cyan-600/80 via-blue-600/80 to-indigo-600/80 backdrop-blur-sm border border-cyan-400/30 text-white px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 transform hover:scale-105 overflow-hidden opacity-70"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <UserX className="w-5 h-5" />
                    {anonymousMutation.isPending ? "Starting..." : "Join Anonymously"}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 opacity-0 group-hover:opacity-50"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </Button>
              </motion.div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}