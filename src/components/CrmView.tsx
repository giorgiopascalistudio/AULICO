/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modulo CRM — stesso schema grafico delle altre sezioni.
 *  - Pipeline commerciale (lead dal primo contatto al contratto firmato)
 *  - Rubrica Fornitori & Subappaltatori
 *  - Storico interazioni per ogni soggetto
 *  - Conversione lead -> commessa con un click
 */

import React, { useMemo, useState } from 'react';
import {
  Target, Plus, X, ChevronLeft, ChevronRight, Building2, Phone, Mail,
  MessageSquarePlus, Trash2, Briefcase, ArrowRightCircle, Euro, MessageCircle, FolderOpen, CheckCircle2, Split, Upload, RefreshCw
} from 'lucide-react';
import { initials, eur } from '../utils';
import { ClientImportModal } from './CrmImport';
import { ClientRecord, Project, UserProfile, Quote } from '../types';

// Dashboard CRM (grafici recharts) — lazy: il chunk recharts si carica solo all'apertura.
const CrmDashboard = React.lazy(() => import('./CrmDashboard'));
// Registro Unico master-detail (scheda dedicata stile prototipo).
const CrmRegistro = React.lazy(() => import('./CrmRegistro'));

export interface CrmNote {
  at: number;
  text: string;
  by?: string;
}
export interface Lead {
  id: string;
  name: string;
  company?: string;
  sector?: 'studio' | 'strategico' | 'materico';
  value?: number;
  stage: string;
  email?: string;
  phone?: string;
  notes?: CrmNote[];
  createdAt: number;
  // Smistamento (Strategico = Point of Entry): la società di competenza è `sector`;
  // `routed` segna che è stato assegnato/confermato (con log chi/quando).
  routed?: boolean;
  routedAt?: number | null;
  routedByName?: string | null;
}
export interface Supplier {
  id: string;
  name: string;
  category?: string;
  sector?: 'studio' | 'strategico' | 'materico';
  email?: string;
  phone?: string;
  notes?: CrmNote[];
  createdAt: number;
}

interface CrmViewProps {
  leads: Lead[];
  suppliers: Supplier[];
  myName: string;
  myUid?: string;
  onSaveLeads: (arr: Lead[]) => void;
  onSaveSuppliers: (arr: Supplier[]) => void;
  onConvertLead: (lead: Lead) => void;
  /** Smistamento lead alla società di competenza (con notifica al team). */
  onRouteLead?: (lead: Lead, sector: 'studio' | 'strategico' | 'materico') => void;
  /** Permesso "gestione lead" (Point of Entry). Senza, lo smistamento è nascosto. */
  canManageLeads?: boolean;
  clients?: Record<string, ClientRecord>;
  onSaveClient?: (rec: ClientRecord) => void;
  onDeleteClient?: (id: string) => void;
  onImportClients?: (recs: ClientRecord[]) => { added: number; skipped: number };
  onMergeClients?: (survivor: ClientRecord, dupIds: string[]) => void;
  usersAll?: Record<string, UserProfile>;
  newsletter?: Record<string, any>;
  projects?: Project[];
  members?: UserProfile[];
  quotes?: Quote[];
  finInvoicesActive?: any[];
  finScadenze?: any[];
  /** Doppia conferma eliminazione (modale condivisa in App). */
  askDelete?: (title: string, message: string | null, onConfirm: () => void) => void;
  /** Sposta l'elemento eliminato nel Cestino condiviso. */
  onTrashItem?: (section: string, label: string, payload: any, meta?: Record<string, string>, detail?: string) => void;
}

const STAGES: { id: string; label: string }[] = [
  { id: 'nuovo', label: 'Nuovo contatto' },
  { id: 'qualificato', label: 'Qualificato' },
  { id: 'preventivo', label: 'Preventivo' },
  { id: 'negoziazione', label: 'Negoziazione' },
  { id: 'vinto', label: 'Contratto firmato' },
  { id: 'perso', label: 'Perso' }
];
const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label || id;

const sectorBadge = (s?: string) =>
  s === 'strategico'
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : s === 'materico'
    ? 'bg-orange-50 text-orange-850 border-orange-200'
    : 'bg-zinc-50 text-zinc-800 border-zinc-200';
const sectorLabel = (s?: string) => (s === 'strategico' ? 'Strategico' : s === 'materico' ? 'Materico' : 'Studio');
const tierBadge = (t?: number | null) => (t === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : t === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200');

// --- Registro Unico delle Persone (CRM Fase 1) ---
// Le 5 società del gruppo (multi-appartenenza del contatto). Onirico = chiave codice 'studio'.
const CRM_SOCIETIES: { id: string; label: string; color: string }[] = [
  { id: 'studio', label: 'Onirico', color: '#161616' },
  { id: 'strategico', label: 'Strategico', color: '#b45309' },
  { id: 'materico', label: 'Materico', color: '#c2410c' },
  { id: 'unico', label: 'Unico', color: '#4338ca' },
  { id: 'fantastico', label: 'Fantastico', color: '#0d9488' },
];
// Tipi di contatto (multi-selezione).
const CONTACT_ROLES: { id: string; label: string }[] = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'lead', label: 'Lead / Potenziale' },
  { id: 'ex_cliente', label: 'Ex cliente' },
  { id: 'investitore', label: 'Investitore' },
  { id: 'investitore_potenziale', label: 'Investitore potenziale' },
  { id: 'fornitore', label: 'Fornitore' },
  { id: 'impresa', label: 'Impresa / Subappaltatore' },
  { id: 'agenzia_immobiliare', label: 'Agenzia immobiliare' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'conoscente', label: 'Conoscente / Segnalatore' },
  { id: 'istituzionale', label: 'Figura istituzionale' },
];
const ROLE_LABEL = (id: string) => CONTACT_ROLES.find((r) => r.id === id)?.label || id;
const ACQUISITION_CHANNELS = ['Social', 'Sito web', 'Passaparola', 'Agenzia', 'Evento', 'Pubblicità', 'Altro'];
const onKeys = (m?: Record<string, boolean>): string[] => Object.keys(m || {}).filter((k) => m![k]);
const waLink = (num?: string | null) => (num ? `https://wa.me/${String(num).replace(/[^0-9]/g, '')}` : null);
const fmtWhen = (t?: number) => (t ? new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }) : '');

