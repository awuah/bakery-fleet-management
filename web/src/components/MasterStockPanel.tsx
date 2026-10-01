import React, { useState } from 'react';
import type { MasterStock, Product, Vehicle } from '../types/bakery';
import { supabase } from '../lib/supabase';
import { Package, Plus, Truck, AlertTriangle, Search, CheckCircle2, Flame } from 'lucide-react';

interface MasterStockPanelProps {
  masterStock: MasterStock[];
  products: Product[];
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const MasterStockPanel: React.FC<MasterStockPanelProps> = ({
  masterStock,
  products,
  vehicles,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal states
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Production Form State
  const [prodProductId, setProdProductId] = useState('');
  const [prodQuantity, setProdQuantity] = useState<number>(50);
  const [prodNotes, setProdNotes] = useState('');
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);

  // Dispatch Form State
  const [dispVehicleId, setDispVehicleId] = useState('');
  const [dispProductId, setDispProductId] = useState('');
  const [dispQuantity, setDispQuantity] = useState<number>(20);
  const [dispNotes, setDispNotes] = useState('');
  const [isSubmittingDisp, setIsSubmittingDisp] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredStock = masterStock.filter((ms) => {
    const nameMatch = ms.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ms.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = selectedCategory === 'All' || ms.product?.category === selectedCategory;
    return nameMatch && catMatch;
  });

  const handleRecordProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodProductId || prodQuantity <= 0) return;
    setIsSubmittingProd(true);

    try {
      const { error } = await supabase.rpc('bk_record_production_run', {
        p_product_id: prodProductId,
        p_quantity: prodQuantity,
        p_notes: prodNotes || 'Fresh oven batch',
      });

      if (error) throw error;
      setShowProductionModal(false);
      setProdNotes('');
      onRefresh();
    } catch (err: any) {
      alert(`Error logging production: ${err.message}`);
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const handleDispatchToVan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispVehicleId || !dispProductId || dispQuantity <= 0) return;

    // Check available master stock
    const currentStock = masterStock.find((ms) => ms.product_id === dispProductId);
    if (!currentStock || currentStock.quantity < dispQuantity) {
      alert(`Cannot dispatch ${dispQuantity} units. Only ${currentStock?.quantity || 0} available in Master Stock.`);
      return;
    }

    setIsSubmittingDisp(true);

    try {
      const itemsPayload = [
        {
          product_id: dispProductId,
          quantity: dispQuantity,
        },
      ];

      const { error } = await supabase.rpc('bk_transfer_to_van', {
        p_vehicle_id: dispVehicleId,
        p_items: itemsPayload,
        p_notes: dispNotes || 'Morning replenishment',
      });

      if (error) throw error;
      setShowDispatchModal(false);
      setDispNotes('');
      onRefresh();
    } catch (err: any) {
      alert(`Error dispatching to van: ${err.message}`);
    } finally {
      setIsSubmittingDisp(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Master Production Stock</h2>
            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              Bakery HQ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Central bakery inventory ready for fleet dispatch</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (products.length > 0) setProdProductId(products[0].id);
              setShowProductionModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Log Bake Run</span>
          </button>

          <button
            onClick={() => {
              if (vehicles.length > 0) setDispVehicleId(vehicles[0].id);
              if (products.length > 0) setDispProductId(products[0].id);
              setShowDispatchModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Load Van</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search bakery product or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Product</th>
              <th className="py-2.5 px-2">Category</th>
              <th className="py-2.5 px-2 text-right">Master Stock</th>
              <th className="py-2.5 px-2 text-right">Price</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStock.map((item) => {
              const isLow = item.quantity <= item.low_stock_threshold;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{item.product?.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.product?.sku}</div>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600">{item.product?.category}</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="font-bold text-sm text-slate-900">{item.quantity}</span>
                    <span className="text-[10px] text-slate-500 ml-1">units</span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                    GH₵{item.product?.unit_price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Sufficient
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Production Modal */}
      {showProductionModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Log Production Run (Oven Output)</h3>
            </div>

            <form onSubmit={handleRecordProduction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  value={prodProductId}
                  onChange={(e) => setProdProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Output Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={prodQuantity}
                  onChange={(e) => setProdQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Oven Batch Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Deck oven #2 - Fresh morning sourdough"
                  value={prodNotes}
                  onChange={(e) => setProdNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmittingProd ? 'Recording...' : 'Add to Master Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch / Load Van Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">Load Van with Master Stock</h3>
            </div>

            <form onSubmit={handleDispatchToVan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Fleet Vehicle</label>
                <select
                  value={dispVehicleId}
                  onChange={(e) => setDispVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.van_code} — {v.driver_name} ({v.license_plate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bakery Product</label>
                <select
                  value={dispProductId}
                  onChange={(e) => setDispProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {products.map((p) => {
                    const stock = masterStock.find((ms) => ms.product_id === p.id)?.quantity || 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (In Stock: {stock})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Load into Van</label>
                <input
                  type="number"
                  min="1"
                  value={dispQuantity}
                  onChange={(e) => setDispQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Route 1 morning stock replenishment"
                  value={dispNotes}
                  onChange={(e) => setDispNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDisp}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{isSubmittingDisp ? 'Transferring...' : 'Transfer to Van'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
