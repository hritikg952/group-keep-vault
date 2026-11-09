import React, { useRef, useEffect } from 'react';
import { KEEP_COLORS } from '../constants/colors';
import { Check } from 'lucide-react';

interface ColorPaletteProps {
  currentColor: string;
  onSelectColor: (colorKey: string) => void;
  onClose?: () => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  currentColor,
  onSelectColor,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-[#2d2e30] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex items-center gap-1.5 flex-wrap w-64 animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {KEEP_COLORS.map((c) => {
        const isSelected = currentColor === c.key;
        return (
          <button
            key={c.key}
            type="button"
            title={c.name}
            onClick={() => onSelectColor(c.key)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-transform hover:scale-110 ${
              c.key === 'default'
                ? 'bg-transparent border-gray-300 dark:border-gray-600'
                : `${c.lightBg} ${c.darkBg} ${c.borderLight} ${c.borderDark}`
            } ${isSelected ? 'ring-2 ring-blue-500 scale-105' : ''}`}
          >
            {isSelected && (
              <Check className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200" strokeWidth={3} />
            )}
          </button>
        );
      })}
    </div>
  );
};
