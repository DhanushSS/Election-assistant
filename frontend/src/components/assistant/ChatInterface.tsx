'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { useChatSession } from '../../features/chat/useChatSession';
import { useTranslationContext } from '../../features/translation/TranslationContext';
import { QUICK_REPLIES } from '../../lib/constants/india-elections';

/**
 * ChatInterface — streaming Gemini chat, no auth required
 */
export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isStreaming, sendMessage } = useChatSession();
  const { language, setLanguage } = useTranslationContext();

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    setInputValue('');
    await sendMessage(trimmed, language);
    inputRef.current?.focus();
  };

  const handleQuickReply = (query: string) => {
    if (!isStreaming) sendMessage(query, language);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto">
      {/* ── Header ────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">VoteAI India</h1>
          <p className="text-xs text-gray-500">Ask anything about Indian elections</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="text-sm font-medium text-gray-600 border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors"
            aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
          >
            {language === 'en' ? 'हि' : 'EN'}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-xs text-gray-500">Gemini Pro</span>
          </div>
        </div>
      </div>

      {/* ── Message List ──────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 chat-scroll bg-gray-50"
        role="log"
        aria-label="Conversation with VoteAI India"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4" aria-hidden="true">🗳️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {language === 'hi' ? 'नमस्ते! मैं VoteAI India हूं' : 'Welcome to VoteAI India'}
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {language === 'hi'
                ? 'भारतीय चुनावों के बारे में कोई भी सवाल पूछें'
                : 'Ask me anything about Indian elections, voter registration, or the democratic process.'}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble key={msg.id} message={msg} isLast={idx === messages.length - 1} />
        ))}

        {isStreaming && <TypingIndicator />}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Quick Replies ─────────────────────── */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 bg-gray-50">
          <QuickReplies
            replies={QUICK_REPLIES}
            language={language}
            onSelect={handleQuickReply}
            disabled={isStreaming}
          />
        </div>
      )}

      {/* ── Input Area ────────────────────────── */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'hi' ? 'भारतीय चुनावों के बारे में पूछें...' : 'Ask about Indian elections...'}
            className="flex-1 bg-transparent resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none max-h-32 py-1"
            rows={1}
            aria-label="Message input"
            aria-multiline="true"
            disabled={isStreaming}
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="p-2 bg-orange-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          VoteAI India covers only Indian elections · Helpline: 1950
        </p>
      </div>
    </div>
  );
}
