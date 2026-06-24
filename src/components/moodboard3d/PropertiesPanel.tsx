import React from 'react';
import { 
  Sliders, 
  Trash2, 
  Copy, 
  Layers,
  Move,
  RotateCw,
  Scaling,
  Palette
} from 'lucide-react';
import { BoardElement, TransformMode } from './types';

interface PropertiesPanelProps {
  selectedElement: BoardElement | null;
  transformMode: TransformMode;
  onSetTransformMode: (mode: TransformMode) => void;
  onUpdateElement: (id: string, updates: Partial<BoardElement>) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

export default function PropertiesPanel({
  selectedElement,
  transformMode,
  onSetTransformMode,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement
}: PropertiesPanelProps) {
  
  if (!selectedElement) {
    return (
      <div className="w-80 h-full bg-[#F4F4F2] border-l border-[#E0E0DB] flex flex-col justify-center items-center p-8 text-center z-10 text-neutral-500 font-sans">
        <div className="w-14 h-14 rounded-full border border-[#D1D1C7] flex items-center justify-center mb-5 text-[#1A1A1A] bg-white shadow-xs">
          <Sliders size={18} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Seleziona Campione</p>
        <p className="text-[10px] text-neutral-400 mt-2 max-w-[200px] leading-relaxed font-semibold">
          Clicca su un materiale nel canvas 3D per sbloccare la mazzetta colori, la rugosità, la trasparenza e lo spessore.
        </p>
      </div>
    );
  }

  const handleScaleChange = (index: number, value: number) => {
    const updatedScale = [...selectedElement.scale] as [number, number, number];
    updatedScale[index] = value;
    onUpdateElement(selectedElement.id, { scale: updatedScale });
  };

  const handleRotationChange = (index: number, value: number) => {
    const updatedRotation = [...selectedElement.rotation] as [number, number, number];
    updatedRotation[index] = value;
    onUpdateElement(selectedElement.id, { rotation: updatedRotation });
  };

  const handlePositionChange = (index: number, value: number) => {
    const updatedPosition = [...selectedElement.position] as [number, number, number];
    updatedPosition[index] = value;
    onUpdateElement(selectedElement.id, { position: updatedPosition });
  };

  return (
    <div className="w-80 h-full bg-[#F4F4F2] border-l border-[#E0E0DB] flex flex-col justify-between z-10 text-[#1A1A1A] font-sans select-none overflow-y-auto">
      
      {/* Scrollable Container */}
      <div className="p-6 space-y-6 flex-1">
        
        {/* Panel Header */}
        <div>
          <span className="text-[9px] font-sans font-extrabold tracking-widest text-neutral-400 uppercase block mb-1">PROPERTIES EDITOR</span>
          <h2 className="text-base font-serif italic text-black font-bold leading-tight truncate">{selectedElement.name}</h2>
          <span className="text-[9px] font-sans font-extrabold uppercase bg-white text-neutral-600 px-2 py-0.5 mt-2 inline-block border border-[#E0E0DB] tracking-widest">
            3D {selectedElement.shape}
          </span>
        </div>

        {/* LAYERS / STATE LOCK CONTROL PILLS */}
        <div className="space-y-1.5 p-3 rounded border border-[#E0E0DB] bg-white shadow-sm">
          <span className="text-[9px] font-sans font-extrabold tracking-widest text-[#8C8C80] uppercase block">Blocco Livello</span>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateElement(selectedElement.id, { lockedPosition: !selectedElement.lockedPosition })}
              className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                selectedElement.lockedPosition 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold' 
                  : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-black hover:bg-neutral-150'
              }`}
              title="Blocca la posizione del campione per prevenire spostamenti accidentali"
              id="lock-position-toggle"
            >
              <Move size={10} />
              <span>{selectedElement.lockedPosition ? '🔒 Movimento' : 'Blocca Mov.'}</span>
            </button>
            <button
              onClick={() => onUpdateElement(selectedElement.id, { lockedMaterial: !selectedElement.lockedMaterial })}
              className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                selectedElement.lockedMaterial 
                  ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold' 
                  : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-black hover:bg-neutral-150'
              }`}
              title="Blocca i materiali per prevenire modifiche accidentali a tinte, textures o parametri fisici"
              id="lock-material-toggle"
            >
              <Palette size={10} />
              <span>{selectedElement.lockedMaterial ? '🔒 Materiale' : 'Blocca Mat.'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: GIZMO TOOL SELECTOR */}
        <div className="space-y-2.5">
          <label className="text-[9px] font-sans font-extrabold text-neutral-400 uppercase tracking-widest block">Gizmo Controllo 3D</label>
          <div className="flex bg-[#E0E0DB] p-0.5 border border-[#D1D1C7] rounded">
            <button
              onClick={() => onSetTransformMode('translate')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-1.5 rounded-sm font-sans font-extrabold text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                transformMode === 'translate' 
                  ? 'bg-black text-white shadow' 
                  : 'text-neutral-500 hover:text-black hover:bg-neutral-100/50'
              }`}
              id="controls-translate-btn"
            >
              <Move size={12} />
              Sposta
            </button>
            <button
              onClick={() => onSetTransformMode('rotate')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-1.5 rounded-sm font-sans font-extrabold text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                transformMode === 'rotate' 
                  ? 'bg-black text-white shadow' 
                  : 'text-neutral-500 hover:text-black hover:bg-neutral-100/50'
              }`}
              id="controls-rotate-btn"
            >
              <RotateCw size={12} />
              Ruota
            </button>
            <button
              onClick={() => onSetTransformMode('scale')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-1.5 rounded-sm font-sans font-extrabold text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                transformMode === 'scale' 
                  ? 'bg-black text-white shadow' 
                  : 'text-neutral-500 hover:text-black hover:bg-neutral-100/50'
              }`}
              id="controls-scale-btn"
            >
              <Scaling size={12} />
              Scala
            </button>
          </div>
        </div>

        {/* SECTION 2: CONDITIONAL CONTROLS FOR PHYSICAL VALUES VS LIGHT FIXTURES */}
        {selectedElement.shape.startsWith('light') ? (
          <div className="space-y-4 pt-4.5 border-t border-[#E0E0DB]">
            <h3 className="text-[9px] font-sans font-extrabold text-neutral-400 uppercase tracking-widest">Controlli Luce Showroom</h3>
            
            {/* Toggle light source */}
            <div className="flex items-center justify-between p-3 bg-white border border-[#E0E0DB] rounded shadow-xs">
              <span className="text-[10px] font-bold text-black">Sorgente Accesa</span>
              <input
                type="checkbox"
                checked={selectedElement.lightOn !== false}
                onChange={(e) => onUpdateElement(selectedElement.id, { lightOn: e.target.checked })}
                className="w-4 h-4 accent-black cursor-pointer"
                id="light-toggle-onoff"
              />
            </div>

            {/* Light color / temperature tint */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-600">Temperatura / Colore</span>
                <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase">{selectedElement.color}</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-2 border border-[#E0E0DB] rounded">
                <input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                  className="w-7 h-7 rounded-sm border border-neutral-300 bg-transparent cursor-pointer overflow-hidden p-0"
                  id="properties_light_color"
                />
                <span className="text-[9px] font-sans font-bold text-neutral-500 uppercase tracking-wider">Regola tinta della lampada</span>
              </div>
            </div>

            {/* Intensity / Luminosity slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                <span>Luminosità / Intensità</span>
                <span className="font-mono text-neutral-500 font-bold">{(selectedElement.intensity ?? 1.5).toFixed(2)} lx</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.05"
                value={selectedElement.intensity ?? 1.5}
                onChange={(e) => onUpdateElement(selectedElement.id, { intensity: parseFloat(e.target.value) })}
                className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                id="properties_light_intensity"
              />
              <div className="flex justify-between text-[7px] text-[#8C8C80] font-sans font-extrabold tracking-widest">
                <span>FAINTEST GLOW</span>
                <span>STUDIO HIGH-BEAM</span>
              </div>
            </div>

            {/* Distance / Radius slider (only non-directional) */}
            {selectedElement.shape !== 'light-directional' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                  <span>Raggio di Copertura (Distanza)</span>
                  <span className="font-mono text-neutral-500 font-bold">{(selectedElement.distance ?? 10).toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="0.5"
                  value={selectedElement.distance ?? 10}
                  onChange={(e) => onUpdateElement(selectedElement.id, { distance: parseFloat(e.target.value) })}
                  className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                  id="properties_light_distance"
                />
              </div>
            )}

            {/* Spotlight specific controls (angle & penumbra) */}
            {selectedElement.shape === 'light-spot' && (
              <>
                {/* Cone angle */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                    <span>Angolo Cono Fascio (Apertura)</span>
                    <span className="font-mono text-neutral-500 font-bold">{selectedElement.angle ?? 45}°</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="85"
                    step="1"
                    value={selectedElement.angle ?? 45}
                    onChange={(e) => onUpdateElement(selectedElement.id, { angle: parseInt(e.target.value) })}
                    className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                    id="properties_light_angle"
                  />
                </div>

                {/* Cone penumbra */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                    <span>Sfocatura Bordi (Penombra)</span>
                    <span className="font-mono text-neutral-500 font-bold">{((selectedElement.penumbra ?? 0.5) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={selectedElement.penumbra ?? 0.5}
                    onChange={(e) => onUpdateElement(selectedElement.id, { penumbra: parseFloat(e.target.value) })}
                    className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                    id="properties_light_penumbra"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-4.5 border-t border-[#E0E0DB]">
            <h3 className="text-[9px] font-sans font-extrabold text-neutral-400 uppercase tracking-widest">Fisica delle Superfici</h3>
            
            {selectedElement.lockedMaterial ? (
              <div className="p-4 bg-blue-50/50 border border-blue-200 text-blue-800 text-[10px] font-bold rounded flex flex-col items-center justify-center gap-1.5 shadow-xs leading-relaxed">
                <span className="text-xl">🔒</span>
                <span>Modifiche materiali bloccate per questo layer.</span>
                <button
                  type="button"
                  onClick={() => onUpdateElement(selectedElement.id, { lockedMaterial: false })}
                  className="mt-1 text-[9px] text-blue-600 hover:text-blue-900 underline uppercase tracking-widest font-extrabold cursor-pointer"
                >
                  Sblocca ora
                </button>
              </div>
            ) : (
              <>
                {/* Base tint color */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-600">Miscelazione Colore</span>
                    <span className="text-[9px] font-mono text-[#101010]/60 font-semibold uppercase">{selectedElement.color}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-2 border border-[#E0E0DB] rounded">
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                      className="w-7 h-7 rounded-sm border border-neutral-300 bg-transparent cursor-pointer overflow-hidden p-0"
                      id="properties_color_picker"
                    />
                    <span className="text-[9px] font-sans font-bold text-neutral-500 uppercase tracking-wider">Regola filtro colore</span>
                  </div>
                </div>

                {/* Custom texture / image replacement */}
                <div className="space-y-2 pt-3 border-t border-dashed border-[#E0E0DB]">
                  <span className="text-[10px] font-bold text-[#1A1A1A] block">Texture Materiale</span>
                  
                  <div className="bg-white p-2.5 border border-[#E0E0DB] rounded space-y-2">
                    {selectedElement.textureUrl ? (
                      <div className="flex items-center justify-between gap-1.5 bg-neutral-50 p-1.5 rounded border border-neutral-150">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img 
                            src={selectedElement.textureUrl} 
                            alt="texture thumbnail" 
                            className="w-8 h-8 rounded object-cover border border-neutral-300 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[9px] text-neutral-600 font-semibold truncate leading-tight block">
                            {selectedElement.textureName || "Texture Attiva"}
                          </span>
                        </div>
                        <button
                          onClick={() => onUpdateElement(selectedElement.id, { textureUrl: undefined, textureName: undefined })}
                          className="text-[9px] font-bold text-red-600 hover:text-red-800 underline uppercase flex-shrink-0 cursor-pointer"
                        >
                          Rimuovi
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-[#8C8C80] block font-semibold leading-normal">
                        Nessuna texture applicata (solo colore).
                      </span>
                    )}

                    {/* Local image file uploader for active texture */}
                    <div className="pt-0.5">
                      <label className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-neutral-300 hover-border-black rounded bg-neutral-50 hover:bg-neutral-100 text-[9px] uppercase tracking-widest font-extrabold text-black cursor-pointer transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Carica Foto/Texture</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  onUpdateElement(selectedElement.id, {
                                    textureUrl: ev.target.result as string,
                                    textureName: file.name
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Roughness parameter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                    <span>Opacità Superficiale (Rugosità)</span>
                    <span className="font-mono text-neutral-500 font-bold">{selectedElement.roughness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.01"
                    value={selectedElement.roughness}
                    onChange={(e) => onUpdateElement(selectedElement.id, { roughness: parseFloat(e.target.value) })}
                    className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                    id="properties_roughness_slider"
                  />
                  <div className="flex justify-between text-[7px] text-[#8C8C80] font-sans font-extrabold tracking-widest">
                    <span>SPECCHIATO</span>
                    <span>OPTERADO MATTE</span>
                  </div>
                </div>

                {/* Metallicity parameter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-[#1A1A1A]">
                    <span>Riflessione Metallo (Metallicità)</span>
                    <span className="font-mono text-neutral-500 font-bold">{selectedElement.metalness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.01"
                    value={selectedElement.metalness}
                    onChange={(e) => onUpdateElement(selectedElement.id, { metalness: parseFloat(e.target.value) })}
                    className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                    id="properties_metalness_slider"
                  />
                  <div className="flex justify-between text-[7px] text-[#8C8C80] font-sans font-extrabold tracking-widest">
                    <span>NATURALE</span>
                    <span>METALLO PURO</span>
                  </div>
                </div>

                {/* Opacity parameter for glass simulation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-[#1A1A1A]">
                    <span>Trasparenza Vetro (Opacità)</span>
                    <span className="font-mono text-neutral-500 font-bold">{(selectedElement.opacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.01"
                    value={selectedElement.opacity}
                    onChange={(e) => onUpdateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                    id="properties_opacity_slider"
                  />
                </div>

                {/* Emissive self-lighting */}
                <div className="space-y-2 pt-3 border-t border-dashed border-[#E0E0DB]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#1A1A1A]">Materiale Emissivo (Autoluminoso)</span>
                    <input
                      type="checkbox"
                      checked={!!selectedElement.emissiveIntensity}
                      onChange={(e) => onUpdateElement(selectedElement.id, { 
                        emissiveIntensity: e.target.checked ? 1.5 : undefined,
                        emissiveColor: e.target.checked ? (selectedElement.emissiveColor || selectedElement.color) : undefined
                      })}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                  </div>
                  
                  {!!selectedElement.emissiveIntensity && (
                    <div className="space-y-2 py-1.5 pl-2.5 border-l-2 border-amber-400 mt-2 bg-amber-50/20 rounded">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-neutral-600">
                          <span>Colore Glow Emissivo</span>
                          <span className="font-mono">{selectedElement.emissiveColor || '#ffffff'}</span>
                        </div>
                        <input
                          type="color"
                          value={selectedElement.emissiveColor || '#ffffff'}
                          onChange={(e) => onUpdateElement(selectedElement.id, { emissiveColor: e.target.value })}
                          className="w-full h-8 cursor-pointer rounded-sm border border-neutral-300 p-0"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-neutral-600">
                          <span>Intensità Glow</span>
                          <span className="font-mono">{(selectedElement.emissiveIntensity ?? 1.5).toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="8.0"
                          step="0.1"
                          value={selectedElement.emissiveIntensity ?? 1.5}
                          onChange={(e) => onUpdateElement(selectedElement.id, { emissiveIntensity: parseFloat(e.target.value) })}
                          className="w-full accent-black h-1 bg-white rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PBR Rilievo and Normal Material Mapping */}
                <div className="space-y-3 pt-3 border-t border-dashed border-[#E0E0DB]">
                  <span className="text-[9px] font-sans font-extrabold text-[#8C8C80] uppercase tracking-widest block">Tessitura & Rilievo PBR</span>

                  {/* Profile dropdown */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-600 block">Profilo Rilievo</span>
                    <select
                      value={selectedElement.pbrProfile || 'none'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { pbrProfile: e.target.value as any })}
                      className="w-full p-2 bg-white border border-[#D1D1C7] text-xs rounded font-bold cursor-pointer hover:border-black transition-colors focus:outline-none"
                      id="properties_pbr_profile"
                    >
                      <option value="none">Nessun rilievo (Liscio)</option>
                      <option value="plaster">Intonaco Muro Rasato</option>
                      <option value="wood">Venatura Legno</option>
                      <option value="stone">Pietra Spaccata / Marmo</option>
                      <option value="fabric">Trama Tessuto / Bouclé</option>
                      <option value="tile">Squadratura Piastrella</option>
                      <option value="metal">Satinatura Metallo Bucciato</option>
                    </select>
                  </div>

                  {selectedElement.pbrProfile && selectedElement.pbrProfile !== 'none' && (
                    <>
                      {/* PBR Bumpiness */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-neutral-600">
                          <span>Profondità Rilievo (Bumpiness)</span>
                          <span className="font-mono text-neutral-500">{(selectedElement.pbrBumpiness ?? 0.5).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1.5"
                          step="0.05"
                          value={selectedElement.pbrBumpiness ?? 0.5}
                          onChange={(e) => onUpdateElement(selectedElement.id, { pbrBumpiness: parseFloat(e.target.value) })}
                          className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                          id="properties_pbr_bumpiness"
                        />
                      </div>

                      {/* PBR Repeat */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-neutral-600">
                          <span>Ripetizione Texture</span>
                          <span className="font-mono text-neutral-500">{(selectedElement.pbrRepeat ?? 1.5).toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.1"
                          value={selectedElement.pbrRepeat ?? 1.5}
                          onChange={(e) => onUpdateElement(selectedElement.id, { pbrRepeat: parseFloat(e.target.value) })}
                          className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                          id="properties_pbr_repeat"
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 3: SPATIAL COORDINATES & SCALE */}
        <div className="space-y-4 pt-4.5 border-t border-[#E0E0DB]">
          <h3 className="text-[9px] font-sans font-extrabold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
            <Layers size={12} />
            Misure e Sovrapposizione
          </h3>

          {selectedElement.lockedPosition ? (
            <div className="p-4 bg-amber-50/50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded flex flex-col items-center justify-center gap-1.5 shadow-xs leading-relaxed">
              <span className="text-xl">🔒</span>
              <span>Posizione e coordinate bloccate.</span>
              <button
                type="button"
                onClick={() => onUpdateElement(selectedElement.id, { lockedPosition: false })}
                className="mt-1 text-[9px] text-amber-700 hover:text-amber-950 underline uppercase tracking-widest font-extrabold cursor-pointer"
              >
                Sblocca ora
              </button>
            </div>
          ) : (
            <>
              {/* Elevation height offset */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                  <span className="flex items-center gap-1">Stacking Height (Offset Y)</span>
                  <span className="font-mono text-neutral-500 font-bold">{selectedElement.position[1].toFixed(2)}m</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.01"
                  value={selectedElement.position[1]}
                  onChange={(e) => handlePositionChange(1, parseFloat(e.target.value))}
                  className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                  id="properties_elevation_slider"
                />
                <div className="flex justify-between text-[7px] text-[#8C8C80] font-sans font-extrabold tracking-widest">
                  <span>SUL TAVOLO</span>
                  <span>IMPILATO SOPRA</span>
                </div>
              </div>

              {/* Rotation coordinate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-[#1A1A1A]">
                  <span>Giro Angolare (Asse Y)</span>
                  <span className="font-mono text-neutral-500 font-bold">{selectedElement.rotation[1]}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={selectedElement.rotation[1]}
                  onChange={(e) => handleRotationChange(1, parseInt(e.target.value))}
                  className="w-full accent-black h-1 bg-[#FAF9F6] rounded appearance-none cursor-pointer border border-[#E0E0DB]"
                  id="properties_rotation_slider"
                />
              </div>
            </>
          )}

          {/* Scale inputs */}
          <div className="space-y-3 pt-2 border-t border-dashed border-[#E0E0DB]">
            <span className="text-[9px] font-sans font-extrabold text-[#8C8C80] uppercase tracking-widest block">Dimensionamento 3D</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="text-[8px] font-extrabold text-[#8C8C80] uppercase tracking-widest block mb-1">Larghezza (X)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5"
                  value={selectedElement.scale[0]}
                  onChange={(e) => handleScaleChange(0, Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-white border border-[#E0E0DB] rounded px-2.5 py-1 text-xs text-black focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <span className="text-[8px] font-extrabold text-[#8C8C80] uppercase tracking-widest block mb-1">Profondità (Z)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5"
                  value={selectedElement.scale[2]}
                  onChange={(e) => handleScaleChange(2, Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-white border border-[#E0E0DB] rounded px-2.5 py-1 text-xs text-black focus:outline-none focus:border-black font-semibold"
                />
              </div>
            </div>
            <div>
              <span className="text-[8px] font-extrabold text-[#8C8C80] uppercase tracking-widest block mb-1">Spessore Campione (Y)</span>
              <input
                type="number"
                step="0.02"
                min="0.01"
                max="1"
                value={selectedElement.scale[1]}
                onChange={(e) => handleScaleChange(1, Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full bg-white border border-[#E0E0DB] rounded px-2.5 py-1 text-xs text-black focus:outline-none focus:border-black font-semibold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 bg-[#FAF9F6] border-t border-[#E0E0DB] flex gap-2">
        <button
          onClick={() => onDuplicateElement(selectedElement.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-neutral-300 hover:border-black text-[10px] uppercase tracking-widest font-extrabold text-black bg-white transition-all cursor-pointer"
          id="duplicate-btn-footer"
        >
          <Copy size={12} />
          DUPLICA
        </button>
        <button
          onClick={() => onDeleteElement(selectedElement.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 border border-red-200 hover:border-red-600 text-red-700 hover:text-red-950 transition-all text-[10px] uppercase tracking-widest font-extrabold cursor-pointer"
          id="delete-btn-footer"
        >
          <Trash2 size={12} />
          ELIMINA
        </button>
      </div>
    </div>
  );
}
