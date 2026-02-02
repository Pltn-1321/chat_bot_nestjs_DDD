import { useRef, useEffect } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ToolResultDisplay } from './ToolResultDisplay';
import { cn } from '@/lib/utils';
import type { ChatMessage, ToolResult } from '@/types/chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  toolResults: ToolResult[] | null;
}

/**
 * Message d'accueil moderne
 */
function WelcomeMessage() {
  const suggestions = [
    { icon: '👥', text: 'Liste les intervenants' },
    { icon: '➕', text: 'Crée un intervenant' },
    { icon: '📅', text: 'Missions à venir' },
    { icon: '📝', text: 'Crée une mission' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fade-in">
      {/* Icône animée */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Titre */}
      <h2 className="text-xl font-semibold text-gradient mb-2">
        Assistant IA
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-xs">
        Je peux vous aider à gérer les intervenants et les missions. Que souhaitez-vous faire ?
      </p>

      {/* Suggestions */}
      <div className="w-full space-y-2">
        <p className="text-xs text-zinc-600 mb-3 flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          Essayez ces commandes
        </p>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl',
              'bg-[#1e1e2e]/50 border border-violet-500/10',
              'hover:border-violet-500/30 hover:bg-[#1e1e2e]',
              'transition-all duration-200 text-left group',
              'animate-fade-in-up'
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="text-lg">{suggestion.icon}</span>
            <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Liste des messages avec scroll automatique
 * Design moderne avec glassmorphism
 */
export function MessageList({
  messages,
  isLoading,
  toolResults,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Filtrer les messages tool (affichés différemment)
  const displayMessages = messages.filter((m) => m.role !== 'tool');

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6"
    >
      {displayMessages.length === 0 ? (
        <WelcomeMessage />
      ) : (
        <>
          {displayMessages.map((message, index) => (
            <div key={message.id} className="space-y-3">
              <MessageBubble message={message} index={index} />

              {/* Afficher les tool results après le dernier message assistant */}
              {message.role === 'assistant' &&
                index === displayMessages.length - 1 &&
                toolResults && <ToolResultDisplay results={toolResults} />}
            </div>
          ))}

          {/* Indicateur de chargement */}
          {isLoading && <TypingIndicator />}
        </>
      )}

      {/* Ancre pour le scroll */}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
