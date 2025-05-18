"use client";

import { Zap, Moon, Sun } from "lucide-react"; // Make sure Sun and Moon are imported
import { motion } from "framer-motion";
import Link from "next/link";

interface NavBarLandingProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

function NavBarLanding({ isDarkMode, toggleTheme }: NavBarLandingProps) {
  return (
    <motion.nav 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-5xl rounded-2xl 
                 border border-white/10 bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-20 
                 shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}
    >
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <motion.div
              className="p-2.5 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-lg shadow-md group-hover:shadow-pink-500/40 transition-shadow duration-300"
              whileHover={{ scale: 1.1, rotate: -10 }}
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <span className={`font-heading text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"} group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300`}>
              IntellectAI
            </span>
          </Link>

          <div className="flex items-center">
            <motion.button
              onClick={toggleTheme} // This is the primary theme toggle
              whileHover={{ scale: 1.15, rotate: isDarkMode ? 15 : -15 }} // Adjusted rotation
              whileTap={{ scale: 0.9 }}
              className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center
                          ${isDarkMode 
                            ? "text-yellow-400 hover:bg-white/10" 
                            : "text-purple-600 hover:bg-black/5"}`}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6" />
              ) : (
                <Moon className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default NavBarLanding;