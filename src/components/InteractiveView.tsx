/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Pin, Star, SwitchCamera, MessageSquare, RefreshCw, Send, HelpCircle, Layers, ShieldAlert } from 'lucide-react';
import { AppleSwitch } from './AppleSwitch';
import { SmartAnimateText } from './SmartText';
import { PinnedList } from './PinnedList';
import { StatusCard } from './StatusCard';
import { MotionTabsMenu } from './MotionTabsMenu';

interface StudioItem {
  id: string;
  title: string;
  category: string;
  desc: string;
  hours: number;
}

const MOCK_STUDIO_ITEMS: StudioItem[] = [
  { id: '1', title: 'Studio di Fattibilità Superbonus', category: 'Architettura', desc: 'Rilevamento termografico e calcolo energetico preliminare.', hours: 14 },
  { id: '2', title: 'Direzione Lavori Cantiere Roma', category: 'Cantieri', desc: 'Sopralluoghi settimanali, monitoraggio SAL e sicurezza.', hours: 42 },
  { id: '3', title: 'Pratica Catastale e Sanatoria Fiscale', category: 'Catasto', desc: 'Aggiornamento planimetrico e conformità urbanistica.', hours: 6 },
  { id: '4', title: 'Rendering 3D Foto-realistico Villa', category: 'Design', desc: 'Modellazione volumetrica, materiali di pregio e luci solari.', hours: 28 }
];

