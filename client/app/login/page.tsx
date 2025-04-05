'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, ArrowLeft, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      if (!data.token) {
        throw new Error('No authentication token received');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
      setTimeout(() => router.push('/input'), 1500);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.main
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Gradient Background */}
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? "bg-gradient-to-br from-purple-900/30 via-gray-900 to-blue-900/30"
          : "bg-gradient-to-br from-purple-100/30 via-gray-50 to-blue-100/30"
      }`}>
        <motion.div 
          className="absolute inset-0 bg-[length:100px_100px] opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${
              isDarkMode ? "#fff" : "#000"
            } 10%, transparent 20%)`,
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
                ? "bg-gradient-to-r from-purple-400 to-blue-400"
                : "bg-gradient-to-r from-purple-200 to-blue-200"
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

      {/* Back Button */}
      <motion.button
        onClick={() => router.back()}
        className={`absolute top-6 left-6 p-2 rounded-full z-50 ${
          isDarkMode ? 'text-purple-400 hover:bg-purple-900/50' : 'text-purple-600 hover:bg-purple-100'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft size={24} />
      </motion.button>

      {/* Theme Toggle */}
      <motion.button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full z-50 ${
          isDarkMode 
            ? "bg-purple-600 hover:bg-purple-700" 
            : "bg-yellow-400 hover:bg-yellow-500"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDarkMode ? (
          <Moon className="w-6 h-6 text-white" />
        ) : (
          <Sun className="w-6 h-6 text-gray-900" />
        )}
      </motion.button>

      {/* Login Card */}
      <motion.div
        className={`relative backdrop-blur-xl rounded-3xl p-8 w-full max-w-md mx-4 ${
          isDarkMode
            ? 'bg-gray-900/50 border border-purple-500/20 shadow-xl shadow-purple-900/20'
            : 'bg-white/80 border border-purple-600/20 shadow-xl shadow-purple-200/20'
        }`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className={`p-4 rounded-2xl mb-4 ${
              isDarkMode
                ? "bg-gradient-to-r from-purple-500 to-blue-500"
                : "bg-gradient-to-r from-purple-400 to-blue-400"
            }`}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className={`w-8 h-8 ${
              isDarkMode ? 'text-white' : 'text-gray-100'
            }`} />
          </motion.div>
          <h1 className={`text-3xl font-bold bg-clip-text text-transparent ${
            isDarkMode
              ? "bg-gradient-to-r from-purple-300 to-blue-300"
              : "bg-gradient-to-r from-purple-600 to-blue-600"
          }`}>
            Welcome Back
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Continue your learning journey
          </p>
        </motion.div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Email Field */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Email Address
          </label>
          <div className={`relative flex items-center rounded-xl transition-all ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700/50 focus-within:border-purple-500/50 focus-within:ring-purple-500/30'
              : 'bg-white/80 border-gray-300/50 focus-within:border-purple-600/50 focus-within:ring-purple-600/30'
          } border`}>
            <Mail className={`absolute left-4 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none"
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Password
          </label>
          <div className={`relative flex items-center rounded-xl transition-all ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700/50 focus-within:border-purple-500/50 focus-within:ring-purple-500/30'
              : 'bg-white/80 border-gray-300/50 focus-within:border-purple-600/50 focus-within:ring-purple-600/30'
          } border`}>
            <Lock className={`absolute left-4 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-semibold relative overflow-hidden ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gradient-to-r from-purple-400 to-blue-400 text-gray-900'
            } ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
                Authenticating...
              </div>
            ) : (
              <>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-700/30 to-blue-700/30 opacity-0 group-hover:opacity-100 transition duration-300" />
                Login
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Message Display */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center text-sm font-medium mt-4 ${
              message.type === 'error' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </form>
    </motion.div>
  </motion.main>
);
}