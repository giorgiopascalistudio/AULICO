/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ContractPrintDoc — generatore CONTRATTI da modello (Centro Commerciale).
 * Modelli dai DOCX di docs/SEZIONI/<società>/COMMERCIALE: campi auto-compilati
 * (committente dalla rubrica, importi/percentuali) + OGNI sezione di testo
 * modificabile prima della stampa (pulsante "Modifica testo"). Stampa/PDF
 * con carta intestata della società (companyInfo).
 */
import React from 'react';
import { X, Printer, PencilLine, Eye } from 'lucide-react';
import type { ClientRecord } from '../types';
import { companyDoc } from '../companyInfo';
import { SOCIETY_COLOR } from '../societyConfig';

export type ContractTemplateId = 'arredi-fissi' | 'ffe' | 'accordo-imprese' | 'manifestazione';

export const CONTRACT_TEMPLATES: { id: ContractTemplateId; soc: string; label: string; desc: string }[] = [
  { id: 'arredi-fissi', soc: 'studio', label: 'Contratto Arredi Fissi', desc: 'Accordo integrativo: selezione e coordinamento di sanitari, rubinetteria, cucina, infissi, porte, luci, opere su misura… (compreso nel 15%).' },
  { id: 'ffe', soc: 'studio', label: 'Contratto FF&E', desc: 'Servizio arredi mobili (Fixture, Furniture & Equipment): compenso 20% sulle forniture approvate, rate e procurement.' },
  { id: 'accordo-imprese', soc: 'materico', label: 'Accordo con imprese', desc: 'Collaborazione e commissione % sui contratti stipulati tra l\'impresa e il cliente.' },
  { id: 'manifestazione', soc: 'unico', label: 'Manifestazione d\'interesse all\'acquisto', desc: 'Proposta non vincolante di acquisto immobile: prezzo offerto, condizioni, validità.' },
];

interface Fields { [k: string]: string }
interface TemplateDef {
  title: string;
  fields: { key: string; label: string; placeholder?: string; wide?: boolean }[];
  build: (f: Fields, co: ReturnType<typeof companyDoc>) => { intro: string; sections: { t: string; b: string }[] };
}

const P = (v: string, fallback = '____________________') => (v && v.trim() ? v.trim() : fallback);

