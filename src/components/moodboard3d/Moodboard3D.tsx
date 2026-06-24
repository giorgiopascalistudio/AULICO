/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Moodboard3D — editor moodboard 3D (R3F) integrato in Onirico Studio OS.
 * Adattato dal prototipo (moodboard-3d): stesse funzionalità (libreria materiali, forme, luci,
 * gizmo sposta/ruota/scala, collisioni, upload texture/modelli, palette, preset scena, export PNG).
 * Differenze rispetto al prototipo:
 *  - è un OVERLAY a tutto schermo riusabile (open/onClose) invece di una pagina;
 *  - la scena è caricata/salvata PER-PROGETTO su Firebase (props elements + onSave) invece del
 *    link `#board=` (rimosso perché confliggeva col router a hash dell'app);
 *  - chrome (header/overlay) in stile Onirico.
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, X, Save, Maximize2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';
import MoodboardCanvas from './MoodboardCanvas';
import { BoardElement, MaterialTemplate, ShapeType, TransformMode, ScenePreset } from './types';
import { DEFAULT_BOARD_ELEMENTS, SCENE_PRESETS } from './data';

export interface Moodboard3DProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  elements: BoardElement[];
  onSave: (elements: BoardElement[]) => void;
}

// I `blob:` URL (modelli .glb / immagini caricati) valgono SOLO nella sessione che li crea:
// dopo un reload puntano a risorse inesistenti → il loader va in errore. Quindi vanno scartati
// sia in caricamento (scena salvata) sia in salvataggio (non vanno mai persistiti su Firebase).
const isBlob = (u?: string) => !!u && u.startsWith('blob:');
const sanitizeElements = (els: BoardElement[] = []): BoardElement[] =>
  els
    .filter((el) => !isBlob(el.modelUrl))
    .map((el) => {
      const c: BoardElement = { ...el };
      if (isBlob(c.textureUrl)) c.textureUrl = undefined;
      if (isBlob(c.normalUrl)) c.normalUrl = undefined;
      if (isBlob(c.roughnessUrl)) c.roughnessUrl = undefined;
      return c;
    });