/**
 * Smistamento automatico (suggerimento): dalla descrizione del lead deduce la
 * società di competenza. Strategico = marketing/comunicazione; Materico =
 * forniture/posa/ristrutturazione; altrimenti Studio (progettazione/pratiche).
 */
const suggestSector = (lead: Lead): 'studio' | 'strategico' | 'materico' => {
  const txt = `${lead.company || ''} ${(lead.notes || []).map((n) => n.text).join(' ')}`.toLowerCase();
  if (/market|social|campagn|brand|comunicaz|adv|pubblicit|eventi|sito web/.test(txt)) return 'strategico';
  if (/fornitur|posa|material|ristruttur|capitolat|arred|paviment|rivestiment|impresa|cantier/.test(txt)) return 'materico';
  return 'studio';
};

export const CrmView: React.FC<CrmViewProps> = ({
  leads,
  suppliers,
  myName,
  myUid,
  onSaveLeads,
  onSaveSuppliers,
  onConvertLead,
  onRouteLead,
  canManageLeads = true,
  clients = {},
  onSaveClient,
  onDeleteClient,
  onImportClients,
  onMergeClients,
  usersAll = {},
  newsletter = {},
  projects = [],
  members = [],
  quotes = [],
  finInvoicesActive = [],
  finScadenze = [],
  askDelete,
  onTrashItem
}) => {
  const [tab, setTab] = useState<'dashboard' | 'pipeline' | 'fornitori' | 'clienti'>('dashboard');
  const [importOpen, setImportOpen] = useState(false);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [openSupplier, setOpenSupplier] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  // Rubrica clienti
  const [openClient, setOpenClient] = useState<string | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clDraft, setClDraft] = useState<Partial<ClientRecord>>({ type: 'privato', category: 'cliente' });
  const [clientTierFilter, setClientTierFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [clientCat, setClientCat] = useState<'cliente' | 'partner'>('cliente');
  const [clientSociety, setClientSociety] = useState<'all' | string>('all'); // filtro per società (vista generale = 'all')
  const [clientRole, setClientRole] = useState<'all' | string>('all');       // filtro per tipo contatto

  // form state
  const [fName, setFName] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fSector, setFSector] = useState<'studio' | 'strategico' | 'materico'>('studio');
  const [fValue, setFValue] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fCategory, setFCategory] = useState('');

  const resetForm = () => {
    setFName(''); setFCompany(''); setFSector('studio'); setFValue('');
    setFEmail(''); setFPhone(''); setFCategory('');
  };

  const pipelineValue = useMemo(
    () => leads.filter((l) => l.stage !== 'perso').reduce((s, l) => s + (Number(l.value) || 0), 0),
    [leads]
  );

  // ---- Lead ops ----
  const addLead = () => {
    if (!fName.trim()) return;
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      name: fName.trim(),
      company: fCompany.trim() || undefined,
      sector: fSector,
      value: fValue ? Number(fValue.replace(/,/g, '.')) : undefined,
      email: fEmail.trim() || undefined,
      phone: fPhone.trim() || undefined,
      stage: 'nuovo',
      notes: [],
      createdAt: Date.now()
    };
    onSaveLeads([...leads, lead]);
    resetForm();
    setNewLeadOpen(false);
  };
  const moveLead = (id: string, dir: 1 | -1) => {
    onSaveLeads(
      leads.map((l) => {
        if (l.id !== id) return l;
        const idx = STAGES.findIndex((s) => s.id === l.stage);
        const ni = Math.max(0, Math.min(STAGES.length - 1, idx + dir));
        return { ...l, stage: STAGES[ni].id };
      })
    );
  };
  const deleteLead = (id: string) => {
    const lead = leads.find((l) => l.id === id);
    const doDelete = () => {
      if (lead) onTrashItem?.('crm_lead', lead.name, lead, undefined, lead.company);
      onSaveLeads(leads.filter((l) => l.id !== id));
      setOpenLead(null);
    };
    if (askDelete) askDelete('Eliminare questo lead?', lead ? `"${lead.name}"` : null, doDelete);
    else if (confirm('Eliminare questo lead?')) doDelete();
  };
  const addLeadNote = (id: string) => {
    if (!noteDraft.trim()) return;
    onSaveLeads(
      leads.map((l) =>
        l.id === id ? { ...l, notes: [...(l.notes || []), { at: Date.now(), text: noteDraft.trim(), by: myName }] } : l
      )
    );
    setNoteDraft('');
  };

  // ---- Supplier ops ----
  const addSupplier = () => {
    if (!fName.trim()) return;
    const sup: Supplier = {
      id: `sup-${Date.now()}`,
      name: fName.trim(),
      category: fCategory.trim() || undefined,
      sector: fSector,
      email: fEmail.trim() || undefined,
      phone: fPhone.trim() || undefined,
      notes: [],
      createdAt: Date.now()
    };
    onSaveSuppliers([...suppliers, sup]);
    resetForm();
    setNewSupplierOpen(false);
  };
  const deleteSupplier = (id: string) => {
    const sup = suppliers.find((s) => s.id === id);
    const doDelete = () => {
      if (sup) onTrashItem?.('crm_supplier', sup.name, sup, undefined, sup.category);
      onSaveSuppliers(suppliers.filter((s) => s.id !== id));
      setOpenSupplier(null);
    };
    if (askDelete) askDelete('Eliminare questo fornitore?', sup ? `"${sup.name}"` : null, doDelete);
    else if (confirm('Eliminare questo fornitore?')) doDelete();
  };
  const addSupplierNote = (id: string) => {
    if (!noteDraft.trim()) return;
    onSaveSuppliers(
      suppliers.map((s) =>
        s.id === id ? { ...s, notes: [...(s.notes || []), { at: Date.now(), text: noteDraft.trim(), by: myName }] } : s
      )
    );
    setNoteDraft('');
  };

  // ---- Rubrica clienti ops ----
  const clientList = useMemo(() => Object.values(clients)
    .filter((c) => (c.category || 'cliente') === clientCat)
    .filter((c) => clientTierFilter === 'all' || String(c.tier || '') === clientTierFilter)
    .filter((c) => clientSociety === 'all' || !!c.societies?.[clientSociety])
    .filter((c) => clientRole === 'all' || !!c.roles?.[clientRole])
    .sort((a, b) => a.name.localeCompare(b.name)), [clients, clientTierFilter, clientCat, clientSociety, clientRole]);
  const clientCounts = useMemo(() => {
    const all = Object.values(clients);
    return { cliente: all.filter((c) => (c.category || 'cliente') === 'cliente').length, partner: all.filter((c) => c.category === 'partner').length };
  }, [clients]);
  // Progetti collegati a un cliente (via rubrica o account portale)
  const projectsOfClient = (rec: ClientRecord) => projects.filter((p) => p.clientRecordId === rec.id || (rec.accountUid && p.clientUid === rec.accountUid));
  // Quadro pagamenti: fatture/scadenze dei progetti del cliente
  const paymentsOfClient = (rec: ClientRecord) => {
    const pids = new Set(projectsOfClient(rec).map((p) => p.id));
    const inv = finInvoicesActive.filter((i: any) => pids.has(i.projectId));
    const sca = finScadenze.filter((s: any) => pids.has(s.projectId) && s.kind === 'entrata');
    const fatturato = inv.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const incassato = inv.filter((i: any) => i.status === 'pagata').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const daIncassare = fatturato - incassato;
    const scadOpen = sca.filter((s: any) => s.status !== 'pagato');
    return { inv, fatturato, incassato, daIncassare, scadOpen };
  };
  const memberName = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;
  // Codice referral univoco: iniziali/nome + anno (2 cifre) + suffisso casuale finché non è unico.
  const genRefCode = (nameLike: string): string => {
    const base = (nameLike || 'CL').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6) || 'CL';
    const yr = String(new Date().getFullYear()).slice(2);
    const existing = new Set(Object.values(clients).map((c) => (c.codiceReferenza || '').toUpperCase()).filter(Boolean));
    let code = '';
    do { const rnd = Math.random().toString(36).slice(2, 5).toUpperCase(); code = `${base}${yr}${rnd}`; } while (existing.has(code));
    return code;
  };
  // Consensi auto dall'account portale collegato: privacy (profileComplete) + newsletter (nodo newsletter/<uid>)
  const consentsOf = (rec: ClientRecord) => {
    const uid = rec.accountUid;
    if (!uid) return { hasAccount: false, privacy: false, newsletter: false };
    const u: any = usersAll[uid];
    return { hasAccount: !!u, privacy: !!u?.profileComplete, newsletter: !!newsletter[uid] };
  };
  // Rilevamento duplicati: schede con stesso nome+telefono normalizzati (tipicamente per progetti multipli)
  const dupKey = (c: ClientRecord) => `${(c.name || '').trim().toLowerCase()}|${(c.phone || '').replace(/\s+/g, '')}`;
  const duplicatesOf = (rec: ClientRecord): ClientRecord[] => {
    const k = dupKey(rec);
    if (!rec.name?.trim()) return [];
    return Object.values(clients).filter((c) => c.id !== rec.id && dupKey(c) === k);
  };
  const openNewClient = () => {
    setClDraft({
      type: clientCat === 'partner' ? 'azienda' : 'privato',
      category: clientCat,
      roles: clientCat === 'partner' ? { impresa: true } : { cliente: true },
      societies: clientSociety !== 'all' ? { [clientSociety]: true } : undefined,
    });
    setClientFormOpen(true);
  };
  const openNewFornitore = () => {
    setClDraft({ type: 'azienda', category: 'partner', roles: { impresa: true } });
    setClientFormOpen(true);
  };
  const openEditClient = (id: string) => { const c = clients[id]; if (c) { setClDraft({ ...c }); setClientFormOpen(true); } };
  const saveClientDraft = () => {
    const d = clDraft;
    const name = (d.type === 'azienda' ? (d.companyName || d.name) : (d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim())) || '';
    if (!name.trim() || !onSaveClient) return;
    const rec: ClientRecord = {
      id: d.id || `cli-${Date.now()}-${Math.floor(Math.random() * 900)}`,
      category: d.category || 'cliente',
      type: (d.type as any) || 'privato',
      name: name.trim(),
      firstName: d.firstName || null, lastName: d.lastName || null,
      email: d.email || null, phone: d.phone || null, whatsapp: d.whatsapp || null, address: d.address || null,
      codiceFiscale: d.codiceFiscale || null, companyName: d.companyName || null,
      partitaIva: d.partitaIva || null, pec: d.pec || null, sdi: d.sdi || null,
      tier: d.tier || null, responsabili: d.responsabili || undefined,
      responsabileNome: d.responsabileNome || null,
      roles: d.roles || undefined, societies: d.societies || undefined,
      targetTags: (d.targetTags && d.targetTags.length ? d.targetTags : null),
      acquisitionChannel: d.acquisitionChannel || null,
      // codice referral proprio: generato una volta e mantenuto univoco
      codiceReferenza: d.codiceReferenza || genRefCode(d.type === 'azienda' ? (d.companyName || name) : (d.lastName || d.firstName || name)),
      referredByCode: d.referredByCode || null,
      // campi Registro Clienti / pratica
      stato: d.stato ?? null, riferimentoComunicazione: d.riferimentoComunicazione || null,
      preventivoStato: d.preventivoStato ?? null, saldato: d.saldato ?? null,
      dataInizio: d.dataInizio || null, dataFine: d.dataFine || null,
      // preserva i campi ricchi gestiti inline nella scheda (registro master-detail)
      brandAsset: d.brandAsset ?? null, credentials: d.credentials ?? null,
      privacyLiberatoria: d.privacyLiberatoria, interactions: d.interactions ?? null,
      accountUid: d.accountUid || null, notes: d.notes || null,
      createdBy: d.createdBy || myUid || 'admin',
      createdAt: d.createdAt || Date.now()
    };
    onSaveClient(rec);
    setClientFormOpen(false);
    setClDraft({ type: 'privato', category: 'cliente' });
  };

  const activeLead = openLead ? leads.find((l) => l.id === openLead) : null;
  const activeSupplier = openSupplier ? suppliers.find((s) => s.id === openSupplier) : null;
  const activeClient = openClient ? clients[openClient] : null;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
            <Target className="w-5 h-5" /> CRM
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">
            Pipeline commerciale, fornitori e storico delle interazioni.
          </p>
        </div>
        {tab !== 'dashboard' && (
          <button
            onClick={() => { resetForm(); tab === 'pipeline' ? setNewLeadOpen(true) : tab === 'fornitori' ? openNewFornitore() : openNewClient(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> {tab === 'pipeline' ? 'Nuovo lead' : tab === 'fornitori' ? 'Nuovo fornitore' : 'Nuovo contatto'}
          </button>
        )}
      </div>

      {/* Tabs + KPI */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {([
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'pipeline', label: 'Pipeline commerciale' },
            { id: 'clienti', label: 'Registro contatti' },
            { id: 'fornitori', label: 'Fornitori & Subappaltatori' }
          ] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${
                  active ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {tab === 'pipeline' && (
          <span className="text-[11px] font-mono font-bold text-[#8a8a8a] bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Pipeline: {eur(pipelineValue)}
          </span>
        )}
      </div>

      {/* DASHBOARD (grafici andamento + report settimanale) */}
      {tab === 'dashboard' && (
        <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico i grafici…</div>}>
          <CrmDashboard clients={Object.values(clients)} leads={leads} projects={projects} quotes={quotes} invoices={finInvoicesActive} societies={CRM_SOCIETIES} roleLabel={ROLE_LABEL} />
        </React.Suspense>
      )}

      {/* PIPELINE KANBAN */}
      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map((st) => {
            const colLeads = leads.filter((l) => l.stage === st.id);
            return (
              <div key={st.id} className="bg-[#f6f6f4] border border-[#ececec] rounded-2xl p-2.5 flex flex-col gap-2 min-h-[120px]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8a8a8a]">{st.label}</span>
                  <span className="text-[10px] font-extrabold text-[#161616] bg-white border border-[#e2e2e2] rounded-full px-1.5">{colLeads.length}</span>
                </div>
                {colLeads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setOpenLead(l.id)}
                    className="bg-white border border-[#e2e2e2] rounded-xl p-3 cursor-pointer hover:border-black hover:shadow-sm transition-all flex flex-col gap-2"
                  >
                    <b className="text-[12.5px] text-[#161616] truncate">{l.name}</b>
                    {l.company && <span className="text-[11px] text-[#8a8a8a] truncate">{l.company}</span>}
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[8.5px] font-extrabold uppercase tracking-wider border px-1.5 py-0.5 rounded-full ${sectorBadge(l.sector)}`}>
                        {sectorLabel(l.sector)}
                      </span>
                      {l.value ? <span className="text-[11px] font-bold text-[#161616]">{eur(l.value)}</span> : null}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#f0f0f0]">
                      <button onClick={(e) => { e.stopPropagation(); moveLead(l.id, -1); }} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer border-none bg-transparent">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveLead(l.id, 1); }} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black cursor-pointer border-none bg-transparent">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* FORNITORI */}
      {tab === 'fornitori' && (
        <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico il registro…</div>}>
          <CrmRegistro
            title="Fornitori & Subappaltatori"
            variant="fornitori"
            restrictRoles={['fornitore', 'impresa']}
            clients={Object.values(clients)}
            societies={CRM_SOCIETIES}
            roles={CONTACT_ROLES}
            onSave={(rec) => onSaveClient?.(rec)}
            onDelete={(rec) => (askDelete ? askDelete('Elimina fornitore', `Eliminare "${rec.name}" dal registro?`, () => onDeleteClient?.(rec.id)) : onDeleteClient?.(rec.id))}
            onEdit={openEditClient}
            onNew={openNewFornitore}
            paymentStatus={(rec) => { const p = paymentsOfClient(rec); return { ok: p.daIncassare <= 0.5, daIncassare: p.daIncassare }; }}
            projectsOf={(rec) => projectsOfClient(rec).map((p) => ({ id: p.id, name: p.name, status: p.status, manager: p.manager || null }))}
            memberName={memberName}
          />
        </React.Suspense>
      )}

      {/* CLIENTI / PARTNER (rubrica) */}
      {tab === 'clienti' && (
        <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico il registro…</div>}>
          <CrmRegistro
            clients={Object.values(clients)}
            societies={CRM_SOCIETIES}
            roles={CONTACT_ROLES}
            onSave={(rec) => onSaveClient?.(rec)}
            onDelete={(rec) => (askDelete ? askDelete('Elimina contatto', `Eliminare "${rec.name}" dal registro?`, () => onDeleteClient?.(rec.id)) : onDeleteClient?.(rec.id))}
            onEdit={openEditClient}
            onNew={openNewClient}
            onImport={onImportClients ? () => setImportOpen(true) : undefined}
            paymentStatus={(rec) => { const p = paymentsOfClient(rec); return { ok: p.daIncassare <= 0.5, daIncassare: p.daIncassare }; }}
            projectsOf={(rec) => projectsOfClient(rec).map((p) => ({ id: p.id, name: p.name, status: p.status, manager: p.manager || null }))}
            memberName={memberName}
            consentsOf={consentsOf}
            duplicatesOf={duplicatesOf}
            onMerge={onMergeClients}
          />
        </React.Suspense>
      )}

      {importOpen && onImportClients && (
        <ClientImportModal onClose={() => setImportOpen(false)} onImport={onImportClients} myUid={myUid} />
      )}

      {/* DETTAGLIO CLIENTE */}
      {activeClient && (() => {
        const pay = paymentsOfClient(activeClient);
        const projs = projectsOfClient(activeClient);
        const resp = Object.keys(activeClient.responsabili || {});
        const wa = waLink(activeClient.whatsapp || activeClient.phone);
        return (
        <Overlay onClose={() => setOpenClient(null)}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-[18px] font-black text-[#161616] leading-tight">{activeClient.name}</h3>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {activeClient.category === 'partner' && <span className="text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border-purple-200">Partner / Impresa</span>}
                <span className="text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-700 border-zinc-200">{activeClient.type === 'azienda' ? 'Azienda' : 'Privato'}</span>
                {activeClient.category !== 'partner' && activeClient.tier && <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${tierBadge(activeClient.tier)}`}>Fascia {activeClient.tier}</span>}
              </div>
            </div>
            <button onClick={() => setOpenClient(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {/* contatti rapidi */}
          <div className="flex items-center gap-2 mb-3">
            {activeClient.email && <a href={`mailto:${activeClient.email}`} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#e2e2e2] text-[12px] font-bold text-[#161616] hover:bg-[#fafafa]"><Mail className="w-4 h-4" /> Email</a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
          </div>

          <div className="flex flex-col gap-2 text-[13px]">
            {activeClient.email && <ClientRow label="Email" value={activeClient.email} />}
            {activeClient.phone && <ClientRow label="Telefono" value={activeClient.phone} />}
            {activeClient.address && <ClientRow label={activeClient.type === 'azienda' ? 'Sede legale' : 'Residenza'} value={activeClient.address} />}
            {activeClient.codiceFiscale && <ClientRow label="Codice Fiscale" value={activeClient.codiceFiscale} />}
            {activeClient.partitaIva && <ClientRow label="P. IVA" value={activeClient.partitaIva} />}
            {activeClient.pec && <ClientRow label="PEC" value={activeClient.pec} />}
            {activeClient.sdi && <ClientRow label="Codice SDI" value={activeClient.sdi} />}
            {resp.length > 0 && <ClientRow label="Responsabili" value={resp.map(memberName).join(', ')} />}
            {activeClient.acquisitionChannel && <ClientRow label="Canale acquisizione" value={activeClient.acquisitionChannel} />}
          </div>

          {/* Società di appartenenza + tipi contatto + target */}
          {(onKeys(activeClient.societies).length > 0 || onKeys(activeClient.roles).length > 0 || (activeClient.targetTags || []).length > 0) && (
            <div className="mt-3 flex flex-col gap-2">
              {onKeys(activeClient.societies).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mr-1">Società</span>
                  {CRM_SOCIETIES.filter((s) => activeClient.societies?.[s.id]).map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ background: `${s.color}12`, color: s.color, borderColor: `${s.color}33` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} /> {s.label}
                    </span>
                  ))}
                </div>
              )}
              {onKeys(activeClient.roles).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mr-1">Tipo</span>
                  {onKeys(activeClient.roles).map((r) => (
                    <span key={r} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">{ROLE_LABEL(r)}</span>
                  ))}
                </div>
              )}
              {(activeClient.targetTags || []).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mr-1">Target</span>
                  {(activeClient.targetTags || []).map((t) => (
                    <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Storico progetti */}
          <div className="mt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] block mb-2">Storico progetti ({projs.length})</span>
            {projs.length === 0 ? <p className="text-[12px] italic text-[#9a9a9a]">Nessun progetto collegato.</p> : (
              <div className="flex flex-col gap-1.5">
                {projs.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-[#f0f0f0]">
                    <span className="text-[12.5px] font-medium text-[#161616] truncate flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-gray-400" /> {p.name}</span>
                    <span className="text-[10px] font-bold text-gray-500 shrink-0">{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quadro pagamenti */}
          <div className="mt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] block mb-2">Quadro pagamenti</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="px-3 py-2 rounded-xl bg-gray-50 border border-[#f0f0f0]"><div className="text-[9.5px] font-bold uppercase text-[#9a9a9a]">Fatturato</div><div className="text-[13px] font-black text-[#161616]">{eur(pay.fatturato)}</div></div>
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100"><div className="text-[9.5px] font-bold uppercase text-emerald-700/70">Incassato</div><div className="text-[13px] font-black text-emerald-700">{eur(pay.incassato)}</div></div>
              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100"><div className="text-[9.5px] font-bold uppercase text-amber-700/70">Da incassare</div><div className="text-[13px] font-black text-amber-700">{eur(pay.daIncassare)}</div></div>
            </div>
            {pay.scadOpen.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                <span className="text-[10.5px] font-bold text-rose-600">Scadenze aperte ({pay.scadOpen.length}) — da sollecitare:</span>
                {pay.scadOpen.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-rose-50/50 border border-rose-100 text-[11.5px]">
                    <span className="text-[#161616]">{s.desc || 'Scadenza'} · {s.dueDate}</span>
                    <span className="font-bold text-rose-700">{eur(Number(s.amount) || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-5">
            <button onClick={() => { openEditClient(activeClient.id); setOpenClient(null); }} className="flex-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">Modifica</button>
            <button onClick={() => { onDeleteClient?.(activeClient.id); setOpenClient(null); }} className="py-2.5 px-3 rounded-xl border border-[#e2e2e2] text-rose-600 font-bold text-[13px] cursor-pointer bg-white" title="Elimina (nel Cestino)"><Trash2 className="w-4 h-4" /></button>
          </div>
        </Overlay>
        );
      })()}

      {/* FORM CLIENTE (nuovo/modifica) */}
      {clientFormOpen && (
        <Overlay onClose={() => setClientFormOpen(false)}>
          <FormHeader title={clDraft.id ? 'Modifica cliente' : 'Nuovo cliente'} onClose={() => setClientFormOpen(false)} />
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {(['privato', 'azienda'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setClDraft((d) => ({ ...d, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold border ${(clDraft.type || 'privato') === t ? 'bg-[#1b1b1b] text-white border-[#1b1b1b]' : 'bg-white text-[#333] border-[#e2e2e2]'}`}>
                  {t === 'privato' ? 'Privato' : 'Azienda'}
                </button>
              ))}
            </div>
            {clDraft.type === 'azienda' ? (
              <Field label="Ragione sociale *"><input value={clDraft.companyName || ''} onChange={(e) => setClDraft((d) => ({ ...d, companyName: e.target.value }))} className="crm-input" /></Field>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nome"><input value={clDraft.firstName || ''} onChange={(e) => setClDraft((d) => ({ ...d, firstName: e.target.value }))} className="crm-input" /></Field>
                <Field label="Cognome"><input value={clDraft.lastName || ''} onChange={(e) => setClDraft((d) => ({ ...d, lastName: e.target.value }))} className="crm-input" /></Field>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email"><input value={clDraft.email || ''} onChange={(e) => setClDraft((d) => ({ ...d, email: e.target.value }))} className="crm-input" /></Field>
              <Field label="Telefono"><input value={clDraft.phone || ''} onChange={(e) => setClDraft((d) => ({ ...d, phone: e.target.value }))} className="crm-input" /></Field>
            </div>
            <Field label={clDraft.type === 'azienda' ? 'Sede legale' : 'Residenza'}><input value={clDraft.address || ''} onChange={(e) => setClDraft((d) => ({ ...d, address: e.target.value }))} className="crm-input" /></Field>
            {clDraft.type === 'azienda' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="P. IVA"><input value={clDraft.partitaIva || ''} onChange={(e) => setClDraft((d) => ({ ...d, partitaIva: e.target.value }))} className="crm-input" /></Field>
                <Field label="Codice Fiscale"><input value={clDraft.codiceFiscale || ''} onChange={(e) => setClDraft((d) => ({ ...d, codiceFiscale: e.target.value }))} className="crm-input" /></Field>
                <Field label="PEC"><input value={clDraft.pec || ''} onChange={(e) => setClDraft((d) => ({ ...d, pec: e.target.value }))} className="crm-input" /></Field>
                <Field label="Codice SDI"><input value={clDraft.sdi || ''} onChange={(e) => setClDraft((d) => ({ ...d, sdi: e.target.value }))} className="crm-input" /></Field>
              </div>
            ) : (
              <Field label="Codice Fiscale"><input value={clDraft.codiceFiscale || ''} onChange={(e) => setClDraft((d) => ({ ...d, codiceFiscale: e.target.value }))} className="crm-input" /></Field>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Fascia cliente">
                <select value={clDraft.tier || ''} onChange={(e) => setClDraft((d) => ({ ...d, tier: e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null }))} className="crm-input">
                  <option value="">—</option>
                  <option value="1">Fascia 1</option>
                  <option value="2">Fascia 2</option>
                  <option value="3">Fascia 3</option>
                </select>
              </Field>
              <Field label="WhatsApp (se diverso)"><input value={clDraft.whatsapp || ''} onChange={(e) => setClDraft((d) => ({ ...d, whatsapp: e.target.value }))} placeholder="+39…" className="crm-input" /></Field>
            </div>
            {/* Tipi di contatto (multi) */}
            <Field label="Tipo di contatto (più scelte)">
              <div className="flex flex-wrap gap-1.5">
                {CONTACT_ROLES.map((r) => {
                  const on = !!clDraft.roles?.[r.id];
                  return (
                    <button key={r.id} type="button"
                      onClick={() => setClDraft((d) => {
                        const m = { ...(d.roles || {}) };
                        if (on) delete m[r.id]; else m[r.id] = true;
                        return { ...d, roles: m };
                      })}
                      className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full border ${on ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2]'}`}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Appartenenza società (multi) */}
            <Field label="Società di appartenenza (più scelte)">
              <div className="flex flex-wrap gap-1.5">
                {CRM_SOCIETIES.map((s) => {
                  const on = !!clDraft.societies?.[s.id];
                  return (
                    <button key={s.id} type="button"
                      onClick={() => setClDraft((d) => {
                        const m = { ...(d.societies || {}) };
                        if (on) delete m[s.id]; else m[s.id] = true;
                        return { ...d, societies: m };
                      })}
                      className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full border ${on ? 'text-white border-transparent' : 'bg-white text-[#6b6b6b] border-[#e2e2e2]'}`}
                      style={on ? { background: s.color } : undefined}>
                      <span className="w-2 h-2 rounded-full" style={{ background: on ? '#fff' : s.color }} /> {s.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Canale di acquisizione">
                <input list="crm-channels" value={clDraft.acquisitionChannel || ''} onChange={(e) => setClDraft((d) => ({ ...d, acquisitionChannel: e.target.value }))} placeholder="Social, Passaparola…" className="crm-input" />
                <datalist id="crm-channels">{ACQUISITION_CHANNELS.map((ch) => <option key={ch} value={ch} />)}</datalist>
              </Field>
              <Field label="Target / etichette (separate da virgola)">
                <input value={(clDraft.targetTags || []).join(', ')} onChange={(e) => setClDraft((d) => ({ ...d, targetTags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))} placeholder="Imprese di Ostuni, …" className="crm-input" />
              </Field>
            </div>

            {members.length > 0 && (
              <Field label="Responsabili">
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const on = !!clDraft.responsabili?.[m.uid];
                    return (
                      <button key={m.uid} type="button"
                        onClick={() => setClDraft((d) => {
                          const r = { ...(d.responsabili || {}) };
                          if (on) delete r[m.uid]; else r[m.uid] = true;
                          return { ...d, responsabili: r };
                        })}
                        className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full border ${on ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2]'}`}>
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
            {/* Pratica & Registro clienti */}
            <div className="border-t border-[#f0f0f0] pt-3 mt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">Pratica & registro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Stato">
                  <select value={clDraft.stato || ''} onChange={(e) => setClDraft((d) => ({ ...d, stato: (e.target.value || null) as any }))} className="crm-input">
                    <option value="">—</option><option value="attivo">Attivo</option><option value="chiuso">Chiuso</option>
                  </select>
                </Field>
                <Field label="Preventivo">
                  <select value={clDraft.preventivoStato || ''} onChange={(e) => setClDraft((d) => ({ ...d, preventivoStato: (e.target.value || null) as any }))} className="crm-input">
                    <option value="">—</option><option value="firmato">Firmato</option><option value="non_firmato">Non firmato</option>
                  </select>
                </Field>
                <Field label="Data inizio"><input type="date" value={clDraft.dataInizio || ''} onChange={(e) => setClDraft((d) => ({ ...d, dataInizio: e.target.value || null }))} className="crm-input" /></Field>
                <Field label="Data fine"><input type="date" value={clDraft.dataFine || ''} onChange={(e) => setClDraft((d) => ({ ...d, dataFine: e.target.value || null }))} className="crm-input" /></Field>
                <Field label="Responsabile (nome)"><input value={clDraft.responsabileNome || ''} onChange={(e) => setClDraft((d) => ({ ...d, responsabileNome: e.target.value || null }))} className="crm-input" /></Field>
                <Field label="Riferimento comunicazione"><input value={clDraft.riferimentoComunicazione || ''} onChange={(e) => setClDraft((d) => ({ ...d, riferimentoComunicazione: e.target.value || null }))} className="crm-input" /></Field>
              </div>
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer text-[13px] font-semibold text-[#333]">
                <input type="checkbox" checked={clDraft.saldato === true} onChange={(e) => setClDraft((d) => ({ ...d, saldato: e.target.checked }))} className="w-4 h-4 accent-[#161616]" /> Saldato
              </label>
            </div>

            {/* Codice referral */}
            <div className="border-t border-[#f0f0f0] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">Referral</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Codice referral (proprio)">
                  <div className="flex items-center gap-1.5">
                    <input readOnly value={clDraft.codiceReferenza || '— generato al salvataggio'} className="crm-input font-mono flex-1 bg-gray-50" />
                    {clDraft.codiceReferenza && (
                      <button type="button" title="Rigenera" onClick={() => setClDraft((d) => ({ ...d, codiceReferenza: genRefCode(d.type === 'azienda' ? (d.companyName || d.name || '') : (d.lastName || d.firstName || d.name || '')) }))} className="px-2 py-2 rounded-lg border border-[#e2e2e2] hover:border-black text-[#161616] cursor-pointer bg-white"><RefreshCw className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </Field>
                <Field label="Portato da (codice referral)"><input value={clDraft.referredByCode || ''} onChange={(e) => setClDraft((d) => ({ ...d, referredByCode: e.target.value.toUpperCase() || null }))} placeholder="Codice di chi ha segnalato" className="crm-input font-mono" /></Field>
              </div>
            </div>
            <button onClick={saveClientDraft} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">{clDraft.id ? 'Salva modifiche' : 'Aggiungi cliente'}</button>
          </div>
        </Overlay>
      )}

      {/* DETTAGLIO LEAD */}
      {activeLead && (
        <Overlay onClose={() => { setOpenLead(null); setNoteDraft(''); }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[18px] font-black text-[#161616] leading-none">{activeLead.name}</h3>
              {activeLead.company && <p className="text-[12.5px] text-[#8a8a8a] mt-1">{activeLead.company}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(activeLead.sector)}`}>{sectorLabel(activeLead.sector)}</span>
                <span className="text-[10px] font-bold text-[#161616] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">{stageLabel(activeLead.stage)}</span>
                {activeLead.value ? <span className="text-[11px] font-bold flex items-center gap-1"><Euro className="w-3 h-3" />{eur(activeLead.value)}</span> : null}
              </div>
            </div>
            <button onClick={() => { setOpenLead(null); setNoteDraft(''); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {/* Smistamento alla società di competenza (Point of Entry) */}
          {canManageLeads && (
            <div className="mb-4 rounded-xl border border-[#ececec] bg-[#fafafa] p-3">
              {activeLead.routed ? (
                <div className="flex items-center gap-1.5 text-[12px] text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Assegnato a {sectorLabel(activeLead.sector)}
                  <span className="font-normal text-[#8a8a8a]">{activeLead.routedByName ? ` · ${activeLead.routedByName}` : ''}{activeLead.routedAt ? ` · ${fmtWhen(activeLead.routedAt)}` : ''}</span>
                </div>
              ) : (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] inline-flex items-center gap-1.5 mb-1.5"><Split className="w-3.5 h-3.5" /> Smista alla società</div>
                  <div className="text-[12px] text-[#555] mb-2">Suggerito: <b>{sectorLabel(suggestSector(activeLead))}</b></div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['studio', 'strategico', 'materico'] as const).map((s) => {
                      const sug = suggestSector(activeLead) === s;
                      return (
                        <button key={s} onClick={() => { const u = { ...activeLead, sector: s, routed: true, routedAt: Date.now(), routedByName: myName }; onSaveLeads(leads.map((l) => (l.id === activeLead.id ? u : l))); onRouteLead?.(u, s); }}
                          className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${sug ? 'bg-[#1b1b1b] text-white border-[#1b1b1b]' : 'bg-white text-[#161616] border-[#e2e2e2] hover:border-[#161616]'}`}>
                          {sectorLabel(s)}{sug ? ' ✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {(activeLead.email || activeLead.phone) && (
            <div className="flex flex-col gap-1 mb-4">
              {activeLead.email && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{activeLead.email}</span>}
              {activeLead.phone && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{activeLead.phone}</span>}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {activeLead.stage !== 'vinto' && activeLead.stage !== 'perso' && (
              <button onClick={() => { onConvertLead(activeLead); onSaveLeads(leads.map(l => l.id === activeLead.id ? { ...l, stage: 'vinto' } : l)); setOpenLead(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none">
                <ArrowRightCircle className="w-4 h-4" /> Converti in commessa
              </button>
            )}
            <button onClick={() => deleteLead(activeLead.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold cursor-pointer border border-red-200">
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          </div>

          <NotesPanel notes={activeLead.notes} draft={noteDraft} setDraft={setNoteDraft} onAdd={() => addLeadNote(activeLead.id)} />
        </Overlay>
      )}

      {/* DETTAGLIO FORNITORE */}
      {activeSupplier && (
        <Overlay onClose={() => { setOpenSupplier(null); setNoteDraft(''); }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[18px] font-black text-[#161616] leading-none">{activeSupplier.name}</h3>
              {activeSupplier.category && <p className="text-[12.5px] text-[#8a8a8a] mt-1">{activeSupplier.category}</p>}
              <div className="mt-2"><span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(activeSupplier.sector)}`}>{sectorLabel(activeSupplier.sector)}</span></div>
            </div>
            <button onClick={() => { setOpenSupplier(null); setNoteDraft(''); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          {(activeSupplier.email || activeSupplier.phone) && (
            <div className="flex flex-col gap-1 mb-4">
              {activeSupplier.email && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{activeSupplier.email}</span>}
              {activeSupplier.phone && <span className="flex items-center gap-1.5 text-[12px] text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{activeSupplier.phone}</span>}
            </div>
          )}
          <div className="mb-4">
            <button onClick={() => deleteSupplier(activeSupplier.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold cursor-pointer border border-red-200">
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          </div>
          <NotesPanel notes={activeSupplier.notes} draft={noteDraft} setDraft={setNoteDraft} onAdd={() => addSupplierNote(activeSupplier.id)} />
        </Overlay>
      )}

      {/* FORM NUOVO LEAD */}
      {newLeadOpen && (
        <Overlay onClose={() => setNewLeadOpen(false)}>
          <FormHeader title="Nuovo lead" onClose={() => setNewLeadOpen(false)} />
          <div className="flex flex-col gap-3">
            <Field label="Nome contatto *"><input value={fName} onChange={(e) => setFName(e.target.value)} className="crm-input" /></Field>
            <Field label="Azienda"><input value={fCompany} onChange={(e) => setFCompany(e.target.value)} className="crm-input" /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Settore"><SectorSelect value={fSector} onChange={setFSector} /></Field>
              <Field label="Valore stimato (€)"><input value={fValue} onChange={(e) => setFValue(e.target.value)} inputMode="decimal" className="crm-input" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email"><input value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="crm-input" /></Field>
              <Field label="Telefono"><input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="crm-input" /></Field>
            </div>
            <button onClick={addLead} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">Aggiungi lead</button>
          </div>
        </Overlay>
      )}

      {/* FORM NUOVO FORNITORE */}
      {newSupplierOpen && (
        <Overlay onClose={() => setNewSupplierOpen(false)}>
          <FormHeader title="Nuovo fornitore / subappaltatore" onClose={() => setNewSupplierOpen(false)} />
          <div className="flex flex-col gap-3">
            <Field label="Nome / Ragione sociale *"><input value={fName} onChange={(e) => setFName(e.target.value)} className="crm-input" /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Categoria"><input value={fCategory} onChange={(e) => setFCategory(e.target.value)} placeholder="es. Impianti, Edile…" className="crm-input" /></Field>
              <Field label="Settore"><SectorSelect value={fSector} onChange={setFSector} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email"><input value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="crm-input" /></Field>
              <Field label="Telefono"><input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="crm-input" /></Field>
            </div>
            <button onClick={addSupplier} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">Aggiungi fornitore</button>
          </div>
        </Overlay>
      )}

      <style>{`.crm-input{width:100%;height:38px;border:1px solid #e2e2e2;border-radius:12px;padding:0 12px;font-size:13px;background:#fbfbfb}.crm-input:focus{outline:none;border-color:#161616}`}</style>
    </div>
  );
};

// --- helpers UI ---
const Overlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fadeIn_0.18s_ease_both]" onClick={onClose}>
    <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-[480px] max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-left" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);
const FormHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-[17px] font-black text-[#161616]">{title}</h3>
    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
  </div>
);
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{label}</span>
    {children}
  </label>
);
const ClientRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-[#f0f0f0]">
    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{label}</span>
    <span className="text-[12.5px] font-medium text-[#161616] text-right">{value}</span>
  </div>
);
const SectorSelect: React.FC<{ value: string; onChange: (v: any) => void }> = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="crm-input">
    <option value="studio">Studio</option>
    <option value="strategico">Strategico</option>
    <option value="materico">Materico</option>
  </select>
);
const NotesPanel: React.FC<{ notes?: CrmNote[]; draft: string; setDraft: (s: string) => void; onAdd: () => void }> = ({ notes, draft, setDraft, onAdd }) => (
  <div>
    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] block mb-2">Storico interazioni</span>
    <div className="flex items-center gap-2 mb-3">
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder="Aggiungi nota / interazione…" className="crm-input flex-grow" />
      <button onClick={onAdd} className="w-9 h-9 rounded-xl bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center shrink-0 cursor-pointer border-none"><MessageSquarePlus className="w-4 h-4" /></button>
    </div>
    {(notes && notes.length > 0) ? (
      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
        {[...notes].sort((a, b) => b.at - a.at).map((n, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50 border border-[#f0f0f0]">
            <p className="text-[13px] text-[#161616]">{n.text}</p>
            <span className="text-[10.5px] text-[#8a8a8a] font-semibold">{[n.by, fmtWhen(n.at)].filter(Boolean).join(' · ')}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-[12.5px] italic text-[#8a8a8a]">Nessuna interazione registrata.</p>
    )}
  </div>
);
