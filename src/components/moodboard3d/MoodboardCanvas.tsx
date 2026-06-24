import React, { useRef, useEffect, useState, useLayoutEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BoardElement, TransformMode, ScenePreset } from './types';
import { getProceduralNormalMap } from './utils';

// Error boundary per-modello: se un .glb/.gltf non carica (es. blob: scaduto, file corrotto)
// mostra un placeholder al posto di far fallire l'intera scena 3D.
class ModelBoundary extends React.Component<{ color?: string; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: any) { console.warn('Modello 3D non caricato:', err?.message || err); }
  render() {
    if (this.state.failed) {
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color={this.props.color || '#cccccc'} roughness={0.9} wireframe />
        </mesh>
      );
    }
    return this.props.children;
  }
}

// Auxiliary helper to safely render loaded .gltf/.glb models and transfer physical material properties on them
function CustomModelRenderer({ 
  modelUrl, 
  color, 
  roughness, 
  metalness, 
  opacity,
  emissiveColor,
  emissiveIntensity
}: { 
  modelUrl: string; 
  color: string; 
  roughness: number; 
  metalness: number; 
  opacity: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  // Clone to avoid sharing material states between multiple instances of the same loaded model
  const clonedScene = React.useMemo(() => gltf.scene.clone(), [gltf]);

  useEffect(() => {
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = roughness;
          child.material.metalness = metalness;
          child.material.opacity = opacity;
          child.material.transparent = opacity < 1;
          
          if (color && color.toLowerCase() !== '#ffffff') {
            child.material.color.set(color);
          }
          
          if (emissiveIntensity && emissiveIntensity > 0) {
            child.material.emissive = new THREE.Color(emissiveColor || color);
            child.material.emissiveIntensity = emissiveIntensity;
          } else {
            child.material.emissive = new THREE.Color('#000000');
            child.material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [clonedScene, color, roughness, metalness, opacity, emissiveColor, emissiveIntensity]);

  return <primitive object={clonedScene} />;
}

// Helper component to load textures safely with PBR normal mapping
function SafeMaterial({
  textureUrl,
  normalUrl,
  roughnessUrl,
  color,
  roughness,
  metalness,
  opacity,
  pbrProfile,
  pbrBumpiness,
  pbrRepeat,
  emissiveColor,
  emissiveIntensity
}: {
  textureUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  pbrProfile?: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal';
  pbrBumpiness?: number;
  pbrRepeat?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [normalMap, setNormalMap] = useState<THREE.Texture | null>(null);
  const [pbrNormal, setPbrNormal] = useState<THREE.Texture | null>(null);
  const [roughnessMap, setRoughnessMap] = useState<THREE.Texture | null>(null);

  // Mappe PBR reali (da file): normal + roughness, con tiling coerente al color map
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let alive = true;
    const setup = (t: THREE.Texture) => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.5, 1.5); return t; };
    if (normalUrl) loader.load(normalUrl, (t) => { if (alive) setPbrNormal(setup(t)); }, undefined, () => { if (alive) setPbrNormal(null); });
    else setPbrNormal(null);
    if (roughnessUrl) loader.load(roughnessUrl, (t) => { if (alive) setRoughnessMap(setup(t)); }, undefined, () => { if (alive) setRoughnessMap(null); });
    else setRoughnessMap(null);
    return () => { alive = false; };
  }, [normalUrl, roughnessUrl]);

  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(1.5, 1.5);
        setTexture(loadedTexture);
      },
      undefined,
      (err) => {
        console.warn('Failed to load texture, falling back to color tint.', err);
        setTexture(null);
      }
    );
  }, [textureUrl]);

  // Procedural normal map generation for realistic PBR feel
  useEffect(() => {
    if (!pbrProfile || pbrProfile === 'none') {
      setNormalMap(null);
      return;
    }

    const bumpStrength = pbrBumpiness ?? 0.5;
    const url = getProceduralNormalMap(pbrProfile, bumpStrength);
    if (!url) {
      setNormalMap(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(url, (loaded) => {
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.wrapT = THREE.RepeatWrapping;
      const rep = pbrRepeat ?? 1.5;
      loaded.repeat.set(rep, rep);
      setNormalMap(loaded);
    });
  }, [pbrProfile, pbrBumpiness, pbrRepeat]);

  // La normal reale (da file PBR) ha la precedenza su quella procedurale
  const effectiveNormal = pbrNormal || normalMap;
  const normalStrength = pbrNormal ? 1.0 : (pbrBumpiness ?? 0.5);
  return (
    <meshStandardMaterial
      map={texture}
      color={color}
      roughness={roughness}
      metalness={metalness}
      roughnessMap={roughnessMap || undefined}
      transparent={opacity < 1}
      opacity={opacity}
      normalMap={effectiveNormal || undefined}
      normalScale={effectiveNormal ? new THREE.Vector2(normalStrength, normalStrength) : undefined}
      emissive={emissiveIntensity && emissiveIntensity > 0 ? new THREE.Color(emissiveColor || color) : new THREE.Color('#000000')}
      emissiveIntensity={emissiveIntensity ?? 0}
    />
  );
}

// Custom Arch Shape Geometry Generator
function ArchMesh({ scale }: { scale: [number, number, number] }) {
  const geometry = React.useMemo(() => {
    const shape = new THREE.Shape();
    const w = 1.0;
    const h = 1.25;
    const r = w / 2;

    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(-w / 2, h / 2 - r);
    shape.absarc(0, h / 2 - r, r, Math.PI, 0, true);
    shape.lineTo(w / 2, -h / 2);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 36
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  return <primitive object={geometry} attach="geometry" />;
}

// Unified Shape and Light Renderer to avoid repeating code
function ShapeRenderer({ 
  element, 
  isSelected,
  spotTargetRef
}: { 
  element: BoardElement; 
  isSelected: boolean;
  spotTargetRef: React.RefObject<THREE.Object3D | null>;
}) {
  // 1. SPOTLIGHT
  if (element.shape === 'light-spot') {
    return (
      <group>
        {/* Visual lamp cup */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.2, 16]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color={element.color} />
        </mesh>
        <object3D ref={(el) => { if (spotTargetRef) (spotTargetRef as any).current = el; }} position={[0, -2, 0]} />
        {element.lightOn !== false && (
          <spotLight
            position={[0, 0, 0]}
            target={(spotTargetRef && spotTargetRef.current) || undefined}
            color={element.color}
            intensity={(element.intensity ?? 1.5) * 5.0}
            distance={element.distance ?? 10}
            angle={(element.angle ?? 45) * (Math.PI / 180)}
            penumbra={element.penumbra ?? 0.5}
            castShadow
            shadow-mapSize={[512, 512]}
            shadow-bias={-0.0002}
          />
        )}
      </group>
    );
  }

  // 2. POINTLIGHT (Omni)
  if (element.shape === 'light-point') {
    return (
      <group>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
          <meshBasicMaterial color="#1c1c1c" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color={element.color} />
        </mesh>
        {element.lightOn !== false && (
          <pointLight
            position={[0, 0, 0]}
            color={element.color}
            intensity={(element.intensity ?? 1.5) * 4.0}
            distance={element.distance ?? 10}
            castShadow
            shadow-mapSize={[512, 512]}
            shadow-bias={-0.0002}
          />
        )}
      </group>
    );
  }

  // 3. DIRECTIONAL LIGHT (Sun)
  if (element.shape === 'light-directional') {
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[0.08, 0.1, 16]} />
          <meshBasicMaterial color={element.color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.012, 0.24, 0.012]} />
          <meshBasicMaterial color={element.color} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.012, 0.24, 0.012]} />
          <meshBasicMaterial color={element.color} />
        </mesh>
        {element.lightOn !== false && (
          <directionalLight
            position={[0, 0.1, 0]}
            color={element.color}
            intensity={(element.intensity ?? 1.5) * 2.5}
            castShadow
            shadow-mapSize={[512, 512]}
            shadow-bias={-0.0001}
          />
        )}
      </group>
    );
  }

  // 4. PHYSICAL ELEMENT / CUSTOM MODEL
  if (element.shape === 'custom-model') {
    return (
      <group>
        {element.modelUrl ? (
          <ModelBoundary color={element.color}>
            <Suspense fallback={
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color={element.color} roughness={0.9} wireframe />
              </mesh>
            }>
              <CustomModelRenderer
                modelUrl={element.modelUrl}
                color={element.color}
                roughness={element.roughness}
                metalness={element.metalness}
                opacity={element.opacity}
                emissiveColor={element.emissiveColor}
                emissiveIntensity={element.emissiveIntensity}
              />
            </Suspense>
          </ModelBoundary>
        ) : (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={element.color} roughness={element.roughness} wireframe />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <mesh castShadow receiveShadow>
      {element.shape === 'tile' && <boxGeometry args={[1, 1, 1]} />}
      {element.shape === 'board' && <boxGeometry args={[1, 1, 1]} />}
      {element.shape === 'circle' && <cylinderGeometry args={[0.5, 0.5, 0.1, 48]} />}
      {element.shape === 'cylinder' && <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />}
      {element.shape === 'sphere' && <sphereGeometry args={[0.5, 48, 48]} />}
      {element.shape === 'arch' && <ArchMesh scale={element.scale} />}

      <SafeMaterial
        textureUrl={element.textureUrl}
        normalUrl={element.normalUrl}
        roughnessUrl={element.roughnessUrl}
        color={element.color}
        roughness={element.roughness}
        metalness={element.metalness}
        opacity={element.opacity}
        pbrProfile={element.pbrProfile}
        pbrBumpiness={element.pbrBumpiness}
        pbrRepeat={element.pbrRepeat}
        emissiveColor={element.emissiveColor}
        emissiveIntensity={element.emissiveIntensity}
      />
    </mesh>
  );
}

// Single Element Renderer inside the 3D scene
function BoardElementMesh({
  element,
  isSelected,
  onSelect,
}: {
  element: BoardElement;
  isSelected: boolean;
  onSelect: (id: string, e: any) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spotTargetRef = useRef<THREE.Object3D | null>(null);

  // Soft pulse feedback when selected
  useFrame((state) => {
    if (groupRef.current) {
      if (isSelected) {
        const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.015;
        groupRef.current.scale.set(
          element.scale[0] * pulse,
          element.scale[1] * pulse,
          element.scale[2] * pulse
        );
      } else {
        groupRef.current.scale.set(element.scale[0], element.scale[1], element.scale[2]);
      }
    }
  });

  return (
    <group 
      ref={groupRef}
      position={element.position}
      rotation={[
        element.rotation[0] * (Math.PI / 180),
        element.rotation[1] * (Math.PI / 180),
        element.rotation[2] * (Math.PI / 180)
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id, e);
      }}
    >
      <ShapeRenderer 
        element={element} 
        isSelected={isSelected} 
        spotTargetRef={spotTargetRef} 
      />
      
      {/* Visual wire outline for selection */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          {element.shape === 'sphere' ? (
            <sphereGeometry args={[0.52, 24, 24]} />
          ) : element.shape === 'circle' ? (
            <cylinderGeometry args={[0.52, 0.52, 0.12, 32]} />
          ) : element.shape === 'cylinder' ? (
            <cylinderGeometry args={[0.42, 0.42, 1.22, 32]} />
          ) : element.shape === 'arch' ? (
            null
          ) : element.shape.startsWith('light') ? (
            <sphereGeometry args={[0.15, 16, 16]} />
          ) : (
            <boxGeometry args={[1.02, 1.02, 1.02]} />
          )}
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// Props of the Main Canvas Scene
interface MoodboardCanvasProps {
  elements: BoardElement[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BoardElement>) => void;
  setCanvasDOMElement: (el: HTMLCanvasElement | null) => void;
  transformMode: TransformMode;
  scenePreset: ScenePreset;
  // Customizable environments
  bgColor: string;
  bgProfile: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal';
  tableColor: string;
  tableProfile: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal';
  tableRoughness: number;
  tableMetalness: number;
  showGrid: boolean;
}

export default function MoodboardCanvas({
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  setCanvasDOMElement,
  transformMode,
  scenePreset,
  bgColor,
  bgProfile,
  tableColor,
  tableProfile,
  tableRoughness,
  tableMetalness,
  showGrid
}: MoodboardCanvasProps) {
  const orbitControlsRef = useRef<any>(null);
  const transformControlsRef = useRef<any>(null);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  // Oggetto a cui agganciare il gizmo (così gli assi stanno SUL modello, non all'origine)
  const [gizmoTarget, setGizmoTarget] = useState<THREE.Object3D | null>(null);
  // true mentre si trascina il gizmo: durante il drag NON sincronizziamo la transform dallo stato
  const draggingRef = useRef(false);

  // Sync the raw mesh target node for TransformControls when selection shifts
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasDOMElement(canvasRef.current);
    }
  }, [setCanvasDOMElement]);

  // Al cambio selezione azzera il target del gizmo: TransformControls si smonta e si
  // riaggancia pulito al nuovo oggetto (evita riferimenti a oggetti rimossi dalla scena).
  useEffect(() => { setGizmoTarget(null); }, [selectedId]);

  // Safe Transform change listener — si aggancia quando il gizmo monta davvero (gizmoTarget)
  useEffect(() => {
    const transformControls = transformControlsRef.current;
    if (!transformControls) return;

    // Aggiorna lo stato SOLO durante un trascinamento reale: così deselezione/aggancio del
    // gizmo non possono "spostare" l'oggetto (es. una luce sospesa che cadeva sul tavolo).
    const handleDraggingChanged = (event: any) => {
      draggingRef.current = !!event.value;
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = !event.value;
    };

    const handleObjectChanged = () => {
      if (!draggingRef.current || !selectedId || !transformControls.object) return;
      const obj = transformControls.object;
      const rx = Math.round(obj.rotation.x * (180 / Math.PI));
      const ry = Math.round(obj.rotation.y * (180 / Math.PI));
      const rz = Math.round(obj.rotation.z * (180 / Math.PI));
      onUpdateElement(selectedId, {
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [rx, ry, rz],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z]
      });
    };

    transformControls.addEventListener('dragging-changed', handleDraggingChanged);
    transformControls.addEventListener('objectChange', handleObjectChanged);

    return () => {
      transformControls.removeEventListener('dragging-changed', handleDraggingChanged);
      transformControls.removeEventListener('objectChange', handleObjectChanged);
    };
  }, [selectedId, onUpdateElement, gizmoTarget]);

  // Helper listener for general canvas clicks to clear active selection
  const handleMissedClick = () => {
    onSelectElement(null);
  };

  return (
    <div className="w-full h-full relative font-sans">
      <Canvas
        ref={canvasRef}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [2.5, 4, 3], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={handleMissedClick}
      >
        {/* Dynamic Background & Fog matching our customizable showroom theme */}
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 8, 25]} />

        <Suspense fallback={null}>
          {/* Studio Ambient Lights Configuration */}
          <ambientLight color={scenePreset.ambientColor} intensity={scenePreset.ambientIntensity * 0.7} />
          
          {/* Keylight for soft shadows */}
          <directionalLight
            position={[4, 6, 4]}
            color={scenePreset.directColor}
            intensity={scenePreset.directIntensity * 0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
          />

          {/* Rim light */}
          <pointLight position={[-4, 3, -4]} intensity={0.4} color="#e0f0ff" />
          
          <spotLight 
            position={[0, 8, 0]} 
            intensity={0.5} 
            angle={0.6} 
            penumbra={0.9} 
            color="#ffffff" 
            castShadow 
          />

          {/* Studio Working Desk Tabletop Surface with customizable PBR texture */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <SafeMaterial
              color={tableColor} 
              roughness={tableRoughness}
              metalness={tableMetalness}
              opacity={1.0}
              pbrProfile={tableProfile}
              pbrBumpiness={0.4}
              pbrRepeat={2.5}
            />
          </mesh>

          {/* Optional Grid Helper (toggleable to reduce CAD look) */}
          {showGrid && (
            <gridHelper args={[12, 24, '#3A3A3A', '#8C8C80']} position={[0, 0.001, 0]} />
          )}

          {/* Render Elements List */}
          {elements.map((element) => {
            const isSelected = element.id === selectedId;
            const isPositionLocked = element.lockedPosition === true;
            return (
              <React.Fragment key={element.id}>
                {/* Gizmo agganciato a un gruppo NON controllato (EditableElement): React non
                    sovrascrive la transform → il trascinamento si ancora; gli assi sono sull'oggetto */}
                {isSelected && !isPositionLocked ? (
                  <>
                    <EditableElement
                      element={element}
                      draggingRef={draggingRef}
                      onSelect={(id) => onSelectElement(id)}
                      onReady={setGizmoTarget}
                    />
                    {gizmoTarget && (
                      <TransformControls
                        ref={transformControlsRef}
                        object={gizmoTarget}
                        mode={transformMode}
                        size={0.75}
                        showY={transformMode === 'translate' || transformMode === 'scale'}
                      />
                    )}
                  </>
                ) : (
                  <BoardElementMesh
                    element={element}
                    isSelected={isSelected}
                    onSelect={(id) => onSelectElement(id)}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Camera Navigator */}
          <OrbitControls
            ref={orbitControlsRef}
            makeDefault
            maxPolarAngle={Math.PI / 2 - 0.02} // Stop camera passing below floor grid level
            minDistance={1.2}
            maxDistance={12}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
      
      {/* Instruction indicator inside canvas */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono select-none pointer-events-none text-neutral-500 bg-white/75 border border-[#E0E0DB] px-3 py-1.5 rounded shadow">
        [Tasto sinistro] Ruota Camera • [Shift + Tasto sinistro] Trascina Workspace • [Rotella] Zoom • [Click elemento] Sposta
      </div>
    </div>
  );
}

// Elemento SELEZIONATO: gruppo NON controllato da React (transform impostata in modo imperativo).
// Così TransformControls può "possedere" la transform senza che React la sovrascriva ad ogni render
// (era la causa per cui lo spostamento non si ancorava). Sincronizza dallo stato solo quando NON
// si sta trascinando (es. modifiche dal pannello Proprietà / cambio elemento).
const deg2rad = (d: number) => d * (Math.PI / 180);
function EditableElement({
  element,
  draggingRef,
  onSelect,
  onReady
}: {
  element: BoardElement;
  draggingRef: React.MutableRefObject<boolean>;
  onSelect: (id: string, e: any) => void;
  onReady: (g: THREE.Object3D | null) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const spotTargetRef = useRef<THREE.Object3D | null>(null);

  // espone il gruppo al gizmo al montaggio
  useLayoutEffect(() => { onReady(ref.current); return () => onReady(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // sincronizza la transform dallo stato quando non si trascina (slider Altezza, ecc.)
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g || draggingRef.current) return;
    g.position.set(element.position[0], element.position[1], element.position[2]);
    g.rotation.set(deg2rad(element.rotation[0]), deg2rad(element.rotation[1]), deg2rad(element.rotation[2]));
    g.scale.set(element.scale[0], element.scale[1], element.scale[2]);
  });

  return (
    <group ref={ref} onClick={(e: any) => { e.stopPropagation(); onSelect(element.id, e); }}>
      <ShapeRenderer element={element} isSelected={true} spotTargetRef={spotTargetRef} />
    </group>
  );
}

// React Three Fiber wrapper to dynamically render current elements inside TransformControls
function ElementMeshWrapper({
  element,
  isSelected,
  onSelect,
  onGroupRef,
}: {
  element: BoardElement;
  isSelected: boolean;
  onSelect: (id: string, e: any) => void;
  onGroupRef?: (g: THREE.Object3D | null) => void;
}) {
  const spotTargetRef = useRef<THREE.Object3D | null>(null);

  return (
    <group
      ref={onGroupRef as any}
      position={element.position}
      rotation={[
        element.rotation[0] * (Math.PI / 180),
        element.rotation[1] * (Math.PI / 180),
        element.rotation[2] * (Math.PI / 180)
      ]}
      scale={element.scale}
      onClick={(e: any) => {
        e.stopPropagation();
        onSelect(element.id, e);
      }}
    >
      <ShapeRenderer
        element={element}
        isSelected={isSelected}
        spotTargetRef={spotTargetRef}
      />
    </group>
  );
}
