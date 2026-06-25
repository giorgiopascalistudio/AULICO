/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ClientRequestPanel — lato CLIENTE del portale.
 * Permette a un cliente (anche appena iscritto, senza progetti) di avviare una
 * NUOVA richiesta scegliendo la divisione (Studio / Materico / Strategico / Unico),
 * descrivere la propria idea e — per le divisioni di progettazione — comporre una
 * Moodboard 3D. Mostra anche l'elenco unificato "Le tue richieste" con lo stato.
 *
 * Routing dati:
 *  - Studio / Strategico / Unico → ClientRequest (nodo clientRequests/<uid>/<id>),
 *    con moodboard 3D opzionale; lo studio la valuta e la converte in progetto.
 *  - Materico → MatericoRequest (flusso partner invariato, bidding imprese).
 */

import React, { useState, lazy, Suspense } from 'react';
import {
  Plus, X, ArrowRight, ArrowLeft, Box, Check, Sparkles, Layers,
  PenSquare, Boxes, Building2, Megaphone, Home,
} from 'lucide-react';
import type { ClientRequest, MatericoRequest, UserProfile } from '../types';
import { COMPANY_COLOR } from '../finance';
import { useLang } from '../i18n';
import { fmtDay } from '../utils';
import { callAiImage } from '../firebase';

const Moodboard3D = lazy(() => import('./moodboard3d/Moodboard3D'));

type Division = 'studio' | 'materico' | 'strategico' | 'unico';

// name = brand (uguale in IT/EN); sub/desc tradotti via t('div.<key>.sub|desc')
const DIVISIONS: { key: Division; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'studio', name: 'Onirico', icon: Building2 },
  { key: 'materico', name: 'Materico', icon: Boxes },
  { key: 'strategico', name: 'Strategico', icon: Megaphone },
  { key: 'unico', name: 'Unico', icon: Home },
];
// Divisioni selezionabili in "Racconta il tuo sogno": Unico è escluso (lato cliente
// è una vetrina immobili, non una richiesta-progetto). DIVISIONS resta per il lookup
// (`divMeta`) di eventuali richieste legacy con divisione 'unico'.
const SELECTABLE_DIVISIONS = DIVISIONS.filter((d) => d.key !== 'unico');

// Solo le classi colore (le label si risolvono via t('reqstatus.<status>')).
const STATUS_CLS: Record<string, string> = {
  // ClientRequest
  inviata: 'bg-amber-50 text-amber-700 border-amber-200',
  presa_in_carico: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  convertita: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  chiusa: 'bg-stone-100 text-stone-500 border-stone-200',
  // MatericoRequest
  nuova: 'bg-amber-50 text-amber-700 border-amber-200',
  inoltrata: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  offerte: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  inviata_cliente: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accettata: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rifiutata: 'bg-rose-50 text-rose-700 border-rose-200',
};

interface ClientRequestPanelProps {
  profile: UserProfile;
  requests: ClientRequest[];                 // proprie ClientRequest
  matericoRequests?: MatericoRequest[];      // proprie MatericoRequest (per la lista unificata)
  onCreate: (req: ClientRequest) => void;
  onCreateMatericoRequest?: (req: MatericoRequest) => void;
}

