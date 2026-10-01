import React from 'react';
import type { Delivery } from '../types/bakery';
import { CheckCircle2, Store, User } from 'lucide-react';

interface DeliveriesPanelProps {
  deliveries: Delivery[];
}

export const DeliveriesPanel: React.FC<DeliveriesPanelProps> = ({ deliveries }) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Live Delivery Receipts</h2>
        </div>
        <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
          Driver App Feed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {deliveries.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No deliveries completed yet today.
          </div>
        ) : (
          deliveries.map((del) => (
            <div key={del.id} className="p-3 hover:bg-slate-50 rounded-xl transition">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{del.customer?.name || 'Customer Shop'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {del.customer?.address}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-emerald-600 font-mono">
                    ${Number(del.total_value).toFixed(2)}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatTime(del.delivered_at)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded text-[10px]">
                    {del.vehicle?.van_code || 'VAN'}
                  </span>
                  <span>Driver: <b>{del.vehicle?.driver_name || 'Driver'}</b></span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <span>Delivered:</span>
                  <b className="text-slate-900">{del.total_items_delivered} units</b>
                </div>
              </div>

              {del.recipient_name && (
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Signed by: <b className="text-slate-700">{del.recipient_name}</b></span>
                </div>
              )}

              {del.driver_notes && (
                <div className="text-[10px] text-slate-500 mt-1 italic">
                  "{del.driver_notes}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
