import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ToolResultDisplay } from './ToolResultDisplay';
import type { ChatMessage, ToolResult } from '@/types/chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  toolResults: ToolResult[] | null;
}

/**
 * Liste des messages avec scroll automatique
 */
export function MessageList({
  messages,
  isLoading,
  toolResults,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Message d'accueil si pas de messages */}
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg mb-2">Bonjour ! 👋</p>
            <p className="text-sm">
              Je peux vous aider à gérer les intervenants et les missions.
            </p>
            <p className="text-sm mt-2 text-muted-foreground/70">
              Essayez : "Liste les intervenants" ou "Crée une mission"
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <div key={message.id}>
            <MessageBubble message={message} />
            {/* Afficher les tools après le dernier message assistant */}
            {message.role === 'assistant' &&
              index === messages.length - 1 &&
              toolResults && <ToolResultDisplay results={toolResults} />}
          </div>
        ))}

        {/* Indicateur de chargement */}
        {isLoading && <TypingIndicator />}

        {/* Ancre pour le scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
