import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat.api';
import { useChatStore } from '@/stores/chat.store';
import type { ChatMessage } from '@/types/chat.types';

/**
 * Hook pour gérer le chat
 * Combine le store Zustand avec React Query pour les appels API
 */
export function useChat() {
  const queryClient = useQueryClient();

  const {
    isOpen,
    isLoading,
    currentConversationId,
    messages,
    lastToolResults,
    conversations,
    openChat,
    closeChat,
    toggleChat,
    setLoading,
    setCurrentConversation,
    addMessage,
    setMessages,
    setToolResults,
    clearMessages,
    setConversations,
    removeConversation,
  } = useChatStore();

  // Charger les conversations
  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    enabled: isOpen,
  });

  // Synchroniser les conversations avec le store (React Query v5)
  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data);
    }
  }, [conversationsQuery.data, setConversations]);

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: ({
      message,
      conversationId,
    }: {
      message: string;
      conversationId?: string;
    }) => chatApi.sendMessage(message, conversationId),
    onMutate: async ({ message }) => {
      // Ajouter le message utilisateur de façon optimiste
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date(),
      };
      addMessage(userMessage);
      setLoading(true);
      setToolResults(null);
    },
    onSuccess: (data) => {
      // Mettre à jour l'ID de conversation
      if (!currentConversationId) {
        setCurrentConversation(data.conversationId);
      }

      // Ajouter la réponse de l'assistant
      const assistantMessage: ChatMessage = {
        ...data.response,
        createdAt: new Date(data.response.createdAt),
      };
      addMessage(assistantMessage);

      // Stocker les résultats des tools
      if (data.toolResults) {
        setToolResults(data.toolResults);
      }

      // Rafraîchir la liste des conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Erreur envoi message:', error);
      // Ajouter un message d'erreur
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        createdAt: new Date(),
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Mutation pour supprimer une conversation
  const deleteConversationMutation = useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: (_, id) => {
      removeConversation(id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Envoyer un message
  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      sendMessageMutation.mutate({
        message: message.trim(),
        conversationId: currentConversationId || undefined,
      });
    },
    [currentConversationId, sendMessageMutation]
  );

  // Charger une conversation
  const loadConversation = useCallback(
    async (id: string) => {
      const conversation = await chatApi.getConversation(id);
      setCurrentConversation(id);
      setMessages(
        conversation.messages.map((m) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }))
      );
    },
    [setCurrentConversation, setMessages]
  );

  // Nouvelle conversation
  const newConversation = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return {
    // État
    isOpen,
    isLoading,
    currentConversationId,
    messages,
    lastToolResults,
    conversations,

    // Actions
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    loadConversation,
    newConversation,
    deleteConversation: deleteConversationMutation.mutate,
  };
}
