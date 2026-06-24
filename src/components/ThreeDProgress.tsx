/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ThreeDProgress – viewer del modello reale a 13 step (GLB).
 * I file vanno in  public/model/step-01.glb … step-13.glb
 * e vengono serviti da  <base>/model/step-XX.glb  su GitHub Pages.
 *
 * Comportamento conservato dalla versione precedente:
 *  - 13 step mappati sulla % di avanzamento (0% → step 1, 100% → step 13)
 *  - scala UNIFORME: ogni step appare grande uguale (TARGET ≈ 7.4)
 *  - camera ravvicinata (r ≈ 7.6)
 *  - fallback automatico allo step 3 se un file è vuoto/assente
 *  - rotazione con dito/mouse + auto-rotazione
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SmartText } from './SmartText';
import { useLang } from '../i18n';

interface ThreeDProgressProps {
  progress: number; // 0 - 100
  modelType?: 'house' | 'solar' | 'electrical' | 'cadastral' | 'energy' | 'generic';
  height?: number | string;
  stageName?: string;
}

interface StageConfig {
  key: string;
  label: string;
  min: number;
  next: number;
  transient?: boolean;
}

// Etichette di fase (usate solo per il testo dell'overlay)
export const THREE_STAGES: Record<string, StageConfig[]> = {
  house: [
    { key: 'sito', label: 'Sopralluogo & rilievo', min: 0, next: 15 },
    { key: 'fond', label: 'Fondazioni', min: 15, next: 32 },
    { key: 'str', label: 'Struttura', min: 32, next: 50 },
    { key: 'muri', label: 'Murature', min: 50, next: 68 },
    { key: 'tetto', label: 'Copertura', min: 68, next: 84 },
    { key: 'inf', label: 'Infissi & dettagli', min: 84, next: 100 },
    { key: 'fin', label: 'Casa finita', min: 100, next: 101 }
  ],
  solar: [
    { key: 'ctx', label: 'Sopralluogo & analisi consumi', min: 0, next: 15 },
    { key: 'prog', label: 'Progetto FV', min: 15, next: 32 },
    { key: 'rail', label: 'Strutture di montaggio', min: 32, next: 50 },
    { key: 'mod', label: 'Posa moduli', min: 50, next: 68 },
    { key: 'inv', label: 'Inverter & cablaggio', min: 68, next: 84 },
    { key: 'on', label: 'Attivazione impianto', min: 84, next: 101 }
  ],
  electrical: [
    { key: 'amb', label: 'Sopralluogo tecnico', min: 0, next: 20 },
    { key: 'quadro', label: 'Quadro elettrico', min: 20, next: 40 },
    { key: 'cavi', label: 'Cavidotti', min: 40, next: 60 },
    { key: 'punti', label: 'Punti luce & prese', min: 60, next: 80 },
    { key: 'on', label: 'Collaudo', min: 80, next: 101 }
  ],
  cadastral: [
    { key: 'ril', label: 'Sopralluogo & misurazioni', min: 0, next: 30 },
    { key: 'part', label: 'Particella', min: 30, next: 60 },
    { key: 'fab', label: 'Fabbricato', min: 60, next: 90 },
    { key: 'doc', label: 'Presentazione pratica', min: 90, next: 101 }
  ],
  energy: [
    { key: 'ctx', label: 'Sopralluogo & dati edificio', min: 0, next: 25 },
    { key: 'diag', label: 'Diagnosi energetica', min: 25, next: 50 },
    { key: 'capp', label: 'Interventi (isolamento)', min: 50, next: 75 },
    { key: 'cert', label: 'Certificato APE', min: 75, next: 101 }
  ],
  generic: [
    { key: 'base', label: 'Avvio', min: 0, next: 20 },
    { key: 's1', label: 'In lavorazione', min: 20, next: 40 },
    { key: 's2', label: 'Sviluppo', min: 40, next: 60 },
    { key: 's3', label: 'Verifica', min: 60, next: 80 },
    { key: 'top', label: 'Completato', min: 80, next: 101 }
  ]
};

