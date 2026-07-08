/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import type { DashboardCtx, DashboardSpec, WidgetData, WidgetSpec } from '../societyConfig';

interface Props {
  spec: DashboardSpec;
  ctx: DashboardCtx;
  societyLabel: string;
  color: string;
}

const sizeClass = (s?: 'sm' | 'md' | 'lg') =>
  s === 'lg' ? 'md:col-span-2' : 'md:col-span-1';

/** Schiarisce un hex per lo sfondo tenue dell'icona (mix col bianco). */
function tint(hex: string, amount = 0.12): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const WidgetBody: React.FC<{ data: WidgetData; color: string; go: (h: string) => void }> = ({ data, color, go }) => {
  if (data.kind === 'kpi') {
    return (
      <div className="pt-1">
        <div className="text-[40px] leading-none font-black tracking-tight" style={{ color }}>{data.value}</div>
        {data.sub && <div className="text-[12px] text-[#8a8a8a] mt-2 font-medium">{data.sub}</div>}
      </div>
    );
  }

  if (data.kind === 'stats') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {data.items.map((it, i) => (
          <button
            key={i}
            onClick={() => it.hash && go(it.hash)}
            disabled={!it.hash}
            className={`rounded-2xl bg-[#f7f6f4] border border-[#ececec] px-2.5 py-3 text-left transition-all ${it.hash ? 'hover:bg-white hover:border-[#e0e0e0] hover:shadow-xs cursor-pointer' : 'cursor-default'}`}
          >
            <div className="text-[24px] leading-none font-black tracking-tight" style={{ color: it.accent || '#161616' }}>{it.value}</div>
            <div className="text-[10.5px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wide truncate">{it.label}</div>
          </button>
        ))}
      </div>
    );
  }

  // list
  if (data.items.length === 0) {
    return <div className="text-[13px] text-[#a8a8a8] py-3">{data.emptyText || 'Nessun elemento'}</div>;
  }
  return (
    <div className="flex flex-col gap-0.5 -mx-1">
      {data.items.map((it, i) => {
        const dot = it.accent || (it.unread ? color : undefined);
        return (
          <button
            key={i}
            onClick={() => it.hash && go(it.hash)}
            disabled={!it.hash}
            className={`flex items-start gap-2.5 text-left rounded-xl px-2.5 py-2 transition-colors ${it.hash ? 'hover:bg-[#f5f5f3] cursor-pointer' : 'cursor-default'}`}
          >
            {dot !== undefined && (
              <span className="mt-[7px] w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
            )}
            <span className="flex-1 min-w-0">
              <span className="flex items-center justify-between gap-2">
                <span className={`text-[13.5px] text-[#161616] truncate ${it.unread ? 'font-bold' : 'font-medium'}`}>{it.label}</span>
                <span className="flex items-center gap-1 shrink-0 text-[11.5px] font-bold text-[#8a8a8a]">
                  {it.meta}
                  {it.hash && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </span>
              </span>
              {it.sub && <span className="block text-[11.5px] text-[#8a8a8a] truncate mt-0.5">{it.sub}</span>}
              {it.progress !== undefined && (
                <span className="block w-full h-[5px] bg-[#ececec] rounded-full overflow-hidden mt-1.5">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, it.progress))}%`, background: it.progress >= 100 ? '#15803d' : (it.accent || color) }}
                  />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const WidgetCard: React.FC<{ w: WidgetSpec; data: WidgetData; color: string; go: (h: string) => void }> = ({ w, data, color, go }) => {
  const Icon = w.icon;
  return (
    <div className={`group bg-white border border-[#e8e8e6] rounded-[24px] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${sizeClass(w.size)}`}>
      <div className="flex items-center gap-2.5 mb-3.5">
        {Icon && (
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(color), color }}>
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="text-[13px] font-extrabold tracking-tight text-[#161616]">{w.title}</div>
      </div>
      <WidgetBody data={data} color={color} go={go} />
    </div>
  );
};

/** Saluto in base all'ora del giorno. */
function greetingFor(name?: string | null): string {
  const h = new Date().getHours();
  const g = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const first = (name || '').trim().split(/\s+/)[0];
  return first ? `${g}, ${first}.` : `${g}.`;
}

/**
 * Dashboard uniforme, popolata dai widget della società corrente.
 * DESKTOP: griglia di card (come sempre). MOBILE (<md): i numeri della "vista
 * generale" diventano tessere grandi e ogni altro widget è una TILE compatta
 * (contatore + anteprima) che apre il contenuto in un bottom-sheet — la home
 * sta in una schermata, niente pila di card da scorrere.
 */
export const SocietyDashboard: React.FC<Props> = ({ spec, ctx, societyLabel, color }) => {
  const isPersonal = ctx.societa === 'holding';
  const dateLabel = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Calcolo unico dei widget, riusato da desktop, tile e overlay.
  const computed = spec.widgets.map((w) => {
    let data: WidgetData;
    try { data = w.compute(ctx); } catch { data = { kind: 'list', items: [], emptyText: '—' }; }
    return { w, data };
  });
  const statWidgets = computed.filter((c) => c.data.kind === 'stats');
  const tileWidgets = computed.filter((c) => c.data.kind !== 'stats');
  const openW = openId ? computed.find((c) => c.w.id === openId) : null;

  // Navigazione dall'overlay: chiudi il foglio, poi salta.
  const goFromSheet = (h: string) => { setOpenId(null); ctx.go(h); };

  return (
    <div className="flex-1 overflow-y-auto px-0 py-0 md:px-[30px] md:py-6 md:bg-[#f5f5f3]">
      {isPersonal ? (
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 text-[11px] md:text-[12px] font-bold uppercase tracking-wider mb-1.5 md:mb-2" style={{ color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {societyLabel}
          </div>
          <h1 className="text-[24px] md:text-[30px] leading-tight font-black tracking-tight text-[#161616]">
            {greetingFor(ctx.profile?.name)}
          </h1>
          <div className="text-[12px] md:text-[13px] text-[#8a8a8a] capitalize mt-0.5 md:mt-1 font-semibold">{dateLabel}</div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 mb-4 md:mb-5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <h1 className="text-[19px] md:text-[22px] font-extrabold text-[#161616] tracking-tight">{societyLabel}</h1>
        </div>
      )}

      {/* ---------- MOBILE: numeri grandi + tile→overlay ---------- */}
      <div className="md:hidden flex flex-col gap-3">
        {statWidgets.map(({ w, data }) => data.kind === 'stats' && (
          <div key={w.id} className="grid grid-cols-3 gap-2">
            {data.items.map((it, i) => (
              <button
                key={i}
                onClick={() => it.hash && ctx.go(it.hash)}
                disabled={!it.hash}
                className={`rounded-2xl bg-white border border-[#e8e8e6] px-2.5 py-3.5 text-left shadow-sm ${it.hash ? 'cursor-pointer active:scale-[0.97] transition-transform' : 'cursor-default'}`}
              >
                <div className="text-[26px] leading-none font-black tracking-tight" style={{ color: it.accent || '#161616' }}>{it.value}</div>
                <div className="text-[10px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wide truncate">{it.label}</div>
              </button>
            ))}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2.5">
          {tileWidgets.map(({ w, data }) => {
            const Icon = w.icon;
            const count = data.kind === 'kpi' ? data.value : String(data.items.length);
            const preview = data.kind === 'kpi'
              ? (data.sub || '')
              : (data.items[0]?.label || data.emptyText || 'Nessun elemento');
            const hasUnread = data.kind === 'list' && data.items.some((it) => it.unread);
            return (
              <button
                key={w.id}
                onClick={() => setOpenId(w.id)}
                className="relative bg-white border border-[#e8e8e6] rounded-[20px] p-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2 min-h-[104px] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  {Icon ? (
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(color), color }}>
                      <Icon className="w-4 h-4" />
                    </span>
                  ) : <span />}
                  {hasUnread ? <span className="w-2 h-2 rounded-full bg-orange-500" /> : <ChevronRight className="w-4 h-4 text-[#c9c9c9]" />}
                </div>
                <div className="mt-auto">
                  <div className="text-[24px] font-black tracking-tight text-[#161616] leading-none">{count}</div>
                  <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-bold uppercase tracking-wider truncate">{w.title}</div>
                  <div className="text-[10.5px] text-[#9a9a9a] font-semibold truncate">{preview}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- DESKTOP: griglia di card come sempre ---------- */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
        {computed.map(({ w, data }) => (
          <WidgetCard key={w.id} w={w} data={data} color={color} go={ctx.go} />
        ))}
      </div>

      {/* ---------- Overlay mobile del widget aperto (portal: §9-bis) ---------- */}
      {openW && createPortal(
        <div className="md:hidden fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end" onClick={() => setOpenId(null)}>
          <div className="w-full max-h-[82vh] overflow-y-auto bg-white rounded-t-[26px] p-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                {openW.w.icon && (
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(color), color }}>
                    <openW.w.icon className="w-4 h-4" />
                  </span>
                )}
                <b className="text-[15px] tracking-tight text-[#161616] truncate">{openW.w.title}</b>
              </div>
              <button onClick={() => setOpenId(null)} className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none shrink-0"><X className="w-4.5 h-4.5" /></button>
            </div>
            <WidgetBody data={openW.data} color={color} go={goFromSheet} />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
