/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sezione Documenti — coerente con le altre sezioni:
 *  - barra dei settori (Tutti / Studio / Strategico / Materico)
 *  - box di tutti i clienti, con i documenti delle loro pratiche
 *  - generatore di documenti (Compilatore Modulistica Edilizia SUE/SUAP)
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  FileText, Download, Trash2, Upload, FolderOpen, Folder, FolderPlus,
  X, ChevronLeft, FileSpreadsheet, Mail, FileSignature
} from 'lucide-react';
import type { Project, UserProfile } from '../types';
import { initials, safeUrl } from '../utils';

interface DocItem {
  id: string;
  name: string;
  kind?: string;
  type?: string;
  size?: number;
  url?: string;
  byName?: string;
  by?: string;
  at?: number;
  folder?: string | null;   // cartella del cliente (es. 'Catasto', 'Permessi')
  path?: string | null;     // percorso leggibile, aggiornato allo spostamento
}

interface DocumentsViewProps {
  documents: Record<string, Record<string, DocItem>>;
  projects: Project[];
  users: Record<string, UserProfile>;
  canEdit: boolean;
  onUploadDocument: (pid: string, file: File, kind?: string) => void;
  onDeleteDocument: (pid: string, docId: string) => void;
  /** Sposta un documento in una cartella (aggiorna folder + path sul nodo). */
  onMoveDocument?: (pid: string, docId: string, folder: string | null) => void;
}

const GENERATOR_URL = `${import.meta.env.BASE_URL}generatore-modulistica.html`;

const fmtSize = (b?: number) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};
const fmtWhen = (t?: number) =>
  t ? new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const sectorBadge = (s?: string) =>
  s === 'strategico'
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : s === 'materico'
    ? 'bg-orange-50 text-orange-850 border-orange-200'
    : 'bg-zinc-50 text-zinc-800 border-zinc-200';
