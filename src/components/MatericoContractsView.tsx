/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatericoContractsView — Contratti con le imprese (Materico §7). Generazione automatica
 * del contratto dai dati a gestionale (impresa, lavorazioni, importo, cronoprogramma,
 * pagamenti, penali, responsabilità) e firma tramite OTP. Ogni contratto è collegabile
 * a una commessa/cantiere.
 */
import React from 'react';
import {
  FileSignature, Plus, X, Trash2, ShieldCheck, Send, CheckCircle2, Printer,
} from 'lucide-react';
import type { MatericoContract, MatericoDeal, MatericoComputoRow } from '../types';
import { eur } from '../utils';

interface PartnerOpt { id: string; name: string; }
interface Props {
  contracts: Record<string, MatericoContract>;
  deals?: MatericoDeal[];
  partners?: PartnerOpt[];
  color?: string;
  canEdit?: boolean;
  onSave?: (c: MatericoContract) => void;
  onDelete?: (id: string) => void;
}

const ST: Record<MatericoContract['status'], { label: string; color: string }> = {
  bozza: { label: 'Bozza', color: '#6b7280' },
  inviato: { label: 'In firma (OTP)', color: '#b45309' },
  firmato: { label: 'Firmato', color: '#059669' },
  annullato: { label: 'Annullato', color: '#dc2626' },
};
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('it-IT') : '—');

/** Corpo contratto auto-compilato dai dati. */
export function buildContractBody(c: MatericoContract): string {
  const L = [
    `CONTRATTO DI SUBAPPALTO N. ${c.number}`,
    ``,
    `Tra Materico S.r.l. (Committente/General Contractor) e ${c.partnerName || '________'} (Impresa esecutrice).`,
    ``,
    `1. LAVORAZIONI AFFIDATE`,
    c.lavorazioni || '________',
    ``,
    `2. IMPORTO`,
    `Corrispettivo complessivo: ${c.importo != null ? eur(c.importo) : '________'} (oltre IVA di legge).`,
    ``,
    `3. CRONOPROGRAMMA`,
    `Inizio lavori: ${fmtDate(c.startDate)} — Fine prevista: ${fmtDate(c.endDate)}.`,
    ``,
    `4. MODALITÀ DI PAGAMENTO`,
    c.modalitaPagamento || 'Pagamenti a SAL secondo avanzamento, saldo a fine lavori previa verifica.',
    ``,
    `5. PENALI`,
    c.penali || 'In caso di ritardo non giustificato, penale giornaliera come da accordi, nei limiti di legge.',
    ``,
    `6. RESPONSABILITÀ`,
    c.responsabilita || 'L\'Impresa esegue a regola d\'arte, nel rispetto delle norme di sicurezza (D.Lgs. 81/2008) e assume la responsabilità delle proprie lavorazioni e maestranze.',
    ``,
    `Il presente contratto è sottoscritto digitalmente mediante firma con codice OTP.`,
  ];
  return L.join('\n');
}

export const MatericoContractsView: React.FC<Props> = ({ contracts, deals = [], partners = [], canEdit = false, onSave, onDelete }) => {
  const [editing, setEditing] = React.useState<MatericoContract | null>(null);
  const list = Object.values(contracts).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  const blank = (): MatericoContract => ({ id: `ctr-${Date.now()}`, number: `CTR-MAT-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`, partnerName: '', status: 'bozza', createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><FileSignature className="w-5.5 h-5.5" /> Contratti imprese</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Generazione automatica del contratto dai dati a gestionale + firma con OTP.</p>
        </div>
        {canEdit && <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuovo contratto</button>}
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <FileSignature className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun contratto.{canEdit ? ' Generane uno dai dati della commessa.' : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((c) => { const s = ST[c.status]; return (
            <div key={c.id} onClick={() => setEditing(c)} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm cursor-pointer hover:border-[#cfcfcf]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-[14px] text-[#161616]">{c.partnerName || 'Impresa'}</b>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5 font-mono">{c.number}</p>
                </div>
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: s.color }}>{s.label}</span>
              </div>
              {c.lavorazioni && <p className="text-[12px] text-[#555] mt-1.5 line-clamp-2">{c.lavorazioni}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[13px] font-black text-[#161616]">{c.importo != null ? eur(c.importo) : '—'}</span>
                {c.status === 'firmato' && c.signedAt && <span className="text-[10.5px] font-bold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {fmtDate(new Date(c.signedAt).toISOString())}</span>}
              </div>
            </div>
          ); })}
        </div>
      )}

      {editing && <ContractEditor contract={editing} deals={deals} partners={partners} canEdit={canEdit} onClose={() => setEditing(null)} onSave={onSave} onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined} />}
    </div>
  );
};