export const InteractiveView: React.FC = () => {
  // 1. Apple Switch states
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    faceId: true,
    haptic: true,
    notifications: false
  });

  const handleSwitchChange = (id: string, value: boolean) => {
    setSwitches(prev => ({ ...prev, [id]: value }));
  };

  // 2. Smart Animate Text states
  const [counter, setCounter] = useState<number>(2410);
  const [textInput, setTextInput] = useState<string>('ONIRICO');

  // 3. Pinned List states
  const [pinnedIds, setPinnedIds] = useState<string[]>(['2', '4']);

  // 4. Flight Status progress state
  const [flightProgress, setFlightProgress] = useState<number>(45);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="text-left bg-white border border-[#e2e2e2] rounded-[26px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-[620px]">
          <div className="flex items-center gap-[7px] text-orange-600 font-bold text-[12.5px] uppercase tracking-wider mb-2 select-none">
            <Sparkles className="w-4 h-4 fill-current animate-pulse" /> Moduli Premium di Design & Interattività
          </div>
          <h2 className="text-[28px] font-extrabold tracking-tight text-[#161616] leading-none mb-2">
            Integrazioni Motion & UI
          </h2>
          <p className="text-[14px] text-[#8a8a8a] leading-relaxed">
            In questa sezione sono stati integrati i 5 widget avanzati unlumen UI e Componentry. 
            Ciascun elemento è completamente interattivo, responsive ed equipaggiato con animazioni inerziali a molla per la massima fluidità visiva.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-[11.5px] font-bold text-[#161616] bg-[#f0f0f0] border border-[#e2e2e2] py-2 px-4 rounded-xl">
            Typekit: Adelle Sans Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Switch & Flight Status (lg:span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* 1. Componentry Status Card widget */}
          <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm text-left flex flex-col gap-4">
            <div>
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#161616]">
                1/5 Status Card Adaptive
              </h3>
              <p className="text-[12.5px] text-[#8a8a8a]">
                Widget di stato avanzamento a matrice di punti ispirato alle bacheche meccaniche, con layout fluido reattivo.
              </p>
            </div>

            {/* Project Status Card Renderer */}
            <StatusCard
              fromCode="AVV"
              fromCity="Fattibilità & Rilievo"
              fromTime="Fase Iniziale Aperta"
              toCode="FINE"
              toCity="Fine Cantiere / Consegna"
              toTime="Collaudo & Certificati"
              progress={flightProgress}
              eta={`Tempo stimato residuo: ~${Math.floor(28 * (1 - flightProgress / 100))} Giorni`}
              nextLabel="Task Corrente"
              nextVal="Sopralluoghi in cantiere"
              rightLabel="Resoconto SAL"
              rightVal={`${flightProgress}/100 Punti`}
            />

            {/* Slider Controls */}
            <div className="bg-gray-50 rounded-xl p-4 border border-[#f5f5f5] flex items-center gap-4">
              <span className="text-[12px] font-bold text-[#161616] flex-shrink-0 uppercase tracking-wide">
                Regola Progress: {flightProgress}%
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={flightProgress}
                onChange={(e) => setFlightProgress(parseInt(e.target.value))}
                className="flex-1 accent-orange-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Apple Switch & Smart Animate Text widget */}
          <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm text-left flex flex-col gap-5">
            <div>
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#171717]">
                2/5 Smart Animate Text & 3/5 Apple Switch
              </h3>
              <p className="text-[12px] text-[#8a8a8a] -mt-0.5">
                Animazioni tipografiche blur-slide per-carattere e pulsanti iOS fluidi con drag & drop nativo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Apple Switch Card */}
              <div className="border border-[#e2e2e2] rounded-2xl p-4 flex flex-col gap-3.5 bg-white">
                <span className="text-[11px] font-extrabold text-[#8a8a8a] tracking-wider uppercase">
                  Pannello Apple Switches
                </span>
                <div className="flex flex-col gap-3">
                  <AppleSwitch
                    id="faceId"
                    checked={switches.faceId}
                    onChange={handleSwitchChange}
                    label="Abilita Face ID"
                    desc="Verifica biometrica Apple"
                    size="md"
                  />
                  <div className="h-px bg-gray-100" />
                  <AppleSwitch
                    id="haptic"
                    checked={switches.haptic}
                    onChange={handleSwitchChange}
                    label="Feedback Tattile"
                    desc="Interazione a molla"
                    size="md"
                  />
                  <div className="h-px bg-gray-100" />
                  <AppleSwitch
                    id="notifications"
                    checked={switches.notifications}
                    onChange={handleSwitchChange}
                    label="Notifiche Push"
                    desc="Aggiornamenti istantanei"
                    size="md"
                  />
                </div>
              </div>

              {/* Smart Animate Text Card */}
              <div className="border border-[#e2e2e2] rounded-2xl p-4 flex flex-col justify-between gap-3 bg-white">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-extrabold text-[#8a8a8a] tracking-wider uppercase">
                    Smart Animate Text
                  </span>
                  <div className="py-2.5">
                    {/* Character Animate output */}
                    <div className="text-[44px] font-black tracking-tight leading-none text-[#161616]">
                      <SmartAnimateText value={counter} enterBlur={6} staggerDelay={0.05} />
                    </div>
                  </div>
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => setCounter(c => c - 15)}
                    className="flex-1 py-1 px-3 border border-[#e2e2e2] rounded-xl hover:bg-gray-50 text-[12px] font-bold text-[#161616] cursor-pointer"
                  >
                    - 15
                  </button>
                  <button
                    onClick={() => setCounter(c => c + 25)}
                    className="flex-1 py-1 px-3 bg-[#1b1b1b] text-white hover:bg-black rounded-xl text-[12px] font-bold cursor-pointer"
                  >
                    + 25
                  </button>
                  <button
                    onClick={() => setCounter(Math.floor(1000 + Math.random() * 8999))}
                    className="w-10 h-8 border border-[#e2e2e2] rounded-xl hover:bg-gray-50 flex items-center justify-center cursor-pointer"
                    title="Numero random"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* String Animate Input */}
                <div className="mt-3">
                  <label className="text-[10px] font-extrabold text-[#8a8a8a] uppercase tracking-wider block mb-1">
                    Digita testo per provare:
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    maxLength={14}
                    onChange={(e) => setTextInput(e.target.value.toUpperCase())}
                    className="input w-full p-2 text-[13px] font-mono tracking-wider font-bold"
                  />
                  <div className="mt-2 text-[26px] font-sans font-extrabold text-[#161616]">
                    <SmartAnimateText value={textInput || '...'} direction="dynamic" staggerDelay={0.03} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pinned List & Motion Menu (lg:span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 3. Motion Tabs Menu unlumen UI */}
          <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm text-left flex flex-col gap-4">
            <div>
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#161616]">
                4/5 Motion Tabs Menu
              </h3>
              <p className="text-[12.5px] text-[#8a8a8a]">
                Floating menu con transizioni di altezza/larghezza e micro-ritardo dei testi per simulare un'app nativa.
              </p>
            </div>

            <MotionTabsMenu />
          </div>

          {/* 4. Pinned List unlumen UI */}
          <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm text-left flex flex-col gap-4">
            <div>
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#161616]">
                5/5 Pinned List Component
              </h3>
              <p className="text-[12.5px] text-[#8a8a8a]">
                Lista fluida con transizione di layout. Gli elementi evidenziati scivolano automaticamente in cima.
              </p>
            </div>

            <PinnedList<StudioItem>
              items={MOCK_STUDIO_ITEMS}
              pinnedIds={pinnedIds}
              getId={(item) => item.id}
              className="mt-1"
              onTogglePin={(id) => {
                setPinnedIds(prev =>
                  prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
                );
              }}
              renderItem={(item, isPinned) => (
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {item.category}
                    </span>
                    {isPinned && (
                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5 fill-current" /> EVIDENZIATO
                      </span>
                    )}
                  </div>
                  <b className="text-[13.5px] font-extrabold text-[#161616] block mt-1 truncate">
                    {item.title}
                  </b>
                  <p className="text-[12px] text-[#8a8a8a] line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                  <span className="text-[11px] text-gray-400 font-mono mt-1">
                    Durata stimata: {item.hours} ore
                  </span>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default InteractiveView;
