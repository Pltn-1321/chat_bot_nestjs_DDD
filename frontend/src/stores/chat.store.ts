import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Conversation, ToolResult } from '@/types/chat.types';

/**
 * État du chat
 */
interface ChatState {
  // UI
  isOpen: boolean;
  isLoading: boolean;

  // Données
  currentConversationId: string | null;
  messages: ChatMessage[];
  lastToolResults: ToolResult[] | null;
  conversations: Conversation[];

  // Actions UI
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setLoading: (loading: boolean) => void;

  // Actions données
  setCurrentConversation: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setToolResults: (results: ToolResult[] | null) => void;
  clearMessages: () => void;
  setConversations: (conversations: Conversation[]) => void;
  removeConversation: (id: string) => void;
}

/**
 * Store Zustand pour le chat
 * Utilise persist pour sauvegarder l'ID de conversation dans localStorage
 */
export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // État initial
      isOpen: false,
      isLoading: false,
      currentConversationId: null,
      messages: [],
      lastToolResults: null,
      conversations: [],

      // Actions UI
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      setLoading: (loading) => set({ isLoading: loading }),

      // Actions données
      setCurrentConversation: (id) => set({ currentConversationId: id }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setMessages: (messages) => set({ messages }),

      setToolResults: (results) => set({ lastToolResults: results }),

      clearMessages: () =>
        set({
          messages: [],
          currentConversationId: null,
          lastToolResults: null,
        }),

      setConversations: (conversations) => set({ conversations }),

      removeConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId:
            state.currentConversationId === id
              ? null
              : state.currentConversationId,
          messages: state.currentConversationId === id ? [] : state.messages,
        })),
    }),
    {
      name: 'chat-storage',
      // Ne persister que l'ID de conversation
      partialize: (state) => ({
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
