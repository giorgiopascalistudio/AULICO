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
  s === 'lg' ? 'md:col-span-3' : s === 'md' ? 'md:col-span-2' : 'md:col-span-1';

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
    <div className="flex flex-col gap-1.5">
      {data.items.map((it, i) => (
        <button
          key={i}
          onClick={() => it.hash && go(it.hash)}
          className="flex items-center justify-between gap-2 text-left rounded-xl px-2.5 py-2 hover:bg-[#f5f5f3] transition-colors cursor-pointer"
        >
          <span className="text-[13.5px] font-medium text-[#161616] truncate">{it.label}</span>
          <span className="flex items-center gap-1 shrink-0 text-[11.5px] font-bold text-[#8a8a8a]">
            {it.meta}
            {it.hash && <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </button>
      ))}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
