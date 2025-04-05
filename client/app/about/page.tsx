"use client";

import { Fade } from "react-awesome-reveal";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Home, User, Sparkles, Moon, Sun } from "lucide-react";

export default function About() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <main className={`relative min-h-screen flex flex-col items-center justify-center px-10 py-20 overflow-hidden ${
      isDarkMode ? "text-white bg-gradient-to-br from-purple-900 via-black to-blue-900" : "text-gray-900 bg-gradient-to-br from-purple-100 via-white to-blue-100"
    }`}>
      {/* Navigation Bar */}
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

            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              <Link 
                href="/"
                className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/10"
              >
                <Home className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Home</span>
              </Link>
              <Link 
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/10"
              >
                <User className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Profile</span>
              </Link>
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-colors duration-300 ${
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
            </div>
          </div>
        </div>
      </nav>

      {/* Background elements */}
      <div className="absolute inset-0 z-[-1]">
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? "bg-[url('/grid-pattern.svg')] opacity-20" 
            : "bg-[url('/light-grid-pattern.svg')] opacity-30"
        }`} />
        <div className={`absolute w-60 h-60 rounded-full blur-[120px] top-10 left-10 opacity-30 ${
          isDarkMode ? "bg-purple-500" : "bg-purple-200"
        }`} />
        <div className={`absolute w-80 h-80 rounded-full blur-[150px] bottom-10 right-10 opacity-30 ${
          isDarkMode ? "bg-blue-500" : "bg-blue-200"
        }`} />
      </div>

      {/* Hero Section */}
      <Fade direction="up" delay={200}>
        <h1 className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          About <span className="text-purple-400">IntellectAI</span>
        </h1>
        <p className={`text-lg max-w-3xl text-center mt-4 ${
          isDarkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          Transforming education through AI-powered, interactive, and personalized learning experiences.
        </p>
      </Fade>

      {/* Team Image */}
      <Fade direction="up" delay={400}>
        <Image
          src="/logo2.png"
          alt="Team Learning"
          width={500}
          height={300}
          className="mt-8 rounded-xl shadow-lg border-2 border-white/20"
        />
      </Fade>

      {/* Why Choose Us Section */}
      <Fade direction="up" delay={600}>
        <div className={`mt-10 max-w-4xl backdrop-blur-md p-8 rounded-xl border shadow-lg ${
          isDarkMode 
            ? "bg-white/10 border-white/20" 
            : "bg-purple-50/30 border-gray-900/20"
        }`}>
          <h2 className="text-3xl font-semibold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Why Choose IntellectAI?
          </h2>
          <ul className={`list-disc text-lg space-y-3 pl-6 ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            <li>📚 AI-driven, personalized learning</li>
            <li>🎙️ Voice-based interactive lectures</li>
            <li>🖥️ Engaging slideshow presentations</li>
            <li>💡 Research-backed content generation</li>
            <li>🚀 A smarter way to learn, adapted for YOU</li>
          </ul>
        </div>
      </Fade>

      {/* Call to Action */}
      <Fade direction="up" delay={800}>
        <div className="mt-12">
          <Link href="/">
            <motion.button 
              className={`px-6 py-3 transition-all duration-300 rounded-full text-lg font-semibold shadow-md ${
                isDarkMode
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-gradient-to-r from-purple-300 to-blue-300 text-gray-900"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </Fade>
    </main>
  );
}