"use client";

import { Zap, Moon, Sun, Home as HomeIcon, User as UserIcon, Info as InfoIcon, Menu as MenuIcon, X as XIcon, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavBarLandingProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const navItems = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Input", href: "/input", icon: Search },
  { name: "About", href: "/about", icon: InfoIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

function NavBarLanding({ isDarkMode, toggleTheme }: NavBarLandingProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); 

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } }
  };

  return (
    <>
      <motion.nav 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] sm:w-[95%] max-w-4xl xl:max-w-5xl rounded-2xl 
                  border border-white/10 bg-clip-padding backdrop-filter backdrop-blur-xl bg-black/20 
                  shadow-2xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}
      >
        <div className="mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-2 group z-10">
              <motion.div
                className="p-2 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-lg shadow-md group-hover:shadow-pink-500/30 transition-shadow duration-300"
                whileHover={{ scale: 1.1, rotate: -8 }}
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
              <span className={`font-heading text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"} group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300`}>
                IntellectAI
              </span>
            </Link>

            {/* Centered Navigation Links - Fixed positioning */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center space-x-3 lg:space-x-4 z-10">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isDarkMode 
                                  ? (isActive ? 'bg-purple-500/20 text-purple-300' : 'text-gray-300 hover:bg-white/5 hover:text-purple-300') 
                                  : (isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-black/[0.03] hover:text-purple-700')
                                }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? '' : (isDarkMode ? 'text-gray-400 group-hover:text-purple-300' : 'text-gray-500 group-hover:text-purple-700')}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions - Ensure proper spacing */}
            <div className="flex items-center gap-3 z-10">
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1, rotate: isDarkMode ? 10 : -10 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center
                            ${isDarkMode 
                              ? "text-yellow-400 hover:bg-white/5" 
                              : "text-purple-600 hover:bg-black/[0.03]"}`}
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.button>
              
              <div className="md:hidden">
                <motion.button
                  onClick={toggleMobileMenu}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center
                              ${isDarkMode ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-black/[0.03]"}`}
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`md:hidden fixed top-[80px] left-3 right-3 z-[90] rounded-xl p-4 shadow-2xl border
                       ${isDarkMode ? 'bg-gray-800/80 border-white/10 backdrop-blur-lg' : 'bg-white/80 border-black/10 backdrop-blur-lg'}`}
          >
            <nav className="flex flex-col space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${isDarkMode 
                                  ? (isActive ? 'bg-purple-500/30 text-purple-200' : 'text-gray-200 hover:bg-white/5 hover:text-purple-300') 
                                  : (isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-black/[0.03] hover:text-purple-700')
                                }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? '' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NavBarLanding;