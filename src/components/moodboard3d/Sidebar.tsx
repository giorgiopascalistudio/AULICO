import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Palette, 
  Trash2, 
  Copy, 
  Plus, 
  Search, 
  Sparkles,
  Grid,
  Circle,
  FolderOpen
} from 'lucide-react';
import { BoardElement, MaterialTemplate, ColorPalette, ShapeType } from './types';
import { EXQUISITE_MATERIALS, PRESET_PALETTES } from './data';

interface SidebarProps {
  elements: BoardElement[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddMaterial: (material: MaterialTemplate) => void;
  onAddPrimitiveShape: (shape: ShapeType, color: string, name: string) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onApplyPaletteColor: (color: string) => void;
  onLoadSavedBoard: (boardState: BoardElement[]) => void;
  onFileUpload?: (file: File) => void;
  // Environment overrides
  bgColor: string;
  setBgColor: (color: string) => void;
  bgProfile: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal';
  setBgProfile: (profile: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal') => void;
  tableColor: string;
  setTableColor: (color: string) => void;
  tableProfile: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal';
  setTableProfile: (profile: 'none' | 'plaster' | 'wood' | 'stone' | 'fabric' | 'tile' | 'metal') => void;
  tableRoughness: number;
  setTableRoughness: (val: number) => void;
  tableMetalness: number;
  setTableMetalness: (val: number) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  wallColor?: string;
  setWallColor?: (color: string) => void;
  showBackdrop?: boolean;
  setShowBackdrop?: (val: boolean) => void;
}

export default function Sidebar({
  elements,
  selectedId,
  onSelectElement,
  onAddMaterial,
  onAddPrimitiveShape,
  onDuplicateElement,
  onDeleteElement,
  onApplyPaletteColor,
  onLoadSavedBoard,
  onFileUpload,
  bgColor,
  setBgColor,
  bgProfile,
  setBgProfile,
  tableColor,
  setTableColor,
  tableProfile,
  setTableProfile,
  tableRoughness,
  setTableRoughness,
  tableMetalness,
  setTableMetalness,
  showGrid,
  setShowGrid,
  wallColor = '#DCDCD6',
  setWallColor = () => {},
  showBackdrop = true,
  setShowBackdrop = () => {}
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'shapes' | 'palettes' | 'environment' | 'layers'>('materials');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom paint code generator
  const [customColor, setCustomColor] = useState<string>('#9a3412');
  const [customPalName, setCustomPalName] = useState<string>('Mio Progetto');
  const [customPalette, setCustomPalette] = useState<string[]>(['#65a30d', '#2563eb', '#db2777', '#ea580c', '#14b8a6']);

  // Local storage quick loads
  const [savedBoards, setSavedBoards] = useState<{name: string, data: BoardElement[]}[]>(() => {
    try {
      const stored = localStorage.getItem('moodboard_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const filteredMaterials = EXQUISITE_MATERIALS.filter(mat => {
    const matchesCategory = materialFilter === 'all' || mat.category === materialFilter;
    const matchesSearch = mat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          mat.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateCustomPaletteColor = () => {
    if (customPalette.includes(customColor)) return;
    setCustomPalette([customColor, ...customPalette.slice(0, 5)]);
  };

  const handleSavedBoardClick = (presetData: BoardElement[]) => {
    onLoadSavedBoard(presetData);
  };

  return (
    <aside className="w-80 h-full bg-[#F4F4F2] border-r border-[#E0E0DB] flex flex-col z-10 text-[#1A1A1A] font-sans selection:bg-neutral-200">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E0E0DB] bg-[#FAF9F6]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-serif italic text-sm tracking-tighter shadow-sm font-bold">
            M
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-widest text-[#1A1A1A] uppercase">STUDIO MOODBOARD</h1>
            <p className="text-[9px] text-[#8C8C80] font-sans font-semibold tracking-wider uppercase">Interactive 3D Material Grid</p>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex border-b border-[#E0E0DB] text-[10px] uppercase tracking-wider font-extrabold bg-[#FAF9F6] text-neutral-400 overflow-x-auto whitespace-nowrap scrollbar-none">
        {(['materials', 'shapes', 'palettes', 'environment', 'layers'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const label = tab === 'materials' 
            ? 'Materiali' 
            : tab === 'shapes' 
            ? 'Forme 3D' 
            : tab === 'palettes' 
            ? 'Tinte' 
            : tab === 'environment'
            ? 'Studio'
            : `Layer (${elements.length})`;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[70px] py-3 text-center border-b font-sans font-extrabold transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'border-black text-black bg-[#F4F4F2]' 
                  : 'border-transparent hover:text-black hover:bg-neutral-100/50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* TAB 1: MATERIALS LIBRARY */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            
            {/* Search Input with editorial style */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3 w-3 text-neutral-450" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cerca materiali (es. rovere, marmo...)"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D1D1C7] rounded text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-semibold"
                id="sidebar_search"
              />
            </div>

            {/* Filter Pill Badges */}
            <div className="flex flex-wrap gap-1">
              {['all', 'wood', 'stone', 'fabric', 'metal', 'glass'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMaterialFilter(cat)}
                  className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer rounded ${
                    materialFilter === cat 
                      ? 'bg-black text-white font-bold' 
                      : 'bg-white text-neutral-500 border border-[#E0E0DB] hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  {cat === 'all' ? 'Tutti' : cat}
                </button>
              ))}
            </div>

            {/* Materials Catalog list of beautiful grid square cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {filteredMaterials.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => onAddMaterial(mat)}
                  className="group flex flex-col text-left p-2 rounded bg-white border border-[#E0E0DB] hover:border-black active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                  title="Clicca per aggiungere alla tavola 3D"
                  id={`material-btn-${mat.id}`}
                >
                  {/* Thumbnail */}
                  <div 
                    className="w-full h-18 rounded-sm mb-1.5 flex items-end p-1 relative overflow-hidden bg-cover bg-center"
                    style={{ 
                      backgroundColor: mat.color,
                      backgroundImage: mat.textureUrl ? `url(${mat.textureUrl})` : 'none'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    {mat.textureUrl && (
                      <span className="relative z-10 text-[7px] bg-black text-neutral-100 font-sans font-bold px-1 rounded uppercase tracking-wider">
                        PBR
                      </span>
                    )}
                  </div>
                  
                  {/* Metadata */}
                  <b className="text-[10px] text-neutral-800 font-bold leading-tight truncate w-full group-hover:text-black">
                    {mat.name}
                  </b>
                  <span className="text-[8px] text-neutral-400 uppercase tracking-widest font-extrabold mt-0.5">
                    {mat.category}
                  </span>
                </button>
              ))}

              {filteredMaterials.length === 0 && (
                <p className="col-span-2 text-center text-[10px] text-neutral-400 py-8 uppercase tracking-wider font-extrabold">
                  Nessun materiale trovato.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PHYSICAL SHAPES ADDER */}
        {activeTab === 'shapes' && (
          <div className="space-y-4">
            {/* AREA DI IMPORTAZIONE MODELLI 3D LOCAL CARRIER */}
            {onFileUpload && (
              <div className="p-4 bg-black text-white rounded space-y-3 shadow-md border border-neutral-800">
                <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-neutral-350 flex items-center gap-2">
                  <FolderOpen size={13} className="text-emerald-400" />
                  Carica File da Computer
                </h4>
                <p className="text-[9px] text-neutral-400 leading-relaxed font-semibold">
                  Carica un file 3D personalizzato <span className="text-white font-bold font-mono">.GLB / .GLTF</span> per posizionarlo sul tavolo, oppure seleziona file immagine <span className="text-white font-bold font-mono">PNG / JPG</span> per textures!
                </p>
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-900 border border-neutral-700 hover:border-emerald-400 rounded text-[9px] font-extrabold uppercase tracking-widest text-white cursor-pointer hover:bg-neutral-850 active:scale-95 transition-all text-center">
                  <Plus size={12} className="text-emerald-400" />
                  Sfoglia e carica file
                  <input
                    type="file"
                    accept=".glb,.gltf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <p className="text-[10px] text-neutral-500 font-sans font-semibold tracking-wide border-l border-neutral-300 pl-2.5 py-0.5">
              Clicca su una forma per generare un nuovo campione tridimensionale sul tavolo di lavoro:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onAddPrimitiveShape('tile', '#eae6e1', 'Piastrella Quadrata')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                id="shape-tile-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-sm bg-neutral-100 text-neutral-800">
                    <Grid size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-black">Piastrella Quadrata / Box</span>
                    <span className="text-[9px] text-neutral-400">Marmi, parquet e legni</span>
                  </div>
                </div>
                <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
              </button>

              <button
                onClick={() => onAddPrimitiveShape('circle', '#dfdbd5', 'Campione Circolare')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                id="shape-circle-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-sm bg-neutral-100 text-neutral-800">
                    <Circle size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-black">Campione Rotondo / Puck</span>
                    <span className="text-[9px] text-neutral-400">Bouclé, velluto e metalli</span>
                  </div>
                </div>
                <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
              </button>

              <button
                onClick={() => onAddPrimitiveShape('arch', '#ece3db', 'Arco Architettonico')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                id="shape-arch-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-sm bg-neutral-100 text-neutral-800">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-black">Arco Modanato</span>
                    <span className="text-[9px] text-neutral-400">Boiserie, cornici e decori</span>
                  </div>
                </div>
                <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
              </button>

              <button
                onClick={() => onAddPrimitiveShape('cylinder', '#bca38a', 'Cilindro / Colonna')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                id="shape-cylinder-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-sm bg-neutral-100 text-neutral-800">
                    <Box size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-black">Cilindro / Pilastro</span>
                    <span className="text-[9px] text-neutral-400">Colonne, listelli e vasi</span>
                  </div>
                </div>
                <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
              </button>

              <button
                onClick={() => onAddPrimitiveShape('sphere', '#ffffff', 'Sfera di Riflessione')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                id="shape-sphere-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-sm bg-neutral-100 text-neutral-800">
                    <Palette size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-black">Sfera Lucidissima</span>
                    <span className="text-[9px] text-neutral-400">Per testare i riflessi specchiati</span>
                  </div>
                </div>
                <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
              </button>
            </div>

            {/* LIGHT FIXTURES ADDER SUBSECTION */}
            <div className="pt-4 border-t border-[#E0E0DB] space-y-3">
              <h3 className="text-[9px] font-extrabold uppercase tracking-widest text-[#8C8C80] flex items-center gap-1.5">
                Sorgenti di Luce:
              </h3>
              <p className="text-[10px] text-neutral-500 leading-normal">
                Genera fari fisici nel tuo set per testare materiali PBR e ombre realistiche:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => onAddPrimitiveShape('light-spot', '#fffbc2', 'Faretto Spot')}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                  id="shape-light-spot-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-sm bg-amber-50 text-amber-700">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-black">Faretto Spot</span>
                      <span className="text-[9px] text-neutral-400">Luce direzionale con cono rotante</span>
                    </div>
                  </div>
                  <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
                </button>

                <button
                  onClick={() => onAddPrimitiveShape('light-point', '#ffd69c', 'Lampadina a Sfera')}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                  id="shape-light-point-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-sm bg-amber-50 text-amber-700">
                      <Circle size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-black">Lampadina a Sospensione</span>
                      <span className="text-[9px] text-neutral-400">Radiale, emana luce a 360 gradi</span>
                    </div>
                  </div>
                  <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
                </button>

                <button
                  onClick={() => onAddPrimitiveShape('light-directional', '#ffffff', 'Luce Sole parallela')}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#FAF9F6] border border-[#E0E0DB] hover:border-black rounded transition-all text-left shadow-sm cursor-pointer group"
                  id="shape-light-directional-btn"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-sm bg-amber-50 text-amber-700">
                      <Grid size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-black">Sole Direzionale</span>
                      <span className="text-[9px] text-neutral-400">Flusso parallelo per illuminazione diffusa</span>
                    </div>
                  </div>
                  <Plus size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLOR PALETTE CREATOR & APPLIER */}
        {activeTab === 'palettes' && (
          <div className="space-y-4">
            
            {/* Custom Palette Generator */}
            <div className="p-4 bg-white border border-[#E0E0DB] rounded space-y-3 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
                <Palette size={14} className="text-black" />
                Color Lab Interni
              </h3>
              <p className="text-[10px] text-neutral-500 leading-normal">
                Seleziona una tinta, aggiungila alla tua mazzetta e applicala direttamente al pezzo selezionato.
              </p>

              <div className="flex gap-2.5 items-center bg-[#FAF9F6] p-2 rounded border border-[#E0E0DB]">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-8 h-8 rounded-full border border-neutral-300 bg-transparent cursor-pointer overflow-hidden p-0"
                  id="color-pal-picker"
                />
                <div className="flex-1">
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 block">HEX CODE</span>
                  <span className="text-xs font-mono font-bold text-black uppercase">{customColor}</span>
                </div>
                <button
                  onClick={handleCreateCustomPaletteColor}
                  className="px-2.5 py-1 bg-black hover:bg-neutral-800 rounded-sm text-[9px] font-extrabold text-white uppercase tracking-widest cursor-pointer"
                >
                  Salva
                </button>
              </div>

              {/* Swatch bucket */}
              <div className="space-y-1.5 pt-2 border-t border-[#E0E0DB]">
                <span className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest">Personalizzate:</span>
                <div className="flex flex-wrap gap-2">
                  {customPalette.map((color, idx) => (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => onApplyPaletteColor(color)}
                      className="w-7 h-7 rounded border border-neutral-300 hover:scale-110 active:scale-95 transition-transform shadow-xs relative group cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={`Clicca per applicare ${color}`}
                    >
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-black text-[7px] px-1 rounded font-mono z-20 text-white select-none whitespace-nowrap shadow">
                        {color}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CURATED ARCHITECTURAL PALETTES */}
            <div className="space-y-3">
              <h4 className="text-[9px] font-extrabold tracking-widest text-[#8C8C80] uppercase">Mazzette Trend Consigliate</h4>
              
              <div className="space-y-2">
                {PRESET_PALETTES.map((palette) => (
                  <div key={palette.id} className="p-3 bg-white border border-[#E0E0DB] rounded shadow-xs">
                    <span className="text-[10px] font-bold text-neutral-700 block mb-2 uppercase tracking-wider">{palette.name}</span>
                    <div className="flex w-full rounded overflow-hidden h-6.5 border border-[#E0E0DB]">
                      {palette.colors.map((color, i) => (
                        <button
                          key={`${color}-${i}`}
                          onClick={() => onApplyPaletteColor(color)}
                          className="flex-1 hover:brightness-95 hover:scale-[1.02] transition-all cursor-pointer relative group"
                          style={{ backgroundColor: color }}
                          title={`Applica ${color}`}
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black text-[7px] font-mono px-1 py-0.5 rounded text-white z-20 pointer-events-none whitespace-nowrap shadow">
                            {color}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: STUDIO REALISTIC ENVIRONMENT CONTROLLERS */}
        {activeTab === 'environment' && (
          <div className="space-y-4">
            {/* 1. Backdrop Settings */}
            <div className="p-4 bg-white border border-[#E0E0DB] rounded space-y-3.5 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
                <Grid size={14} className="text-black" />
                Atmosfera Showroom
              </h3>
              <p className="text-[10px] text-neutral-500 leading-normal">
                Modifica le impostazioni di illuminazione, foschia dello sfondo e griglia di misura.
              </p>

              {/* Fog/Background Color selector */}
              <div className="space-y-1.5 pb-2 border-b border-[#E0E0DB]">
                <span className="text-[8px] font-extrabold text-[#8C8C80] block uppercase tracking-widest">Atmosfera Studio (Fog/Sfondo)</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded border border-neutral-300 cursor-pointer overflow-hidden p-0 bg-transparent flex-shrink-0"
                    id="bg-col-picker"
                  />
                  <div className="flex flex-wrap gap-1 items-center">
                    {[
                      { hex: '#EAEAE5', label: 'Crema Studio' },
                      { hex: '#1C1C1B', label: 'Dark Slate' },
                      { hex: '#E2DEC3', label: 'Warm Linen' },
                      { hex: '#3E2A24', label: 'Terracotta' },
                      { hex: '#D2DCD0', label: 'Salvia' }
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => setBgColor(col.hex)}
                        className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                          bgColor.toLowerCase() === col.hex.toLowerCase() 
                            ? 'border-black scale-110 shadow-sm' 
                            : 'border-neutral-200'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Show/Hide Grid Helper */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-neutral-800">Mostra Griglia di Misura</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="sr-only peer"
                    id="sidebar_grid_toggle"
                  />
                  <div className="w-8 h-4 bg-[#E0E0DB] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-black font-semibold"></div>
                </label>
              </div>
            </div>

            {/* 2. Tabletop Settings */}
            <div className="p-4 bg-white border border-[#E0E0DB] rounded space-y-3.5 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
                <Box size={14} className="text-black" />
                Pavimentazione Tavolo
              </h3>
              <p className="text-[10px] text-neutral-500 leading-normal">
                Modifica le proprietà del tavolo showroom su cui poggiano i campioni materiali.
              </p>

              {/* Tabletop Color */}
              <div className="space-y-1.5">
                <span className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest">Colore Piano</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tableColor}
                    onChange={(e) => setTableColor(e.target.value)}
                    className="w-8 h-8 rounded border border-neutral-305 cursor-pointer overflow-hidden p-0 bg-transparent flex-shrink-0"
                    id="table-col-picker"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {[
                      { hex: '#D1D1C7', label: 'Ecrù standard' },
                      { hex: '#2A2925', label: 'Nero Noce' },
                      { hex: '#F9F8F6', label: 'Bianco Travertino' },
                      { hex: '#776D5B', label: 'Cemento Brunito' }
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => setTableColor(col.hex)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          tableColor.toLowerCase() === col.hex.toLowerCase() 
                            ? 'border-black scale-110 shadow-sm' 
                            : 'border-[#E0E0DB]'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabletop Profile */}
              <div className="space-y-1.5">
                <span className="text-[8px] font-extrabold text-neutral-400 block uppercase tracking-widest">Texture Tavolo (PBR)</span>
                <select
                  value={tableProfile}
                  onChange={(e) => setTableProfile(e.target.value as any)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#D1D1C7] text-xs rounded font-bold cursor-pointer hover:border-black transition-colors focus:outline-none"
                  id="table-texture-profile"
                >
                  <option value="none">Satinato Opaco Uniforme</option>
                  <option value="wood">Venatura Legno Rovere</option>
                  <option value="stone">Travertino Poroso</option>
                  <option value="fabric">Tessuto Canvas Rustico</option>
                  <option value="tile">Fuga Ceramiche Squadrate</option>
                </select>
              </div>

              {/* Roughness / Gloss */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-extrabold text-neutral-400 uppercase tracking-widest">
                  <span>Rugosità (Opaco vs Lucido)</span>
                  <span className="font-mono text-black">{tableRoughness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={tableRoughness}
                  onChange={(e) => setTableRoughness(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                  id="table-roughness-slider"
                />
              </div>

              {/* Metalness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-extrabold text-neutral-400 uppercase tracking-widest">
                  <span>Riflesso Metallico</span>
                  <span className="font-mono text-black">{tableMetalness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.9"
                  step="0.05"
                  value={tableMetalness}
                  onChange={(e) => setTableMetalness(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                  id="table-metalness-slider"
                />
              </div>
            </div>

            {/* 3. General Studio grid toggle */}
            <div className="p-4 bg-[#FAF9F6] border border-[#E0E0DB] rounded flex items-center justify-between shadow-xs">
              <div>
                <h4 className="text-xs font-bold text-black">Linee della Griglia CAD</h4>
                <p className="text-[9px] text-neutral-400">Attiva la griglia prospettica tecnica.</p>
              </div>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4 accent-black cursor-pointer"
                id="show-grid-checkbox"
              />
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVE MOODBOARD LAYERS */}
        {activeTab === 'layers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[9px] font-extrabold text-[#8C8C80] uppercase tracking-wider">Oggetti in Tavola</h3>
              <span className="text-[9px] font-extrabold uppercase bg-neutral-200 px-2 py-0.5 rounded text-black">
                {elements.length} elementi
              </span>
            </div>

            <div className="space-y-2">
              {elements.map((el) => {
                const isSelected = el.id === selectedId;
                return (
                  <div
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-black bg-white text-black shadow-md' 
                        : 'border-[#E0E0DB] bg-[#FAF9F6] text-neutral-600 hover:text-black hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Color indicator / thumbnail */}
                      <div 
                        className="w-5 h-5 rounded-sm border border-neutral-300 flex-shrink-0 bg-cover bg-center"
                        style={{ 
                          backgroundColor: el.color,
                          backgroundImage: el.textureUrl ? `url(${el.textureUrl})` : 'none'
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate text-black">
                          {el.name}
                        </span>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#8C8C80] block mt-0.5">
                          {el.shape}
                        </span>
                      </div>
                    </div>

                    {/* Quick actions inside layers */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateElement(el.id);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-black transition-colors cursor-pointer"
                        title="Duplica elemento"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Elimina elemento"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {elements.length === 0 && (
                <div className="text-center py-10 border border-dashed border-[#D1D1C7] rounded">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold">Tavola vuota.</p>
                  <p className="text-[9px] text-[#8C8C80] mt-1 font-semibold">Trascina foto o aggiungi forme.</p>
                </div>
              )}
            </div>

            {/* Quick Presets Local Storage */}
            {savedBoards.length > 0 && (
              <div className="pt-4 border-t border-[#E0E0DB] space-y-2">
                <h4 className="text-[9px] font-extrabold text-[#8C8C80] uppercase tracking-widest flex items-center gap-1">
                  <FolderOpen size={10} />
                  Progetti nel Browser
                </h4>
                <div className="space-y-1.5">
                  {savedBoards.map((b, bIdx) => (
                    <button
                      key={`${b.name}-${bIdx}`}
                      onClick={() => handleSavedBoardClick(b.data)}
                      className="w-full flex items-center justify-between text-left p-2.5 rounded bg-[#FAF9F6] border border-[#E0E0DB] text-neutral-700 hover:text-black hover:bg-white hover:border-black transition-all cursor-pointer shadow-xs"
                    >
                      <span className="truncate font-bold text-xs">{b.name}</span>
                      <span className="text-[9px] font-extrabold text-neutral-400">
                        {b.data.length} PEZZI
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