const DEFS: Record<ContractTemplateId, TemplateDef> = {
  'arredi-fissi': {
    title: 'CONTRATTO PROFESSIONALE INTEGRATIVO — ARREDI FISSI',
    fields: [
      { key: 'committente', label: 'Committente' }, { key: 'residenza', label: 'Residenza', wide: true },
      { key: 'cf', label: 'Codice fiscale' }, { key: 'dataContratto', label: 'Data contratto principale' },
      { key: 'oggetto', label: 'Oggetto contratto principale', wide: true }, { key: 'immobile', label: 'Immobile sito in', wide: true },
    ],
    build: (f, co) => ({
      intro: `Tra ${P(f.committente)}, residente in ${P(f.residenza)}, codice fiscale ${P(f.cf)}, di seguito "COMMITTENTE", e ${co.legalName}, con sede in ${co.address || '____'}, P.IVA ${co.piva || '____'}, rappresentata dal legale rappresentante, di seguito "ONIRICO DESIGN".`,
      sections: [
        { t: 'Premesso che', b: `In data ${P(f.dataContratto, '__/__/____')} le Parti hanno sottoscritto un contratto avente ad oggetto ${P(f.oggetto)} relativo all'immobile sito in ${P(f.immobile)}; la corretta definizione di alcune forniture, componenti impiantistiche e arredi fissi risulta indispensabile per lo sviluppo del progetto esecutivo e la corretta realizzazione delle opere; le Parti intendono disciplinare responsabilità, modalità operative e tempistiche relative a tali scelte.` },
        { t: 'Oggetto dell\'accordo', b: 'Il presente accordo integra il contratto principale e disciplina le attività di selezione, definizione e coordinamento tecnico degli elementi che influenzano la progettazione architettonica, impiantistica e costruttiva dell\'intervento.' },
        { t: 'Elementi soggetti a definizione', b: '1. Sanitari · 2. Rubinetteria · 3. Cucina (layout, isola, colonne, pensili, elettrodomestici, predisposizioni) · 4. Infissi · 5. Porte interne · 6. Corpi illuminanti · 7. Box doccia · 8. Termoarredi e scaldasalviette · 9. Ventilconvettori · 10. Opere in ferro · 11. Opere in legno (arredi su misura, boiserie, rivestimenti) · 12. Impianti elettrici, domotica e allarme · 13. Bocchette VMC · 14. Maniglie porte e finestre · 15. Zanzariere · 16. Oscuramenti (tende tecniche, frangisole, persiane, avvolgibili). Per ciascun elemento: modello, finitura, tipologia, predisposizioni e schede tecniche.' },
        { t: 'Attività di Onirico Design', b: 'Onirico Design provvederà a: individuare e proporre soluzioni coerenti con il concept; supportare il Committente nella valutazione delle alternative; coordinare le scelte con il progetto architettonico e impiantistico; verificare la compatibilità tecnica; fornire le indicazioni a imprese e fornitori; richiedere e analizzare la documentazione tecnica. Le scelte definitive saranno sottoposte all\'approvazione del Committente.' },
        { t: 'Obblighi del Committente', b: 'Il Committente si impegna ad approvare le scelte nei termini indicati, fornire tempestivamente le informazioni necessarie e comunicare eventuali modifiche in tempi compatibili con l\'avanzamento delle opere. Per forniture selezionate autonomamente dovrà trasmettere preventivamente schede tecniche, disegni dimensionali, specifiche di installazione e predisposizioni richieste; Onirico Design verificherà la compatibilità tecnica prima dell\'approvazione definitiva.' },
        { t: 'Compenso', b: 'Le attività di consulenza, selezione, coordinamento tecnico e verifica sono comprese nell\'incarico professionale e integralmente remunerate dal compenso del contratto principale, pari al 15% del costo complessivo delle opere realizzate. Nessun compenso aggiuntivo è dovuto. Restano esclusi (oggetto di separato incarico): modifiche sostanziali richieste dopo l\'approvazione delle scelte; revisioni conseguenti a sostituzione di prodotti approvati; attività straordinarie; rifacimenti resi necessari da modifiche tardive.' },
      ],
    }),
  },
  'ffe': {
    title: 'CONTRATTO DI PRESTAZIONE PROFESSIONALE — SERVIZIO FF&E',
    fields: [
      { key: 'committente', label: 'Committente' }, { key: 'residenza', label: 'Residenza', wide: true },
      { key: 'cf', label: 'Codice fiscale' }, { key: 'immobile', label: 'Immobile sito in', wide: true },
      { key: 'pct', label: 'Compenso % forniture', placeholder: '20' }, { key: 'acconto', label: 'Acconto all\'accettazione €', placeholder: '5.000,00' },
    ],
    build: (f, co) => ({
      intro: `Tra ${P(f.committente)}, residente in ${P(f.residenza)}, codice fiscale ${P(f.cf)}, di seguito "COMMITTENTE", e ${co.legalName}, con sede in ${co.address || '____'}, P.IVA ${co.piva || '____'}, di seguito "ONIRICO DESIGN". Premesso che il Committente, proprietario dell'immobile sito in ${P(f.immobile)}, intende procedere all'intervento e che Onirico Design è disponibile ad assumere l'incarico, si conviene quanto segue.`,
      sections: [
        { t: 'Oggetto del contratto', b: 'Onirico Design svolgerà il servizio FF&E (Fixture, Equipment, Furniture, Fabrics & Soft Goods) in forma autonoma rispetto alla progettazione architettonica: ricerca, selezione, proposta e coordinamento di divani, poltrone, tavoli, sedie, letti, comodini, armadi, tavolini, specchi, tende, corpi illuminanti decorativi, lampade, complementi e accessori; definizione delle specifiche tecniche, coordinamento fornitori, supporto al procurement, supervisione di consegne e installazioni.' },
        { t: 'Compensi e modalità di pagamento', b: `Il compenso è pari al ${P(f.pct, '20')}% del valore definitivo delle forniture FF&E approvate dal Committente, al netto di IVA 22% e Cassa 4%, calcolato sul valore post sconti dei fornitori. Corresponsione: all'accettazione € ${P(f.acconto, '5.000,00')} (oltre Cassa e IVA); all'approvazione delle forniture il 50% del valore; alla conferma dell'ordine il 30%; al completamento di consegne e installazioni l'importo residuo. Varianti e integrazioni sono compensate con la medesima percentuale. In caso di mancato pagamento Onirico Design potrà sospendere le attività.` },
        { t: 'Approvazione forniture e procurement', b: 'Le forniture si intendono approvate solo con conferma scritta del Committente; all\'approvazione il valore si cristallizza ai fini del compenso. I rapporti economici coi fornitori restano in capo al Committente: Onirico Design non assume obblighi di pagamento, anticipazioni o intermediazione finanziaria.' },
        { t: 'Tolleranze, sostituzioni e varianti', b: 'In caso di indisponibilità o criticità produttive Onirico Design proporrà alternative equivalenti o migliorative, soggette ad approvazione scritta. Sostituzioni tecniche equivalenti ammesse entro ±10% per elemento o categoria omogenea, purché non alterino il concept approvato. Ogni modifica alle forniture approvate costituisce variante, quantificata con la medesima percentuale contrattuale.' },
        { t: 'Esclusioni', b: 'Salvo diverso accordo scritto, l\'incarico non comprende: progettazione architettonica e impiantistica, direzione lavori, acquisto diretto delle forniture, gestione amministrativa o finanziaria degli ordini, logistica, trasporto, consegna e installazione esecutiva.' },
      ],
    }),
  },
  'accordo-imprese': {
    title: 'CONTRATTO DI COLLABORAZIONE E COMMISSIONE',
    fields: [
      { key: 'impresa', label: 'Impresa (ragione sociale)' }, { key: 'sedeImpresa', label: 'Sede impresa', wide: true },
      { key: 'pivaImpresa', label: 'P.IVA impresa' }, { key: 'rappr', label: 'Legale rappresentante impresa' },
      { key: 'cliente', label: 'Cliente finale' }, { key: 'dataContratto', label: 'Data contratto impresa-cliente' },
      { key: 'pct', label: 'Commissione %', placeholder: '5' }, { key: 'giorni', label: 'Versamento entro giorni', placeholder: '15' },
    ],
    build: (f, co) => ({
      intro: `Tra ${co.legalName}, con sede in ${co.address || '____'}, P.IVA ${co.piva || '____'}, di seguito "COMMITTENTE", e ${P(f.impresa, '[Impresa]')}, con sede legale in ${P(f.sedeImpresa)}, P.IVA ${P(f.pivaImpresa)}, rappresentata da ${P(f.rappr)}, di seguito "IMPRESA". Premesso che il Committente collabora con l'Impresa per le attività relative al contratto firmato il ${P(f.dataContratto, '__/__/____')} tra il cliente ${P(f.cliente)} e l'Impresa, le parti formalizzano una remunerazione a percentuale sui contratti stipulati.`,
      sections: [
        { t: 'Art. 1 — Oggetto', b: `L'Impresa verserà al Committente una commissione pari al ${P(f.pct, '5')}% del valore di ogni contratto stipulato con il cliente.` },
        { t: 'Art. 2 — Calcolo e versamento', b: `La commissione è calcolata sul valore complessivo del contratto, al netto di sconti o riduzioni applicati al cliente finale, e versata entro ${P(f.giorni, '15')} giorni dalla ricezione del pagamento del cliente in regolazione del SAL.` },
        { t: 'Art. 3 — Obblighi dell\'Impresa', b: 'Fornire copia del contratto stipulato con il cliente (costi e servizi inclusi); versare tempestivamente la commissione nei termini; informare il Committente di ogni modifica significativa al contratto col cliente.' },
        { t: 'Art. 4 — Obblighi del Committente', b: 'Fornire supporto commerciale all\'Impresa, facilitandone la presentazione ai potenziali clienti e contribuendo alla negoziazione; comunicare tempestivamente ogni informazione utile alla gestione del progetto e al rispetto delle scadenze.' },
        { t: 'Art. 5-7 — Durata, risoluzione, disposizioni finali', b: 'Il contratto ha la medesima durata del contratto Impresa-Cliente, rinnovabile previo accordo. In caso di inadempimento la parte adempiente può risolvere con effetto immediato, previa comunicazione scritta. Non cedibile a terzi senza consenso scritto; modifiche solo per iscritto; foro competente Brindisi.' },
      ],
    }),
  },
  'manifestazione': {
    title: 'MANIFESTAZIONE D\'INTERESSE ALL\'ACQUISTO',
    fields: [
      { key: 'proponente', label: 'Proponente' }, { key: 'residenza', label: 'Residenza/sede', wide: true },
      { key: 'cf', label: 'CF / P.IVA' }, { key: 'immobile', label: 'Immobile (indirizzo e dati catastali)', wide: true },
      { key: 'prezzo', label: 'Prezzo offerto €' }, { key: 'validita', label: 'Validità (giorni)', placeholder: '15' },
      { key: 'condizioni', label: 'Condizioni sospensive', placeholder: 'es. esito due diligence, ottenimento finanziamento', wide: true },
    ],
    build: (f, co) => ({
      intro: `Il sottoscritto ${P(f.proponente)}, ${P(f.residenza)}, CF/P.IVA ${P(f.cf)}, di seguito "PROPONENTE", manifesta a ${co.legalName}${co.piva ? ` (P.IVA ${co.piva})` : ''} il proprio interesse NON VINCOLANTE all'acquisto dell'immobile ${P(f.immobile)}.`,
      sections: [
        { t: 'Prezzo offerto', b: `Il Proponente manifesta interesse all'acquisto al prezzo di € ${P(f.prezzo, '____________')}, oltre imposte e oneri di legge.` },
        { t: 'Natura non vincolante', b: 'La presente manifestazione non costituisce proposta irrevocabile né contratto preliminare: impegna le parti esclusivamente a proseguire la trattativa in buona fede. Ogni vincolo sorgerà solo con la sottoscrizione del contratto preliminare.' },
        { t: 'Condizioni', b: `L'eventuale acquisto resta subordinato a: ${P(f.condizioni, 'esito positivo della due diligence tecnico-legale; verifica urbanistica e catastale; assenza di ipoteche, vincoli o pesi non dichiarati')}.` },
        { t: 'Validità', b: `La presente manifestazione è valida ${P(f.validita, '15')} giorni dalla data di sottoscrizione; decorso il termine senza riscontro, si intenderà priva di effetti.` },
        { t: 'Riservatezza', b: 'Le parti manterranno riservate le informazioni scambiate nel corso della trattativa, utilizzandole esclusivamente per la valutazione dell\'operazione.' },
      ],
    }),
  },
};

