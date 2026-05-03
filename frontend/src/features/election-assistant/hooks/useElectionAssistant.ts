/**
 * useElectionAssistant — Custom hook encapsulating all chat business logic.
 *
 * WHY a custom hook (not component state):
 * - Encapsulates SSE stream management, retry logic, and message accumulation
 * - Reusable across ChatInterface and any other component needing AI chat
 * - Makes the logic independently testable via renderHook
 *
 * This hook follows the SRP — its sole concern is chat interaction state.
 * Firebase auth concerns live in useAuth; persistence is in ElectionAssistantService.
 */

'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useReducer,
} from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  timestamp: number;
  model?: string;
}

type ChatState =
  | { status: 'idle' }
  | { status: 'streaming'; partialContent: string }
  | { status: 'error'; message: string };

type ChatAction =
  | { type: 'START_STREAMING' }
  | { type: 'APPEND_CHUNK'; chunk: string }
  | { type: 'FINISH_STREAMING' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'RESET' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'START_STREAMING':
      return { status: 'streaming', partialContent: '' };
    case 'APPEND_CHUNK':
      if (state.status !== 'streaming') return state;
      return { ...state, partialContent: state.partialContent + action.chunk };
    case 'FINISH_STREAMING':
      return { status: 'idle' };
    case 'SET_ERROR':
      return { status: 'error', message: action.message };
    case 'RESET':
      return { status: 'idle' };
    default:
      return state;
  }
}

export interface UseElectionAssistantOptions {
  region?: string;
  language?: string;
  initialConversationId?: string;
}

export interface UseElectionAssistantReturn {
  messages: ChatMessage[];
  conversationId: string | undefined;
  state: ChatState;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  isStreaming: boolean;
  error: string | undefined;
}

export function useElectionAssistant(
  options: UseElectionAssistantOptions = {}
): UseElectionAssistantReturn {
  const { region, language = 'en', initialConversationId } = options;
  const { user, getIdToken } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [chatState, dispatch] = useReducer(chatReducer, { status: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (chatState.status === 'streaming') return;
      if (!user) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const streamingPlaceholder: ChatMessage = {
        id: 'streaming-placeholder',
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage, streamingPlaceholder]);
      dispatch({ type: 'START_STREAMING' });

      abortControllerRef.current = new AbortController();

      try {
        const token = await getIdToken();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: content,
            conversationId,
            language,
            region,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error((err as { error?: string }).error ?? 'Request failed');
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('event: meta')) continue;
            if (line.startsWith('event: done')) {
              const dataLine = lines[lines.indexOf(line) + 1];
              if (dataLine?.startsWith('data: ')) {
                try {
                  const data = JSON.parse(dataLine.slice(6)) as { conversationId: string };
                  setConversationId(data.conversationId);
                } catch { /* Ignore parse errors */ }
              }
            }
            if (line.startsWith('data: ') && !line.includes('"conversationId"')) {
              try {
                const data = JSON.parse(line.slice(6)) as { text?: string };
                if (data.text) {
                  accumulated += data.text;
                  dispatch({ type: 'APPEND_CHUNK', chunk: data.text });
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === 'streaming-placeholder'
                        ? { ...m, content: accumulated }
                        : m
                    )
                  );
                }
              } catch { /* Ignore malformed SSE chunks */ }
            }
          }
        }

        // Finalize streaming message
        const finalId = crypto.randomUUID();
        setMessages(prev =>
          prev.map(m =>
            m.id === 'streaming-placeholder'
              ? { ...m, id: finalId, isStreaming: false, content: accumulated }
              : m
          )
        );
        dispatch({ type: 'FINISH_STREAMING' });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          dispatch({ type: 'RESET' });
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        dispatch({ type: 'SET_ERROR', message: errorMessage });
        setMessages(prev => prev.filter(m => m.id !== 'streaming-placeholder'));
      }
    },
    [chatState.status, user, conversationId, language, region, getIdToken]
  );

  const clearConversation = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setConversationId(undefined);
    dispatch({ type: 'RESET' });
  }, []);

  return {
    messages,
    conversationId,
    state: chatState,
    sendMessage,
    clearConversation,
    isStreaming: chatState.status === 'streaming',
    error: chatState.status === 'error' ? chatState.message : undefined,
  };
}
