import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

/**
 * Bouton flottant pour ouvrir/fermer le chat
 * Positionné en bas à droite de l'écran
 */
export function FloatingChatButton() {
  const { isOpen, toggleChat } = useChat();

  return (
    <Button
      onClick={toggleChat}
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 hover:shadow-xl',
        'z-50',
        isOpen && 'bg-destructive hover:bg-destructive/90'
      )}
      size="icon"
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <MessageCircle className="h-6 w-6" />
      )}
    </Button>
  );
}
