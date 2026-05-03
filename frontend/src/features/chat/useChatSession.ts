'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '../../components/assistant/MessageBubble';

// Always use the relative Next.js API route — no external backend needed
const API_URL = '/api/chat';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return uuidv4();
  const existing = localStorage.getItem('voteai-session-id');
  if (existing) return existing;
  const newId = uuidv4();
  localStorage.setItem('voteai-session-id', newId);
  return newId;
}

/**
 * useChatSession — streams Gemini responses via Next.js API route /api/chat
 * Uses anonymous UUID session stored in localStorage
 */
export function useChatSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (text: string, language: 'en' | 'hi') => {
    const sessionId = getOrCreateSessionId();

    // Snapshot current history for context
    const historyForApi = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message immediately
    const userMsg: Message = { id: uuidv4(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    // Placeholder for streaming assistant reply
    const assistantId = uuidv4();
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);
    setIsStreaming(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, language, history: historyForApi }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      let gotContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw) as
              | { type: 'token'; text: string }
              | { type: 'done' }
              | { type: 'error'; message: string };

            if (data.type === 'token') {
              gotContent = true;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.text }
                    : m
                )
              );
            } else if (data.type === 'done') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
            } else if (data.type === 'error') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, isStreaming: false, content: data.message }
                    : m
                )
              );
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      // Safety: if stream ended without explicit done event
      if (!gotContent) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  isStreaming: false,
                  content: "I'm having trouble connecting. Please try again in a moment.",
                }
              : m
          )
        );
      } else {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      }
    } catch (err) {
      console.error('[useChatSession] Stream error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                isStreaming: false,
                content:
                  'Sorry, I encountered an error connecting to the AI. Please check your API key or try again later.',
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return { messages, isStreaming, sendMessage };
}
