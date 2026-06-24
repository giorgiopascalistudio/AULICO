/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

interface ModalProps {
  title: string;
  subtitle?: string | null;
  isOpen: boolean;
  onClose: () => void;
  wide?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  isOpen,
  onClose,
  wide = false,
  footer,
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-[fadeIn_0.18s_ease_both]">
      <div
        className={`bg-white border border-[#e2e2e2] rounded-t-[26px] sm:rounded-[26px] w-full shadow-2xl mt-auto sm:mt-0 mb-0 sm:my-auto pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 animate-[popIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both] ${
          wide ? 'sm:max-w-[680px]' : 'sm:max-w-[520px]'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center gap-3 px-5 md:px-6 pt-5 pb-3">
          <div className="text-left min-w-0 flex-1">
            <h2 className="font-semibold text-[21px] tracking-tight text-[#161616] m-0">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-[#8a8a8a] mt-[2px] mb-0 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-[38px] h-[38px] md:w-[34px] md:h-[34px] rounded-lg flex items-center justify-center text-[#8a8a8a] hover:bg-[#ececec] hover:text-[#161616] transition-colors cursor-pointer"
            aria-label="Chiudi"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 md:px-6 py-2 max-h-[68vh] md:max-h-[62vh] overflow-y-auto text-left">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex gap-2.5 px-5 md:px-6 pt-4 pb-5 justify-end flex-wrap border-t border-[#f5f5f5] mt-4">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.985);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
