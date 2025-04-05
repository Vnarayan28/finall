import React from "react";
import { BarChartBig, WandSparkles, CircleUserRound, Info } from "lucide-react";
import NavBarElement from "./navBarElement";
import Link from "next/link";

function NavBar() {
  return (
    <nav className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="./logo.png" 
              width="140px" 
              className="transition-transform duration-300 hover:scale-105"
              alt="Logo"
            />
          </Link>

          {/* Navigation Items */}
          <div className="flex space-x-6">
            <NavBarElement 
              href="/"
              additionalClass="active" 
              icon={<BarChartBig className="w-5 h-5" />} 
              navBarSection="Home" 
            />
            <NavBarElement 
              href="/create"
              icon={<WandSparkles className="w-5 h-5" />} 
              navBarSection="Create" 
            />
            <NavBarElement 
              href="/profile"
              icon={<CircleUserRound className="w-5 h-5" />} 
              navBarSection="Profile" 
            />
            <NavBarElement 
              href="/about"
              icon={<Info className="w-5 h-5" />} 
              navBarSection="About" 
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;