const sectorLabel = (s?: string) =>
  s === 'strategico' ? 'Strategico' : s === 'materico' ? 'Materico' : 'Studio';

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  projects,
  users,
  canEdit,
  onUploadDocument,
  onDeleteDocument,
  onMoveDocument
}) => {
  const [mainTab, setMainTab] = useState<'pratiche' | 'contratti'>('pratiche');
  const [sector, setSector] = useState<'tutti' | 'studio' | 'strategico' | 'materico'>('tutti');
  const [openClient, setOpenClient] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [search, setSearch] = useState('');
  const [contractProjId, setContractProjId] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadPidRef = useRef<string | null>(null);
  const uploadKindRef = useRef<string>('allegato');

  const clients = useMemo(
    () =>
      Object.values(users)
        .filter((u) => u.role === 'cliente')
        .filter((u) => (sector === 'tutti' ? true : (u.sector || 'studio') === sector))
        .filter((u) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [users, sector, search]
  );

  const projectsOf = (uid: string) => projects.filter((p) => p.clientUid === uid);
  const docsCount = (uid: string) =>
    projectsOf(uid).reduce((sum, p) => sum + Object.keys(documents[p.id] || {}).length, 0);

  const triggerUpload = (pid: string, kind: string = 'allegato') => {
    uploadPidRef.current = pid;
    uploadKindRef.current = kind;
    uploadRef.current?.click();
  };
  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pid = uploadPidRef.current;
    if (file && pid) onUploadDocument(pid, file, uploadKindRef.current);
    if (uploadRef.current) uploadRef.current.value = '';
  };

  const activeClient = openClient ? users[openClient] : null;

  // --- Contratti: documenti con kind 'contratto' raggruppati per pratica ---
  const contractsByProject = useMemo(() => {
    return projects
      .map((p) => ({
        project: p,
        docs: Object.values(documents[p.id] || {})
          .filter((d) => d.kind === 'contratto')
          .sort((a, b) => (b.at || 0) - (a.at || 0))
      }))
      .filter((g) => g.docs.length > 0);
  }, [projects, documents]);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* hidden file input condiviso */}
      <input ref={uploadRef} type="file" className="hidden" onChange={onFilePicked} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none">Documenti</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">
            Archivio pratiche per cliente e generatore di modulistica.
          </p>
        </div>
      </div>

      {/* Compilatore + Crea contratto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <button
          onClick={() => setShowGenerator(true)}
          className="text-left bg-gradient-to-br from-[#161616] to-[#2c2d31] text-white rounded-[24px] p-5 flex items-center gap-4 cursor-pointer border-none hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="flex-grow min-w-0">
            <b className="text-[15px] block">Compilatore Modulistica Edilizia — SUE/SUAP</b>
            <span className="text-[12.5px] text-white/60 block mt-0.5">
              Compila e genera CILA, SCIA, permessi di costruire e altra modulistica.
            </span>
          </div>
          <span className="text-[12px] font-bold text-white/70 group-hover:text-white shrink-0 hidden sm:block">Apri →</span>
        </button>

        {/* Crea contratto: box predisposto, da attivare in un secondo momento */}
        <div className="text-left bg-white border border-dashed border-[#d8d8d8] rounded-[24px] p-5 flex items-center gap-4 opacity-80">
          <div className="w-12 h-12 rounded-2xl bg-[#f3f3f3] flex items-center justify-center shrink-0">
            <FileSignature className="w-6 h-6 text-[#9a9a9a]" />
          </div>
          <div className="flex-grow min-w-0">
            <b className="text-[15px] block text-[#161616]">Crea contratto</b>
            <span className="text-[12.5px] text-[#9a9a9a] block mt-0.5">
              Generazione guidata dei contratti (incarico, fornitura, subappalto).
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
            In preparazione
          </span>
        </div>
      </div>

      {/* Barra principale: Pratiche | Contratti */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="pillbar flex items-center bg-[#161616] border border-neutral-800 p-[3px] rounded-full gap-[2px]">
          {([['pratiche', 'Pratiche & Archivio'], ['contratti', 'Contratti']] as const).map(([id, lbl]) => {
            const active = mainTab === id;
            return (
              <button
                key={id}
                onClick={() => { setMainTab(id); setOpenClient(null); }}
                className={`text-[12px] font-extrabold px-4 py-1.5 rounded-full cursor-pointer border-none transition-all ${
                  active ? 'bg-white text-[#161616] shadow-xs' : 'text-[#a3a3a3] bg-transparent hover:text-white'
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </div>

        {mainTab === 'pratiche' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
              {(['tutti', 'studio', 'strategico', 'materico'] as const).map((sec) => {
                const active = sector === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => { setSector(sec); setOpenClient(null); }}
                    className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${
                      active ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'
                    }`}
                  >
                    {sec === 'tutti' ? 'Tutti' : sectorLabel(sec)}
                  </button>
                );
              })}
            </div>

            {!openClient && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca cliente…"
                className="input text-[13px] h-9 w-full sm:w-[220px] rounded-xl border border-[#e2e2e2] px-3"
              />
            )}
          </div>
        )}
      </div>

      {/* TAB CONTRATTI: registro contratti per pratica */}
      {mainTab === 'contratti' ? (
        <div className="flex flex-col gap-5">
          {canEdit && (
            <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Carica un contratto sulla pratica</span>
                <select
                  value={contractProjId}
                  onChange={(e) => setContractProjId(e.target.value)}
                  className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[13px] bg-white outline-none focus:border-[#161616]"
                >
                  <option value="">— seleziona pratica —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.client ? ` · ${p.client}` : ''}</option>)}
                </select>
              </label>
              <button
                onClick={() => contractProjId && triggerUpload(contractProjId, 'contratto')}
                disabled={!contractProjId}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40 transition-all"
              >
                <Upload className="w-4 h-4" /> Carica contratto
              </button>
            </div>
          )}

          {contractsByProject.length === 0 ? (
            <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
              <FileSignature className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun contratto archiviato.</p>
            </div>
          ) : (
            contractsByProject.map(({ project: p, docs }) => (
              <div key={p.id} className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <b className="text-[15px] text-[#161616] block truncate">{p.name}</b>
                    <span className="text-[11px] text-[#8a8a8a]">{p.client || '—'}{p.code ? ` · ${p.code}` : ''}</span>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => triggerUpload(p.id, 'contratto')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e2e2] hover:border-black hover:bg-gray-50 text-[12px] font-bold text-[#161616] cursor-pointer shrink-0 bg-white"
                    >
                      <Upload className="w-3.5 h-3.5" /> Carica
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#f0f0f0] hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileSignature className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <b className="text-[13px] text-[#161616] block truncate">{d.name}</b>
                        <span className="text-[11px] text-[#8a8a8a]">
                          {['Contratto', d.byName, fmtWhen(d.at), fmtSize(d.size)].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      {d.url && (
                        <a
                          href={safeUrl(d.url) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg border border-[#e2e2e2] bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
                          title="Apri / scarica"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onDeleteDocument(p.id, d.id)}
                          className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 shrink-0 cursor-pointer"
                          title="Elimina (nel Cestino)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeClient ? (
        <ClientDocuments
          client={activeClient}
          projects={projectsOf(activeClient.uid)}
          documents={documents}
          canEdit={canEdit}
          onBack={() => setOpenClient(null)}
          onUpload={triggerUpload}
          onDelete={onDeleteDocument}
          onMove={onMoveDocument}
        />
      ) : clients.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun cliente in questo settore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map((u) => {
            const projs = projectsOf(u.uid);
            const nDocs = docsCount(u.uid);
            return (
              <div
                key={u.uid}
                onClick={() => setOpenClient(u.uid)}
                className="group bg-white border border-[#e2e2e2] rounded-[24px] p-5 hover:border-black hover:shadow-md transition-all cursor-pointer flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[14px] border border-white bg-gradient-to-tr from-sky-100 to-sky-200 text-sky-850">
                    {initials(u.name)}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#161616] bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                    <FileText className="w-3.5 h-3.5" /> {nDocs}
                  </span>
                </div>

                <div>
                  <h4 className="text-[14.5px] font-extrabold text-[#161616] tracking-tight truncate">{u.name}</h4>
                  <div className="mt-1.5">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(u.sector)}`}>
                      {sectorLabel(u.sector)}
                    </span>
                  </div>
                  {u.email && (
                    <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500 mt-2.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span className="truncate">{u.email}</span>
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-dashed border-[#ececec]">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-1.5">
                    {projs.length} {projs.length === 1 ? 'pratica' : 'pratiche'}
                  </span>
                  <span className="text-[12px] font-bold text-[#8a8a8a] group-hover:text-black transition-colors">
                    Apri documenti →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GENERATORE a tutto schermo (come il moodboard 3D) */}
      {showGenerator && (
        <div className="fixed inset-0 z-[200] flex flex-col animate-[fadeIn_0.18s_ease_both]">
          <div className="bg-[#eceae5] w-full h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161616] text-white shrink-0">
              <b className="text-[13px] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Compilatore Modulistica Edilizia
              </b>
              <div className="flex items-center gap-2">
                <a
                  href={GENERATOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11.5px] font-bold text-white/70 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  Apri in scheda
                </a>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer border-none text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe title="Generatore Modulistica" src={GENERATOR_URL} className="flex-grow w-full border-none bg-[#eceae5]" />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Dettaglio documenti di un cliente, raggruppati per pratica (con cartelle) ---
const ClientDocuments: React.FC<{
  client: UserProfile;
  projects: Project[];
  documents: Record<string, Record<string, DocItem>>;
  canEdit: boolean;
  onBack: () => void;
  onUpload: (pid: string) => void;
  onDelete: (pid: string, docId: string) => void;
  onMove?: (pid: string, docId: string, folder: string | null) => void;
}> = ({ client, projects, documents, canEdit, onBack, onUpload, onDelete, onMove }) => {
  // cartelle create in sessione (ancora vuote) + filtro cartella attiva, per pratica
  const [extraFolders, setExtraFolders] = useState<Record<string, string[]>>({});
  const [activeFolder, setActiveFolder] = useState<Record<string, string>>({});
  const [newFolderFor, setNewFolderFor] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const foldersOf = (pid: string, docs: DocItem[]) => {
    const set = new Set<string>(extraFolders[pid] || []);
    docs.forEach((d) => { if (d.folder) set.add(d.folder); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };
  const createFolder = (pid: string) => {
    const name = newFolderName.trim();
    if (!name) return;
    setExtraFolders((prev) => ({ ...prev, [pid]: Array.from(new Set([...(prev[pid] || []), name])) }));
    setActiveFolder((prev) => ({ ...prev, [pid]: name }));
    setNewFolderFor(null);
    setNewFolderName('');
  };

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8a8a8a] hover:text-[#161616] w-fit">
        <ChevronLeft className="w-4 h-4" /> Tutti i clienti
      </button>

      <div className="flex items-center gap-4">
        <span className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-[18px] bg-gradient-to-tr from-sky-100 to-sky-200 text-sky-850">
          {initials(client.name)}
        </span>
        <div>
          <h2 className="text-[22px] font-black tracking-tight leading-none">{client.name}</h2>
          <div className="mt-1.5">
            <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${sectorBadge(client.sector)}`}>
              {sectorLabel(client.sector)}
            </span>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessuna pratica collegata a questo cliente.</p>
        </div>
      ) : (
        projects.map((p) => {
          const docs = Object.values(documents[p.id] || {}).sort((a, b) => (b.at || 0) - (a.at || 0));
          const folders = foldersOf(p.id, docs);
          const curFolder = activeFolder[p.id] || '';
          const visibleDocs = curFolder ? docs.filter((d) => (d.folder || '') === curFolder) : docs;
          return (
            <div key={p.id} className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <b className="text-[15px] text-[#161616] block truncate">{p.name}</b>
                  {p.code && <span className="text-[11px] text-[#8a8a8a] font-mono">{p.code}</span>}
                </div>
                {canEdit && (
                  <button
                    onClick={() => onUpload(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e2e2] hover:border-black hover:bg-gray-50 text-[12px] font-bold text-[#161616] cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" /> Carica
                  </button>
                )}
              </div>

              {/* Cartelle della pratica */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <button
                  onClick={() => setActiveFolder((prev) => ({ ...prev, [p.id]: '' }))}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${!curFolder ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2] hover:border-[#b0b0b0]'}`}
                >
                  Tutti
                </button>
                {folders.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFolder((prev) => ({ ...prev, [p.id]: f }))}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${curFolder === f ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2] hover:border-[#b0b0b0]'}`}
                  >
                    <Folder className="w-3 h-3" /> {f}
                    <span className="opacity-60">({docs.filter((d) => (d.folder || '') === f).length})</span>
                  </button>
                ))}
                {canEdit && (newFolderFor === p.id ? (
                  <span className="inline-flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') createFolder(p.id); if (e.key === 'Escape') { setNewFolderFor(null); setNewFolderName(''); } }}
                      placeholder="Nome cartella"
                      className="h-7 w-36 border border-[#e2e2e2] rounded-full px-3 text-[11.5px] outline-none focus:border-[#161616]"
                    />
                    <button onClick={() => createFolder(p.id)} className="text-[11px] font-bold text-white bg-[#161616] rounded-full px-2.5 py-1 cursor-pointer border-none">Crea</button>
                    <button onClick={() => { setNewFolderFor(null); setNewFolderName(''); }} className="text-gray-400 hover:text-[#161616]"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ) : (
                  <button
                    onClick={() => { setNewFolderFor(p.id); setNewFolderName(''); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border border-dashed border-[#cfcfcf] text-[#8a8a8a] hover:text-[#161616] hover:border-[#161616] bg-white transition-colors"
                  >
                    <FolderPlus className="w-3 h-3" /> Nuova cartella
                  </button>
                ))}
              </div>

              {visibleDocs.length === 0 ? (
                <p className="text-[12.5px] italic text-[#8a8a8a]">{curFolder ? 'Cartella vuota: sposta qui un documento con "Sposta in…".' : 'Nessun documento.'}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {visibleDocs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#f0f0f0] hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <b className="text-[13px] text-[#161616] block truncate">
                          {d.name}
                          {d.kind === 'contratto' && (
                            <span className="ml-2 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full align-middle">Contratto</span>
                          )}
                        </b>
                        <span className="text-[11px] text-[#8a8a8a]">
                          {[d.folder ? `📁 ${d.folder}` : null, d.byName, fmtWhen(d.at), fmtSize(d.size)].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      {canEdit && onMove && (
                        <select
                          value={d.folder || ''}
                          onChange={(e) => onMove(p.id, d.id, e.target.value || null)}
                          className="h-8 max-w-[130px] border border-[#e2e2e2] rounded-lg px-2 text-[11px] font-bold text-[#6b6b6b] bg-white outline-none focus:border-[#161616] shrink-0"
                          title="Sposta in cartella"
                        >
                          <option value="">Sposta in…</option>
                          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      )}
                      {d.url && (
                        <a
                          href={safeUrl(d.url) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg border border-[#e2e2e2] bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
                          title="Apri / scarica"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onDelete(p.id, d.id)}
                          className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 shrink-0 cursor-pointer"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
