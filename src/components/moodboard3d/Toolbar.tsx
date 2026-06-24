import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  RotateCcw, 
  Share2, 
  Sun, 
  Sunset, 
  CloudRain, 
  Moon, 
  Save, 
  Upload, 
  Camera, 
  Check,
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { ScenePreset, BoardElement } from './types';
import { SCENE_PRESETS } from './data';

interface ToolbarProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetBoard: () => void;
  onExportPNG: () => void;
  activePreset: ScenePreset;
  onUpdatePreset: (preset: ScenePreset) => void;
  elements: BoardElement[];
  onLoadBoard: (board: BoardElement[]) => void;
}

export default function Toolbar({
  onImageUpload,
  onResetBoard,
  onExportPNG,
  activePreset,
  onUpdatePreset,
  elements,
  onLoadBoard
}: ToolbarProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState('Haussmann Apartment Renovation');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize dynamic tab name or project list from saved presets
  useEffect(() => {
    try {
      const stored = localStorage.getItem('moodboard_last_title');
      if (stored) {
        setProjectName(stored);
      }
    } catch {}
  }, []);

  const handleTitleChange = (val: string) => {
    setProjectName(val);
    try {
      localStorage.setItem('moodboard_last_title', val);
    } catch {}
  };

  // Generate URL Hash containing compiled shareable 3D state
  const handleGenerateShareableLink = () => {
    try {
      const serialized = JSON.stringify(elements);
      const encoded = btoa(unescape(encodeURIComponent(serialized)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#board=${encoded}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error('Failed to create sharing link', err);
    }
  };

  // Save layout into localStorage presets
  const handleSaveToLocalStorage = () => {
    try {
      const stored = localStorage.getItem('moodboard_presets');
      const list = stored ? JSON.parse(stored) : [];
      
      // Filter out duplicate names
      const newList = list.filter((item: any) => item.name !== projectName);
      newList.push({
        name: projectName,
        data: elements
      });
      
      localStorage.setItem('moodboard_presets', JSON.stringify(newList));
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setShowSaveModal(false);
      }, 1500);

      // Force a slight browser event so other sections pick up the save list
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to save layout', err);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <nav className="w-full h-18 bg-white border-b border-[#E0E0DB] flex items-center justify-between px-8 z-10 text-[#1A1A1A] select-none shadow-sm font-sans">
      
      {/* Editorial Title & Geometric Logo */}
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center transform hover:rotate-90 transition-transform duration-500">
          <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-neutral-400 font-sans">STUDIO BOARD • PROJECT 01</span>
          <div className="flex items-center gap-1.5">
            <input 
              type="text"
              value={projectName}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-base font-serif italic text-black bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none py-0.5 leading-none w-56 font-serif"
              title="Clicca per rinominare il progetto"
            />
          </div>
        </div>
      </div>

      {/* Lighting Presets Panel styled with Minimal Pills */}
      <div className="hidden lg:flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400">Atmosphere</span>
        <div className="flex items-center bg-[#F4F4F2] rounded-full p-0.5 border border-[#E0E0DB]">
          {SCENE_PRESETS.map((preset) => {
            const isSelected = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onUpdatePreset(preset)}
                className={`flex items-center gap-1.5 px-3.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-black text-white shadow font-bold' 
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50'
                }`}
                title={preset.name}
              >
                <span>{preset.id === 'scene-giorno' ? 'Giorno' : preset.id === 'scene-notte' ? 'Notte' : 'Interno'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Actions & File Handlers */}
      <div className="flex items-center gap-3">
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*,.glb,.gltf" 
          onChange={onImageUpload}
          className="hidden" 
          id="toolbar_file_uploader_raw"
        />
        
        {/* Paste/Upload tool */}
        <button
          onClick={triggerFileInput}
          className="flex items-center gap-1 px-4 py-2 border border-neutral-300 hover:border-black text-[10px] uppercase tracking-widest font-extrabold text-black bg-white transition-all cursor-pointer hover:bg-neutral-50 shadow-xs"
          id="toolbar_upload_btn"
        >
          <Upload size={12} />
          <span>Carica Foto / 3D</span>
        </button>

        {/* Save board project button */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-1 px-4 py-2 border border-[#E0E0DB] bg-[#F4F4F2] hover:bg-neutral-200 hover:border-neutral-400 text-[10px] uppercase tracking-widest font-extrabold text-neutral-700 hover:text-black transition-all cursor-pointer"
          id="toolbar_save_panel_btn"
        >
          <Save size={12} />
          <span>Salva</span>
        </button>

        <span className="w-[1px] h-5 bg-neutral-200"></span>

        {/* Export / Instant Rendering image */}
        <button
          onClick={onExportPNG}
          className="px-5 py-2 bg-black text-white text-[10px] uppercase tracking-widest font-extrabold hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
          title="Esporta rendering della tavola 3D ad alta definizione"
          id="toolbar_export_btn"
        >
          <Camera size={12} />
          <span>Render PNG</span>
        </button>

        {/* Share board */}
        <button
          onClick={handleGenerateShareableLink}
          className={`px-4 py-2 text-[10px] uppercase tracking-widest font-extrabold border transition-all cursor-pointer ${
            copiedLink 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
              : 'border-black text-[#1A1A1A] hover:bg-neutral-50'
          }`}
          id="toolbar_share_btn"
        >
          <span>{copiedLink ? 'Copiato!' : 'Share'}</span>
        </button>

        <button
          onClick={onResetBoard}
          className="p-2 border border-neutral-200 hover:border-red-400/50 hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-all rounded cursor-pointer"
          title="Svuota l'intera tavola"
          id="toolbar_reset_btn"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* SAVE MODAL DIALOG OVERLAY */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="w-full max-w-sm bg-white border border-[#E0E0DB] shadow-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Briefcase className="text-gray-400" size={14} />
              Salva Configurazione Board
            </h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Conserva campioni, rotazioni, stacking di altezze e combinazioni di colore nel tuo archivio locale dell'appartamento.
            </p>

            <div className="space-y-1.5">
              <label className="text-[9px] font-sans font-extrabold uppercase text-neutral-400 tracking-wider">Titolo Progetto</label>
              <input
                type="text"
                value={projectName}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="es. Haussmann Apartment Renovation"
                className="w-full px-3 py-2 bg-[#F4F4F2] border border-[#E0E0DB] rounded text-xs text-black focus:outline-none focus:border-black font-semibold"
                id="save_project_name_input"
              />
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[10px] uppercase tracking-widest font-bold text-neutral-600 rounded transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveToLocalStorage}
                className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] uppercase tracking-widest font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? <Check size={12} /> : <Save size={12} />}
                <span>{isSaved ? 'Salvato!' : 'Salva'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
