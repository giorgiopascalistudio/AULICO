/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  X,
  Trash2,
  Calendar as CalendarIcon,
  Link as LinkIcon,
  ImageIcon,
  Check,
  Sofa,
  LayoutGrid,
  Palette,
  Type as TypeIcon,
  AlertTriangle,
  Pencil
} from 'lucide-react';

import { Furnishing, Project } from '../types';
import { todayISO, eur, safeUrl } from '../utils';
import { useLang } from '../i18n';
import { arrediTotals, STUDIO_FEE_PCT, ARREDI_MOBILI_FEE_PCT } from '../finance';
import { Box, Maximize2, Loader2 } from 'lucide-react';
import { MoodboardErrorBoundary } from './moodboard3d/MoodboardErrorBoundary';
// Caricamento lazy: three/fiber/drei finiscono in un chunk separato, scaricato solo all'apertura
const Moodboard3D = lazy(() => import('./moodboard3d/Moodboard3D'));

interface FurnishingsBoardProps {
  project: Project;
  items: Furnishing[];
  myUid: string;
  myRole: string;
  isStudio: boolean;
  onSaveItem: (pid: string, item: Furnishing) => void;
  onDeleteItem: (pid: string, itemId: string) => void;
  onToggleStudioManagesMobili?: (pid: string, value: boolean) => void;
  moodboard3dElements?: any[];
  onSaveMoodboard3d?: (pid: string, elements: any[]) => void;
}

type Section = 'fissi' | 'mobili' | 'moodboard';

// label risolta via t('fb.sec.<id>')
const SECTIONS: { id: Section; icon: React.ElementType }[] = [
  { id: 'fissi', icon: Sofa },
  { id: 'mobili', icon: LayoutGrid },
  { id: 'moodboard', icon: Palette }
];

// Valori canonici memorizzati (italiano); display tradotto via CAT_KEY → t('fbcat.<key>')
const CATEGORIES = ['Sanitari', 'Cucina', 'Armadi a incasso', 'Illuminazione', 'Tessili', 'Pavimenti', 'Rivestimenti', 'Altro'];
const CAT_KEY: Record<string, string> = {
  'Sanitari': 'sanitari', 'Cucina': 'cucina', 'Armadi a incasso': 'armadi', 'Illuminazione': 'illuminazione',
  'Tessili': 'tessili', 'Pavimenti': 'pavimenti', 'Rivestimenti': 'rivestimenti', 'Altro': 'altro',
};

const STATUS_FLOW: Furnishing['status'][] = ['da_scegliere', 'proposto', 'scelto', 'confermato'];
const STATUS_STYLE: Record<Furnishing['status'], string> = {
  da_scegliere: 'bg-[#f1f1f1] text-[#6b6b6b]',
  proposto: 'bg-amber-50 text-amber-700',
  scelto: 'bg-indigo-50 text-indigo-700',
  confermato: 'bg-emerald-50 text-emerald-700'
};

// Stato scadenza per badge (rosso scaduta, ambra vicina, neutro altrimenti)
function deadlineState(deadline?: string | null): 'overdue' | 'soon' | 'ok' | null {
  if (!deadline) return null;
  const today = todayISO();
  if (deadline < today) return 'overdue';
  const d = new Date(deadline).getTime();
  const t = new Date(today).getTime();
  const days = Math.round((d - t) / 86400000);
  if (days <= 7) return 'soon';
  return 'ok';
}

