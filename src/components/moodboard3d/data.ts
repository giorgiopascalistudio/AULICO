import { MaterialTemplate, ColorPalette, ScenePreset, BoardElement } from './types';

// Texture PBR ottimizzate (public/mb-textures/<id>/{color,normal,rough}.jpg) — vedi scripts/optimize-mb-textures.mjs
const MB = import.meta.env.BASE_URL + 'mb-textures/';
const pbr = (id: string) => ({
  textureUrl: `${MB}${id}/color.jpg`,
  normalUrl: `${MB}${id}/normal.jpg`,
  roughnessUrl: `${MB}${id}/rough.jpg`
});

export const EXQUISITE_MATERIALS: MaterialTemplate[] = [
  // LEGNI
  { id: 'leg-rovere', name: 'Rovere Naturale', category: 'wood', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('leg-rovere') },
  { id: 'leg-parquet', name: 'Parquet Rovere', category: 'wood', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('leg-parquet') },
  { id: 'leg-doghe', name: 'Doghe in Legno', category: 'wood', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('leg-doghe') },

  // PIETRE & PAVIMENTI
  { id: 'pie-marmo', name: 'Marmo', category: 'stone', color: '#ffffff', roughness: 1, metalness: 0.1, ...pbr('pie-marmo') },
  { id: 'pie-onice', name: 'Onice', category: 'stone', color: '#ffffff', roughness: 1, metalness: 0.1, ...pbr('pie-onice') },
  { id: 'pie-cemento', name: 'Cemento', category: 'stone', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('pie-cemento') },

  // TESSUTI
  { id: 'tes-lino', name: 'Lino', category: 'fabric', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('tes-lino') },
  { id: 'tes-boucle', name: 'Bouclé', category: 'fabric', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('tes-boucle') },
  { id: 'tes-velluto', name: 'Velluto', category: 'fabric', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('tes-velluto') },

  // PELLE
  { id: 'pel-cuoio', name: 'Cuoio', category: 'fabric', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('pel-cuoio') },
  { id: 'pel-nabuk', name: 'Pelle Nabuk', category: 'fabric', color: '#ffffff', roughness: 1, metalness: 0, ...pbr('pel-nabuk') },

  // METALLI
  { id: 'met-acciaio', name: 'Acciaio', category: 'metal', color: '#ffffff', roughness: 1, metalness: 0.9, ...pbr('met-acciaio') },
  { id: 'met-spazzolato', name: 'Metallo Spazzolato', category: 'metal', color: '#ffffff', roughness: 1, metalness: 0.9, ...pbr('met-spazzolato') },
  { id: 'met-grezzo', name: 'Metallo Grezzo', category: 'metal', color: '#ffffff', roughness: 1, metalness: 0.85, ...pbr('met-grezzo') },

  // VETRI (senza texture: resa fisica)
  { id: 'mat-fluted', name: 'Vetro Cannettato', category: 'glass', color: '#e0f0f0', roughness: 0.15, metalness: 0.9, opacity: 0.65 },
  { id: 'mat-smoked', name: 'Vetro Fumè', category: 'glass', color: '#322d28', roughness: 0.1, metalness: 0.85, opacity: 0.75 }
];

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'pal-neutral',
    name: 'Symphony Neutra (Bouclé, Rovere, Marmo)',
    colors: ['#F5F5F4', '#E7E5E4', '#D6D3D1', '#A8A29E', '#78716C', '#44403C']
  },
  {
    id: 'pal-earth',
    name: 'Terre Calde di Toscana',
    colors: ['#E6DFD3', '#D3C2AF', '#B29B82', '#A36E51', '#804E35', '#4E3120']
  },
  {
    id: 'pal-forest',
    name: 'Sottobosco e Salvia Marina',
    colors: ['#E2E8F0', '#CBD5E1', '#8FA89B', '#5A7D69', '#3B5245', '#1E2923']
  },
  {
    id: 'pal-minimalist',
    name: 'Contrasti d\'Architettura',
    colors: ['#FFFFFF', '#F1F5F9', '#94A3B8', '#475569', '#1E293B', '#0F172A']
  }
];

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'scene-giorno',
    name: 'Giorno (Luce Naturale)',
    icon: 'Sun',
    ambientColor: '#EAEAE5',
    ambientIntensity: 0.9,
    directColor: '#FFFDF0',
    directIntensity: 1.6,
    bgColor: '#EAEAE5',
    tableColor: '#D1D1C7',
    tableRoughness: 0.8
  },
  {
    id: 'scene-notte',
    name: 'Notte (Chiaro di luna)',
    icon: 'Moon',
    ambientColor: '#1A2233',
    ambientIntensity: 0.25,
    directColor: '#A5C0E6',
    directIntensity: 0.7,
    bgColor: '#0C0F14',
    tableColor: '#121720',
    tableRoughness: 0.55
  },
  {
    id: 'scene-interno',
    name: 'Interno (Showroom Accogliente)',
    icon: 'Sunset',
    ambientColor: '#423225',
    ambientIntensity: 0.65,
    directColor: '#FFA347',
    directIntensity: 1.4,
    bgColor: '#1F1712',
    tableColor: '#281E18',
    tableRoughness: 0.85
  }
];

export const DEFAULT_BOARD_ELEMENTS: BoardElement[] = [
  {
    id: 'default-marmo',
    name: 'Marmo (Campione)',
    shape: 'tile',
    color: '#ffffff',
    ...pbr('pie-marmo'),
    textureName: 'Marmo',
    roughness: 1,
    metalness: 0.1,
    opacity: 1,
    position: [-1.2, 0.02, -0.6],
    rotation: [0, -15, 0],
    scale: [1.6, 0.04, 2.2]
  },
  {
    id: 'default-oak',
    name: 'Listello Rovere',
    shape: 'tile',
    color: '#ffffff',
    ...pbr('leg-rovere'),
    textureName: 'Rovere Naturale',
    roughness: 1,
    metalness: 0,
    opacity: 1,
    position: [0.3, 0.03, -0.8],
    rotation: [0, 8, 0],
    scale: [0.6, 0.06, 2.6]
  },
  {
    id: 'default-velvet',
    name: 'Cerchio Velluto',
    shape: 'circle',
    color: '#ffffff',
    ...pbr('tes-velluto'),
    textureName: 'Velluto',
    roughness: 1,
    metalness: 0,
    opacity: 1,
    position: [-0.1, 0.04, 0.6],
    rotation: [0, 45, 0],
    scale: [1.4, 0.08, 1.4]
  },
  {
    id: 'default-brass',
    name: 'Dettaglio Ottone',
    shape: 'cylinder',
    color: '#dfb76c',
    roughness: 0.25,
    metalness: 0.95,
    opacity: 1,
    position: [1.3, 0.10, 0.4],
    rotation: [0, 0, 0],
    scale: [0.4, 0.2, 0.4]
  }
];
