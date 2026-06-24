/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase – Onirico Studio OS (progetto oniricoapp-48953)
 * Auth Google + Realtime Database condiviso.
 * Gli account vivono nel nodo "users" (compatibile con le regole esistenti:
 * campi `active` e `role`). Tutti i dati dell'app sono sincronizzati sul DB.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue
} from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyDzhJBHWFTWnU86Mx9i-Z-uJmYUJTXrF3k',
  authDomain: 'oniricoapp-48953.firebaseapp.com',
  databaseURL: 'https://oniricoapp-48953-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'oniricoapp-48953',
  storageBucket: 'oniricoapp-48953.firebasestorage.app',
  messagingSenderId: '471588067505',
  appId: '1:471588067505:web:52f03aeed3da5b6ac3aa90'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
// Cloud Functions (region coerente con la RTDB). Usato per l'AI assist (§22-quater).
export const functions = getFunctions(app, 'europe-west1');

/**
 * Chiama la Cloud Function `aiGenerate` (Anthropic). Predisposta: funziona solo
 * dopo deploy + secret ANTHROPIC_KEY (vedi functions/README.md). In mancanza
 * lancia un errore che la UI mostra con un messaggio "AI non configurata".
 */
export const callAi = async (data: { prompt: string; system?: string; maxTokens?: number; model?: string }): Promise<string> => {
  const fn = httpsCallable<typeof data, { text: string }>(functions, 'aiGenerate');
  const res = await fn(data);
  return (res?.data?.text || '').toString();
};

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logoutGoogle = () => signOut(auth);
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

// ---- Accesso/registrazione con email e password ----
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);
export const registerWithEmail = async (email: string, password: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    try { await updateProfile(cred.user, { displayName }); } catch (_) { /* non bloccante */ }
  }
  return cred;
};
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

// Rimuove undefined/funzioni: Firebase rifiuta i valori undefined
export const clean = (val: any) => JSON.parse(JSON.stringify(val ?? null));

// ---- Helper generici Realtime Database ----
export const watchNode = (path: string, cb: (val: any) => void, onErr?: (e: any) => void) =>
  onValue(ref(db, path), (snap) => cb(snap.val()), onErr);
export const getNode = async (path: string) => (await get(ref(db, path))).val();
export const writeNode = (path: string, val: any) => set(ref(db, path), clean(val));
export const updateNode = (path: string, patch: any) => update(ref(db, path), clean(patch));
export const removeNode = (path: string) => remove(ref(db, path));

// ---- Account (nodo "users") ----
const USERS = 'users';
export const watchAccounts = (cb: (val: Record<string, any>) => void, onErr?: (e: any) => void) =>
  onValue(ref(db, USERS), (snap) => cb(snap.val() || {}), onErr);
export const watchOwnAccount = (uid: string, cb: (val: any) => void, onErr?: (e: any) => void) =>
  onValue(ref(db, `${USERS}/${uid}`), (snap) => cb(snap.val()), onErr);
export const getAccounts = async () => (await get(ref(db, USERS))).val() || {};
export const setAccount = (uid: string, data: any) => set(ref(db, `${USERS}/${uid}`), clean(data));
export const updateAccount = (uid: string, patch: any) => update(ref(db, `${USERS}/${uid}`), clean(patch));
export const removeAccount = (uid: string) => remove(ref(db, `${USERS}/${uid}`));

export type { User };
