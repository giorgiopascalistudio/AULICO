/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wrapper lazy del viewer 3D: three.js (+GLTFLoader) pesa centinaia di kB e
 * serve solo quando la card 3D è effettivamente renderizzata. Con React.lazy
 * il chunk viene scaricato on-demand e NON entra nel bundle iniziale
 * (fondamentale per le prestazioni mobile / PageSpeed).
 */
import React, { Suspense } from 'react';

const Inner = React.lazy(() =>
  import('./ThreeDProgress').then((m) => ({ default: m.ThreeDProgress }))
);

interface Props {
  progress: number; // 0 - 100
  modelType?: 'house' | 'solar' | 'electrical' | 'cadastral' | 'energy' | 'generic';
  height?: number | string;
  stageName?: string;
}

export const ThreeDProgress: React.FC<Props> = (props) => (
  <Suspense
    fallback={
      <div
        className="w-full flex items-center justify-center bg-[#fcfcfc]"
        style={{ height: props.height || 280 }}
      >
        <span className="text-[12px] font-semibold text-[#8a8a8a] animate-pulse">
          Caricamento modello 3D…
        </span>
      </div>
    }
  >
    <Inner {...props} />
  </Suspense>
);
