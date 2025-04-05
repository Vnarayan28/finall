"use client";

import { useState } from "react";
import { Fade } from "react-awesome-reveal";
import Image from "next/image";
import { Edit, LogOut, Mail, User, Settings } from "lucide-react";

export default function Profile() {
  // Dummy user data
  const [user] = useState({
    name: "John Doe",
    email: "johndoe@example.com",
    avatar: "/avatar-placeholder.png",
  });

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-10 py-20 text-white overflow-hidden">
      {/* Background with glowing effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 z-[-1]"></div>
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 z-[-1]"></div>

      {/* Floating glow effects */}
      <div className="absolute w-60 h-60 bg-purple-500 rounded-full blur-[120px] top-10 left-10 opacity-30"></div>
      <div className="absolute w-80 h-80 bg-blue-500 rounded-full blur-[150px] bottom-10 right-10 opacity-30"></div>

      {/* Profile Card */}
      <Fade direction="up" delay={300}>
        <div className="bg-white/10 backdrop-blur-md p-10 rounded-xl border border-white/20 shadow-lg max-w-md w-full text-center">
          {/* Avatar */}
          <div className="flex justify-center">
            <Image
              src={user.avatar}
              alt="User Avatar"
              width={100}
              height={100}
              className="rounded-full border-4 border-purple-400 shadow-md"
            />
          </div>

          {/* User Info */}
          <h1 className="text-3xl font-semibold mt-4 text-purple-300">{user.name}</h1>
          <p className="text-gray-300 text-sm flex items-center justify-center gap-2 mt-2">
            <Mail size={18} /> {user.email}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-all duration-300 rounded-full text-lg font-semibold text-white shadow-md">
              <Edit size={20} /> Edit Profile
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 transition-all duration-300 rounded-full text-lg font-semibold text-white shadow-md">
              <Settings size={20} /> Settings
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 transition-all duration-300 rounded-full text-lg font-semibold text-white shadow-md">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      </Fade>
    </main>
  );
}
