/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sync KPI social → Realtime Database (nodo `mktKpi`), fase 1: Google Analytics 4
 * (canale "Sito web" del Centro Marketing). Riusa la STESSA service account di
 * firebase-admin: basta darle accesso "Visualizzatore" sulla proprietà GA4
 * (GA4 → Amministrazione → Gestione accesso alla proprietà → aggiungi l'email
 * `client_email` della service account come Viewer).
 *
 * Per ogni account marketing (`mktAccounts/<id>`) che ha impostato `ga4PropertyId`,
 * aggiorna il mese corrente (e il precedente nei primi 3 giorni del mese, per i
 * dati che arrivano in ritardo). Scrive SOLO le metriche oggettive di GA4, in
 * MERGE con l'inserimento manuale: le altre voci (es. "lead") restano.
 *
 * Mappatura → chiavi di KPI_METRICS.sito nel gestionale:
 *   utentiAttivi ← activeUsers · nuoviUtenti ← newUsers · sessioni ← sessions
 *   interazioni  ← engagedSessions · stranieriPct ← sessioni non-Italia / totali
 */
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const pad = (n) => String(n).padStart(2, '0');
const ymOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const monthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate(); // ultimo giorno del mese
  return { startDate: `${y}-${pad(m)}-01`, endDate: `${y}-${pad(m)}-${pad(last)}` };
};

// GA4 metric name → chiave usata dal gestionale.
const GA4_METRICS = [
  { key: 'utentiAttivi', api: 'activeUsers' },
  { key: 'nuoviUtenti', api: 'newUsers' },
  { key: 'sessioni', api: 'sessions' },
  { key: 'interazioni', api: 'engagedSessions' },
];
// Voci "di proprietà" di GA4 (le sovrascrive il sync; le altre restano manuali).
const GA4_API_KEYS = ['utentiAttivi', 'nuoviUtenti', 'sessioni', 'interazioni', 'stranieriPct'];

export async function syncGa4Kpis(db, serviceAccount) {
  const snap = await db.ref('mktAccounts').get();
  const accounts = Object.values(snap.val() || {}).filter(Boolean);
  const targets = accounts.filter((a) => a.ga4PropertyId && String(a.ga4PropertyId).replace(/\D/g, ''));
  if (!targets.length) { console.log('GA4: nessun account con ga4PropertyId — salto.'); return; }

  const client = new BetaAnalyticsDataClient({
    credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key },
    projectId: serviceAccount.project_id,
  });

  const now = new Date();
  const months = [ymOf(now)];
  if (now.getDate() <= 3) months.push(ymOf(new Date(now.getFullYear(), now.getMonth() - 1, 1)));

  for (const acc of targets) {
    const propId = String(acc.ga4PropertyId).replace(/\D/g, '');
    const property = `properties/${propId}`;
    for (const ym of months) {
      try {
        const { startDate, endDate } = monthRange(ym);
        // 1) metriche aggregate
        const [rep] = await client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          metrics: GA4_METRICS.map((m) => ({ name: m.api })),
        });
        const row = rep.rows?.[0];
        const fetched = {};
        GA4_METRICS.forEach((m, i) => {
          const v = row?.metricValues?.[i]?.value;
          fetched[m.key] = v == null ? null : Number(v);
        });
        // 2) % stranieri = sessioni non-Italia / sessioni totali
        const [geo] = await client.runReport({
          property,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
        });
        let tot = 0, italia = 0;
        (geo.rows || []).forEach((r) => {
          const c = r.dimensionValues?.[0]?.value || '';
          const s = Number(r.metricValues?.[0]?.value || 0);
          tot += s;
          if (c === 'Italy' || c === 'Italia') italia += s;
        });
        fetched.stranieriPct = tot > 0 ? Math.round(((tot - italia) / tot) * 1000) / 10 : null;

        // MERGE con l'esistente: preserva le voci manuali (es. lead) e le note.
        const id = `${acc.id}__sito__${ym}`;
        const cur = (await db.ref(`mktKpi/${id}`).get()).val() || {};
        const metrics = { ...(cur.metrics || {}) };
        for (const k of GA4_API_KEYS) if (fetched[k] != null) metrics[k] = fetched[k];
        await db.ref(`mktKpi/${id}`).set({
          id, accountId: acc.id, platform: 'sito', ym, metrics,
          notes: cur.notes ?? null, source: 'ga4', syncedAt: Date.now(), updatedAt: Date.now(),
        });
        console.log(`GA4 ok: ${acc.name || acc.id} ${ym} — utenti ${fetched.utentiAttivi ?? '—'}, sessioni ${fetched.sessioni ?? '—'}, stranieri ${fetched.stranieriPct ?? '—'}%`);
      } catch (e) {
        console.error(`GA4 errore ${acc.id} ${ym}:`, e?.message || e);
      }
    }
  }
}
