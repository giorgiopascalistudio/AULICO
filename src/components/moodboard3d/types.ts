export type ShapeType = 'tile' | 'circle' | 'arch' | 'cylinder' | 'sphere' | 'board' | 'light-spot' | 'light-point' | 'light-directional' | 'custom-model';

export interface BoardElement {
  id: string;
  name: string;
  shape: ShapeType;
  color: string;
  textureUrl?: string;     // albedo / color map
  normalUrl?: string;      // normal map (PBR)
  roughnessUrl?: string;   // roughness map (PBR)
  textureName?: string;
  modelUrl?: string; // URL blob or base64 for custom GLTF/GLB file
  modelName?: string;
  roughness: number;
  metalness: number;
  opacity: number;
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [rx, ry, rz] in degrees
  scale: [number, number, number]; // [sx, sy, sz]
  // Light specific settings
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  lightOn?: boolean;
  // PBR Bump/Normal settings
  pbrProfile?: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal';
  pbrBumpiness?: number;
  pbrRepeat?: number;
  // Emissive / Self-lighting properties
  emissiveColor?: string;
  emissiveIntensity?: number;
  // Layer lock presets
  lockedPosition?: boolean;
  lockedMaterial?: boolean;
}

export interface MaterialTemplate {
  id: string;
  name: string;
  category: 'wood' | 'stone' | 'fabric' | 'metal' | 'glass' | 'organic';
  color: string;
  textureUrl?: string;     // albedo / color map
  normalUrl?: string;      // normal map (PBR)
  roughnessUrl?: string;   // roughness map (PBR)
  roughness: number;
  metalness: number;
  opacity?: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface ScenePreset {
  id: string;
  name: string;
  icon: string;
  ambientColor: string;
  ambientIntensity: number;
  directColor: string;
  directIntensity: number;
  bgColor: string;
  tableColor: string;
  tableRoughness: number;
}
