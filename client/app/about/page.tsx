"use client";

import { Fade } from "react-awesome-reveal"; 
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react"; 
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react"; 


import AnimatedGradientBg from "../components/AnimatedGradientBg"; 
import NavBarLanding from "../NavBarLanding"; 

export default function AboutPage() { 
  const [isDarkMode, setIsDarkMode] = useState(true); 

  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newMode);
      }
      return newMode;
    });
  };
  
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialIsDark = storedTheme ? storedTheme === 'dark' : systemPrefersDark;
      setIsDarkMode(initialIsDark);
      document.documentElement.classList.toggle('dark', initialIsDark);
    }
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center overflow-x-hidden selection:bg-pink-500 selection:text-white ${isDarkMode ? "dark" : ""}`}>
      <AnimatedGradientBg isDarkMode={isDarkMode} />
      <NavBarLanding isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 md:py-32 text-center">
        {/* Hero Section for About Page */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <Fade direction="down" triggerOnce cascade damping={0.1}>
            <h1 className={`font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight
                           ${isDarkMode ? 'text-white' : 'text-black'}`}>
              About <span className={`text-transparent bg-clip-text bg-gradient-to-r 
                                      ${isDarkMode ? 'from-purple-400 via-pink-400 to-orange-400' 
                                                   : 'from-purple-600 via-pink-600 to-orange-500'}`}>
                        IntellectAI
                      </span>
            </h1>
            <p className={`mt-4 text-md sm:text-lg max-w-2xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Pioneering the future of education through AI-powered, interactive, and deeply personalized learning adventures.
            </p>
          </Fade>
        </motion.div>
        
        {/* Team Image / Brand Image */}
        <motion.div 
          className="my-10 sm:my-12 md:my-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Fade direction="up" delay={200} triggerOnce>
            <div className={`relative inline-block p-1.5 sm:p-2 rounded-2xl shadow-2xl 
                           bg-gradient-to-br ${isDarkMode ? "from-purple-600/30 to-blue-600/30" : "from-purple-200/40 to-blue-200/40"}`}>
              <Image
                src="/logo2.png" 
                alt="IntellectAI Brand Image"
                width={480} 
                height={288} 
                className="rounded-xl object-cover"
                priority
              />
            </div>
          </Fade>
        </motion.div>

        {/* helps in motion handling*/}
        <motion.section 
          className="w-full max-w-3xl mx-auto"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible" 
          viewport={{ once: true, amount: 0.3 }}
        >
          <Fade direction="up" delay={100} triggerOnce> {}
            <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-xl 
                           ${isDarkMode 
                             ? "bg-black/30 border-white/10 backdrop-blur-lg shadow-purple-500/10" 
                             : "bg-white/50 border-black/10 backdrop-blur-lg shadow-purple-500/5"
                           }`}>
              <h2 className={`font-heading text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 text-center
                             ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300' 
                                          : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600'}`}>
                Why IntellectAI?
              </h2>
              <ul className={`space-y-3 text-left text-sm sm:text-base list-none sm:pl-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {[
                  "📚 AI-driven, personalized learning paths tailored to you.",
                  "🎙️ Voice-based interactive lectures for engaging study.",
                  "🖥️ Dynamic slideshows and captivating presentations.",
                  "💡 Cutting-edge, research-backed content generation.",
                  "🚀 A smarter, adaptive way to master any subject."
                ].map((item, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-start gap-2.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }} // Stagger list items
                  >
                    <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 mt-1 shrink-0 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Fade>
        </motion.section>

        
        <motion.div 
          className="mt-10 sm:mt-12 md:mt-16"
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.5, duration:0.5}}
        >
          <Fade direction="up" delay={100} triggerOnce>
            <Link href="/input" passHref> 
              <motion.button 
                className={`font-semibold px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl text-md sm:text-lg relative group overflow-hidden shadow-lg
                            transition-all duration-300 ease-out
                            ${isDarkMode
                              ? "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white hover:shadow-pink-500/30"
                              : "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:shadow-pink-500/20"
                            }`}
                whileHover={{ scale: 1.03, y: -2, boxShadow: `0px 8px 25px -5px ${isDarkMode ? 'rgba(192, 132, 252, 0.25)' : 'rgba(147, 51, 234, 0.2)'}` }}
                whileTap={{ scale: 0.97, y: 0 }}
              >
                 <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/10 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-100 rounded-xl"></span>
                <span className="relative flex items-center gap-2">
                  <Zap className="w-5 h-5 group-hover:animate-pulse" />
                  Explore Topics
                </span>
              </motion.button>
            </Link>
          </Fade>
        </motion.div>
      </main>
    </div>
  );
}