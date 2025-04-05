"use client";

import { Sparkles, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface NavBarLandingProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

function NavBarLanding({ isDarkMode, toggleTheme }: NavBarLandingProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              className="relative flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-75 blur-sm"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0.9, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <div className="relative flex items-center bg-black/50 rounded-full p-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="ml-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  IntellectAI
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Right Side - Only Theme Toggle */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-full transition-colors duration-300 flex items-center justify-center ${
                isDarkMode
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-yellow-400 hover:bg-yellow-500"
              }`}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <Moon className="w-6 h-6 text-white" />
              ) : (
                <Sun className="w-6 h-6 text-gray-900" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBarLanding;