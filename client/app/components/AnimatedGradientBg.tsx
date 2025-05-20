"use client";
import { motion } from "framer-motion";

interface AnimatedGradientBgProps {
  isDarkMode: boolean;
}

export default function AnimatedGradientBg({ isDarkMode }: AnimatedGradientBgProps) {
  return (
    <div className={`fixed inset-0 -z-10 h-full w-full 
      ${isDarkMode ? 'bg-gray-950' : 'bg-slate-100'} 
      bg-[radial-gradient(#e5e7eb_0.5px,transparent_0.5px)] 
      dark:bg-[radial-gradient(#ffffff10_0.5px,transparent_0.5px)] 
      [background-size:16px_16px]`}>
      <div className={`absolute inset-0 -z-20 animate-aurora 
        ${isDarkMode ? 'bg-gradient-to-r from-purple-900/50 via-gray-950 to-blue-900/50' 
                     : 'bg-gradient-to-r from-purple-200/50 via-slate-100 to-blue-200/50'}`} 
        style={{ backgroundSize: '400% 400%' }}
      />
    </div>
  );
}