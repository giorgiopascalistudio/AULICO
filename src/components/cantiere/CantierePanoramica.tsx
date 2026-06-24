/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CantierePanoramica — vista d'insieme del cantiere selezionato (landing della
 * sezione). KPI cliccabili che portano alla sezione di dettaglio: avanzamento,
 * consegna, giornale, manodopera, documenti in scadenza, non conformità,
 * attività aperte, SAL. Stessi dati delle altre tab, sola lettura.
 */
import React from 'react';
import {
  TrendingUp, CalendarDays, BookOpen, Clock, FileWarning, BadgeAlert,
  ClipboardList, CheckCircle2
} from 'lucide-react';
import {
  Cantiere, Rapportino, Presenza, CantiereDoc, CantiereRecord, CantiereSal, ChecklistItem
} from '../../types';
import { eur, todayISO, relDay, parseISO, isoDate, addDays } from '../../utils';

export interface CantierePanoramicaProps {
  cantiere: Cantiere;
  isStudio: boolean;
  rapportini: Rapportino[];
  presenze: Presenza[];
  documenti: CantiereDoc[];
  records: CantiereRecord[];
  sal: CantiereSal[];
  checklist: ChecklistItem[];
  onGo: (sectionId: string) => void;
}

const Kpi: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
  onClick: () => void;
}> = ({ icon: Icon, label, value, sub, tone = 'default', onClick }) => {
  const subColor = tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : tone === 'bad' ? 'text-rose-700' : 'text-[#9a9a9a]';
  return (
    <button onClick={onClick} className="text-left p-3.5 rounded-2xl border border-[#eee] bg-[#fafafa] hover:bg-white hover:border-[#d8d8d8] transition-colors">
      <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a]">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-[20px] font-extrabold text-[#161616] mt-1 leading-tight">{value}</div>
      {sub && <div className={`text-[11px] font-medium mt-0.5 ${subColor}`}>{sub}</div>}
    </button>
  );
};

export const CantierePanoramica: React.FC<CantierePanoramicaProps> = (p) => {
  const { cantiere: c } = p;
  const today = todayISO();

  // avanzamento + consegna
  const progress = c.progressPct || 0;
  let daysLeft: number | null = null;
  if (c.dueDate) {
    daysLeft = Math.round((parseISO(c.dueDate).getTime() - parseISO(today).getTime()) / 86400000);
  }

  // giornale
  const lastEntry = p.rapportini.reduce<string | null>((max, r) => (!max || r.date > max ? r.date : max), null);
  const pending = p.rapportini.filter((r) => r.status === 'inviato').length;

  // manodopera (ore da Presenze; fallback ore dei rapportini)
  const orePresenze = p.presenze.reduce((s, x) => s + (x.ore || 0), 0);
  const oreGiornale = p.rapportini.reduce((s, r) => s + (r.ore || 0), 0);
  const oreTot = orePresenze > 0 ? orePresenze : oreGiornale;

  // documenti in scadenza entro 30gg (o scaduti)
  const limit = isoDate(addDays(new Date(), 30));
  const docsExp = p.documenti.filter((d) => d.expiry && d.expiry <= limit);
  const docsScaduti = docsExp.filter((d) => d.expiry! < today).length;

  // registri
  const ncAperte = p.records.filter((r) => r.section === 'nonconformita' && r.status !== 'Chiusa').length;
  const attivita = p.records.filter((r) => r.section === 'scadenze' && r.status !== 'Completata');
  const attScadute = attivita.filter((r) => r.date && r.date < today).length;

  // SAL + checklist
  const salApprovati = p.sal.filter((s) => s.status === 'approvato');
  const salImporto = salApprovati.reduce((s, x) => s + (x.importo || 0), 0);
  const chkDone = p.checklist.filter((x) => x.done).length;

  return (
    <div className="flex flex-col gap-3">
      {/* barra avanzamento in evidenza */}
      <button onClick={() => p.onGo('sal')} className="text-left p-3.5 rounded-2xl border border-[#eee] bg-[#fafafa] hover:bg-white hover:border-[#d8d8d8] transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a]"><TrendingUp className="w-3.5 h-3.5" /> Avanzamento lavori</span>
          <span className="text-[15px] font-extrabold text-[#161616]">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#eaeaea] overflow-hidden">
          <div className="h-full bg-[#161616]" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        {salApprovati.length > 0 && (
          <div className="text-[11px] font-medium text-[#9a9a9a] mt-1.5">{salApprovati.length} SAL approvati · {eur(salImporto)}</div>
        )}
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Kpi
          icon={CalendarDays}
          label="Consegna"
          value={c.dueDate ? relDay(c.dueDate) : '—'}
          sub={daysLeft == null ? 'nessuna data impostata' : daysLeft < 0 ? `${-daysLeft}gg di ritardo` : `${daysLeft}gg rimanenti`}
          tone={daysLeft == null ? 'default' : daysLeft < 0 ? 'bad' : daysLeft <= 14 ? 'warn' : 'ok'}
          onClick={() => p.onGo('dati')}
        />
        <Kpi
          icon={BookOpen}
          label="Giornale"
          value={lastEntry ? relDay(lastEntry) : 'Mai compilato'}
          sub={pending > 0 ? `${pending} ${pending === 1 ? 'voce da approvare' : 'voci da approvare'}` : `${p.rapportini.length} voci totali`}
          tone={pending > 0 ? 'warn' : 'default'}
          onClick={() => p.onGo('diario')}
        />
        <Kpi
          icon={Clock}
          label="Manodopera"
          value={oreTot > 0 ? `${oreTot}h` : '—'}
          sub={orePresenze > 0 ? `${p.presenze.length} presenze registrate` : 'da ore dei rapportini'}
          onClick={() => p.onGo('presenze')}
        />
        <Kpi
          icon={FileWarning}
          label="Doc. in scadenza"
          value={String(docsExp.length)}
          sub={docsScaduti > 0 ? `${docsScaduti} già scaduti` : 'entro 30 giorni'}
          tone={docsScaduti > 0 ? 'bad' : docsExp.length > 0 ? 'warn' : 'ok'}
          onClick={() => p.onGo('doctecnica')}
        />
        <Kpi
          icon={BadgeAlert}
          label="Non conformità"
          value={String(ncAperte)}
          sub={ncAperte > 0 ? 'aperte / in corso' : 'nessuna aperta'}
          tone={ncAperte > 0 ? 'bad' : 'ok'}
          onClick={() => p.onGo('nonconformita')}
        />
        <Kpi
          icon={ClipboardList}
          label="Attività aperte"
          value={String(attivita.length)}
          sub={attScadute > 0 ? `${attScadute} oltre scadenza` : 'in programma'}
          tone={attScadute > 0 ? 'bad' : attivita.length > 0 ? 'warn' : 'ok'}
          onClick={() => p.onGo('attivita')}
        />
        <Kpi
          icon={CheckCircle2}
          label="Controllo qualità"
          value={p.checklist.length ? `${chkDone}/${p.checklist.length}` : '—'}
          sub={p.checklist.length ? 'voci verificate' : 'nessuna checklist'}
          tone={p.checklist.length > 0 && chkDone === p.checklist.length ? 'ok' : 'default'}
          onClick={() => p.onGo('qualita')}
        />
        <Kpi
          icon={TrendingUp}
          label="SAL"
          value={p.sal.length ? `${salApprovati.length}/${p.sal.length}` : '—'}
          sub={salImporto > 0 ? `${eur(salImporto)} approvati` : 'nessun SAL emesso'}
          onClick={() => p.onGo('sal')}
        />
      </div>
    </div>
  );
};
