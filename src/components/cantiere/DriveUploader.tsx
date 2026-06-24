/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DriveUploader — upload reale su Google Drive con fallback "incolla link".
 * Estratto da CantiereBoard per essere riusato dai registri documenti del Cantiere.
 */
import React, { useState } from 'react';
import { Link as LinkIcon, CloudUpload, AlertTriangle } from 'lucide-react';
import { uploadToDrive, driveAvailable } from '../../drive';

export const DriveUploader: React.FC<{
  folderName: string;
  onUploaded: (f: { driveFileId?: string; driveUrl?: string; link?: string; name?: string }) => void;
}> = ({ folderName, onUploaded }) => {
  const [busy, setBusy] = useState(false);
  const [linkMode, setLinkMode] = useState(!driveAvailable());
  const [link, setLink] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await uploadToDrive(file, folderName);
      onUploaded({ driveFileId: res.fileId, driveUrl: res.webViewLink, name: file.name });
    } catch (e: any) {
      setLinkMode(true);
      setErr('Upload Drive non disponibile: incolla un link al file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!linkMode && (
        <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[12.5px] font-bold cursor-pointer hover:bg-[#fafafa] ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
          <CloudUpload className="w-4 h-4" /> {busy ? 'Caricamento…' : 'Carica su Drive'}
          <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      )}
      {linkMode && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white">
            <LinkIcon className="w-4 h-4 text-[#9a9a9a]" />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…  (Drive/Dropbox/…)"
              className="flex-1 border-none outline-none text-[12.5px] bg-transparent"
            />
          </div>
          <button
            type="button"
            disabled={!link.trim()}
            onClick={() => { onUploaded({ link: link.trim() }); setLink(''); }}
            className="px-3 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40"
          >
            Allega
          </button>
        </div>
      )}
      {err && <span className="inline-flex items-center gap-1 text-[11px] text-amber-700"><AlertTriangle className="w-3 h-3" /> {err}</span>}
      {!linkMode && driveAvailable() && (
        <button type="button" onClick={() => setLinkMode(true)} className="self-start text-[11px] text-[#9a9a9a] underline">
          oppure incolla un link
        </button>
      )}
    </div>
  );
};
