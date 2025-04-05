'use client'

import { cn } from '../lib/utils'
import type { MessageTranscript } from './Voice'

export default function Sidebar({ 
  messages,
  className 
}: { 
  messages: MessageTranscript[]
  className?: string 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lecture Transcript</h3>
      {messages.map((message, index) => (
        <div
          key={index}
          className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md"
        >
          <p className="text-gray-700 text-sm">{message.content}</p>
          {message.role === 'user' && (
            <span className="inline-block mt-2 text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Your Question
            </span>
          )}
        </div>
      ))}
    </div>
  )
}