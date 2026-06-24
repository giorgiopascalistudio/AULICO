/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, PinOff } from 'lucide-react';

interface PinnedListProps<T> {
  items: T[];
  pinnedIds: string[];
  getId: (item: T) => string;
  onTogglePin: (id: string) => void;
  renderItem: (item: T, isPinned: boolean) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function PinnedList<T>({
  items,
  pinnedIds,
  getId,
  onTogglePin,
  renderItem,
  className = '',
  emptyMessage = 'Nessun elemento presente'
}: PinnedListProps<T>) {
  // Sort items: pinned first, then unpinned
  const sortedItems = [...items].sort((a, b) => {
    const idA = getId(a);
    const idB = getId(b);
    const pinA = pinnedIds.includes(idA);
    const pinB = pinnedIds.includes(idB);
    if (pinA && !pinB) return -1;
    if (!pinA && pinB) return 1;
    return 0;
  });

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <AnimatePresence mode="popLayout">
        {sortedItems.length > 0 ? (
          sortedItems.map(item => {
            const id = getId(item);
            const isPinned = pinnedIds.includes(id);

            return (
              <motion.div
                key={id}
                layoutId={`pinned-item-${id}`}
                layout="position"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 38
                }}
                className="group relative flex items-center justify-between p-3.5 bg-white border border-[#e2e2e2] rounded-[18px] hover:border-[#161616] transition-colors focus-within:ring-2 focus-within:ring-black/5"
              >
                <div className="flex-1 min-w-0 pr-10">
                  {renderItem(item, isPinned)}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(id);
                  }}
                  title={isPinned ? 'Rimuovi dai messi in evidenza' : 'Metti in evidenza'}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isPinned
                      ? 'bg-orange-50 text-orange-600 opacity-100'
                      : 'bg-gray-50 text-[#8a8a8a] opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-[#161616]'
                  }`}
                >
                  {isPinned ? (
                    <PinOff className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Pin className="w-3.5 h-3.5" />
                  )}
                </button>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-[#8a8a8a] text-[13.5px] italic">
            {emptyMessage}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