export const ClientRequestPanel: React.FC<ClientRequestPanelProps> = ({
  profile, requests, matericoRequests, onCreate, onCreateMatericoRequest,
}) => {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [division, setDivision] = useState<Division>('studio');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [linksText, setLinksText] = useState('');
  const [moodboard, setMoodboard] = useState<any[]>([]);
  const [mbOpen, setMbOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Bozza immagine AI (da foto reale + questionario: stile/ambiente/palette/atmosfera)
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [style, setStyle] = useState('Moderno');
  const [ambiente, setAmbiente] = useState('Soggiorno');
  const [palette, setPalette] = useState('Neutri');
  const [atmosfera, setAtmosfera] = useState('Luminosa');
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);

  const useMoodboard = division !== 'materico'; // moodboard 3D per le divisioni di progettazione

  const reset = () => {
    setStep(1); setDivision('studio'); setTitle(''); setDescription('');
    setBudget(''); setLocation(''); setLinksText(''); setMoodboard([]); setErr(null);
    setPhotoB64(null); setStyle('Moderno'); setAmbiente('Soggiorno'); setPalette('Neutri'); setAtmosfera('Luminosa'); setDraftImage(null); setGenErr(null);
  };

  const STYLES = ['Moderno', 'Minimal', 'Rustico', 'Mediterraneo', 'Industriale', 'Classico', 'Scandinavo'];
  const AMBIENTI = ['Soggiorno', 'Cucina', 'Camera', 'Bagno', 'Studio', 'Esterno / giardino', 'Facciata', 'Lotto / terreno'];
  const PALETTE = ['Neutri', 'Caldi', 'Freddi', 'Terrosi', 'Bianco & legno', 'Scuri eleganti'];
  const ATMOSFERE = ['Luminosa', 'Accogliente', 'Minimal', 'Lussuosa', 'Naturale'];

  const onPhoto = (file: File) => {
    const r = new FileReader();
    r.onloadend = () => setPhotoB64(r.result as string);
    r.readAsDataURL(file);
  };

  const generateDraft = async () => {
    if (!photoB64) { setGenErr('Carica prima una foto.'); return; }
    setGenLoading(true); setGenErr(null);
    try {
      const prompt = `${style} style, ${ambiente.toLowerCase()}, ${palette.toLowerCase()} color palette, ${atmosfera.toLowerCase()} atmosphere — architecture/interior render redesigned from the provided photo, realistic lighting, clean composition, high quality. ${description.trim().slice(0, 300)}`;
      const dataUrl = await callAiImage({ imageBase64: photoB64, prompt });
      setDraftImage(dataUrl);
    } catch (e: any) {
      setGenErr(e?.message || 'Generazione non riuscita.');
    } finally {
      setGenLoading(false);
    }
  };
  const close = () => { setOpen(false); reset(); };

  const submit = () => {
    if (!title.trim()) { setErr(t('req.errTitle')); return; }
    if (!description.trim()) { setErr(t('req.errDesc')); return; }
    const links = linksText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    const now = Date.now();

    if (division === 'materico') {
      const req: MatericoRequest = {
        id: `mr-${now}`,
        clientUid: profile.uid,
        clientName: profile.name,
        title: title.trim(),
        description: description.trim(),
        note: budget.trim() ? t('req.budgetNote', { budget: budget.trim() }) : undefined,
        links: links.length ? links : undefined,
        status: 'nuova',
        createdAt: now,
      };
      onCreateMatericoRequest?.(req);
    } else {
      const req: ClientRequest = {
        id: `cr-${now}`,
        clientUid: profile.uid,
        clientName: profile.name,
        clientEmail: profile.email || null,
        division,
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim() ? Number(String(budget).replace(/[^\d.]/g, '')) || null : null,
        location: location.trim() || null,
        links: links.length ? links : null,
        moodboard: moodboard.length ? moodboard : null,
        draftImage: draftImage || null,
        status: 'inviata',
        createdAt: now,
      };
      onCreate(req);
    }
    close();
  };

  // Lista unificata (ClientRequest + MatericoRequest del cliente), ordinata per data desc.
  const unified: { id: string; division: Division; title: string; status: string; at: number; mood: number }[] = [
    ...requests.map((r) => ({ id: r.id, division: r.division as Division, title: r.title, status: r.status, at: r.createdAt, mood: (r.moodboard || []).length })),
    ...(matericoRequests || []).map((r) => ({ id: r.id, division: 'materico' as Division, title: r.title, status: r.status, at: r.createdAt, mood: 0 })),
  ].sort((a, b) => b.at - a.at);

  const divMeta = (d: Division) => DIVISIONS.find((x) => x.key === d)!;

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm overflow-hidden">
      {/* Header card */}
      <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-[#f0f0f0]">
        <div className="min-w-0">
          <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#161616]" /> {t('req.tellIdea')}
          </h3>
          <p className="text-[12.5px] text-[#8a8a8a] mt-0.5 leading-snug">
            {t('req.tellIdeaSub.a')}<b className="text-[#161616] font-bold">{t('req.tellIdeaSub.bold')}</b>{t('req.tellIdeaSub.b')}
          </p>
        </div>
        <button
          onClick={() => { reset(); setOpen(true); }}
          className="shrink-0 inline-flex items-center gap-1.5 bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> {t('req.new')}
        </button>
      </div>

      {/* Lista richieste */}
      <div className="p-4 sm:p-5">
        {unified.length === 0 ? (
          <p className="text-[12.5px] text-[#a3a3a3] text-center py-3">
            {t('req.emptyList')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {unified.map((r) => {
              const m = divMeta(r.division);
              const stCls = STATUS_CLS[r.status] || 'bg-stone-100 text-stone-500 border-stone-200';
              const stLabel = STATUS_CLS[r.status] ? t('reqstatus.' + r.status) : r.status;
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl border border-[#ececec] bg-[#fafafa]">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COMPANY_COLOR[r.division] }}>
                    <m.icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <b className="text-[13.5px] text-[#161616] truncate">{r.title}</b>
                      {r.mood > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md px-1.5 py-0.5">
                          <Box className="w-3 h-3" /> 3D
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-[#8a8a8a]">{m.name} · {fmtDay(new Date(r.at))}</span>
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${stCls}`}>{stLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Modale nuova richiesta (nascosta mentre è aperta la moodboard 3D, che sta sotto a z-120) ---- */}
      {open && !mbOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-[640px] sm:rounded-[26px] rounded-t-[26px] shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* head */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#f0f0f0] px-5 sm:px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="w-8 h-8 rounded-lg hover:bg-[#f2f2f0] flex items-center justify-center cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <b className="text-[15px] text-[#161616]">{step === 1 ? t('req.step1Title') : t('req.step2Title')}</b>
                  <div className="text-[11.5px] text-[#8a8a8a]">{t('req.stepOf', { step })}</div>
                </div>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-lg hover:bg-[#f2f2f0] flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SELECTABLE_DIVISIONS.map((d) => {
                    const on = division === d.key;
                    return (
                      <button
                        key={d.key}
                        onClick={() => setDivision(d.key)}
                        className={`text-left rounded-2xl border p-3.5 transition-all ${on ? 'text-white shadow-md' : 'border-[#e6e6e6] bg-white hover:border-stone-400'}`}
                        style={on ? { backgroundColor: COMPANY_COLOR[d.key], borderColor: COMPANY_COLOR[d.key] } : undefined}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${on ? 'bg-white/15' : 'bg-[#f2f2f0]'}`}>
                          <d.icon className="w-5 h-5" />
                        </div>
                        <b className="block text-[14px]">{d.name}</b>
                        <span className={`block text-[10.5px] font-bold uppercase tracking-wide mt-0.5 ${on ? 'text-white/70' : 'text-stone-400'}`}>{t('div.' + d.key + '.sub')}</span>
                        <span className={`block text-[11.5px] leading-snug mt-1.5 ${on ? 'text-white/80' : 'text-stone-500'}`}>{t('div.' + d.key + '.desc')}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-white px-3 py-2 rounded-xl" style={{ backgroundColor: COMPANY_COLOR[division] }}>
                    {React.createElement(divMeta(division).icon, { className: 'w-4 h-4' })}
                    {divMeta(division).name} · {t('div.' + division + '.sub')}
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-bold text-[#555] flex items-center gap-1.5"><PenSquare className="w-3.5 h-3.5" /> {t('req.title')}</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('req.titlePlaceholder')} className="input w-full h-11 px-3.5 text-[14px]" />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-bold text-[#555]">{t('req.idea')}</span>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={t('req.ideaPlaceholder')} className="input w-full px-3.5 py-2.5 text-[14px] resize-y" />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-bold text-[#555]">{t('req.budget')}</span>
                      <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={t('req.budgetPlaceholder')} className="input w-full h-11 px-3.5 text-[14px]" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-bold text-[#555]">{t('req.where')}</span>
                      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('req.wherePlaceholder')} className="input w-full h-11 px-3.5 text-[14px]" />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-bold text-[#555]">{t('req.links')}</span>
                    <input value={linksText} onChange={(e) => setLinksText(e.target.value)} placeholder={t('req.linksPlaceholder')} className="input w-full h-11 px-3.5 text-[14px]" />
                  </label>

                  {/* Bozza immagine AI: foto reale + stile → render di idea */}
                  {useMoodboard && (
                    <div className="rounded-2xl border border-[#e6e6e6] bg-[#fafafa] p-3.5 flex flex-col gap-2.5">
                      <b className="text-[13px] text-[#161616] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#b45309]" /> Bozza immagine AI</b>
                      <span className="text-[11.5px] text-[#8a8a8a] -mt-1">Carica una foto (la stanza, la facciata o il lotto), rispondi al breve questionario e genera una bozza d'idea. Risultato indicativo.</span>
                      <label className="text-[12px] font-bold px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] cursor-pointer hover:bg-[#f5f5f5] self-start">
                        {photoB64 ? 'Cambia foto' : 'Carica foto'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); }} />
                      </label>
                      {/* Questionario */}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1"><span className="text-[10.5px] font-bold text-[#8a8a8a]">Ambiente</span>
                          <select value={ambiente} onChange={(e) => setAmbiente(e.target.value)} className="input h-9 px-2 text-[13px]">{AMBIENTI.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                        <label className="flex flex-col gap-1"><span className="text-[10.5px] font-bold text-[#8a8a8a]">Stile</span>
                          <select value={style} onChange={(e) => setStyle(e.target.value)} className="input h-9 px-2 text-[13px]">{STYLES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                        <label className="flex flex-col gap-1"><span className="text-[10.5px] font-bold text-[#8a8a8a]">Palette colori</span>
                          <select value={palette} onChange={(e) => setPalette(e.target.value)} className="input h-9 px-2 text-[13px]">{PALETTE.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                        <label className="flex flex-col gap-1"><span className="text-[10.5px] font-bold text-[#8a8a8a]">Atmosfera</span>
                          <select value={atmosfera} onChange={(e) => setAtmosfera(e.target.value)} className="input h-9 px-2 text-[13px]">{ATMOSFERE.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                      </div>
                      <button type="button" onClick={generateDraft} disabled={!photoB64 || genLoading} className="self-start text-[12px] font-bold px-3 py-2 rounded-xl bg-[#1b1b1b] text-white border-none cursor-pointer disabled:opacity-40">
                        {genLoading ? 'Genero…' : 'Genera bozza'}
                      </button>
                      {genErr && <span className="text-[11.5px] text-red-600">{genErr}</span>}
                      <div className="flex gap-3 flex-wrap">
                        {photoB64 && (
                          <div className="flex flex-col gap-1"><span className="text-[10.5px] text-[#8a8a8a] font-bold">Foto</span><img src={photoB64} alt="foto" className="w-28 h-28 object-cover rounded-xl border border-[#e2e2e2]" /></div>
                        )}
                        {draftImage && (
                          <div className="flex flex-col gap-1"><span className="text-[10.5px] text-[#b45309] font-bold">Bozza ({style})</span><img src={draftImage} alt="bozza" className="w-28 h-28 object-cover rounded-xl border border-[#b45309]" /></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Moodboard 3D */}
                  {useMoodboard && (
                    <div className="rounded-2xl border border-[#e6e6e6] bg-[#fafafa] p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <b className="text-[13px] text-[#161616] flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-600" /> {t('req.mb3d')}</b>
                        <span className="block text-[11.5px] text-[#8a8a8a] mt-0.5">
                          {moodboard.length ? t('req.mbComposed', { n: moodboard.length }) : t('req.mbCompose')}
                        </span>
                      </div>
                      <button onClick={() => setMbOpen(true)} className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-[#1b1b1b] hover:bg-[#1b1b1b] hover:text-white text-[#161616] font-bold text-[12.5px] py-2 px-3.5 rounded-xl cursor-pointer transition-all active:scale-95">
                        <Box className="w-4 h-4" /> {moodboard.length ? t('common.edit') : t('common.open')}
                      </button>
                    </div>
                  )}

                  {err && <p className="text-[12px] text-red-600 font-semibold">{err}</p>}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#f0f0f0] px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
              <button onClick={close} className="text-[12.5px] font-bold text-stone-500 hover:text-[#161616]">{t('common.cancel')}</button>
              {step === 1 ? (
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13.5px] h-11 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                  {t('req.continue')} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={submit} className="inline-flex items-center gap-2 bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13.5px] h-11 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                  <Check className="w-4 h-4" /> {t('req.send')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay Moodboard 3D (lazy) */}
      {mbOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center text-white text-sm font-bold">{t('req.mbLoading')}</div>}>
          <Moodboard3D
            open={mbOpen}
            onClose={() => setMbOpen(false)}
            projectName={title.trim() || t('req.ideaFallback')}
            elements={moodboard}
            onSave={(els: any[]) => setMoodboard(els)}
          />
        </Suspense>
      )}
    </div>
  );
};
