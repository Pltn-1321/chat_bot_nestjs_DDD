import { Plus } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { cn } from '@/lib/utils';

/**
 * Panneau principal du chat
 * S'affiche comme un panneau latéral flottant
 */
export function ChatPanel() {
  const {
    isOpen,
    isLoading,
    messages,
    lastToolResults,
    sendMessage,
    newConversation,
  } = useChat();

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 z-40',
        'w-[400px] h-[600px] max-h-[80vh]',
        'bg-background border rounded-lg shadow-2xl',
        'flex flex-col overflow-hidden',
        'transition-all duration-300 ease-in-out',
        'transform origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistant</h3>
            <p className="text-xs opacity-80">Gestion intervenants & missions</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={newConversation}
          className="text-primary-foreground hover:bg-primary-foreground/20"
          title="Nouvelle conversation"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        toolResults={lastToolResults}
      />

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
