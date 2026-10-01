import React from 'react';
import type { StockMovement } from '../types/bakery';
import { Activity, ArrowRight, Flame, Truck, CheckCircle2, RotateCcw } from 'lucide-react';

interface StockActivityFeedProps {
  movements: StockMovement[];
}

export const StockActivityFeed: React.FC<StockActivityFeedProps> = ({ movements }) => {
  const getBadge = (type: StockMovement['movement_type']) => {
    switch (type) {
      case 'PRODUCTION_ADD':
        return {
          icon: <Flame className="w-3 h-3" />,
          label: 'Oven Bake Batch',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'VAN_LOAD':
        return {
          icon: <Truck className="w-3 h-3" />,
          label: 'Van Stock Load',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'VAN_DELIVERY':
        return {
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'Shop Delivery Drop',
          color: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'VAN_RETURN':
        return {
          icon: <RotateCcw className="w-3 h-3" />,
          label: 'Stock Return',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      default:
        return {
          icon: <Activity className="w-3 h-3" />,
          label: type,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Live Stock Movement Ledger</h2>
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Realtime Audit</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {movements.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No stock movements recorded yet.
          </div>
        ) : (
          movements.map((m) => {
            const badge = getBadge(m.movement_type);
            return (
              <div key={m.id} className="p-2.5 hover:bg-slate-50 rounded-xl transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{formatTime(m.created_at)}</span>
                </div>

                <div className="flex items-center justify-between text-xs my-1">
                  <span className="font-semibold text-slate-800">
                    {m.product?.name || 'Bakery Product'}
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {m.movement_type === 'PRODUCTION_ADD' || m.movement_type === 'VAN_LOAD' ? '+' : '-'}
                    {m.quantity} <span className="text-[10px] text-slate-500 font-normal">pcs</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                  <span className="truncate max-w-[120px] font-mono text-slate-700">{m.from_location.replace('MASTER_PRODUCTION_CENTER', 'Main Bakery')}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[150px] font-semibold text-amber-700">{m.to_location}</span>
                </div>

                {m.notes && (
                  <div className="text-[10px] text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                    💬 {m.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
