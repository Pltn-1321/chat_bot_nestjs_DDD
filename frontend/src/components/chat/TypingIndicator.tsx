import { cn } from '@/lib/utils';

/**
 * Indicateur de frappe moderne avec animation vague violet
 * Design glassmorphism élégant
 */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar de l'assistant */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white/80" />
      </div>

      {/* Bulle de typing */}
      <div
        className={cn(
          'glass rounded-2xl rounded-tl-sm px-4 py-3',
          'border border-violet-500/20'
        )}
      >
        <div className="flex items-center gap-1.5">
          {/* Point 1 */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-typing-wave"
            style={{ animationDelay: '0ms' }}
          />
          {/* Point 2 */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-typing-wave"
            style={{ animationDelay: '150ms' }}
          />
          {/* Point 3 */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-typing-wave"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
