import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Paperclip, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Champ de saisie moderne et épuré
 * Design floating avec auto-resize et animations
 */
export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Écrivez votre message...',
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize du textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = !input.trim();

  return (
    <div className="p-4 bg-[#13131f]/80 backdrop-blur-xl border-t border-violet-500/10">
      <div
        className={cn(
          'relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-300',
          'bg-[#1e1e2e] border',
          isFocused
            ? 'border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.1)]'
            : 'border-violet-500/10 hover:border-violet-500/20'
        )}
      >
        {/* Bouton pièce jointe (optionnel) */}
        <button
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            'text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10',
            'transition-all duration-200'
          )}
          title="Joindre un fichier"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Zone de texte */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600',
            'resize-none py-2.5 px-1',
            'focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[120px]'
          )}
        />

        {/* Bouton envoi */}
        <button
          onClick={handleSend}
          disabled={disabled || isEmpty}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            'transition-all duration-200',
            isEmpty
              ? 'text-zinc-600 cursor-not-allowed'
              : [
                  'bg-violet-600 text-white',
                  'hover:bg-violet-500 hover:scale-105',
                  'shadow-lg shadow-violet-600/25',
                  'active:scale-95',
                ]
          )}
        >
          {disabled ? (
            <Sparkles className="w-4 h-4 animate-pulse" />
          ) : (
            <Send className={cn('w-4 h-4', !isEmpty && 'animate-fade-in')} />
          )}
        </button>
      </div>

      {/* Indicateur de raccourci clavier */}
      <div className="flex justify-between items-center mt-2 px-1">
        <span className="text-[10px] text-zinc-600">
          Entrée pour envoyer • Maj+Entrée pour nouvelle ligne
        </span>
        {disabled && (
          <span className="text-[10px] text-violet-400/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            L'assistant réfléchit...
          </span>
        )}
      </div>
    </div>
  );
}
