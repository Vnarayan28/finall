'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, ArrowLeft, Lock, Mail, Loader2, Zap } from 'lucide-react'; // Added Zap for consistency if needed
// Assuming AnimatedGradientBg is in components folder
import AnimatedGradientBg from '../components/AnimatedGradientBg'; 
// Assuming NavBarLanding is in the same folder or adjust path
import NavBarLanding from '../NavBarLanding'; // If you want the full navbar

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:8000/login', { // Ensure this URL is correct for your environment
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      if (!data.token) {
        throw new Error('Authentication error. No token received.');
      }
      localStorage.setItem('authToken', data.token);
      setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
      setTimeout(() => router.push('/input'), 1500); // Adjust redirect path
    } catch (err: any) {
      setMessage({ text: err.message || 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4, ease: "easeInOut" } },
  };
  
  const cardItemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.2 } },
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4 selection:bg-pink-500 selection:text-white ${isDarkMode ? "dark" : ""}`}>
      <AnimatedGradientBg isDarkMode={isDarkMode} />
      
      {/* Standalone Theme Toggle & Back Button (if not using full NavBarLanding) */}
      <div className="fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => router.back()}
          className={`p-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md
                        ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white' 
                                     : 'bg-gray-200/70 hover:bg-gray-300/90 text-gray-700 hover:text-black'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity:0, x: -20}}
          animate={{ opacity:1, x: 0}}
          transition={{delay: 0.3}}
        >
          <ArrowLeft size={22} />
        </motion.button>
      </div>
      <div className="fixed top-4 right-4 z-50">
          <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1, rotate: isDarkMode ? 15 : -15 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md
                          ${isDarkMode 
                            ? "bg-gray-700/50 hover:bg-gray-600/70 text-yellow-400" 
                            : "bg-gray-200/70 hover:bg-gray-300/90 text-purple-600"}`}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              initial={{ opacity:0, x: 20}}
              animate={{ opacity:1, x: 0}}
              transition={{delay: 0.3}}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>
      </div>

      {/* Login Card */}
      <motion.div
        className={`relative w-full max-w-md rounded-3xl p-8 sm:p-10 
                   border ${isDarkMode 
                      ? 'bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/10' 
                      : 'bg-white/60 border-black/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/5'
                    }`}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div 
          className="flex flex-col items-center mb-8"
          variants={cardItemVariants} // Stagger children if needed, or apply directly
        >
          <motion.div
            className={`p-3.5 rounded-xl mb-5 shadow-lg
              bg-gradient-to-br ${isDarkMode 
                ? "from-purple-600 via-pink-500 to-orange-500" 
                : "from-purple-500 via-pink-500 to-orange-400"}`}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease:"easeInOut" }}
          >
            <Zap className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className={`font-heading text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
            Welcome Back
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to access your IntellectAI dashboard.
          </p>
        </motion.div>

        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div variants={cardItemVariants}>
            <label htmlFor="email" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <div className={`relative group`}>
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none 
                               ${isDarkMode ? 'text-gray-500 group-focus-within:text-purple-400' : 'text-gray-400 group-focus-within:text-purple-600'}`} size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-3 py-3 rounded-lg outline-none transition-all duration-300
                            border ${isDarkMode 
                              ? 'bg-gray-800/70 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                              : 'bg-gray-100/70 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'}`}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </motion.div>

          <motion.div variants={cardItemVariants}>
            <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative group">
               <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none
                                ${isDarkMode ? 'text-gray-500 group-focus-within:text-purple-400' : 'text-gray-400 group-focus-within:text-purple-600'}`} size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-3 py-3 rounded-lg outline-none transition-all duration-300
                            border ${isDarkMode 
                              ? 'bg-gray-800/70 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                              : 'bg-gray-100/70 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'}`}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </motion.div>

          <motion.div variants={cardItemVariants}>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03, y: -1, boxShadow: `0px 8px 20px -5px ${isDarkMode ? 'rgba(192, 132, 252, 0.25)' : 'rgba(147, 51, 234, 0.15)'}` }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-lg font-semibold text-base relative group overflow-hidden shadow-md
                          transition-all duration-300 ease-out
                          ${isLoading ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') 
                                      : (isDarkMode ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white hover:shadow-pink-500/30' 
                                                    : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:shadow-pink-500/20')}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </div>
              ) : (
                <>
                <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/20 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-100 rounded-lg"></span>
                <span className="relative">Sign In</span>
                </>
              )}
            </motion.button>
          </motion.div>

          {message.text && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-sm font-medium pt-2 ${message.type === 'error' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-green-400' : 'text-green-600') }`}
            >
              {message.text}
            </motion.p>
          )}
        </form>

        <motion.div 
          className="mt-8 text-center"
          variants={cardItemVariants}
        >
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No account yet?{' '}
            <button 
              onClick={() => router.push('/signup')} 
              className={`font-medium hover:underline ${isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
            >
              Create one
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}