interface Props {
  template: ContractTemplateId;
  soc: string;                          // società intestataria (carta intestata)
  rubrica?: ClientRecord[];             // per auto-compilare il committente
  onClose: () => void;
}

export const ContractPrintDoc: React.FC<Props> = ({ template, soc, rubrica = [], onClose }) => {
  const def = DEFS[template];
  const co = companyDoc(soc);
  const color = (SOCIETY_COLOR as any)[soc] || '#161616';
  const [fields, setFields] = React.useState<Fields>({});
  const [editing, setEditing] = React.useState(false);
  const built = def.build(fields, co);
  const [sections, setSections] = React.useState(built.sections);
  const [touched, setTouched] = React.useState<Record<number, boolean>>({});
  // Rigenera le sezioni non modificate a mano quando cambiano i campi
  React.useEffect(() => {
    const nb = def.build(fields, co);
    setSections((prev) => nb.sections.map((s, i) => (touched[i] ? prev[i] : s)));
  }, [JSON.stringify(fields)]); // eslint-disable-line

  const pickClient = (id: string) => {
    const c = rubrica.find((x) => x.id === id);
    if (!c) return;
    setFields((f) => ({
      ...f,
      committente: c.name, proponente: c.name, impresa: f.impresa ?? '',
      residenza: c.address || f.residenza || '',
      cf: c.partitaIva || c.codiceFiscale || f.cf || '',
    }));
  };

  return (
    <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-3xl my-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Comandi + campi (non stampati) */}
        <div className="no-print px-5 py-4 border-b border-[#eee]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13.5px] font-extrabold text-[#161616]">{def.title} · modello {co.brand}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold cursor-pointer ${editing ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#161616] border-[#e2e2e2] hover:border-[#161616]'}`}>{editing ? <><Eye className="w-3.5 h-3.5" /> Anteprima</> : <><PencilLine className="w-3.5 h-3.5" /> Modifica testo</>}</button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Printer className="w-4 h-4" /> Stampa / PDF</button>
              <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {rubrica.length > 0 && (
              <label className="flex flex-col gap-1 col-span-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Compila dalla rubrica</span>
                <select defaultValue="" onChange={(e) => pickClient(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none bg-white cursor-pointer">
                  <option value="">— scegli un contatto —</option>
                  {rubrica.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            {def.fields.map((fd) => (
              <label key={fd.key} className={`flex flex-col gap-1 ${fd.wide ? 'col-span-2' : ''}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">{fd.label}</span>
                <input value={fields[fd.key] || ''} placeholder={fd.placeholder} onChange={(e) => setFields((f) => ({ ...f, [fd.key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
              </label>
            ))}
          </div>
        </div>

        {/* DOCUMENTO */}
        <div className="print-area px-8 py-7 text-[#161616]" style={{ fontSize: 12, lineHeight: 1.55 }}>
          <div className="flex items-start justify-between gap-4 pb-3 mb-4" style={{ borderBottom: `3px solid ${color}` }}>
            <div>
              <p className="text-[24px] font-black tracking-tight leading-none" style={{ color }}>{co.brand}</p>
              <p className="text-[10px] text-[#8a8a8a] font-semibold mt-1">{co.legalName}{co.piva ? ` · P.IVA ${co.piva}` : ''}{co.address ? ` · ${co.address}` : ''}</p>
            </div>
            <p className="text-[11px] text-[#555] shrink-0">Data: <span className="inline-block border-b border-[#9a9a9a] min-w-[90px]">&nbsp;</span></p>
          </div>
          <h3 className="text-[14.5px] font-black tracking-wide text-center mb-4">{def.title}</h3>
          {editing ? (
            <textarea value={built.intro} readOnly rows={3} className="w-full px-3 py-2 rounded-lg border border-[#ececec] bg-[#fafafa] text-[11.5px] mb-3 resize-none text-[#555]" />
          ) : (
            <p className="text-[12px] mb-4">{built.intro}</p>
          )}
          {sections.map((s, i) => (
            <div key={i} className="mb-3">
              <p className="text-[12px] font-extrabold tracking-wide mb-1">{s.t}</p>
              {editing ? (
                <textarea
                  value={s.b}
                  rows={Math.max(3, Math.ceil(s.b.length / 110))}
                  onChange={(e) => { setSections((prev) => prev.map((x, j) => (j === i ? { ...x, b: e.target.value } : x))); setTouched((t) => ({ ...t, [i]: true })); }}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[11.5px] outline-none focus:border-[#161616] bg-white resize-y"
                />
              ) : (
                <p className="text-[11.5px] text-[#333]">{s.b}</p>
              )}
            </div>
          ))}
          <p className="text-[11.5px] mt-5 mb-1">Letto, confermato e sottoscritto.</p>
          <div className="grid grid-cols-2 gap-8 mt-8 mb-3 text-[11px] text-[#555]">
            <div><div className="border-b border-[#9a9a9a] h-8" /><p className="mt-1">FIRMA {co.legalName.toUpperCase()}</p></div>
            <div><div className="border-b border-[#9a9a9a] h-8" /><p className="mt-1">{template === 'accordo-imprese' ? 'FIRMA IMPRESA' : template === 'manifestazione' ? 'FIRMA PROPONENTE' : 'FIRMA COMMITTENTE'}</p></div>
          </div>
          {(co.contacts || co.pec) && (
            <p className="text-[9.5px] text-[#9a9a9a] pt-2 mt-4" style={{ borderTop: `2px solid ${color}` }}>
              {co.legalName}{co.address ? ` · ${co.address}` : ''}{co.contacts ? ` · ${co.contacts}` : ''}{co.pec ? ` · PEC ${co.pec}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractPrintDoc;
