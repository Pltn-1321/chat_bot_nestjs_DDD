import { apiClient } from './client';
import type {
  Conversation,
  SendMessageResponse,
} from '@/types/chat.types';

/**
 * API du chat
 */
export const chatApi = {
  /**
   * Envoyer un message au chatbot
   */
  sendMessage: async (
    message: string,
    conversationId?: string
  ): Promise<SendMessageResponse> => {
    const params = conversationId ? `?conversationId=${conversationId}` : '';
    const { data } = await apiClient.post<SendMessageResponse>(
      `/chat/message${params}`,
      { message }
    );
    return data;
  },

  /**
   * Récupérer toutes les conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await apiClient.get<Conversation[]>('/chat/conversations');
    return data;
  },

  /**
   * Récupérer une conversation par ID
   */
  getConversation: async (id: string): Promise<Conversation> => {
    const { data } = await apiClient.get<Conversation>(
      `/chat/conversations/${id}`
    );
    return data;
  },

  /**
   * Supprimer une conversation
   */
  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/chat/conversations/${id}`);
  },
};
