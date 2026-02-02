import { useCallback } from 'react';
import { Plus, PanelRightClose } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { AssistantAvatar } from './Avatar';
import { ResizeHandle } from './ResizeHandle';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  width: number;
  onResize: (delta: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const MIN_WIDTH = 350;
const MAX_WIDTH = 800;

/**
 * Panneau de chat moderne avec Split View
 * Design glassmorphism violet sombre
 */
export function ChatPanel({
  width,
  onResize,
  isCollapsed,
  onToggleCollapse,
}: ChatPanelProps) {
  const { isLoading, messages, lastToolResults, sendMessage, newConversation } = useChat();

  const handleResize = useCallback(
    (delta: number) => {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width + delta));
      onResize(newWidth - width);
    },
    [width, onResize]
  );

  if (isCollapsed) {
    return (
      <div className="flex-shrink-0 flex flex-col items-center py-4 border-l border-violet-500/10 bg-[#13131f]">
        <button
          onClick={onToggleCollapse}
          className={cn(
            'p-3 rounded-xl text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10',
            'transition-all duration-200'
          )}
          title="Ouvrir le chat"
        >
          <PanelRightClose className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Poignée de redimensionnement */}
      <ResizeHandle onResize={handleResize} />

      {/* Panneau de chat */}
      <div
        className={cn(
          'flex-shrink-0 flex flex-col h-full',
          'bg-[#13131f] border-l border-violet-500/10',
          'transition-all duration-300 ease-out'
        )}
        style={{ width }}
      >
        {/* Header */}
        <header
          className={cn(
            'flex items-center justify-between px-4 py-3',
            'border-b border-violet-500/10',
            'bg-gradient-to-r from-[#13131f] via-[#1a1a2e] to-[#13131f]'
          )}
        >
          {/* Info assistant */}
          <div className="flex items-center gap-3">
            <AssistantAvatar />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Assistant IA
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">
                    En ligne
                  </span>
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Gestion intervenants & missions
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Nouvelle conversation */}
            <button
              onClick={newConversation}
              className={cn(
                'p-2 rounded-lg text-zinc-500 hover:text-violet-400',
                'hover:bg-violet-500/10 transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={isLoading}
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Toggle collapse */}
            <button
              onClick={onToggleCollapse}
              className={cn(
                'p-2 rounded-lg text-zinc-500 hover:text-zinc-300',
                'hover:bg-zinc-500/10 transition-all duration-200'
              )}
              title="Réduire le panneau"
            >
              <PanelRightClose className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </header>

        {/* Liste des messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          toolResults={lastToolResults}
        />

        {/* Zone de saisie */}
        <MessageInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </>
  );
}
