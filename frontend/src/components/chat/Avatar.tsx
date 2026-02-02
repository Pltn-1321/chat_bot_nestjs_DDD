import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { MessageRole } from '@/types/chat.types';

interface AvatarProps {
  role: MessageRole;
  className?: string;
}

/**
 * Avatar moderne pour les messages
 * Assistant: Icône robot avec halo violet
 * Utilisateur: Icône utilisateur sobre
 * Tool: Icône outil
 */
export function Avatar({ role, className }: AvatarProps) {
  if (role === 'assistant') {
    return (
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-violet-500 to-violet-700',
          'shadow-lg shadow-violet-500/25',
          className
        )}
      >
        <Bot className="w-4 h-4 text-white" />
      </div>
    );
  }

  if (role === 'tool') {
    return (
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
          'bg-emerald-600/20 border border-emerald-500/30',
          className
        )}
      >
        <span className="text-emerald-400 text-xs font-mono">T</span>
      </div>
    );
  }

  // User
  return (
    <div
      className={cn(
        'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
        'bg-zinc-700/50 border border-zinc-600/30',
        className
      )}
    >
      <User className="w-4 h-4 text-zinc-400" />
    </div>
  );
}

/**
 * Avatar avec halo animé pour l'assistant (effet "en ligne")
 */
export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Halo animé */}
      <div className="absolute inset-0 rounded-xl bg-violet-500/20 animate-pulse-glow" />

      {/* Avatar principal */}
      <div
        className={cn(
          'relative w-8 h-8 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-violet-500 to-violet-700',
          'shadow-lg shadow-violet-500/30'
        )}
      >
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* Indicateur de statut */}
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#13131f]" />
    </div>
  );
}
