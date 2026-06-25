/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Automazioni schedulate Aulico — versione GRATIS via GitHub Actions (niente
 * Blaze, niente Cloud Functions). Si connette al Realtime Database con
 * firebase-admin (service account) e scrive notifiche in-app su
 * notifications/<uid> (le legge l'app, come le Cloud Functions).
 *
 * Esegue ogni giorno:
 *  - reminder ferie (7gg) + scadenze finanziarie (3gg)
 *  - alert scadenze documenti/contratti (60/30/15/7/0 gg)
 *  - consegne Materico in ritardo (1/7/14/30 gg) → "valuta penale"
 *  - report attività: settimanale (lunedì) e mensile (giorno 1)
 *
 * Email: non inviate (per restare 100% gratis senza provider/carta). Si possono
 * aggiungere in seguito (Brevo/Resend) leggendo un secret opzionale.
 *
 * Variabili d'ambiente (secrets del repo GitHub):
 *  - FIREBASE_SERVICE_ACCOUNT : JSON della service account (Project settings →
 *    Service accounts → Generate new private key)
 *  - FIREBASE_DB_URL          : URL del Realtime Database (default sotto)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const DB_URL = process.env.FIREBASE_DB_URL
  || 'https://aulico-228bd-default-rtdb.europe-west1.firebasedatabase.app';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error('Manca FIREBASE_SERVICE_ACCOUNT (secret).');
  process.exit(1);
}
const serviceAccount = JSON.parse(raw);
initializeApp({ credential: cert(serviceAccount), databaseURL: DB_URL });
const db = getDatabase();

const iso = (d) => d.toISOString().slice(0, 10);
const arr = (v) => (v ? Object.values(v).filter(Boolean) : []);
const daysUntil = (isoDate, from) => {
  const d = new Date(isoDate).getTime();
  if (isNaN(d)) return NaN;
  return Math.round((d - new Date(iso(from)).getTime()) / 86400000);
};

async function studioMembers() {
  const snap = await db.ref('users').get();
  const users = snap.val() || {};
  return Object.entries(users)
    .filter(([, u]) => u && u.active === true && u.role !== 'cliente' && u.role !== 'partner')
    .map(([uid, u]) => ({ uid, name: u.name || 'Membro', email: u.email, role: u.role }));
}

async function pushNotification(uid, payload) {
  const id = `ntf-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
  await db.ref(`notifications/${uid}/${id}`).set({
    id, type: payload.type, title: payload.title, body: payload.body || null, link: payload.link || null,
    read: false, at: Date.now(), by: 'system', byName: 'Sistema',
  });
}
const notifyAll = (members, p) => Promise.all(members.map((m) => pushNotification(m.uid, p)));

// ---- ferie 7gg + scadenze 3gg ----
async function dailyReminders(members) {
  const today = new Date();
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
  const in3 = new Date(today); in3.setDate(in3.getDate() + 3);
  const leaves = arr((await db.ref('teamLeave').get()).val());
  for (const l of leaves) {
    if (l.dateFrom === iso(in7)) {
      await notifyAll(members, { type: 'ferie', title: `Promemoria assenza: ${l.name} (${l.type}) dal ${l.dateFrom}`, link: '#calendario' });
    }
  }
  const scad = arr((await db.ref('finScadenze').get()).val());
  const due = scad.filter((s) => s.status !== 'pagato' && s.dueDate && s.dueDate >= iso(today) && s.dueDate <= iso(in3));
  if (due.length) {
    const adminMgr = members.filter((m) => m.role === 'admin' || m.role === 'manager');
    await notifyAll(adminMgr, { type: 'scadenza', title: `Scadenze in arrivo (${due.length}) entro 3 giorni`, body: `${due.length} scadenze entro 3 giorni`, link: '#finanze' });
  }
}

// ---- scadenze documenti/contratti 60/30/15/7/0 gg ----
const ALERT_THRESHOLDS = [60, 30, 15, 7, 0];
async function expiryAlerts(members) {
  const adminMgr = members.filter((m) => m.role === 'admin' || m.role === 'manager');
  if (!adminMgr.length) return;
  const today = new Date();
  const hits = [];
  const consider = (label, expiry) => {
    if (!expiry || typeof expiry !== 'string') return;
    const d = daysUntil(expiry, today);
    if (!isNaN(d) && ALERT_THRESHOLDS.includes(d)) hits.push({ label, date: expiry, days: d });
  };
  const impresaDocs = (await db.ref('impresaDocs').get()).val() || {};
  Object.values(impresaDocs).forEach((byUid) => arr(byUid).forEach((x) => consider(`Impresa · ${x.title || x.category || 'Documento'}`, x.expiry)));
  const cantDocs = (await db.ref('cantiereDocumenti').get()).val() || {};
  Object.values(cantDocs).forEach((byCid) => arr(byCid).forEach((x) => consider(`Cantiere · ${x.title || x.category || 'Documento'}`, x.expiry)));
  arr((await db.ref('mktContracts').get()).val()).forEach((c) => consider(`Contratto · ${c.title || c.clientName || 'Retainer'}`, c.endAt));
  if (!hits.length) return;
  await notifyAll(adminMgr, { type: 'scadenza', title: `Scadenze documenti/contratti (${hits.length})`, body: `${hits.length} in scadenza`, link: '#progetti' });
}

// ---- consegne Materico in ritardo 1/7/14/30 gg ----
const DELAY_THRESHOLDS = [1, 7, 14, 30];
async function matericoDelayCheck(members) {
  const adminMgr = members.filter((m) => m.role === 'admin' || m.role === 'manager');
  if (!adminMgr.length) return;
  const today = new Date();
  const reqs = arr((await db.ref('matericoRequests').get()).val());
  const late = reqs.filter((r) => {
    if (!r.selectedPartnerUid) return false;
    if (r.status !== 'inviata_cliente' && r.status !== 'accettata') return false;
    if (r.completedDate || (r.penalty && r.penalty.status === 'applicata')) return false;
    if (!r.agreedDeliveryDate) return false;
    return DELAY_THRESHOLDS.includes(-daysUntil(r.agreedDeliveryDate, today));
  });
  if (!late.length) return;
  await notifyAll(adminMgr, { type: 'materico', title: `Consegne Materico in ritardo (${late.length})`, body: `${late.length} in ritardo`, link: '#progetti' });
}

// ---- report attività (settimanale lunedì / mensile giorno 1) ----
async function activityReport(members, sinceMs, label) {
  const tasks = arr((await db.ref('tasks').get()).val());
  for (const m of members) {
    const mine = tasks.filter((t) => t.assignee === m.uid || (t.assignees || []).includes(m.uid));
    const done = mine.filter((t) => t.done && (t.updatedAt || 0) >= sinceMs);
    const open = mine.filter((t) => !t.done);
    await pushNotification(m.uid, { type: 'report', title: `Report ${label}: ${done.length} attività completate`, body: `${open.length} ancora aperte`, link: '#calendario' });
  }
}

async function main() {
  const members = await studioMembers();
  if (!members.length) { console.log('Nessun membro studio attivo.'); return; }
  const now = new Date();
  await dailyReminders(members);
  await expiryAlerts(members);
  await matericoDelayCheck(members);
  if (now.getDay() === 1) await activityReport(members, Date.now() - 7 * 86400000, 'settimanale');
  if (now.getDate() === 1) await activityReport(members, Date.now() - 30 * 86400000, 'mensile');
  console.log('Automazioni completate.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
