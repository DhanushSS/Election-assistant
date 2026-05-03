'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { useChatSession } from '../../features/chat/useChatSession';
import { useTranslationContext } from '../../features/translation/TranslationContext';
import { QUICK_REPLIES } from '../../lib/constants/india-elections';

/**
 * ChatInterface — streaming Gemini chat, no auth required
 * Back-to-home via ← button in header
 */
export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [showApiNotice, setShowApiNotice] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isStreaming, sendMessage } = useChatSession();
  const { language, setLanguage } = useTranslationContext();

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Check if API key is configured
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then((d: { geminiConfigured?: boolean }) => {
        if (d.geminiConfigured === false) setShowApiNotice(true);
      })
      .catch(() => {});
  }, []);

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
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Top bar with saffron accent ──────────── */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600" aria-hidden="true" />

      {/* ── Header ───────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        {/* Back to Home */}
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm group"
          aria-label="Back to Home"
        >
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            className="group-hover:-translate-x-1 transition-transform"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-base font-bold text-gray-900">
            🗳️ VoteAI India
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {language === 'hi' ? 'भारतीय चुनाव सहायक' : 'Indian Election Assistant'}
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="text-xs font-semibold text-gray-700 border border-gray-300 px-2.5 py-1 rounded-full hover:bg-orange-50 hover:border-orange-300 transition-colors"
            aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
          >
            {language === 'en' ? 'हिं' : 'EN'}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="hidden sm:inline">Gemini</span>
          </div>
        </div>
      </header>

      {/* ── API key notice (shown when no key configured) ── */}
      <AnimatePresence>
        {showApiNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between overflow-hidden"
          >
            <span>
              ⚠️ Add your <code className="font-mono bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> in{' '}
              <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code>{' '}
              to enable live AI responses. Static answers are shown for now.
            </span>
            <button onClick={() => setShowApiNotice(false)} className="ml-2 text-amber-600 hover:text-amber-800" aria-label="Dismiss">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Message List ──────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
        role="log"
        aria-label="Conversation with VoteAI India"
        aria-live="polite"
        aria-relevant="additions"
        id="chat-messages"
      >
        {/* Welcome state */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10 max-w-md mx-auto"
          >
            <div className="text-6xl mb-4" aria-hidden="true">🗳️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {language === 'hi' ? 'नमस्ते! मैं VoteAI India हूं' : 'Welcome to VoteAI India'}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {language === 'hi'
                ? 'भारतीय चुनावों, मतदाता पंजीकरण, EVM, और लोकतांत्रिक प्रक्रिया के बारे में कोई भी सवाल पूछें।'
                : 'Ask me anything about Indian elections, voter registration, EVMs, Model Code of Conduct, and the democratic process.'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-left">
              {[
                { icon: '📋', text: 'Form 6 — Voter Registration' },
                { icon: '🏛️', text: 'Lok Sabha & Rajya Sabha' },
                { icon: '⚖️', text: 'Model Code of Conduct' },
                { icon: '🗳️', text: 'EVM & VVPAT explained' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-3 text-gray-700">
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator — shown while streaming starts */}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Quick Replies ─────────────────────────── */}
      {messages.length === 0 && (
        <div className="px-3 sm:px-6 pb-2 bg-gray-50">
          <QuickReplies
            replies={QUICK_REPLIES}
            language={language}
            onSelect={handleQuickReply}
            disabled={isStreaming}
          />
        </div>
      )}

      {/* ── Input Area ────────────────────────────── */}
      <div className="px-3 sm:px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            id="chat-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'hi' ? 'भारतीय चुनावों के बारे में पूछें...' : 'Ask about Indian elections...'}
            className="flex-1 bg-transparent resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none py-1 max-h-40"
            rows={1}
            aria-label="Message input"
            disabled={isStreaming}
            autoFocus
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="p-2.5 bg-orange-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 active:bg-orange-700 transition-colors flex-shrink-0 shadow-sm"
            aria-label="Send message (Enter)"
          >
            {isStreaming ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="animate-spin">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" opacity={0.3} />
                <path d="M20 12a8 8 0 0 1-8 8v2a10 10 0 0 0 10-10z" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </motion.button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          VoteAI India · Indian elections only · Helpline: <a href="tel:1950" className="text-orange-600 hover:underline font-medium">1950</a>
        </p>
      </div>
    </div>
  );
}