export const getStageInfo = (model: keyof typeof THREE_STAGES, pc: number): StageConfig => {
  const list = THREE_STAGES[model] || THREE_STAGES.generic;
  let active = list[0];
  for (const st of list) {
    if (pc >= st.min) active = st;
  }
  return active;
};

// ---- Configurazione modello GLB (come nella versione precedente) ----
const STEP_COUNT = 13;
const TARGET = 7.4;        // dimensione visiva uniforme di ogni step
const CAM_R = 7.6;         // raggio camera (più vicina)
const FALLBACK_STEP = 3;   // step usato se quello richiesto è vuoto/assente
const MODEL_BASE = `${import.meta.env.BASE_URL}model/`;

// % avanzamento → numero step (1..13)
const stepForPct = (pct: number): number => {
  const p = Math.max(0, Math.min(100, pct));
  return Math.max(1, Math.min(STEP_COUNT, 1 + Math.round((p / 100) * (STEP_COUNT - 1))));
};

const stepUrl = (n: number) => `${MODEL_BASE}step-${String(n).padStart(2, '0')}.glb`;

export const ThreeDProgress: React.FC<ThreeDProgressProps> = ({
  progress,
  modelType = 'house',
  height = '340px',
  stageName
}) => {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(progress);
  const loadStepRef = useRef<(n: number) => void>(() => {});
  const shownStepRef = useRef<number>(-1);

  progressRef.current = progress;

  // ---- Setup scena (una sola volta al mount) ----
  useEffect(() => {
    if (!containerRef.current) return;
    const host = containerRef.current;

    const computedW = () => host.clientWidth || 340;
    const computedH = () => host.clientHeight || 340;
    let width = computedW();
    let heightVal = computedH();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, heightVal);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Preserva eventuali overlay già montati (non distruttivo)
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / heightVal, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbdbdbd, 0.72));
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(8, 14, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.radius = 3;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-8, 6, 4);
    scene.add(fillLight);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // Disco di terra leggero per ricevere ombra
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.5, 0.2, 48),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.98 })
    );
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    pivot.add(ground);

    // ---- Caricamento / cache modelli GLB ----
    const loader = new GLTFLoader();
    const cache: Record<number, THREE.Group> = {};
    let currentModel: THREE.Group | null = null;
    let disposed = false;

    const hasMesh = (root: THREE.Object3D): boolean => {
      let found = false;
      root.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) found = true;
      });
      return found;
    };

    // Normalizza: centra e scala in modo UNIFORME a TARGET, appoggia a terra
    const normalize = (root: THREE.Group) => {
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const s = TARGET / maxDim;
      root.scale.setScalar(s);
      // Ricalcola dopo lo scale per riallineare a terra e al centro
      const box2 = new THREE.Box3().setFromObject(root);
      const c2 = new THREE.Vector3();
      box2.getCenter(c2);
      root.position.x -= c2.x;
      root.position.z -= c2.z;
      root.position.y -= box2.min.y; // base appoggiata sul terreno
      root.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
    };

    const swapTo = (model: THREE.Group, stepNo: number) => {
      if (disposed) return;
      if (currentModel) pivot.remove(currentModel);
      currentModel = model;
      pivot.add(model);
      shownStepRef.current = stepNo;
    };

    const display = (stepNo: number) => {
      if (disposed) return;
      if (cache[stepNo]) {
        swapTo(cache[stepNo], stepNo);
        return;
      }
      loader.load(
        stepUrl(stepNo),
        (gltf) => {
          if (disposed) return;
          let group = gltf.scene as unknown as THREE.Group;
          // Fallback: file vuoto → usa step 3
          if (!hasMesh(group) && stepNo !== FALLBACK_STEP) {
            if (cache[FALLBACK_STEP]) {
              cache[stepNo] = cache[FALLBACK_STEP];
              swapTo(cache[FALLBACK_STEP], stepNo);
              return;
            }
            loader.load(
              stepUrl(FALLBACK_STEP),
              (g2) => {
                if (disposed) return;
                const fb = g2.scene as unknown as THREE.Group;
                normalize(fb);
                cache[FALLBACK_STEP] = fb;
                cache[stepNo] = fb;
                swapTo(fb, stepNo);
              },
              undefined,
              () => {}
            );
            return;
          }
          normalize(group);
          cache[stepNo] = group;
          swapTo(group, stepNo);
        },
        undefined,
        () => {
          // File assente → prova il fallback
          if (stepNo !== FALLBACK_STEP) display(FALLBACK_STEP);
        }
      );
    };

    loadStepRef.current = display;
    // primo caricamento in base alla % attuale
    display(stepForPct(progressRef.current));

    // ---- Controlli rotazione ----
    const dom = renderer.domElement;
    let azim = 0.6;
    let elev = 0.18;
    let dragging = false;
    let autoRot = true;
    let lastX = 0;
    let lastY = 0;
    let idleT = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      autoRot = false;
      idleT = 0;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      lastX = x; lastY = y;
    };
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = (x - lastX) / width;
      const dy = (y - lastY) / heightVal;
      lastX = x; lastY = y;
      azim -= dx * 3.14;
      elev = Math.max(-0.15, Math.min(0.65, elev + dy * 1.5));
    };
    const onPointerUp = () => { dragging = false; };

    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown as any, { passive: true });
    window.addEventListener('touchmove', onPointerMove as any, { passive: false });
    window.addEventListener('touchend', onPointerUp as any);

    // ---- Loop ----
    let lastTime = performance.now();
    let frameId = 0;
    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      idleT += dt;
      if (!dragging && idleT > 2.2) autoRot = true;
      if (autoRot) azim += dt * 0.15;

      camera.position.x = Math.cos(azim) * CAM_R;
      camera.position.z = Math.sin(azim) * CAM_R;
      camera.position.y = 3.2 + elev * 6;
      camera.lookAt(0, 1.6, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      width = computedW();
      heightVal = computedH();
      renderer.setSize(width, heightVal);
      camera.aspect = width / heightVal;
      camera.updateProjectionMatrix();
    });
    ro.observe(host);

    // ---- Cleanup ----
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      try { ro.disconnect(); } catch (_) {}
      dom.removeEventListener('mousedown', onPointerDown as any);
      window.removeEventListener('mousemove', onPointerMove as any);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown as any);
      window.removeEventListener('touchmove', onPointerMove as any);
      window.removeEventListener('touchend', onPointerUp);

      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose?.();
          const mat = m.material as any;
          if (Array.isArray(mat)) mat.forEach((x) => x?.dispose?.());
          else mat?.dispose?.();
        }
      });
      renderer.dispose();
      if (canvas.parentElement === host) host.removeChild(canvas);
    };
  }, []); // setup unico

  // ---- Reagisce alla % di avanzamento → cambia step ----
  useEffect(() => {
    progressRef.current = progress;
    const target = stepForPct(progress);
    if (target !== shownStepRef.current) {
      loadStepRef.current(target);
    }
  }, [progress]);

  const activeStage = getStageInfo(modelType, progress);

  return (
    <div className="relative rounded-3xl overflow-hidden w-full select-none" style={{ height }}>
      {/* Contenitore ThreeJS */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* Overlay dettagli (identico a prima) */}
      <div className="absolute inset-x-[22px] bottom-[20px] flex items-end justify-between gap-4 pointer-events-none z-10 flex-wrap">
        <div>
          <div className="text-[12px] tracking-widest uppercase text-[#1b1b1b] font-bold mb-1 flex items-center gap-[7px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-[15px] h-[15px]">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            </svg>
            {stageName || t('t3d.' + modelType + '.' + activeStage.key)}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[34px] font-extrabold tracking-tighter leading-[0.95] text-[#161616]">
            <SmartText value={`${progress}%`} />
          </div>
          <div className="w-[120px] h-[6px] rounded-full bg-white/50 border border-black/10 overflow-hidden mt-2">
            <div className="h-full rounded-full bg-[#1b1b1b]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
