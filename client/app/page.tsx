"use client";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Brain, BookOpenText, Mic, PlayCircle } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import NavBarLanding from "./NavBarLanding";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const features = [
    {
      title: "Smart AI Tutor",
      description: "Adaptive learning paths powered by neural networks",
      icon: <Brain size={48} className="text-purple-100" />,
    },
    {
      title: "Dynamic Content",
      description: "Interactive lessons with multimedia integration",
      icon: <BookOpenText size={48} className="text-purple-100" />,
    },
    {
      title: "Voice Interface",
      description: "Natural language processing for seamless interaction",
      icon: <Mic size={48} className="text-purple-100" />,
    },
    {
      title: "Smart Visuals",
      description: "AI-generated diagrams and interactive presentations",
      icon: <PlayCircle size={48} className="text-purple-100" />,
    },
  ];

  return (
    <main className={`relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-10 py-20 overflow-hidden ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`}>
      {/* Navigation Bar */}
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Background and animation elements */}
      <div className={`absolute inset-0 z-0 ${
        isDarkMode
          ? "bg-gradient-to-br from-purple-900 via-black to-blue-900"
          : "bg-gradient-to-br from-purple-100 via-white to-blue-100"
      }`}>
        <motion.div
          className="absolute inset-0 bg-[length:100px_100px] opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${isDarkMode ? "#fff" : "#000"} 10%, transparent 20%)`,
            y: y,
          }}
        />
      </div>

      {/* Floating particles and geometric shapes */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full blur-[2px] ${
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
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute w-[800px] h-[800px] -top-64 -left-64 mix-blend-screen opacity-20"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className={`w-full h-full bg-[url('/geometric-pattern.svg')] bg-cover ${
          isDarkMode ? "invert-0" : "invert"
        }`} />
      </motion.div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative inline-block"
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-clip-text font-spacegrotesk relative">
              <motion.span
                className="relative inline-block"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                }}
                style={{
                  backgroundImage: `linear-gradient(45deg, ${
                    isDarkMode ? "#c084fc, #60a5fa" : "#9333ea, #3b82f6"
                  })`,
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                Learn Smarter
                <motion.span
                  className="absolute -right-8 top-0"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className={`w-8 h-8 ${
                    isDarkMode ? "text-yellow-400" : "text-yellow-500"
                  }`} />
                </motion.span>
              </motion.span>
              <br />
              <motion.span
                className="text-7xl md:text-9xl bg-clip-text text-transparent mt-4 inline-block"
                style={{
                  backgroundImage: `linear-gradient(45deg, ${
                    isDarkMode ? "#e9d5ff, #bfdbfe" : "#4c1d95, #1e3a8a"
                  })`,
                }}
                animate={{
                  textShadow: [
                    `0 0 10px rgba(${isDarkMode ? "192,132,252,0.5" : "147,51,234,0.5"})`,
                    `0 0 20px rgba(${isDarkMode ? "147,51,234,0.5" : "37,99,235,0.5"})`,
                    `0 0 10px rgba(${isDarkMode ? "192,132,252,0.5" : "147,51,234,0.5"})`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                IntellectAI
              </motion.span>
            </h1>
          </motion.div>

          <motion.p
            className={`text-xl md:text-2xl max-w-3xl mt-6 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Revolutionizing education through AI-powered interactive learning experiences
          </motion.p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            className={`px-8 py-4 rounded-2xl text-xl font-semibold relative overflow-hidden group ${
              isDarkMode
                ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white"
                : "bg-gradient-to-br from-purple-300 to-blue-300 text-gray-900"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className={`w-6 h-6 ${
                  isDarkMode ? "text-yellow-400" : "text-yellow-500"
                }`} />
              </motion.div>
              Start Your Journey
            </div>
            <div className={`absolute inset-0 border-2 rounded-2xl pointer-events-none ${
              isDarkMode ? "border-white/20" : "border-gray-900/20"
            }`} />
          </motion.button>
        </motion.div>
      </div>

      {/* Auth Selection Modal */}
      <Dialog
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-md rounded-3xl p-8 ${
            isDarkMode 
              ? "bg-gray-900 border border-purple-500/20" 
              : "bg-white border border-purple-600/20"
          }`}>
            <Dialog.Title className={`text-2xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Welcome to IntellectAI
            </Dialog.Title>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAuthModalOpen(false);
                  router.push("/login");
                }}
                className={`w-full py-3 px-6 rounded-xl text-lg font-medium transition-all ${
                  isDarkMode
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-100 hover:bg-purple-200 text-gray-900"
                }`}
              >
                I already have an account
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAuthModalOpen(false);
                  router.push("/signup");
                }}
                className={`w-full py-3 px-6 rounded-xl text-lg font-medium transition-all ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-100 hover:bg-blue-200 text-gray-900"
                }`}
              >
                Create new account
              </motion.button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className={`text-sm ${
                  isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Continue exploring first
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Features grid */}
      <motion.div
        className="mt-24 w-full max-w-7xl px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <motion.div
                whileHover={{ y: -10 }}
                className={`relative backdrop-blur-xl p-8 rounded-3xl border transition-all duration-300 group ${
                  isDarkMode
                    ? "bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-white/10 hover:border-purple-400/30"
                    : "bg-gradient-to-br from-purple-100/30 to-blue-100/30 border-gray-900/10 hover:border-purple-600/30"
                }`}
              >
                <div className={`absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops)] ${
                  isDarkMode
                    ? "from-purple-500/10"
                    : "from-purple-400/10"
                } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <motion.div
                    className={`p-4 rounded-2xl mb-4 ${
                      isDarkMode
                        ? "bg-gradient-to-r from-purple-500 to-blue-500"
                        : "bg-gradient-to-r from-purple-400 to-blue-400"
                    }`}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className={`text-2xl font-bold bg-clip-text text-transparent ${
                    isDarkMode
                      ? "bg-gradient-to-r from-purple-200 to-blue-200"
                      : "bg-gradient-to-r from-purple-700 to-blue-700"
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`leading-relaxed ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {feature.description}
                  </p>
                </div>
                <div className={`absolute inset-0 rounded-3xl pointer-events-none ${
                  isDarkMode ? "border-white/5" : "border-gray-900/5"
                }`} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="fixed bottom-8 flex flex-col items-center space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className={`w-1 h-8 bg-gradient-to-b rounded-full ${
            isDarkMode ? "from-purple-400" : "from-purple-600"
          } to-transparent`}
          animate={{
            y: [0, 20],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.span
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
          animate={{
            textShadow: [
              `0 0 8px rgba(${isDarkMode ? "192,132,252,0" : "147,51,234,0"})`,
              `0 0 8px rgba(${isDarkMode ? "192,132,252,0.3" : "147,51,234,0.3"})`,
              `0 0 8px rgba(${isDarkMode ? "192,132,252,0" : "147,51,234,0"})`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Explore More
        </motion.span>
      </motion.div>
    </main>
  );
}