/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ImpresaArea — "La mia impresa": profilo dell'impresa partner riutilizzabile su tutti i
 * cantieri (documentazione DURC/SOA/polizze, squadre, operai, mezzi, sicurezza).
 * Dati keyed per uid (nodi impresaDocs/impresaRecords); usato nel portale partner e
 * leggibile dallo studio dentro al cantiere.
 */
import React, { useState } from 'react';
import { FileText, Users, HardHat, Truck, ShieldCheck } from 'lucide-react';
import { ImpresaDoc, ImpresaRecord } from '../../types';
import { DocRegistry, DocItem } from './DocRegistry';
import { RecordRegistry, GenericRecord, RecordColumn } from './RecordRegistry';

const newId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 900)}`;

type SecRender =
  | { t: 'doc'; categories: string[] }
  | { t: 'rec'; section: string; columns: RecordColumn[]; statuses?: string[] };

interface Sec { id: string; label: string; icon: React.ElementType; render: SecRender; }

const SECS: Sec[] = [
  { id: 'documentazione', label: 'Documentazione impresa', icon: FileText, render: { t: 'doc', categories: ['DURC', 'Visura', 'Polizza assicurativa', 'Certificazione SOA', 'Documento dipendente'] } },
  { id: 'squadre', label: 'Squadre', icon: Users, render: { t: 'rec', section: 'squadre', columns: [{ key: 'title', label: 'Nome squadra' }, { key: 'caposquadra', label: 'Caposquadra' }, { key: 'componenti', label: 'N. componenti', type: 'number' }] } },
  { id: 'operai', label: 'Operai', icon: HardHat, render: { t: 'rec', section: 'operai', columns: [{ key: 'title', label: 'Nominativo' }, { key: 'mansione', label: 'Mansione' }, { key: 'contatto', label: 'Contatto' }] } },
  { id: 'mezzi', label: 'Mezzi & attrezzature', icon: Truck, render: { t: 'rec', section: 'mezzi', statuses: ['Operativo', 'In manutenzione', 'Guasto'], columns: [{ key: 'title', label: 'Mezzo / attrezzatura' }, { key: 'targa', label: 'Targa / codice' }, { key: 'status', label: 'Stato' }] } },
  { id: 'sicurezza_impresa', label: 'Sicurezza impresa', icon: ShieldCheck, render: { t: 'rec', section: 'sicurezza_impresa', statuses: ['Valido', 'In scadenza', 'Scaduto'], columns: [{ key: 'title', label: 'Voce (DPI/formazione/visita/patentino)' }, { key: 'lavoratore', label: 'Lavoratore' }, { key: 'date', label: 'Scadenza', type: 'date' }, { key: 'status', label: 'Stato' }] } }
];

interface ImpresaAreaProps {
  uid: string;
  canWrite: boolean;
  docs: ImpresaDoc[];
  records: ImpresaRecord[];
  folderName: string;
  onSaveEntity: (coll: string, item: any) => void;
  onDeleteEntity: (coll: string, id: string) => void;
}

export const ImpresaArea: React.FC<ImpresaAreaProps> = ({ uid, canWrite, docs, records, folderName, onSaveEntity, onDeleteEntity }) => {
  const [section, setSection] = useState<string>('documentazione');
  const def = SECS.find((s) => s.id === section) || SECS[0];

  const render = () => {
    const r = def.render;
    if (r.t === 'doc') {
      const items: DocItem[] = docs.map((d) => ({ id: d.id, name: d.name, driveUrl: d.driveUrl, link: d.link, category: d.docType, expiry: d.expiry, by: d.by, at: d.at }));
      return (
        <DocRegistry
          items={items}
          folderName={folderName}
          canWrite={canWrite}
          categories={r.categories}
          withExpiry
          emptyText="Nessun documento dell'impresa (carica DURC, polizze, SOA con la relativa scadenza)."
          onAdd={(data) => onSaveEntity('impresaDocs', { id: newId('idoc'), docType: data.category || 'Documento', name: data.name, expiry: data.expiry || null, driveFileId: data.driveFileId || null, driveUrl: data.driveUrl || null, link: data.link || null, by: uid, at: Date.now() })}
          onDelete={(id) => onDeleteEntity('impresaDocs', id)}
        />
      );
    }
    const recItems: GenericRecord[] = records.filter((x) => x.section === r.section);
    return (
      <RecordRegistry
        items={recItems}
        columns={r.columns}
        statuses={r.statuses}
        canWrite={canWrite}
        onAdd={(data) => onSaveEntity('impresaRecords', { id: newId('irec'), section: r.section, title: data.title, date: data.date || null, status: data.status || null, fields: data.fields, by: uid, at: Date.now() })}
        onDelete={(id) => onDeleteEntity('impresaRecords', id)}
      />
    );
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
      <div className="mb-3">
        <h3 className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#161616]"><HardHat className="w-5 h-5" /> La mia impresa</h3>
        <p className="text-[12px] text-[#9a9a9a] mt-0.5">Anagrafiche, documenti e sicurezza dell'impresa — riutilizzati automaticamente in tutti i cantieri assegnati.</p>
      </div>
      <div className="flex gap-1 overflow-x-auto mb-3">
        {SECS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)} className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${active ? 'bg-[#161616] text-white' : 'bg-[#f3f3f3] text-[#6b6b6b]'}`}>
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>
      {render()}
    </div>
  );
};
