/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CredenzialiView — Credenziali & password per società (Contabilità & Amministrazione).
 * Riusa la cassaforte (`governanceVault` + master password `governanceVaultConfig`), filtrando
 * le voci per società. Gate a livello UI (i dati restano condivisi nel gruppo).
 */
import React from 'react';
import { Lock, KeyRound, Plus, X, Trash2, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import type { VaultEntry, VaultConfig, VaultCategory } from '../types';
import { safeUrl } from '../utils';

interface Props {
  entries: VaultEntry[];       // già filtrate per società (o filtrabili qui)
  config: VaultConfig;
  soc: string;
  socLabel?: string;
  canEdit?: boolean;
  onSave?: (e: VaultEntry) => void;
  onDelete?: (id: string) => void;
  onSetConfig?: (cfg: VaultConfig) => Promise<any>;
}

const CATS: VaultCategory[] = ['sito', 'portale', 'software', 'strumento', 'social', 'altro'];
const CAT_LABEL: Record<string, string> = { sito: 'Sito', portale: 'Portale', software: 'Software', strumento: 'Strumento', social: 'Social', altro: 'Altro' };

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const randSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, '0')).join('');

export const CredenzialiView: React.FC<Props> = ({ entries, config, soc, socLabel, canEdit = false, onSave, onDelete, onSetConfig }) => {
  const [unlocked, setUnlocked] = React.useState(false);
  const [pass, setPass] = React.useState('');
  const [err, setErr] = React.useState('');
  const [setup, setSetup] = React.useState(false);
  const [np1, setNp1] = React.useState(''); const [np2, setNp2] = React.useState('');
  const [editing, setEditing] = React.useState<VaultEntry | null>(null);
  const [reveal, setReveal] = React.useState<Record<string, boolean>>({});
  const hasPass = !!config.passHash;
  const list = entries.filter((e) => (e.soc || null) === soc || (!e.soc && false)).sort((a, b) => a.label.localeCompare(b.label));

  const tryUnlock = async () => { setErr(''); const h = await sha256Hex((config.salt || '') + pass); if (h === config.passHash) setUnlocked(true); else setErr('Password errata.'); };
  const saveNew = async () => { if (np1.length < 4) { setErr('Minimo 4 caratteri.'); return; } if (np1 !== np2) { setErr('Non coincidono.'); return; } const salt = randSalt(); const passHash = await sha256Hex(salt + np1); await onSetConfig?.({ salt, passHash }); setUnlocked(true); };
  const blank = (): VaultEntry => ({ id: `vault-${Date.now()}`, label: '', category: 'sito', soc, url: null, username: null, password: null, note: null, createdAt: Date.now() });
  const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});

  if (!unlocked) {
    return (
      <div className="flex flex-col gap-5 text-left">
        <div><h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><KeyRound className="w-5.5 h-5.5" /> Credenziali & password {socLabel ? `· ${socLabel}` : ''}</h2></div>
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-8 shadow-sm max-w-md mx-auto flex flex-col items-center text-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-[#161616] text-white flex items-center justify-center"><Lock className="w-6 h-6" /></span>
          <h3 className="text-[18px] font-extrabold text-[#161616]">Cassaforte credenziali</h3>
          {!hasPass && !setup && (<>
            <p className="text-[12.5px] text-[#8a8a8a]">Nessuna password impostata.{canEdit ? ' Impostane una.' : ' Chiedi a un amministratore.'}</p>
            {canEdit && <button onClick={() => { setSetup(true); setErr(''); }} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Imposta password</button>}
          </>)}
          {hasPass && !setup && (<>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tryUnlock()} placeholder="Password sezione" autoFocus className="w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[14px] outline-none focus:border-[#161616] bg-white" />
            {err && <p className="text-[12px] text-rose-600 font-semibold">{err}</p>}
            <button onClick={tryUnlock} disabled={!pass} className="w-full px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Sblocca</button>
            {canEdit && <button onClick={() => { setSetup(true); setErr(''); }} className="text-[11.5px] font-semibold text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none">Reimposta password (amministratore)</button>}
          </>)}
          {setup && canEdit && (<>
            <input type="password" value={np1} onChange={(e) => setNp1(e.target.value)} placeholder="Nuova password" autoFocus className="w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[14px] outline-none focus:border-[#161616] bg-white" />
            <input type="password" value={np2} onChange={(e) => setNp2(e.target.value)} placeholder="Ripeti" className="w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[14px] outline-none focus:border-[#161616] bg-white" />
            {err && <p className="text-[12px] text-rose-600 font-semibold">{err}</p>}
            <div className="flex items-center gap-2 w-full"><button onClick={() => { setSetup(false); setErr(''); }} className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#e2e2e2] text-[13px] font-bold cursor-pointer">Annulla</button><button onClick={saveNew} className="flex-1 px-4 py-2.5 rounded-xl bg-[#161616] text-white text-[13px] font-bold cursor-pointer border-none">Salva</button></div>
          </>)}
          <p className="text-[10.5px] text-[#b8b8b8] mt-1">Protezione a livello UI: le credenziali sono condivise nel gruppo. La master password è comune alla cassaforte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><KeyRound className="w-5.5 h-5.5" /> Credenziali & password {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Accessi a siti, portali, software e strumenti della società.</p></div>
        <div className="flex items-center gap-2">
          {canEdit && <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova credenziale</button>}
          <button onClick={() => setUnlocked(false)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Lock className="w-3.5 h-3.5" /> Blocca</button>
        </div>
      </div>
      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Nessuna credenziale per questa società.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((e) => { const url = e.url ? safeUrl(e.url) : null; const shown = reveal[e.id]; return (
            <div key={e.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><b className="text-[13.5px] text-[#161616] truncate block">{e.label}</b><span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">{CAT_LABEL[e.category || 'altro']}</span></div>
                {canEdit && <div className="flex items-center gap-1 shrink-0"><button onClick={() => setEditing(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Eye className="w-3.5 h-3.5" /></button><button onClick={() => onDelete?.(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button></div>}
              </div>
              {url && <a href={url} target="_blank" rel="noreferrer" className="text-[12px] text-indigo-600 hover:underline inline-flex items-center gap-1 truncate"><ExternalLink className="w-3 h-3 shrink-0" /> {e.url}</a>}
              {e.username && <div className="flex items-center justify-between gap-2 bg-gray-50 border border-[#eee] rounded-lg px-2.5 py-1.5"><span className="text-[12px] text-[#333] truncate"><span className="text-[#a0a0a0]">Utente:</span> {e.username}</span><button onClick={() => copy(e.username!)} className="text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none shrink-0"><Copy className="w-3.5 h-3.5" /></button></div>}
              {e.password && <div className="flex items-center justify-between gap-2 bg-gray-50 border border-[#eee] rounded-lg px-2.5 py-1.5"><span className="text-[12px] text-[#333] font-mono truncate">{shown ? e.password : '•'.repeat(Math.min(12, e.password.length))}</span><div className="flex items-center gap-1.5 shrink-0"><button onClick={() => setReveal((r) => ({ ...r, [e.id]: !r[e.id] }))} className="text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none">{shown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button><button onClick={() => copy(e.password!)} className="text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none"><Copy className="w-3.5 h-3.5" /></button></div></div>}
              {e.note && <p className="text-[11.5px] text-[#8a8a8a] leading-relaxed">{e.note}</p>}
            </div>
          ); })}
        </div>
      )}
      {editing && onSave && <CredEditor entry={editing} onClose={() => setEditing(null)} onSave={(e) => { onSave(e); setEditing(null); }} />}
    </div>
  );
};

const CredEditor: React.FC<{ entry: VaultEntry; onClose: () => void; onSave: (e: VaultEntry) => void }> = ({ entry, onClose, onSave }) => {
  const [d, setD] = React.useState<VaultEntry>(entry);
  const [show, setShow] = React.useState(false);
  const set = (c: Partial<VaultEntry>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616]">{entry.label ? 'Modifica credenziale' : 'Nuova credenziale'}</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <input value={d.label} onChange={(e) => set({ label: e.target.value })} placeholder="Nome (es. Google Workspace)" className={inp} />
          <select value={d.category || 'sito'} onChange={(e) => set({ category: e.target.value as VaultCategory })} className={inp}>{CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}</select>
          <input value={d.url || ''} onChange={(e) => set({ url: e.target.value || null })} placeholder="URL (https://…)" className={inp} />
          <input value={d.username || ''} onChange={(e) => set({ username: e.target.value || null })} placeholder="Utente / email" className={inp} />
          <div className="relative"><input type={show ? 'text' : 'password'} value={d.password || ''} onChange={(e) => set({ password: e.target.value || null })} placeholder="Password / chiave" className={`${inp} pr-10`} /><button onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
          <textarea value={d.note || ''} onChange={(e) => set({ note: e.target.value || null })} placeholder="Note (2FA, recupero…)" rows={2} className={`${inp} resize-none`} />
          <button onClick={() => onSave({ ...d, label: d.label.trim(), updatedAt: Date.now() })} disabled={!d.label.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva</button>
        </div>
      </div>
    </div>
  );
};

export default CredenzialiView;