export const Moodboard3D: React.FC<Moodboard3DProps> = ({ open, onClose, projectName, elements: savedElements, onSave }) => {
  const [elements, setElements] = useState<BoardElement[]>(savedElements?.length ? sanitizeElements(savedElements) : DEFAULT_BOARD_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [activePreset, setActivePreset] = useState<ScenePreset>(SCENE_PRESETS[0]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [canvasDOMElement, setCanvasDOMElement] = useState<HTMLCanvasElement | null>(null);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  // Pannelli laterali richiudibili
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Dettagli ambientali personalizzabili
  const [bgColor, setBgColor] = useState<string>('#EAEAE5');
  const [bgProfile, setBgProfile] = useState<'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal'>('plaster');
  const [tableColor, setTableColor] = useState<string>('#D1D1C7');
  const [tableProfile, setTableProfile] = useState<'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal'>('none');
  const [tableRoughness, setTableRoughness] = useState<number>(0.8);
  const [tableMetalness, setTableMetalness] = useState<number>(0.0);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [wallColor, setWallColor] = useState<string>('#DCDCD6');

  // ---- Persistenza per-progetto su Firebase ----
  const hydratedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // (Ri)carica la scena salvata ad ogni apertura
  useEffect(() => {
    if (open) {
      setElements(savedElements?.length ? sanitizeElements(savedElements) : DEFAULT_BOARD_ELEMENTS);
      setSelectedId(null);
      hydratedRef.current = false;
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  // Autosave (debounce) dopo l'idratazione iniziale — mai persistere blob:
  useEffect(() => {
    if (!open) return;
    if (!hydratedRef.current) { hydratedRef.current = true; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSave(sanitizeElements(elements)), 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    onSave(sanitizeElements(elements));
    onClose();
  };

  // Sincronizza l'ambiente col preset attivo
  useEffect(() => {
    setBgColor(activePreset.bgColor);
    if (activePreset.id === 'scene-notte') setWallColor('#18181F');
    else if (activePreset.id === 'scene-interno') setWallColor('#635B55');
    else setWallColor('#D2CDC6');
    setTableColor(activePreset.tableColor);
    setTableRoughness(activePreset.tableRoughness);
  }, [activePreset]);

  const handleDuplicateElement = (id: string) => {
    const target = elements.find(el => el.id === id);
    if (!target) return;
    const cloned: BoardElement = {
      ...target,
      id: `elem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${target.name} (Copia)`,
      position: [target.position[0] + 0.3, target.position[1], target.position[2] + 0.3]
    };
    setElements([...elements, cloned]);
    setSelectedId(cloned.id);
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateElement = (id: string, updates: Partial<BoardElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleApplyPaletteColor = (color: string) => {
    if (selectedId) {
      handleUpdateElement(selectedId, { color });
    } else {
      const newSwatch: BoardElement = {
        id: `elem-${Date.now()}`,
        name: `Campione Colore ${color.toUpperCase()}`,
        shape: 'tile', color, roughness: 0.8, metalness: 0.0, opacity: 1,
        position: [Math.random() * 1.5 - 0.75, 0.04, Math.random() * 1.5 - 0.75],
        rotation: [0, Math.round(Math.random() * 30 - 15), 0],
        scale: [1.2, 0.04, 1.2]
      };
      setElements([...elements, newSwatch]);
      setSelectedId(newSwatch.id);
    }
  };

  const handleAddMaterial = (material: MaterialTemplate) => {
    const newPhys: BoardElement = {
      id: `elem-${Date.now()}`,
      name: material.name,
      shape: material.category === 'fabric' ? 'circle' : 'tile',
      color: material.color,
      textureUrl: material.textureUrl,
      normalUrl: material.normalUrl,
      roughnessUrl: material.roughnessUrl,
      textureName: material.name,
      roughness: material.roughness,
      metalness: material.metalness,
      opacity: material.opacity ?? 1,
      position: [Math.random() * 1.0 - 0.5, 0.05, Math.random() * 1.0 - 0.5],
      rotation: [0, Math.round(Math.random() * 40 - 20), 0],
      scale: material.category === 'fabric' ? [1.2, 0.08, 1.2] : [1.4, 0.04, 2.0]
    };
    setElements([...elements, newPhys]);
    setSelectedId(newPhys.id);
  };

  const handleAddPrimitiveShape = (shape: ShapeType, color: string, name: string) => {
    const isLight = shape.startsWith('light');
    const newShape: BoardElement = {
      id: `elem-${Date.now()}`,
      name, shape, color, roughness: 0.4, metalness: 0.1, opacity: 1,
      position: isLight ? [Math.random() * 0.8 - 0.4, 2.3, Math.random() * 0.8 - 0.4] : [Math.random() * 1.0 - 0.5, 0.05, Math.random() * 1.0 - 0.5],
      rotation: isLight ? [-Math.PI / 3, 0, 0] : [0, 0, 0],
      scale: shape === 'cylinder' ? [0.6, 1.4, 0.6] : shape === 'sphere' ? [1, 1, 1] : isLight ? [0.35, 0.35, 0.35] : [1.2, 0.05, 1.2],
      lightOn: true, intensity: 1.5, distance: 12, angle: 45, penumbra: 0.5
    };
    setElements([...elements, newShape]);
    setSelectedId(newShape.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadFile(file);
  };

  const processUploadFile = (file: File) => {
    const isModel = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
    if (isModel) {
      const modelBlobUrl = URL.createObjectURL(file);
      const newModelElement: BoardElement = {
        id: `elem-${Date.now()}`,
        name: file.name.replace(/\.(glb|gltf)$/i, '') || 'Modello 3D',
        shape: 'custom-model', color: '#ffffff', modelUrl: modelBlobUrl, modelName: file.name,
        roughness: 0.5, metalness: 0.1, opacity: 1.0, position: [0, 0.4, 0], rotation: [0, 0, 0], scale: [1, 1, 1]
      };
      setElements(prev => [...prev, newModelElement]);
      setSelectedId(newModelElement.id);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Url = event.target.result as string;
          const newTextureElement: BoardElement = {
            id: `elem-${Date.now()}`,
            name: file.name.split('.')[0] || 'Campione Immagine',
            shape: 'tile', color: '#ffffff', textureUrl: base64Url, textureName: file.name,
            roughness: 0.6, metalness: 0.0, opacity: 1.0,
            position: [0, 0.03, 0], rotation: [0, Math.round(Math.random() * 20 - 10), 0], scale: [1.6, 0.02, 1.6 * (9 / 16)]
          };
          setElements(prev => [...prev, newTextureElement]);
          setSelectedId(newTextureElement.id);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPNG = () => {
    if (canvasDOMElement) {
      const dataUrl = canvasDOMElement.toDataURL('image/png');
      const cleanLink = document.createElement('a');
      cleanLink.download = `${(projectName || 'moodboard').toLowerCase().replace(/\s+/g, '-')}-3d.png`;
      cleanLink.href = dataUrl;
      cleanLink.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingFile(true); };
  const handleDragLeave = () => setIsDraggingFile(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadFile(file);
  };

  if (!open) return null;

  // Render via portal su document.body: evita che un antenato con `transform`/`filter`
  // (animazioni riseIn, motion, backdrop-blur) ancori il `fixed` e lo rinchiuda in un box.
  return createPortal(
    <div className="mb3d fixed inset-0 z-[120] bg-[#F5F5F3] flex flex-col animate-[fadeIn_0.18s_ease_both]">
      {/* Header in stile Onirico */}
      <div className="h-14 shrink-0 bg-white border-b border-[#e2e2e2] flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Maximize2 className="w-4 h-4 text-[#8a8a8a] shrink-0" />
          <div className="min-w-0">
            <h2 className="text-[14.5px] font-extrabold text-[#161616] truncate leading-tight">Moodboard 3D</h2>
            {projectName && <p className="text-[11px] text-[#8a8a8a] truncate -mt-0.5">{projectName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onSave(sanitizeElements(elements))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer">
            <Save className="w-4 h-4" /> Salva
          </button>
          <button onClick={handleClose} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[12.5px] font-bold text-[#161616] hover:bg-[#fafafa] cursor-pointer">
            <X className="w-4 h-4" /> Chiudi
          </button>
        </div>
      </div>

      {/* Corpo: libreria · canvas · proprietà */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden text-[#161616]" onDragOver={handleDragOver}>
        {leftOpen && <Sidebar
          elements={elements}
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onAddMaterial={handleAddMaterial}
          onAddPrimitiveShape={handleAddPrimitiveShape}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onApplyPaletteColor={handleApplyPaletteColor}
          onLoadSavedBoard={(data) => { setElements(data); if (data.length > 0) setSelectedId(data[0].id); }}
          onFileUpload={processUploadFile}
          bgColor={bgColor} setBgColor={setBgColor}
          bgProfile={bgProfile} setBgProfile={setBgProfile}
          tableColor={tableColor} setTableColor={setTableColor}
          tableProfile={tableProfile} setTableProfile={setTableProfile}
          tableRoughness={tableRoughness} setTableRoughness={setTableRoughness}
          tableMetalness={tableMetalness} setTableMetalness={setTableMetalness}
          showGrid={showGrid} setShowGrid={setShowGrid}
        />}

        <div className="flex-1 flex flex-col min-w-0 relative h-full bg-[#EAEAE5]">
          <Toolbar
            onImageUpload={handleImageUpload}
            onResetBoard={() => { setElements([]); setSelectedId(null); }}
            onExportPNG={handleExportPNG}
            activePreset={activePreset}
            onUpdatePreset={setActivePreset}
            elements={elements}
            onLoadBoard={(data) => { setElements(data); if (data.length > 0) setSelectedId(data[0].id); }}
          />

          <div className="flex-1 w-full relative bg-[#EAEAE5] overflow-hidden">
            <MoodboardCanvas
              elements={elements}
              selectedId={selectedId}
              onSelectElement={setSelectedId}
              onUpdateElement={handleUpdateElement}
              setCanvasDOMElement={setCanvasDOMElement}
              transformMode={transformMode}
              scenePreset={activePreset}
              bgColor={bgColor}
              bgProfile={bgProfile}
              tableColor={tableColor}
              tableProfile={tableProfile}
              tableRoughness={tableRoughness}
              tableMetalness={tableMetalness}
              showGrid={showGrid}
            />

            {/* toggle pannelli laterali (richiudibili) */}
            <button
              onClick={() => setLeftOpen((v) => !v)}
              title={leftOpen ? 'Nascondi libreria' : 'Mostra libreria'}
              className="absolute top-1/2 -translate-y-1/2 left-2 z-20 w-8 h-12 rounded-xl bg-white/95 backdrop-blur border border-[#e2e2e2] shadow flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] cursor-pointer"
            >
              {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setRightOpen((v) => !v)}
              title={rightOpen ? 'Nascondi proprietà' : 'Mostra proprietà'}
              className="absolute top-1/2 -translate-y-1/2 right-2 z-20 w-8 h-12 rounded-xl bg-white/95 backdrop-blur border border-[#e2e2e2] shadow flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] cursor-pointer"
            >
              {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>

            {/* gizmo modalità trasformazione */}
            {selectedId && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-1 border border-[#e2e2e2] shadow-lg flex items-center gap-1 z-20 rounded-xl">
                <span className="text-[8px] font-extrabold tracking-widest text-[#8a8a8a] uppercase px-2">MODO</span>
                {(['translate', 'rotate', 'scale'] as TransformMode[]).map((m) => (
                  <button key={m} onClick={() => setTransformMode(m)}
                    className={`px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest transition-all rounded-lg cursor-pointer ${transformMode === m ? 'bg-[#161616] text-white' : 'text-[#6b6b6b] hover:text-[#161616] hover:bg-[#f0f0f0]'}`}>
                    {m === 'translate' ? 'Sposta' : m === 'rotate' ? 'Ruota' : 'Scala'}
                  </button>
                ))}
              </div>
            )}

            {/* suggerimento iniziale */}
            {showWelcomeTooltip && (
              <div className="absolute bottom-6 right-6 max-w-sm bg-white border border-[#e2e2e2] p-5 rounded-[18px] shadow-xl z-20">
                <div className="flex justify-between items-start mb-2">
                  <b className="text-[10px] font-extrabold text-[#161616] uppercase tracking-widest">📐 Suggerimento</b>
                  <button onClick={() => setShowWelcomeTooltip(false)} className="p-1 text-[#9a9a9a] hover:text-[#161616] transition-colors cursor-pointer"><X size={12} /></button>
                </div>
                <p className="text-[11px] leading-relaxed text-[#8a8a8a] font-semibold">
                  Trascina i campioni sul tavolo, impilali regolando l'<span className="text-[#161616] font-extrabold">Altezza (Y)</span> nel pannello a destra. Trascina file PNG/JPG/GLB direttamente qui per usarli.
                </p>
              </div>
            )}
          </div>
        </div>

        {rightOpen && <PropertiesPanel
          selectedElement={elements.find(el => el.id === selectedId) || null}
          transformMode={transformMode}
          onSetTransformMode={setTransformMode}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
        />}
      </div>

      {/* overlay drag&drop file */}
      {isDraggingFile && (
        <div className="fixed inset-0 bg-[#F5F5F3]/90 backdrop-blur-md flex flex-col justify-center items-center z-50 text-[#161616] pointer-events-none"
          onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="p-10 border border-dashed border-[#d1d1c7] rounded-[22px] bg-white shadow-2xl flex flex-col items-center gap-4 text-center max-w-md">
            <div className="w-14 h-14 rounded-full bg-[#161616] text-white flex items-center justify-center shadow-md"><UploadCloud size={24} className="animate-pulse" /></div>
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#161616]">Rilascia qui</h2>
              <p className="text-[10px] text-[#8a8a8a] uppercase font-extrabold tracking-wider mt-1 max-w-[280px]">Immagine (texture) o modello .glb/.gltf da aggiungere alla scena</p>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default Moodboard3D;
