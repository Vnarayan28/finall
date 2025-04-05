"use client";
import React from "react";
import { MessageTranscript } from "./Voice";

interface SidebarProps {
  messages: MessageTranscript[];
}

export default function Sidebar({ messages }: SidebarProps) {
  return (
    <div className="flex flex-col w-full h-screen p-4 bg-gray-800 text-white">
      <div className="flex-1 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <p className="text-gray-400 text-sm">{message.role}</p>
            <p className="text-white">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}