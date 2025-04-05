'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');
      
      setMessage('Login successful! Redirecting...');
      setTimeout(() => router.push('/input'), 1500);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <motion.main
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating Particles */}
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

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className={`absolute top-6 left-6 p-2 rounded-full z-50 ${
          isDarkMode ? 'text-purple-400 hover:bg-purple-900/50' : 'text-purple-600 hover:bg-purple-100'
        }`}
      >
        <ArrowLeft size={24} />
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full z-50 ${
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

      {/* Login Card */}
      <motion.div
        className={`relative backdrop-blur-xl rounded-3xl p-8 w-full max-w-md ${
          isDarkMode
            ? 'bg-gray-900/50 border border-purple-500/20'
            : 'bg-white/80 border border-purple-600/20'
        }`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col items-center mb-8">
          <Sparkles className={`w-12 h-12 mb-4 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>
            Welcome Back
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Continue your learning journey
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl transition-all ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700/50 focus:border-purple-500/50 focus:ring-purple-500/30'
                  : 'bg-white/80 border-gray-300/50 focus:border-purple-600/50 focus:ring-purple-600/30'
              } border outline-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl transition-all ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700/50 focus:border-purple-500/50 focus:ring-purple-500/30'
                  : 'bg-white/80 border-gray-300/50 focus:border-purple-600/50 focus:ring-purple-600/30'
              } border outline-none`}
            />
          </div>

          <motion.button
            type="button"
            onClick={handleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-100 hover:bg-purple-200 text-gray-900'
            }`}
          >
            Log In
          </motion.button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('successful') 
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <p className={`mt-6 text-center text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className={`font-semibold ${
                isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              Sign up
            </button>
          </p>
        </form>
      </motion.div>

      {/* Animated Background Elements */}
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[150px] -top-96 -left-96 ${
          isDarkMode
            ? "bg-gradient-to-r from-purple-500/20 via-pink-500/20"
            : "bg-gradient-to-r from-purple-300/20 via-pink-300/20"
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
    </motion.main>
  );
}