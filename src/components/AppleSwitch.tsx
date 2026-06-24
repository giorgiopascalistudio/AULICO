/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';

interface AppleSwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  desc?: string;
  onChange: (id: string, value: boolean) => void;
}

export const AppleSwitch: React.FC<AppleSwitchProps> = ({
  id,
  checked,
  disabled = false,
  size = 'md',
  label,
  desc,
  onChange
}) => {
  const [grabbing, setGrabbing] = useState(false);
  const startX = useRef<number | null>(null);

  const sizeClasses = {
    sm: 'w-[44px] h-[25px] [--thumb:19px] [--pad:3px]',
    md: 'w-[54px] h-[31px] [--thumb:25px] [--pad:3px]',
    lg: 'w-[64px] h-[36px] [--thumb:30px] [--pad:3px]'
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setGrabbing(true);
    startX.current = e.clientX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || !grabbing || startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 10) {
      const isRight = dx > 0;
      if (isRight !== checked) {
        onChange(id, isRight);
      }
    }
  };

  const handlePointerUp = () => {
    setGrabbing(false);
    startX.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onChange(id, !checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(id, !checked);
    }
  };

  const switchBtn = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`relative rounded-full border-none p-0 cursor-pointer transition-colors duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] ${
        sizeClasses[size]
      } ${checked ? 'bg-[#1b1b1b]' : 'bg-[#a8a8a8]'} ${grabbing ? 'cursor-grabbing' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ touchAction: 'none' }}
    >
      <span
        className={`absolute top-[var(--pad)] left-[var(--pad)] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1) ${
          checked
            ? 'translate-x-[calc(var(--w,54px)-var(--thumb,25px)-var(--pad,3px)*2)]'
            : 'translate-x-0'
        } ${grabbing ? 'w-[calc(var(--thumb)+6px)]' : 'w-[var(--thumb)]'} h-[var(--thumb)]`}
        style={{
          '--w': size === 'sm' ? '44px' : size === 'lg' ? '64px' : '54px'
        } as React.CSSProperties}
      />
    </button>
  );

  if (!label && !desc) return switchBtn;

  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {switchBtn}
      <span className="flex flex-col gap-[1px]">
        {label && <span className="text-[14px] font-semibold text-[#161616]">{label}</span>}
        {desc && <span className="text-[12px] text-[#8a8a8a]">{desc}</span>}
      </span>
    </label>
  );
};
