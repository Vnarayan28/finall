"use client";
import React, { useState } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { Sparkles, Moon, Sun, Home, User, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Input() {
  const [topic, setTopic] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { scrollY } = useScroll();
  const { push } = useRouter();

  const rotate = useTransform(scrollY, [0, 100], [0, 5]);
  const scale = useTransform(scrollY, [0, 100], [1, 1.02]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleButtonClick = async () => {
    if (!topic) return;
    try {
      push(`/research?topic=${encodeURIComponent(topic)}`);
    } catch (error) {
      console.error("Failed to navigate: ", error);
    }
  };

  return (
    <motion.main 
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
      style={{ scale }}
    >
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg ${
        isDarkMode ? "bg-gray-900/70" : "bg-white/70"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className={`flex items-center space-x-2 transition-colors duration-200 ${
                isDarkMode ? "hover:text-purple-400" : "hover:text-purple-600"
              }`}>
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>
              <Link href="/about" className={`flex items-center space-x-2 transition-colors duration-200 ${
                isDarkMode ? "hover:text-purple-400" : "hover:text-purple-600"
              }`}>
                <Info className="w-5 h-5" />
                <span className="font-medium">About</span>
              </Link>
              <Link href="/profile" className={`flex items-center space-x-2 transition-colors duration-200 ${
                isDarkMode ? "hover:text-purple-400" : "hover:text-purple-600"
              }`}>
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-3 rounded-full z-50 transition-colors duration-300 ${
          isDarkMode 
            ? "bg-purple-600 hover:bg-purple-700" 
            : "bg-yellow-400 hover:bg-yellow-500"
        }`}
      >
        {isDarkMode ? (
          <Moon className="w-6 h-6 text-white" />
        ) : (
          <Sun className="w-6 h-6 text-gray-900" />
        )}
      </button>

      {/* Rest of the existing components... */}
      {/* Dynamic Background Layers */}
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-pink-900/30"
          : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-pink-100/30"
      }`}>
        <motion.div 
          className="absolute inset-0 bg-[length:100px_100px] opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${
              isDarkMode ? "#fff" : "#000"
            } 10%, transparent 20%)`,
            y: useTransform(scrollY, [0, 300], [0, 100]),
          }}
        />
      </div>

      {/* Floating Holographic Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1.5 h-1.5 rounded-full blur-[1px] ${
              isDarkMode
                ? "bg-gradient-to-r from-purple-400 to-pink-400"
                : "bg-gradient-to-r from-purple-200 to-pink-200"
            }`}
            initial={{
              scale: 0,
              x: Math.random() * 100 - 50 + "%",
              y: Math.random() * 100 - 50 + "%",
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Animated Gradient Blobs */}
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[150px] -top-96 -left-96 ${
          isDarkMode
            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            : "bg-gradient-to-r from-purple-300/20 to-pink-300/20"
        }`}
        animate={{
          x: [-100, 100, -100],
          y: [-50, 50, -50],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[150px] -bottom-96 -right-96 ${
          isDarkMode
            ? "bg-gradient-to-l from-blue-500/20 to-cyan-500/20"
            : "bg-gradient-to-l from-blue-300/20 to-cyan-300/20"
        }`}
        animate={{
          x: [100, -100, 100],
          y: [50, -50, 50],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div 
        className="flex flex-col items-center justify-center space-y-8 p-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Link href="/" passHref>
          <motion.div 
            className="relative group"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.img
              src="../inputCreate_adapted.svg"
              alt="Create"
              className="w-32 h-32 object-contain cursor-pointer"
              style={{ rotate }}
            />
            <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 ${
              isDarkMode 
                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                : "bg-gradient-to-r from-purple-400 to-pink-400"
            }`} />
          </motion.div>
        </Link>

        <motion.h1 
          className="text-6xl font-bold text-transparent bg-clip-text relative"
          style={{
            backgroundImage: `linear-gradient(45deg, ${
              isDarkMode ? "#c084fc, #ec4899" : "#9333ea, #db2777"
            })`
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity
          }}
        >
          Teach me
          <motion.span 
            className="absolute -right-8 -top-4"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity
            }}
          >
            <Sparkles className={`w-8 h-8 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
          </motion.span>
        </motion.h1>

        <motion.div 
          className="relative w-full max-w-2xl"
          whileHover={{ scale: 1.02 }}
        >
          <input
            type="text"
            placeholder="Name a topic..."
            className={`w-full px-8 py-5 text-xl backdrop-blur-lg rounded-2xl shadow-xl border-2 transition-all duration-300 outline-none focus:ring-0 ${
              isDarkMode
                ? "bg-gray-800/50 border-gray-700/50 placeholder:text-gray-400"
                : "bg-white/80 border-gray-300/50 placeholder:text-gray-500"
            } ${
              isFocused 
                ? (isDarkMode 
                    ? "border-purple-500/50 shadow-purple-500/20" 
                    : "border-purple-600/50 shadow-purple-600/20")
                : ""
            }`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {!topic && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className={`animate-pulse ${
                isDarkMode ? "text-gray-500/60" : "text-gray-400/70"
              }`}>
                Try "Quantum Computing" or "Neural Networks"
              </span>
            </motion.div>
          )}
        </motion.div>

        <motion.button
          onClick={handleButtonClick}
          disabled={!topic}
          className={`relative overflow-hidden px-10 py-5 text-xl font-semibold flex items-center space-x-3 rounded-2xl transition-all duration-500 ${
            topic
              ? isDarkMode
                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-purple-500/30"
                : "bg-gradient-to-r from-purple-400 to-pink-400 hover:shadow-purple-400/30"
              : "cursor-not-allowed"
          } ${
            isDarkMode 
              ? "text-white" 
              : "text-gray-900"
          } ${
            !topic && (isDarkMode 
              ? "bg-gray-800/50" 
              : "bg-gray-100/50")
          }`}
          whileHover={topic ? { scale: 1.05 } : {}}
          whileTap={topic ? { scale: 0.95 } : {}}
        >
          {topic && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          )}
          <Sparkles className={`w-6 h-6 ${topic ? "animate-sparkle" : ""}`} />
          <span>Generate AI Insights</span>
        </motion.button>
      </motion.div>
    </motion.main>
  );
}