/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ClientProfileModal — profilo del cliente nel portale.
 * Permette di cambiare foto profilo, password (solo account email), residenza,
 * gestire i consensi (newsletter) e richiedere l'eliminazione account (gestita
 * dallo studio). Scrive direttamente su users/<uid> (regole: write del proprio uid).
 */
import React, { useState } from 'react';
import { X, Camera, Lock, MapPin, Mail, Trash2, Check, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { auth, updateNode, writeNode, changePassword } from '../firebase';
import { NewsletterButton } from './NewsletterButton';

export const ClientProfileModal: React.FC<{
  profile: UserProfile;
  onClose: () => void;
  onLogout: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}> = ({ profile, onClose, onLogout, onToast }) => {
  const [photo, setPhoto] = useState(profile.photoURL || '');
  const [residenza, setResidenza] = useState(profile.residenza || '');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [delArmed, setDelArmed] = useState(false);
  const [busyDel, setBusyDel] = useState(false);

  const hasPassword = !!auth.currentUser?.providerData?.some((p) => p.providerId === 'password');

  const onPhoto = (file: File) => {
    const r = new FileReader();
    r.onloadend = async () => {
      const url = r.result as string;
      setPhoto(url);
      try { await updateNode(`users/${profile.uid}`, { photoURL: url }); onToast('Foto profilo aggiornata.'); }
      catch { onToast('Errore aggiornamento foto.', 'err'); }
    };
    r.readAsDataURL(file);
  };

  const saveInfo = async () => {
    setSavingInfo(true);
    try { await updateNode(`users/${profile.uid}`, { residenza: residenza.trim() || null }); onToast('Dati aggiornati.'); }
    catch { onToast('Errore salvataggio.', 'err'); }
    finally { setSavingInfo(false); }
  };

  const savePassword = async () => {
    if (pass.length < 6) { onToast('La password deve avere almeno 6 caratteri.', 'err'); return; }
    if (pass !== pass2) { onToast('Le password non coincidono.', 'err'); return; }
    setSavingPass(true);
    try { await changePassword(pass); setPass(''); setPass2(''); onToast('Password aggiornata.'); }
    catch (e: any) {
      onToast(e?.code === 'auth/requires-recent-login' ? 'Per sicurezza, esci e rientra, poi riprova.' : 'Errore cambio password.', 'err');
    } finally { setSavingPass(false); }
  };

  const requestDeletion = async () => {
    setBusyDel(true);
    try {
      await writeNode(`deletionRequests/${profile.uid}`, {
        uid: profile.uid, name: profile.name || null, email: profile.email || null, at: Date.now(), status: 'aperta',
      });
      await updateNode(`users/${profile.uid}`, { deletionRequested: true });
      onToast('Richiesta di eliminazione inviata allo studio.');
      onClose();
      setTimeout(() => onLogout(), 600);
    } catch { onToast('Errore invio richiesta.', 'err'); setBusyDel(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-[480px] max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
          <b className="text-[16px] tracking-tight">Il tuo profilo</b>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 flex flex-col gap-5 text-left">
          {/* Foto + identità */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {photo ? <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover border border-[#e2e2e2]" /> : <div className="w-16 h-16 rounded-full bg-[#161616] text-white flex items-center justify-center text-[20px] font-bold">{(profile.name || '?').slice(0, 1)}</div>}
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1b1b1b] text-white flex items-center justify-center cursor-pointer border-2 border-white">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); }} />
              </label>
            </div>
            <div className="min-w-0">
              <b className="block text-[15px] text-[#161616] truncate">{profile.name}</b>
              <span className="block text-[12.5px] text-[#8a8a8a] truncate">{profile.email}</span>
            </div>
          </div>

          {/* Residenza */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Residenza</span>
            <input value={residenza} onChange={(e) => setResidenza(e.target.value)} placeholder="Via, civico, città" className="border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px] outline-none focus:border-[#161616]" />
            <button onClick={saveInfo} disabled={savingInfo} className="self-start mt-1 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-[#1b1b1b] text-white border-none cursor-pointer disabled:opacity-50">{savingInfo ? 'Salvo…' : 'Salva'}</button>
          </label>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Password</span>
            {hasPassword ? (
              <>
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Nuova password" className="border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px] outline-none focus:border-[#161616]" />
                <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Conferma password" className="border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px] outline-none focus:border-[#161616]" />
                <button onClick={savePassword} disabled={savingPass} className="self-start mt-1 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-[#1b1b1b] text-white border-none cursor-pointer disabled:opacity-50">{savingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cambia password'}</button>
              </>
            ) : (
              <p className="text-[12.5px] text-[#8a8a8a]">Accedi con Google: la password è gestita dal tuo account Google.</p>
            )}
          </div>

          {/* Consensi */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Consensi</span>
            <div className="text-[12.5px] text-[#555] inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Privacy accettata{profile.privacyAcceptedAt ? ` il ${new Date(profile.privacyAcceptedAt).toLocaleDateString('it-IT')}` : ''}.</div>
            <NewsletterButton uid={profile.uid} name={profile.name} email={profile.email} />
          </div>

          {/* Elimina account */}
          <div className="border-t border-[#f0f0f0] pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 inline-flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Elimina account</span>
            <p className="text-[12px] text-[#8a8a8a] mt-1.5">Invii allo studio la richiesta di cancellazione del tuo account e dei tuoi dati. Verrai disconnesso.</p>
            {!delArmed ? (
              <button onClick={() => setDelArmed(true)} className="mt-2 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer">Richiedi eliminazione</button>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <button onClick={requestDeletion} disabled={busyDel} className="text-[12.5px] font-bold px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer disabled:opacity-50">{busyDel ? 'Invio…' : 'Conferma richiesta'}</button>
                <button onClick={() => setDelArmed(false)} className="text-[12.5px] font-bold px-3 py-2 rounded-xl bg-[#f0f0f0] text-[#161616] border-none cursor-pointer">Annulla</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