const ContractEditor: React.FC<{ contract: MatericoContract; deals: MatericoDeal[]; partners: PartnerOpt[]; canEdit: boolean; onClose: () => void; onSave?: (c: MatericoContract) => void; onDelete?: (id: string) => void }> = ({ contract, deals, partners, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<MatericoContract>(contract);
  const [otpInput, setOtpInput] = React.useState('');
  const [otpErr, setOtpErr] = React.useState('');
  const set = (c: Partial<MatericoContract>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  const signed = d.status === 'firmato';
  const locked = signed || !canEdit;

  const prefillFromDeal = (dealId: string) => {
    const dl = deals.find((x) => x.id === dealId); if (!dl) return;
    const lav = (dl.computo || []).map((r: MatericoComputoRow) => `• ${r.description} — ${r.qty} ${r.unit || ''}`.trim()).join('\n');
    set({ dealId: dl.id, cantiereId: dl.cantiereId || d.cantiereId, lavorazioni: lav || d.lavorazioni, importo: dl.costoStimato ?? d.importo, startDate: d.startDate });
  };
  const genBody = () => set({ body: buildContractBody({ ...d }) });
  const genOtp = () => { const code = String(Math.floor(100000 + Math.random() * 900000)); set({ otp: code, otpAt: Date.now(), status: 'inviato', body: d.body || buildContractBody({ ...d }) }); setOtpErr(''); setOtpInput(''); };
  const verifyOtp = () => {
    if (!d.otp) { setOtpErr('Genera prima il codice OTP.'); return; }
    if (otpInput.trim() === d.otp) { const signedC = { ...d, status: 'firmato' as const, signedAt: Date.now(), signedByName: d.partnerName || null, otp: null }; setD(signedC); onSave?.(signedC); setOtpErr(''); }
    else setOtpErr('Codice OTP errato.');
  };
  const save = () => onSave?.({ ...d, body: d.body || buildContractBody({ ...d }), updatedAt: Date.now() });
  const printContract = () => { const w = window.open('', '_blank'); if (!w) return; const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); w.document.write(`<pre style="font-family:Inter,Arial,sans-serif;font-size:13px;white-space:pre-wrap;padding:32px;line-height:1.5">${esc(d.body || buildContractBody({ ...d }))}${d.status === 'firmato' ? `\n\n— FIRMATO con OTP il ${fmtDate(d.signedAt ? new Date(d.signedAt).toISOString() : null)} —` : ''}</pre><script>window.onload=function(){window.print()}<\/script>`); w.document.close(); };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div><h3 className="text-[16px] font-extrabold text-[#161616]">Contratto {d.number}</h3><span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: ST[d.status].color }}>{ST[d.status].label}</span></div>
          <div className="flex items-center gap-1">
            <button onClick={printContract} title="Stampa / PDF" className="p-1.5 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Printer className="w-4 h-4" /></button>
            {canEdit && !signed && onDelete && contract.partnerName && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {canEdit && !signed && deals.length > 0 && (
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Precompila da commessa</span>
              <select value={d.dealId || ''} onChange={(e) => e.target.value && prefillFromDeal(e.target.value)} className={inp}>
                <option value="">— seleziona commessa —</option>{deals.map((dl) => <option key={dl.id} value={dl.id}>{dl.title}{dl.clientName ? ` · ${dl.clientName}` : ''}</option>)}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Impresa</span>
              <input disabled={locked} list="ctr-partners" value={d.partnerName} onChange={(e) => { const p = partners.find((x) => x.name === e.target.value); set({ partnerName: e.target.value, partnerRecordId: p?.id || d.partnerRecordId }); }} className={inp} />
              <datalist id="ctr-partners">{partners.map((p) => <option key={p.id} value={p.name} />)}</datalist>
            </label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Importo €</span><input disabled={locked} type="number" value={d.importo ?? ''} onChange={(e) => set({ importo: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
          </div>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Lavorazioni affidate</span><textarea disabled={locked} value={d.lavorazioni || ''} onChange={(e) => set({ lavorazioni: e.target.value || null })} rows={3} className={`${inp} resize-none`} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Inizio</span><input disabled={locked} type="date" value={d.startDate || ''} onChange={(e) => set({ startDate: e.target.value || null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Fine prevista</span><input disabled={locked} type="date" value={d.endDate || ''} onChange={(e) => set({ endDate: e.target.value || null })} className={inp} /></label>
          </div>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Modalità di pagamento</span><input disabled={locked} value={d.modalitaPagamento || ''} onChange={(e) => set({ modalitaPagamento: e.target.value || null })} placeholder="A SAL, saldo a fine lavori…" className={inp} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Penali</span><input disabled={locked} value={d.penali || ''} onChange={(e) => set({ penali: e.target.value || null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Responsabilità</span><input disabled={locked} value={d.responsabilita || ''} onChange={(e) => set({ responsabilita: e.target.value || null })} className={inp} /></label>
          </div>

          {/* Testo contratto */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Testo del contratto</span>
            {canEdit && !signed && <button onClick={genBody} className="text-[11.5px] font-bold text-[#4338ca] hover:underline cursor-pointer bg-transparent border-none">Rigenera dai dati</button>}
          </div>
          <textarea disabled={locked} value={d.body || ''} onChange={(e) => set({ body: e.target.value })} rows={7} placeholder="Clicca 'Rigenera dai dati' per compilare automaticamente." className={`${inp} resize-none font-mono text-[11.5px] leading-relaxed`} />

          {/* Firma OTP (§7) */}
          {!signed ? (
            <div className="rounded-[16px] border border-[#e2e2e2] bg-[#fafafa] p-3 flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Firma con OTP</span>
              {canEdit && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={genOtp} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Send className="w-3.5 h-3.5" /> {d.otp ? 'Rigenera OTP' : 'Genera OTP'}</button>
                  {d.otp && <span className="text-[13px] font-black tracking-[0.2em] text-[#161616] bg-white border border-[#e2e2e2] rounded-lg px-3 py-1.5">{d.otp}</span>}
                  {d.otp && <span className="text-[11px] text-[#9a9a9a]">Comunica il codice al firmatario.</span>}
                </div>
              )}
              {d.otp && (
                <div className="flex items-center gap-2">
                  <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Inserisci OTP a 6 cifre" maxLength={6} className="w-40 px-3 py-2 rounded-lg border border-[#e2e2e2] text-[14px] tracking-widest text-center outline-none focus:border-[#161616] bg-white" />
                  <button onClick={verifyOtp} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold cursor-pointer border-none"><CheckCircle2 className="w-4 h-4" /> Firma</button>
                </div>
              )}
              {otpErr && <p className="text-[12px] text-rose-600 font-semibold">{otpErr}</p>}
              <p className="text-[10.5px] text-[#b8b8b8]">OTP a livello applicativo (senza invio SMS reale). Integrazione provider di firma = evoluzione futura.</p>
            </div>
          ) : (
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div><p className="text-[13px] font-bold text-emerald-800">Contratto firmato con OTP</p><p className="text-[11.5px] text-emerald-700">{d.signedByName || 'Impresa'} · {fmtDate(d.signedAt ? new Date(d.signedAt).toISOString() : null)}</p></div>
            </div>
          )}

          {canEdit && !signed && <button onClick={save} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva contratto</button>}
        </div>
      </div>
    </div>
  );
};

export default MatericoContractsView;
