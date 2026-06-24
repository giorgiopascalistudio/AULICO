/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface SmartAnimateTextProps {
  value: string | number;
  gap?: number;
  className?: string;
  digitClassName?: string;
  staggerDelay?: number;
  enterStiffness?: number;
  enterDamping?: number;
  direction?: 'dynamic' | 'up' | 'down';
  enterY?: number;
  enterBlur?: number;
  enterScale?: number;
}

export const SmartAnimateText: React.FC<SmartAnimateTextProps> = ({
  value,
  gap = 1,
  className = '',
  digitClassName = '',
  staggerDelay = 0.04,
  enterStiffness = 170,
  enterDamping = 16,
  direction = 'dynamic',
  enterY = 16,
  enterBlur = 4,
  enterScale = 0.8
}) => {
  const stringVal = String(value);
  const prevValRef = useRef<string>('');
  const [computedDir, setComputedDir] = useState<'up' | 'down'>('up');

  useEffect(() => {
    const prev = prevValRef.current;
    if (prev && prev !== stringVal) {
      if (direction === 'up') {
        setComputedDir('up');
      } else if (direction === 'down') {
        setComputedDir('down');
      } else {
        const prevNum = parseFloat(prev.replace(/[^0-9.-]/g, ''));
        const nextNum = parseFloat(stringVal.replace(/[^0-9.-]/g, ''));
        if (!isNaN(prevNum) && !isNaN(nextNum)) {
          setComputedDir(nextNum >= prevNum ? 'up' : 'down');
        } else {
          setComputedDir(stringVal.localeCompare(prev) >= 0 ? 'up' : 'down');
        }
      }
    }
    prevValRef.current = stringVal;
  }, [stringVal, direction]);

  const prev = prevValRef.current;
  const chars = stringVal.split('');
  let changedCount = 0;

  return (
    <span
      className={`inline-flex items-baseline font-variant-numeric-tabular-nums select-none ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {chars.map((char, idx) => {
        const same = prev[idx] === char;
        const isAlphanumeric = /[0-9A-Za-z]/.test(char);

        if (isAlphanumeric && !same) {
          changedCount++;
          const delay = changedCount * staggerDelay;
          const yOffset = computedDir === 'up' ? enterY : -enterY;

          return (
            <span
              key={`${idx}-${char}`}
              className={`inline-block relative overflow-hidden h-[1.25em] ${digitClassName}`}
            >
              <motion.span
                initial={{
                  opacity: 0,
                  y: yOffset,
                  filter: `blur(${enterBlur}px)`,
                  scale: enterScale
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  scale: 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: enterStiffness,
                  damping: enterDamping,
                  delay: delay
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            </span>
          );
        }

        return (
          <span key={`${idx}-static`} className="inline-block">
            {char}
          </span>
        );
      })}
    </span>
  );
};

// Also keep the existing SmartText name exported for safe seamless integration:
export const SmartText: React.FC<{ value: string | number; className?: string; dir?: 'up' | 'down' }> = ({
  value,
  className = '',
  dir = 'up'
}) => {
  return (
    <SmartAnimateText
      value={value}
      className={className}
      direction={dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'dynamic'}
    />
  );
};

export const injectSmartTextStyles = () => {
  // Empty stub to prevent errors since we're now using high performance motion library instead of pure CSS keyframes!
};
