'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

/**
 * MessageBubble — slides in from bottom with spring easing.
 * Shows copy button on hover. Renders markdown-like line breaks.
 */
export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      role="article"
      aria-label={`${isUser ? 'You' : 'VoteAI India'}: ${message.content}`}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-0.5"
          aria-hidden="true"
        >
          🗳️
        </div>
      )}

      <div className={`relative max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-orange-500 text-white rounded-br-sm'
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'}
          `}
        >
          {/* Render with line breaks */}
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}

          {/* Streaming cursor */}
          {message.isStreaming && isLast && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" aria-hidden="true" />
          )}
        </div>

        {/* Copy button — shows on hover */}
        {!message.isStreaming && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 right-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-gray-600"
            aria-label="Copy message"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
