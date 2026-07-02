/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { DashboardCtx, DashboardSpec, WidgetData } from '../societyConfig';

interface Props {
  spec: DashboardSpec;
  ctx: DashboardCtx;
  societyLabel: string;
  color: string;
}

const sizeClass = (s?: 'sm' | 'md' | 'lg') =>
  s === 'lg' ? 'md:col-span-2' : 'md:col-span-1';

const WidgetBody: React.FC<{ data: WidgetData; color: string; go: (h: string) => void }> = ({ data, color, go }) => {
  if (data.kind === 'kpi') {
    return (
      <div>
        <div className="text-[34px] leading-none font-extrabold tracking-tight" style={{ color }}>{data.value}</div>
        {data.sub && <div className="text-[12px] text-[#8a8a8a] mt-1.5">{data.sub}</div>}
      </div>
    );
  }
  // list
  if (data.items.length === 0) {
    return <div className="text-[13px] text-[#a8a8a8] py-2">{data.emptyText || 'Nessun elemento'}</div>;
  }
  return (
    <div className="flex flex-col gap-0.5">
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
              <span className="mt-[7px] w-2 h-2 rounded-full shrink-0" style={{ background: dot, opacity: it.unread === false ? 0.35 : 1 }} />
            )}
            <span className="flex-1 min-w-0">
              <span className="flex items-center justify-between gap-2">
                <span className={`text-[13.5px] text-[#161616] truncate ${it.unread ? 'font-bold' : 'font-medium'}`}>{it.label}</span>
                <span className="flex items-center gap-1 shrink-0 text-[11.5px] font-bold text-[#8a8a8a]">
                  {it.meta}
                  {it.hash && <ChevronRight className="w-3.5 h-3.5" />}
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

/** Dashboard uniforme, popolata dai widget della società corrente. */
export const SocietyDashboard: React.FC<Props> = ({ spec, ctx, societyLabel, color }) => {
  return (
    <div className="flex-1 overflow-y-auto px-[30px] py-5">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <h1 className="text-[22px] font-extrabold text-[#161616] tracking-tight">{societyLabel}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spec.widgets.map((w) => {
          let data: WidgetData;
          try { data = w.compute(ctx); } catch { data = { kind: 'list', items: [], emptyText: '—' }; }
          return (
            <div key={w.id} className={`bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm ${sizeClass(w.size)}`}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-3">{w.title}</div>
              <WidgetBody data={data} color={color} go={ctx.go} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