export const FurnishingsBoard: React.FC<FurnishingsBoardProps> = ({
  project,
  items,
  myUid,
  myRole,
  isStudio,
  onSaveItem,
  onDeleteItem,
  onToggleStudioManagesMobili,
  moodboard3dElements,
  onSaveMoodboard3d
}) => {
  const { t } = useLang();
  const catLabel = (c?: string | null) => (c && CAT_KEY[c] ? t('fbcat.' + CAT_KEY[c]) : (c || ''));
  const [section, setSection] = useState<Section>('fissi');
  const [modalKind, setModalKind] = useState<Furnishing['kind'] | null>(null);
  const [editItem, setEditItem] = useState<Furnishing | null>(null);   // arredo in modifica (solo non confermati)
  const [mb3dOpen, setMb3dOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Form (modale nuovo arredo)
  const [fTitle, setFTitle] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fDeadline, setFDeadline] = useState('');
  const [fImageUrl, setFImageUrl] = useState('');
  const [fLink, setFLink] = useState('');
  const [fColor, setFColor] = useState('');
  const [fNote, setFNote] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fQuantity, setFQuantity] = useState('');

  const pid = project.id;
  const fissi = items.filter((i) => i.kind === 'fisso');
  const mobili = items.filter((i) => i.kind === 'mobile');
  const boardItems = items.filter((i) => i.board);

  // Subtotali e anteprima fee (motore finanziario).
  // In contabilità entrano SOLO gli arredi confermati: la fee si calcola su quelli.
  const totals = arrediTotals(items);
  const managesMobili = !!project.studioManagesArrediMobili;
  const feeFissi = totals.fissiConfermati * (project.studioFeePct ?? STUDIO_FEE_PCT);
  const feeMobili = managesMobili ? totals.mobiliConfermati * (project.arrediMobiliFeePct ?? ARREDI_MOBILI_FEE_PCT) : 0;

  const resetForm = () => {
    setFTitle('');
    setFCategory('');
    setFDeadline('');
    setFImageUrl('');
    setFLink('');
    setFColor('');
    setFNote('');
    setFPrice('');
    setFQuantity('');
  };

  const openModal = (kind: Furnishing['kind']) => {
    resetForm();
    setEditItem(null);
    setModalKind(kind);
  };

  // Modifica di un arredo esistente (consentita finché non è confermato)
  const openEdit = (item: Furnishing) => {
    setFTitle(item.title || '');
    setFCategory(item.category || '');
    setFDeadline(item.deadline || '');
    setFImageUrl(item.imageUrl || '');
    setFLink(item.link || '');
    setFColor(item.color || '');
    setFNote(item.note || '');
    setFPrice(item.price != null ? String(item.price) : '');
    setFQuantity(item.quantity != null ? String(item.quantity) : '');
    setEditItem(item);
    setModalKind(item.kind);
  };

  const saveNew = () => {
    if (!fTitle.trim() || !modalKind) return;
    const fields = {
      kind: modalKind,
      category: fCategory || null,
      title: fTitle.trim(),
      deadline: fDeadline || null,
      imageUrl: fImageUrl.trim() || null,
      link: fLink.trim() || null,
      color: fColor.trim() || null,
      note: fNote.trim() || null,
      price: fPrice.trim() ? parseFloat(fPrice.replace(',', '.')) || null : null,
      quantity: fQuantity.trim() ? parseFloat(fQuantity.replace(',', '.')) || null : null
    };
    if (editItem) {
      onSaveItem(pid, { ...editItem, ...fields, updatedAt: Date.now() });
    } else {
      onSaveItem(pid, {
        id: `fur-${Date.now()}-${Math.floor(Math.random() * 900)}`,
        projectId: pid,
        status: 'da_scegliere',
        board: null,
        createdBy: myUid,
        createdByName: undefined,
        createdByRole: myRole,
        at: Date.now(),
        ...fields
      });
    }
    setEditItem(null);
    setModalKind(null);
  };

  const cycleStatus = (item: Furnishing) => {
    const idx = STATUS_FLOW.indexOf(item.status);
    // Il cliente può arrivare fino a 'scelto'; solo lo studio conferma.
    const maxIdx = isStudio ? STATUS_FLOW.length - 1 : STATUS_FLOW.length - 2;
    const next = STATUS_FLOW[Math.min(idx + 1, maxIdx)];
    onSaveItem(pid, { ...item, status: next, updatedAt: Date.now() });
  };

  const toggleBoard = (item: Furnishing) => {
    if (item.board) {
      onSaveItem(pid, { ...item, board: null, updatedAt: Date.now() });
    } else {
      onSaveItem(pid, { ...item, board: { x: 24, y: 24, rot: 0 }, updatedAt: Date.now() });
    }
  };

  // Aggiunge una tile diretta sulla lavagna (immagine/colore/nota)
  const addBoardTile = (data: Partial<Furnishing>) => {
    const item: Furnishing = {
      id: `fur-${Date.now()}-${Math.floor(Math.random() * 900)}`,
      projectId: pid,
      kind: 'mobile',
      category: null,
      title: data.title || 'Riferimento',
      status: 'da_scegliere',
      deadline: null,
      imageUrl: data.imageUrl || null,
      link: null,
      color: data.color || null,
      note: data.note || null,
      board: { x: 24 + Math.floor(Math.random() * 80), y: 24 + Math.floor(Math.random() * 80), rot: 0 },
      createdBy: myUid,
      createdByRole: myRole,
      at: Date.now()
    };
    onSaveItem(pid, item);
  };

  const onTileDragEnd = (item: Furnishing, offsetX: number, offsetY: number) => {
    const base = item.board || { x: 0, y: 0 };
    onSaveItem(pid, {
      ...item,
      board: { ...base, x: Math.max(0, base.x + offsetX), y: Math.max(0, base.y + offsetY) },
      updatedAt: Date.now()
    });
  };

  const renderCard = (item: Furnishing, showDeadline: boolean) => {
    const dState = showDeadline ? deadlineState(item.deadline) : null;
    return (
      <div key={item.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" className="w-16 h-16 rounded-[14px] object-cover border border-[#ececec] flex-shrink-0" />
          ) : item.color ? (
            <div className="w-16 h-16 rounded-[14px] border border-[#ececec] flex-shrink-0" style={{ background: item.color }} />
          ) : (
            <div className="w-16 h-16 rounded-[14px] border border-[#ececec] bg-[#fafafa] flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-gray-300" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[13.5px] text-[#161616] truncate" title={item.title}>{item.title}</b>
              <span className="flex items-center gap-1.5 flex-shrink-0">
                {item.status !== 'confermato' && (
                  <button onClick={() => openEdit(item)} className="text-gray-300 hover:text-[#161616] transition-colors" title={t('common.edit')}>
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => onDeleteItem(pid, item.id)} className="text-gray-300 hover:text-red-500 transition-colors" title={t('fb.remove')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </div>
            {item.category && <div className="text-[10.5px] text-[#8a8a8a] font-semibold mt-0.5">{catLabel(item.category)}</div>}
            {item.price != null && (
              <div className="text-[11px] font-bold text-[#161616] mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>{eur(item.price)}{(item.quantity ?? 1) !== 1 ? ` × ${item.quantity} = ${eur((item.price || 0) * (item.quantity || 1))}` : ''}</span>
                {item.status === 'confermato' && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" /> {t('fb.inAccounting')}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <button
                onClick={() => cycleStatus(item)}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-opacity hover:opacity-80 ${STATUS_STYLE[item.status]}`}
                title={t('fb.advanceStatus')}
              >
                {t('fbstatus.' + item.status)}
              </button>
              {showDeadline && item.deadline && (
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                    dState === 'overdue'
                      ? 'bg-red-50 text-red-700'
                      : dState === 'soon'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-[#f1f1f1] text-[#6b6b6b]'
                  }`}
                >
                  {dState === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                  <CalendarIcon className="w-3 h-3" /> {item.deadline}
                </span>
              )}
            </div>
          </div>
        </div>
        {item.note && <p className="text-[11.5px] text-[#5b5b5b] leading-snug">{item.note}</p>}
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          {item.link && (
            <a href={safeUrl(item.link) || '#'} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> {t('fb.reference')}
            </a>
          )}
          <button onClick={() => toggleBoard(item)} className="text-[#6b6b6b] hover:text-[#161616] inline-flex items-center gap-1 ml-auto">
            <Palette className="w-3 h-3" /> {item.board ? t('fb.removeFromBoard') : t('fb.addToMoodboard')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm text-left">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-[#f5f5f5] pb-3">
        <div>
          <h3 className="text-[14px] font-extrabold text-[#161616] font-sans tracking-tight">{t('tab.arredi')}</h3>
          <p className="text-[10.5px] text-[#8a8a8a] mt-0.5 font-medium">{t('fb.header.sub')}</p>
        </div>
        {/* Barra a pillole sezioni */}
        <div className="inline-flex items-center gap-1 bg-[#f1f1f1] rounded-full p-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-[11.5px] font-bold transition-colors ${
                  active ? 'bg-[#1b1b1b] text-white' : 'text-[#6b6b6b] hover:text-[#161616]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t('fb.sec.' + s.id)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ARREDI FISSI / MOBILI */}
      {(section === 'fissi' || section === 'mobili') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] text-[#8a8a8a] font-medium">
              {section === 'fissi' ? t('fb.descFissi') : t('fb.descMobili')}
              {isStudio && <span className="text-[#6b6b6b]">{t('fb.confirmNote.a')}<b>{t('fb.confirmNote.bold')}</b>{t('fb.confirmNote.b')}</span>}
            </p>
            <button
              onClick={() => openModal(section === 'fissi' ? 'fisso' : 'mobile')}
              className="bg-[#1b1b1b] hover:bg-black text-white text-[11.5px] font-bold py-1.5 px-3.5 rounded-full inline-flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> {t('common.add')}
            </button>
          </div>

          {/* Subtotale + anteprima fee (motore finanziario) */}
          <div className="bg-[#fafafa] border border-[#ececec] rounded-[16px] p-3.5 flex flex-wrap items-center justify-between gap-3">
            {section === 'fissi' ? (
              <>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#8a8a8a] block">{t('fb.accFissi')}</span>
                  <b className="text-[15px] font-black text-[#161616]">{eur(totals.fissiConfermati)}</b>
                  {totals.fissi > totals.fissiConfermati && (
                    <span className="text-[10px] text-[#8a8a8a] block mt-0.5">
                      {t('fb.outOf', { total: eur(totals.fissi) })}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#8a8a8a] block">
                    {t('fb.studioFees', { pct: Math.round((project.studioFeePct ?? STUDIO_FEE_PCT) * 100) })}
                  </span>
                  <b className="text-[14px] font-black text-indigo-700">{eur(feeFissi)}</b>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#8a8a8a] block">{t('fb.accMobili')}</span>
                  <b className="text-[15px] font-black text-[#161616]">{eur(totals.mobiliConfermati)}</b>
                  {totals.mobili > totals.mobiliConfermati && (
                    <span className="text-[10px] text-[#8a8a8a] block mt-0.5">
                      {t('fb.outOf', { total: eur(totals.mobili) })}
                    </span>
                  )}
                </div>
                {isStudio ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={managesMobili}
                      onChange={(e) => onToggleStudioManagesMobili?.(pid, e.target.checked)}
                    />
                    <span className="text-[11.5px] font-bold text-[#161616] leading-tight">
                      {t('fb.studioManages')}
                      <span className="block text-[10.5px] font-semibold text-[#8a8a8a]">
                        {t('fb.feeLine', { pct: Math.round((project.arrediMobiliFeePct ?? ARREDI_MOBILI_FEE_PCT) * 100) })}<b className="text-indigo-700">{eur(feeMobili)}</b>
                      </span>
                    </span>
                  </label>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#8a8a8a] block">{t('fb.studioMgmt')}</span>
                    <b className="text-[13px] font-black text-[#161616]">{managesMobili ? t('fb.yesFee', { fee: eur(feeMobili) }) : t('common.no')}</b>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(section === 'fissi' ? fissi : mobili).map((it) => renderCard(it, section === 'fissi'))}
          </div>
          {(section === 'fissi' ? fissi : mobili).length === 0 && (
            <div className="text-center text-[12px] text-[#9a9a9a] py-8 border border-dashed border-[#e2e2e2] rounded-[18px]">
              {section === 'fissi' ? t('fb.emptyFisso') : t('fb.emptyMobile')}
            </div>
          )}
        </div>
      )}

      {/* MOODBOARD 3D */}
      {section === 'moodboard' && (() => {
        const count = (moodboard3dElements || []).length;
        return (
          <div className="flex flex-col gap-4">
            <div className="relative w-full rounded-[22px] border border-[#e2e2e2] bg-white overflow-hidden">
              <div className="absolute inset-0 opacity-[0.5] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ececec 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#161616] text-white flex items-center justify-center shrink-0">
                  <Box className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-extrabold text-[#161616] tracking-tight">{t('req.mb3d')}</h3>
                  <p className="text-[12.5px] text-[#8a8a8a] mt-1 max-w-xl">
                    {t('fb.mb.desc')}
                    {count > 0 ? (count === 1 ? t('fb.mb.savedOne', { count }) : t('fb.mb.savedMany', { count })) : t('fb.mb.none')}
                  </p>
                </div>
                <button
                  onClick={() => setMb3dOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer shrink-0"
                >
                  <Maximize2 className="w-4 h-4" /> {t('fb.mb.open')}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#9a9a9a]">{t('fb.mb.footer')}</p>
          </div>
        );
      })()}

      {/* Editor moodboard 3D (overlay fullscreen, caricato on-demand) */}
      {mb3dOpen && (
        <MoodboardErrorBoundary onClose={() => setMb3dOpen(false)}>
          <Suspense fallback={
            <div className="fixed inset-0 z-[120] bg-[#F5F5F3] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-[#161616] animate-spin" />
              <span className="text-[12.5px] font-bold text-[#8a8a8a]">{t('fb.mb.loading')}</span>
            </div>
          }>
            <Moodboard3D
              open={mb3dOpen}
              onClose={() => setMb3dOpen(false)}
              projectName={project.name}
              elements={moodboard3dElements || []}
              onSave={(els) => onSaveMoodboard3d?.(pid, els)}
            />
          </Suspense>
        </MoodboardErrorBoundary>
      )}

      {/* MODALE NUOVO ARREDO */}
      {modalKind && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setModalKind(null); setEditItem(null); }}>
          <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-md p-6 shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[15px] font-extrabold text-[#161616]">
                {editItem
                  ? (modalKind === 'fisso' ? t('fb.modal.editFisso') : t('fb.modal.editMobile'))
                  : (modalKind === 'fisso' ? t('fb.modal.newFisso') : t('fb.modal.newMobile'))}
              </h4>
              <button onClick={() => { setModalKind(null); setEditItem(null); }} className="text-gray-400 hover:text-[#161616]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1">
                {t('fb.f.title')}
                <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder={t('fb.f.titlePlaceholder')} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
              </label>
              <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1">
                {t('fb.f.category')}
                <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b] bg-white">
                  <option value="">{t('fb.f.categoryPlaceholder')}</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
              </label>
              {modalKind === 'fisso' && (
                <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1">
                  {t('fb.f.deadline')}
                  <input type="date" value={fDeadline} onChange={(e) => setFDeadline(e.target.value)} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                </label>
              )}
              <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1">
                {t('fb.f.imageUrl')}
                <input value={fImageUrl} onChange={(e) => setFImageUrl(e.target.value)} placeholder="https://…" className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
              </label>
              <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1">
                {t('fb.f.link')}
                <input value={fLink} onChange={(e) => setFLink(e.target.value)} placeholder="https://…" className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
              </label>
              <div className="flex gap-2">
                <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1 flex-1">
                  {t('fb.f.price')}
                  <input type="number" inputMode="decimal" value={fPrice} onChange={(e) => setFPrice(e.target.value)} placeholder={t('fb.f.pricePlaceholder')} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                </label>
                <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1 w-24">
                  {t('fb.f.quantity')}
                  <input type="number" inputMode="decimal" value={fQuantity} onChange={(e) => setFQuantity(e.target.value)} placeholder="1" className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={fColor || '#cccccc'} onChange={(e) => setFColor(e.target.value)} className="w-10 h-10 rounded-[10px] border border-[#e2e2e2] cursor-pointer" />
                <span className="text-[11.5px] text-[#8a8a8a]">{t('fb.f.colorSample')}</span>
                {fColor && <button onClick={() => setFColor('')} className="text-[11px] text-gray-400 hover:text-red-500 ml-auto">{t('fb.f.removeColor')}</button>}
              </div>
              <textarea value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder={t('common.notes')} rows={2} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b] resize-none" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setModalKind(null); setEditItem(null); }} className="flex-1 border border-[#e2e2e2] rounded-full py-2.5 text-[12.5px] font-bold text-[#6b6b6b] hover:bg-[#f5f5f5]">{t('common.cancel')}</button>
              <button onClick={saveNew} disabled={!fTitle.trim()} className="flex-1 bg-[#1b1b1b] hover:bg-black disabled:opacity-40 text-white rounded-full py-2.5 text-[12.5px] font-bold inline-flex items-center justify-center gap-1">
                <Check className="w-4 h-4" /> {editItem ? t('fb.f.saveEdit') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toolbar per aggiungere tile direttamente sulla lavagna
const MoodboardToolbar: React.FC<{ onAddTile: (data: Partial<Furnishing>) => void }> = ({ onAddTile }) => {
  const [open, setOpen] = useState<'image' | 'color' | 'note' | null>(null);
  const [val, setVal] = useState('');
  const [color, setColor] = useState('#cccccc');

  const confirm = () => {
    if (open === 'image' && val.trim()) onAddTile({ imageUrl: val.trim(), title: 'Immagine' });
    if (open === 'color') onAddTile({ color, title: 'Colore' });
    if (open === 'note' && val.trim()) onAddTile({ note: val.trim(), title: 'Nota' });
    setVal('');
    setOpen(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold text-[#8a8a8a] mr-1">Aggiungi alla lavagna:</span>
      <button onClick={() => { setOpen('image'); setVal(''); }} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-[#e2e2e2] rounded-full px-3 py-1.5 hover:bg-[#f5f5f5]"><ImageIcon className="w-3.5 h-3.5" /> Immagine</button>
      <button onClick={() => setOpen('color')} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-[#e2e2e2] rounded-full px-3 py-1.5 hover:bg-[#f5f5f5]"><Palette className="w-3.5 h-3.5" /> Colore</button>
      <button onClick={() => { setOpen('note'); setVal(''); }} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-[#e2e2e2] rounded-full px-3 py-1.5 hover:bg-[#f5f5f5]"><TypeIcon className="w-3.5 h-3.5" /> Nota</button>

      {open && (
        <div className="flex items-center gap-2 w-full mt-1">
          {open === 'image' && <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="URL immagine" className="flex-1 border border-[#e2e2e2] rounded-full px-3 py-1.5 text-[12px] outline-none focus:border-[#1b1b1b]" />}
          {open === 'note' && <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="Testo nota" className="flex-1 border border-[#e2e2e2] rounded-full px-3 py-1.5 text-[12px] outline-none focus:border-[#1b1b1b]" />}
          {open === 'color' && <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-9 rounded-[10px] border border-[#e2e2e2] cursor-pointer" />}
          <button onClick={confirm} className="bg-[#1b1b1b] hover:bg-black text-white rounded-full px-4 py-1.5 text-[12px] font-bold">Aggiungi</button>
          <button onClick={() => setOpen(null)} className="text-gray-400 hover:text-[#161616]"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};
