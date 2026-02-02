import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import type { ChatMessage } from '@/types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  index?: number;
}

/**
 * Bulle de message moderne avec avatars
 * Design glassmorphism pour l'assistant, dégradé subtil pour l'utilisateur
 */
export function MessageBubble({ message, index = 0 }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const animationDelay = index * 0.05;

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Avatar */}
      <Avatar role={message.role} />

      {/* Contenu du message */}
      <div
        className={cn(
          'flex flex-col max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Nom du rôle */}
        <span className="text-xs text-zinc-500 mb-1 px-1">
          {isUser ? 'Vous' : 'Assistant'}
        </span>

        {/* Bulle */}
        <div
          className={cn(
            'relative px-4 py-2.5 text-sm leading-relaxed',
            'transition-all duration-300',
            isUser
              ? [
                  'bg-violet-600 text-white',
                  'rounded-2xl rounded-tr-sm',
                  'shadow-lg shadow-violet-600/20',
                ]
              : [
                  'glass text-zinc-100',
                  'rounded-2xl rounded-tl-sm',
                  'border border-violet-500/20',
                ]
          )}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <span className="italic text-zinc-400">Message vide</span>
          )}
        </div>

        {/* Heure du message (si disponible) */}
        <span className="text-[10px] text-zinc-600 mt-1 px-1">
          {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
