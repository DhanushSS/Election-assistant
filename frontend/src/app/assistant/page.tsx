'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useElectionAssistant } from '@/features/election-assistant/hooks/useElectionAssistant';
import styles from './page.module.css';
import { clsx } from 'clsx';

const QUICK_REPLIES = [
  'How do I register to vote?',
  'What ID do I need to vote?',
  'How do I vote by mail?',
  'When is Election Day?',
  'Where is my polling place?',
  'What are the registration deadlines?',
];

export default function AssistantPage() {
  const { user, isLoading, signOutUser } = useAuth();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, clearConversation, isStreaming, error } =
    useElectionAssistant({ language });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Announce new AI messages to screen readers
  useEffect(() => {
    const lastMsg = messages.at(-1);
    if (lastMsg?.role === 'assistant' && !lastMsg.isStreaming && liveRegionRef.current) {
      liveRegionRef.current.textContent = `Assistant: ${lastMsg.content.slice(0, 200)}`;
    }
  }, [messages]);

  // Handle keyboard shortcut '?' for help modal
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        // TODO: Open help modal
        console.log('[Keyboard] Help shortcut triggered');
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isStreaming) return;
    setInputValue('');
    await sendMessage(content);
    // Restore focus to input after sending (WCAG 2.4.3)
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputValue, isStreaming, sendMessage]);

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleQuickReply = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage]
  );

  if (isLoading || !user) return null;

  return (
    <div className={styles.layout}>
      {/* ARIA live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
        role="status"
      />

      {/* Sidebar */}
      <aside className={styles.sidebar} aria-label="Chat sidebar">
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} aria-label="Election Assistant">
            <span className={styles.logoIcon} aria-hidden="true">🗳️</span>
            <span className={styles.logoText}>Election<br />Assistant</span>
          </div>
        </div>

        <nav className={styles.sidebarNav} aria-label="Main navigation">
          <a href="/assistant" className={`${styles.navLink} ${styles.navLinkActive}`} aria-current="page">
            <span aria-hidden="true">💬</span> Chat
          </a>
          <a href="/timeline" className={styles.navLink}>
            <span aria-hidden="true">📅</span> Timeline
          </a>
        </nav>

        <div className={styles.sidebarActions}>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem' }}
            onClick={clearConversation}
            aria-label="Start new conversation"
          >
            <span aria-hidden="true">✏️</span> New Chat
          </button>

          {/* Language selector */}
          <label className={styles.langLabel} htmlFor="language-select">
            Language
          </label>
          <select
            id="language-select"
            className={styles.langSelect}
            value={language}
            onChange={e => setLanguage(e.target.value)}
            aria-label="Select response language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo} aria-label={`Signed in as ${user.displayName ?? user.email ?? 'Guest'}`}>
            <div className={styles.avatar} aria-hidden="true">
              {(user.displayName ?? user.email ?? 'G')[0]?.toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>
                {user.displayName ?? user.email ?? 'Guest'}
              </div>
              <div className={styles.userRole}>
                {user.isAnonymous ? 'Guest' : 'Member'}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={signOutUser}
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main id="main-content" className={styles.chatMain}>
        <header className={styles.chatHeader}>
          <h1 className={styles.chatTitle}>Election Assistant</h1>
          <div className={styles.headerBadge} role="img" aria-label="Powered by Vertex AI Gemini Pro">
            <span aria-hidden="true">✨</span> Vertex AI Gemini Pro
          </div>
          <p className={styles.srOnly}>
            Press ? at any time to see keyboard shortcuts.
          </p>
        </header>

        {/* Messages */}
        <div
          className={styles.messages}
          role="log"
          aria-label="Conversation"
          aria-live="off"
        >
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">🗳️</div>
              <h2 className={styles.emptyTitle}>Ask me anything about elections</h2>
              <p className={styles.emptyDesc}>
                Voter registration, timelines, polling locations, ID requirements &mdash; I&apos;m here to help.
              </p>
              {/* Quick reply chips */}
              <div className={styles.quickReplies} role="list" aria-label="Suggested questions">
                {QUICK_REPLIES.map(text => (
                  <button
                    key={text}
                    role="listitem"
                    className={styles.quickReply}
                    onClick={() => handleQuickReply(text)}
                    disabled={isStreaming}
                    aria-label={`Ask: ${text}`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={clsx(
                styles.messageRow,
                msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
              )}
            >
              {msg.role === 'assistant' && (
                <div className={styles.msgAvatar} aria-hidden="true">🤖</div>
              )}
              <div
                className={clsx(
                  'message-bubble',
                  msg.role === 'user'
                    ? 'message-bubble--user'
                    : 'message-bubble--assistant',
                  msg.isStreaming && 'streaming-cursor'
                )}
                aria-label={`${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`}
              >
                <MessageContent content={msg.content} />
              </div>
              {msg.role === 'user' && (
                <div className={styles.msgAvatar} aria-hidden="true">
                  {(user.displayName ?? 'U')[0]?.toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isStreaming && messages.at(-1)?.content === '' && (
            <div className={styles.typingIndicator} aria-label="Assistant is typing" role="status">
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
            </div>
          )}

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className={styles.errorBanner}
            >
              <span aria-hidden="true">⚠</span> {error}
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Quick replies after last assistant message */}
        {messages.length > 0 && !isStreaming && (
          <div className={styles.followUpChips} aria-label="Suggested follow-up questions">
            {['Tell me more', 'What are the deadlines?', 'Show me a timeline'].map(text => (
              <button
                key={text}
                className={styles.quickReply}
                onClick={() => handleQuickReply(text)}
                aria-label={`Ask: ${text}`}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={styles.inputArea} role="form" aria-label="Send a message">
          <div className={styles.inputWrapper}>
            <label htmlFor="chat-input" className={styles.srOnly}>
              Type your election question
            </label>
            <textarea
              ref={inputRef}
              id="chat-input"
              className={styles.chatInput}
              placeholder="Ask about voter registration, deadlines, polling locations..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeydown}
              disabled={isStreaming}
              rows={1}
              maxLength={5000}
              aria-label="Your election question"
              aria-describedby="input-hint"
            />
            <span id="input-hint" className={styles.srOnly}>
              Press Enter to send, Shift+Enter for new line
            </span>
            <button
              className={`btn btn-primary ${styles.sendBtn}`}
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              aria-label={isStreaming ? 'Sending...' : 'Send message'}
              aria-busy={isStreaming}
            >
              {isStreaming ? (
                <div className="spinner" aria-hidden="true" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
            </button>
          </div>
          <p className={styles.inputDisclaimer}>
            AI responses are informational. Always verify with your official election authority.
          </p>
        </div>
      </main>
    </div>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function MessageContent({ content }: { content: string }) {
  // Render markdown-like bold text and line breaks
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const boldified = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: boldified }} />
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}
