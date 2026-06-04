import { useCallback, useEffect, useRef, useState } from 'react';
import { streamPersonaReply } from '@/api/chatService';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { ChatMessage, PersonaId } from '@/types';
import { getPersona } from '@/config/personas';
import { now, uid } from '@/utils/id';

/** Drives a single chat session: load history, send, stream the AI reply. */
export function useChat(sessionId: string | undefined, personaId: PersonaId | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    (async () => {
      const existing = await ChatRepository.listMessages(sessionId);
      if (!active) return;
      if (existing.length === 0 && personaId) {
        // Seed the conversation with the persona greeting.
        const greeting = getPersona(personaId).greeting;
        const saved = await ChatRepository.addMessage(sessionId, 'assistant', greeting);
        setMessages([saved]);
      } else {
        setMessages(existing);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId, personaId]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId || !personaId || sending) return;
      setError(null);
      setSending(true);

      const userMsg = await ChatRepository.addMessage(sessionId, 'user', trimmed);
      // Set title from first user message.
      const isFirstUser = messages.filter((m) => m.role === 'user').length === 0;
      if (isFirstUser) {
        await ChatRepository.touchSession(sessionId, trimmed.slice(0, 20));
      }

      const placeholderId = uid();
      const placeholder: ChatMessage = {
        id: placeholderId,
        sessionId,
        role: 'assistant',
        content: '',
        createdAt: now(),
        pending: true,
      };
      const history = [...messages, userMsg];
      setMessages([...history, placeholder]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const full = await streamPersonaReply({
          personaId,
          history,
          signal: controller.signal,
          onDelta: (_chunk, accumulated) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId ? { ...m, content: accumulated } : m,
              ),
            );
          },
        });
        const saved = await ChatRepository.addMessage(sessionId, 'assistant', full);
        setMessages((prev) =>
          prev.map((m) => (m.id === placeholderId ? saved : m)),
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '문제가 생겼어요.';
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [messages, sessionId, personaId, sending],
  );

  return { messages, sending, error, send };
}
