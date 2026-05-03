'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 group`}
    >
      {/* Avatar — assistant only */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0 mt-1 text-sm" aria-hidden="true">
          🗳️
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-orange-500 text-white rounded-tr-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-gray-900 prose-a:text-orange-600 prose-a:underline">
              <ReactMarkdown
                components={{
                  // Bullet lists
                  ul: ({ children }) => (
                    <ul className="list-none space-y-1 mt-2 mb-2">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="flex gap-2 text-gray-700">
                      <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                      <span>{children}</span>
                    </li>
                  ),
                  // Bold
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  // Inline code (for things like "GEMINI_API_KEY")
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-orange-700 text-xs px-1.5 py-0.5 rounded font-mono">{children}</code>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 underline hover:text-orange-700"
                    >
                      {children}
                    </a>
                  ),
                  // Paragraphs — no extra margins
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 text-gray-800">{children}</p>
                  ),
                  // Headings
                  h3: ({ children }) => (
                    <h3 className="font-bold text-gray-900 mt-2 mb-1">{children}</h3>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {/* Streaming cursor */}
              {message.isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-orange-500 ml-0.5 animate-pulse align-middle" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        {/* Copy button — only for assistant messages with content */}
        {!isUser && message.content && !message.isStreaming && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-1"
            aria-label="Copy response"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2} />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth={2} />
                </svg>
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1 text-xs text-white font-bold" aria-hidden="true">
          You
        </div>
      )}
    </motion.div>
  );
}
