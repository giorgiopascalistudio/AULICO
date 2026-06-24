/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Upload file reali su Google Drive (gratuito) per il modulo Cantiere.
 * Usa Google Identity Services (GIS) token client con scope `drive.file`
 * (autorizzazione incrementale, richiesta SOLO al primo upload — non tocca
 * il login Firebase/Google esistente). I file restano nel Drive di chi carica
 * con link-sharing (reader-con-link), così studio + partner possono vederli.
 *
 * Su Firebase si salva SOLO { fileId, webViewLink }. Se GIS/Drive non sono
 * disponibili (script bloccato, API non abilitata, scope negato) le funzioni
 * lanciano: la UI ricade sul fallback "incolla link".
 */

/**
 * OAuth 2.0 **Web** Client ID del progetto Google Cloud `oniricoapp-48953`.
 * ⚠️ Setup una tantum dell'utente: in Google Cloud Console → Credenziali creare
 * (o riusare) un "ID client OAuth → Applicazione web", aggiungere agli
 * "Authorized JavaScript origins" `http://localhost:3000` e
 * `https://giorgiopascalistudio.github.io`, abilitare la **Google Drive API**,
 * poi incollare qui l'ID (formato `<n>-<hash>.apps.googleusercontent.com`)
 * — oppure impostarlo a runtime su `window.__ONIRICO_DRIVE_CLIENT_ID__`.
 * Finché resta vuoto, l'upload Drive non parte e la UI usa il fallback "link".
 */
const DEFAULT_CLIENT_ID = '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

function clientId(): string {
  return (typeof window !== 'undefined' && (window as any).__ONIRICO_DRIVE_CLIENT_ID__) || DEFAULT_CLIENT_ID;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

let gisLoaded: Promise<void> | null = null;
let tokenClient: any = null;
let cachedToken: { value: string; exp: number } | null = null;
const folderCache: Record<string, string> = {};

/** Carica lo script GIS una sola volta. */
function loadGis(): Promise<void> {
  if (gisLoaded) return gisLoaded;
  gisLoaded = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google Identity Services non disponibile.'));
    document.head.appendChild(s);
  });
  return gisLoaded;
}

/** Ottiene (o riusa) un access token Drive. Richiede il consenso al primo uso. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  await loadGis();
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services non inizializzato.');
  }
  return new Promise<string>((resolve, reject) => {
    try {
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId(),
          scope: DRIVE_SCOPE,
          callback: (resp: any) => {
            if (resp.error) {
              reject(new Error(resp.error_description || resp.error));
              return;
            }
            cachedToken = {
              value: resp.access_token,
              exp: Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3_600_000)
            };
            resolve(resp.access_token);
          }
        });
      } else {
        tokenClient.callback = (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
            return;
          }
          cachedToken = {
            value: resp.access_token,
            exp: Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3_600_000)
          };
          resolve(resp.access_token);
        };
      }
      // prompt vuoto: riusa il consenso già concesso quando possibile
      tokenClient.requestAccessToken({ prompt: cachedToken ? '' : 'consent' });
    } catch (e) {
      reject(e);
    }
  });
}

/** True se l'upload reale è configurato e tentabile (altrimenti → fallback link). */
export function driveAvailable(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && !!clientId();
}

/** Cerca/crea una cartella per il cantiere e ne ritorna l'id. */
async function ensureFolder(token: string, folderName: string): Promise<string | null> {
  if (folderCache[folderName]) return folderCache[folderName];
  try {
    const q = encodeURIComponent(
      `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const search = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&spaces=drive`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await search.json();
    if (data.files && data.files.length > 0) {
      folderCache[folderName] = data.files[0].id;
      return data.files[0].id;
    }
    const create = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
    });
    const folder = await create.json();
    if (folder.id) {
      folderCache[folderName] = folder.id;
      return folder.id;
    }
  } catch (_) {
    /* non bloccante: si carica nella root del Drive */
  }
  return null;
}

/** Imposta link-sharing (reader con link) sul file. */
async function makeSharable(token: string, fileId: string): Promise<void> {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
  } catch (_) {
    /* non bloccante */
  }
}

/**
 * Carica un file su Drive (multipart) dentro la cartella del cantiere,
 * lo rende leggibile con link e ritorna { fileId, webViewLink }.
 * Lancia se l'upload reale non è possibile (→ fallback link nella UI).
 */
export async function uploadToDrive(file: File, folderName: string): Promise<DriveUploadResult> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token, folderName);

  const metadata: Record<string, any> = { name: file.name };
  if (folderId) metadata.parents = [folderId];

  const boundary = `onirico-${Date.now()}`;
  const head =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;

  const body = new Blob([head, file, tail], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body
    }
  );
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Upload Drive fallito (${res.status}). ${msg}`);
  }
  const data = await res.json();
  if (!data.id) throw new Error('Upload Drive: risposta senza id file.');
  await makeSharable(token, data.id);
  return {
    fileId: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`
  };
}
