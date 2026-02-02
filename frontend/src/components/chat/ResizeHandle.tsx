import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  className?: string;
}

/**
 * Poignée de redimensionnement entre les panneaux
 * Style moderne avec indicateur visuel
 */
export function ResizeHandle({ onResize, className }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onResize]);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-4 cursor-col-resize select-none z-50',
        'transition-colors duration-200',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Zone invisible élargie pour faciliter la capture */}
      <div className="absolute inset-0 w-full h-full" />

      {/* Ligne centrale avec effet glow */}
      <div
        className={cn(
          'w-px h-12 rounded-full transition-all duration-200',
          isDragging
            ? 'bg-violet-400 w-0.5 shadow-[0_0_10px_rgba(139,92,246,0.8)]'
            : isHovered
              ? 'bg-violet-500/50 w-0.5'
              : 'bg-violet-500/20'
        )}
      />

      {/* Points indicateurs */}
      <div
        className={cn(
          'absolute flex flex-col gap-1 transition-opacity duration-200',
          isDragging || isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="w-1 h-1 rounded-full bg-violet-400" />
        <div className="w-1 h-1 rounded-full bg-violet-400" />
        <div className="w-1 h-1 rounded-full bg-violet-400" />
      </div>
    </div>
  );
}
