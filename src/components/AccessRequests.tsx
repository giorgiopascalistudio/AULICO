/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pannello admin: approva/rifiuta richieste di accesso e assegna ruoli.
 * Pensato per essere inserito dentro <Modal> in App.tsx.
 */

import React, { useState } from 'react';
import { Check, X, Shield, RotateCcw, Trash2 } from 'lucide-react';
import type { UserProfile, UserRole } from '../types';
import { initials, avColor } from '../utils';

interface AccessRequestsProps {
  pending: UserProfile[];
  members: UserProfile[];
  currentUid: string;
  onApprove: (uid: string, role: UserRole, sector?: string) => void;
  onReject: (uid: string) => void;
  onChangeRole: (uid: string, role: UserRole, sector?: string) => void;
  onRevoke: (uid: string) => void;
  onRemove: (uid: string) => void;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Amministratore' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'staff', label: 'Operatore Staff' },
  { value: 'cliente', label: 'Cliente (Portale)' },
  { value: 'partner', label: 'Partner B2B' }
];

const SECTORS = [
  { value: 'studio', label: 'Studio (Architettura)' },
  { value: 'strategico', label: 'Strategico (Marketing)' },
  { value: 'materico', label: 'Materico (Finiture)' }
];

const Avatar: React.FC<{ u: UserProfile; size?: number }> = ({ u, size = 38 }) => (
  u.photoURL ? (
    <img
      src={u.photoURL}
      alt={u.name}
      referrerPolicy="no-referrer"
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full flex items-center justify-center text-white font-extrabold shrink-0"
      style={{ width: size, height: size, background: avColor(u.name || u.email), fontSize: size * 0.34 }}
    >
      {initials(u.name || u.email)}
    </span>
  )
);

export const AccessRequests: React.FC<AccessRequestsProps> = ({
  pending,
  members,
  currentUid,
  onApprove,
  onReject,
  onChangeRole,
  onRevoke,
  onRemove
}) => {
  // ruolo selezionato per ogni richiesta in attesa
  const [draftRole, setDraftRole] = useState<Record<string, UserRole>>({});
  const [draftSector, setDraftSector] = useState<Record<string, string>>({});

  const roleOf = (uid: string) => draftRole[uid] || 'staff';
  const sectorOf = (uid: string) => draftSector[uid] || 'studio';

  return (
    <div className="flex flex-col gap-6 text-left max-h-[68vh] overflow-y-auto pr-1">
      {/* Richieste in attesa */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[14px] font-extrabold text-[#161616]">
            Richieste in attesa
          </h4>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <p className="text-[13px] italic text-[#8a8a8a]">Nessuna richiesta da approvare.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((u) => (
              <div key={u.uid} className="border border-[#e2e2e2] rounded-2xl p-3.5 bg-white flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar u={u} />
                  <div className="min-w-0 flex-grow">
                    <b className="block text-[13.5px] text-[#161616] truncate">{u.name || 'Senza nome'}</b>
                    <small className="block text-[12px] text-[#8a8a8a] truncate">{u.email}</small>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={roleOf(u.uid)}
                    onChange={(e) => setDraftRole((p) => ({ ...p, [u.uid]: e.target.value as UserRole }))}
                    className="select flex-1 min-w-[150px] text-[12.5px] h-9"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>

                  {roleOf(u.uid) === 'cliente' && (
                    <select
                      value={sectorOf(u.uid)}
                      onChange={(e) => setDraftSector((p) => ({ ...p, [u.uid]: e.target.value }))}
                      className="select flex-1 min-w-[150px] text-[12.5px] h-9"
                    >
                      {SECTORS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(u.uid, roleOf(u.uid), roleOf(u.uid) === 'cliente' ? sectorOf(u.uid) : undefined)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"
                  >
                    <Check className="w-4 h-4" /> Approva
                  </button>
                  <button
                    onClick={() => onReject(u.uid)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[12.5px] font-bold cursor-pointer border border-red-200"
                  >
                    <X className="w-4 h-4" /> Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membri attivi */}
      <div>
        <h4 className="text-[14px] font-extrabold text-[#161616] mb-3">
          Account attivi ({members.length})
        </h4>
        <div className="flex flex-col gap-2.5">
          {members.map((u) => {
            const isMe = u.uid === currentUid;
            return (
              <div key={u.uid} className="border border-[#ececec] rounded-2xl p-3 bg-[#fafafa] flex items-center gap-3">
                <Avatar u={u} size={34} />
                <div className="min-w-0 flex-grow">
                  <b className="block text-[13px] text-[#161616] truncate">
                    {u.name} {isMe && <span className="text-[10px] text-[#8a8a8a] font-bold">(tu)</span>}
                  </b>
                  <small className="block text-[11.5px] text-[#8a8a8a] truncate">{u.email}</small>
                </div>

                <select
                  value={u.role}
                  disabled={isMe}
                  onChange={(e) => onChangeRole(u.uid, e.target.value as UserRole, u.sector)}
                  className="select text-[11.5px] h-8 w-[130px] disabled:opacity-50"
                  title={isMe ? 'Non puoi cambiare il tuo ruolo' : 'Cambia ruolo'}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {!isMe && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onRevoke(u.uid)}
                      title="Rimetti in attesa"
                      className="w-8 h-8 rounded-lg border border-[#e2e2e2] bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(u.uid)}
                      title="Elimina account"
                      className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {isMe && <Shield className="w-4 h-4 text-[#8a8a8a] shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
