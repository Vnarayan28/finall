"use client";
import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, PanInfo } from "framer-motion";
import { Sparkles, Brain, BookOpenText, Mic, PlayCircle, ArrowRight, Zap, Rows3, Sun, Moon } from "lucide-react"; // Added Sun, Moon
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import NavBarLanding from "./NavBarLanding";

// InteractiveOrb component is now REMOVED


export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const features = [ // Feature configuration remains the same
    {
      title: "Hyper-Personalized AI Tutor",
      description: "Adapts to your unique learning style for maximum efficiency.",
      icon: Brain,
      color: isDarkMode ? "text-purple-400" : "text-purple-600",
      area: "col-span-2 row-span-1 md:col-span-2 md:row-span-1",
      bgClass: isDarkMode ? "bg-purple-900/30" : "bg-purple-100/50",
    },
    {
      title: "Interactive Content Universe",
      description: "Dive into lessons that come alive with multimedia and simulations.",
      icon: Rows3, 
      color: isDarkMode ? "text-sky-400" : "text-sky-600",
      area: "col-span-2 row-span-1 md:col-span-1 md:row-span-2",
      bgClass: isDarkMode ? "bg-sky-900/30" : "bg-sky-100/50",
    },
    {
      title: "Seamless Voice Command",
      description: "Control your learning journey with intuitive voice interactions.",
      icon: Mic,
      color: isDarkMode ? "text-emerald-400" : "text-emerald-600",
      area: "col-span-1 row-span-1",
      bgClass: isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100/50",
    },
    {
      title: "AI-Generated Visualizations",
      description: "Complex concepts made simple with dynamic diagrams.",
      icon: PlayCircle,
      color: isDarkMode ? "text-pink-400" : "text-pink-600",
      area: "col-span-1 row-span-1",
      bgClass: isDarkMode ? "bg-pink-900/30" : "bg-pink-100/50",
    },
  ];

  const heroVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  };

  const heroItemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } },
  };
  
  const AnimatedGradientBg = () => ( // Background remains the same
    <div className={`fixed inset-0 -z-10 h-full w-full 
      ${isDarkMode ? 'bg-gray-950' : 'bg-slate-50'}
      bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] 
      dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)] 
      [background-size:16px_16px]`}>
      <div className={`absolute inset-0 -z-20 animate-aurora 
        ${isDarkMode ? 'bg-gradient-to-r from-purple-900/70 via-black to-blue-900/70' 
                     : 'bg-gradient-to-r from-purple-200/70 via-white to-blue-200/70'}`} 
        style={{ backgroundSize: '400% 400%' }}
      />
    </div>
  );

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden selection:bg-pink-500 selection:text-white ${isDarkMode ? "dark" : ""}`}>
      <AnimatedGradientBg />
      {/* Pass toggleTheme to NavBarLanding so it can also control the theme if needed */}
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen w-full px-4 pt-24 pb-16"
        variants={heroVariants}
        initial="initial"
        animate="animate"
      >
        {/* Removed the InteractiveOrb div that was here */}

        <motion.h1 
          variants={heroItemVariants}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter"
        >
          <span className={`
            ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400' 
                         : 'text-transparent bg-clip-text bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500'}
          `}>
            Unlock Your
          </span>
          <span className={`block mt-1 sm:mt-2 ${isDarkMode ? "text-white" : "text-black"}`}>
            Learning Potential.
          </span>
        </motion.h1>

        <motion.p
          variants={heroItemVariants}
          className={`mt-6 text-lg sm:text-xl max-w-xl md:max-w-2xl ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          IntellectAI merges cutting-edge AI with interactive design to create a learning experience 
          that's not just smarter, but truly transformative.
        </motion.p>
        
        <motion.div variants={heroItemVariants} className="mt-10 flex flex-col sm:flex-row items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05, y: -2, boxShadow: `0px 10px 30px -5px ${isDarkMode ? 'rgba(192, 132, 252, 0.3)' : 'rgba(147, 51, 234, 0.2)'}` }}
            whileTap={{ scale: 0.95, y: 0 }}
            onClick={() => setIsAuthModalOpen(true)}
            className={`font-semibold px-8 py-4 rounded-xl text-lg relative group overflow-hidden shadow-lg
                        transition-all duration-300 ease-out
                        ${isDarkMode
                          ? "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white hover:shadow-pink-500/40"
                          : "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:shadow-pink-500/30"
                        }`}
          >
            <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/20 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-100 rounded-xl"></span>
            <span className="relative flex items-center gap-2.5">
              <Zap className="w-5 h-5 group-hover:animate-pulse" />
              Begin Your Ascent
            </span>
          </motion.button>

          {/* New Prominent Theme Toggle Button in Hero */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: isDarkMode ? -10 : 10 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3.5 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg
                        border ${isDarkMode 
                          ? "bg-gray-800 border-white/20 text-yellow-400 hover:bg-gray-700 hover:border-yellow-400/50" 
                          : "bg-white border-black/10 text-purple-600 hover:bg-gray-100 hover:border-purple-600/50"}`}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            variants={heroItemVariants} // Can reuse hero item variants for entry
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
          </motion.button>
        </motion.div>
      </motion.section>

      {/* Auth Selection Modal (remains the same) */}
      <Dialog
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        className="relative z-[150]"
      >
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className={`w-full max-w-xs sm:max-w-sm rounded-2xl p-6 shadow-2xl
                      ${isDarkMode 
                        ? "bg-gray-900 border border-white/10" 
                        : "bg-white border"
                      }`}
          >
            <Dialog.Panel> 
              <Dialog.Title className={`font-heading text-2xl font-bold mb-6 text-center ${
                isDarkMode ? "text-white" : "text-black"
              }`}>
                Join IntellectAI
              </Dialog.Title>
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2, backgroundColor: isDarkMode ? '#7c3aed' : '#a855f7' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setIsAuthModalOpen(false); router.push("/login"); }}
                  className={`w-full py-3 px-5 rounded-lg text-md font-medium transition-colors duration-200 flex items-center justify-center gap-2
                              ${isDarkMode ? "bg-purple-700 text-white" : "bg-purple-600 text-white" }`}
                > Sign In <ArrowRight size={18} /> </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2, backgroundColor: isDarkMode ? '#4b5563' : '#e5e7eb' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setIsAuthModalOpen(false); router.push("/signup"); }}
                  className={`w-full py-3 px-5 rounded-lg text-md font-medium transition-colors duration-200 flex items-center justify-center gap-2
                              ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black" }`}
                > Create Account <ArrowRight size={18} /> </motion.button>
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => setIsAuthModalOpen(false)}
                  className={`text-sm transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-black"}`}
                > Maybe later </button>
              </div>
            </Dialog.Panel>
          </motion.div>
        </div>
      </Dialog>

      {/* Features Bento Grid Section (remains the same) */}
      <section className="relative z-10 w-full max-w-6xl mx-auto py-20 sm:py-28 px-4">
        <motion.h2 
          className={`font-heading text-4xl sm:text-5xl font-black text-center mb-12 sm:mb-16 tracking-tight
            ${isDarkMode ? "text-white" : "text-black"}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          The Future of Learning is <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">Here</span>.
        </motion.h2>
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          initial="initial"
          whileInView="animate"
          variants={{ animate: { transition: { staggerChildren: 0.1 }}}}
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
            <motion.div
              key={index}
              className={`relative p-6 rounded-2xl overflow-hidden group cursor-pointer
                          border ${isDarkMode ? 'border-white/10 hover:border-white/20' : 'border-black/10 hover:border-black/20'}
                          transition-all duration-300 ease-in-out min-h-[200px] md:min-h-[240px]
                          flex flex-col justify-between ${feature.area} ${feature.bgClass} backdrop-blur-md`}
              variants={heroItemVariants} 
              whileHover={{ scale: 1.03, boxShadow: `0px 8px 25px -5px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
              <div>
                <div className={`p-3 rounded-lg inline-block mb-4 shadow-md ${feature.color.replace('text-', 'bg-').replace('400', '500/20').replace('600', '500/20')}`}>
                  <IconComponent size={28} className={feature.color} />
                </div>
                <h3 className={`font-heading text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                  {feature.title}
                </h3>
              </div>
              <p className={`text-sm mt-2 leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {feature.description}
              </p>
            </motion.div>
          )})}
        </motion.div>
      </section>

       {/* Footer - Simple (remains the same) */}
       <footer className="relative z-10 w-full py-12 text-center">
        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          © {new Date().getFullYear()} IntellectAI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}