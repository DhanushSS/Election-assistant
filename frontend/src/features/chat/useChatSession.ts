'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from '../../components/assistant/MessageBubble';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return uuidv4();
  const existing = localStorage.getItem('voteai-session-id');
  if (existing) return existing;
  const newId = uuidv4();
  localStorage.setItem('voteai-session-id', newId);
  return newId;
}

/**
 * useChatSession — manages messages, SSE streaming, anonymous session
 */
export function useChatSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (text: string, language: 'en' | 'hi') => {
    const sessionId = getOrCreateSessionId();

    // Add user message immediately
    const userMsg: Message = { id: uuidv4(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    // Placeholder assistant message for streaming
    const assistantId = uuidv4();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]);
    setIsStreaming(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6)) as
              | { type: 'token'; text: string }
              | { type: 'done'; model: string; tokensUsed: number }
              | { type: 'error'; message: string };

            if (data.type === 'token') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.text }
                    : m
                )
              );
            } else if (data.type === 'done' || data.type === 'error') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, isStreaming: false, content: data.type === 'error' ? data.message : m.content }
                    : m
                )
              );
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      console.error('[useChatSession] Stream error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, isStreaming: false, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, sendMessage };
}
