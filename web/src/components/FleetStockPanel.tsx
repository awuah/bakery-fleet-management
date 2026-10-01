import React from 'react';
import type { Vehicle, VehicleStock } from '../types/bakery';
import { Truck, Battery, Phone, Compass } from 'lucide-react';

interface FleetStockPanelProps {
  vehicles: Vehicle[];
  vehicleStock: VehicleStock[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

export const FleetStockPanel: React.FC<FleetStockPanelProps> = ({
  vehicles,
  vehicleStock,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const currentStocks = vehicleStock.filter((vs) => vs.vehicle_id === currentVehicle?.id);

  const totalLoaded = currentStocks.reduce((sum, s) => sum + s.loaded_quantity, 0);
  const totalDelivered = currentStocks.reduce((sum, s) => sum + s.delivered_quantity, 0);
  const totalRemaining = currentStocks.reduce((sum, s) => sum + s.current_quantity, 0);
  const deliveryRate = totalLoaded > 0 ? Math.round((totalDelivered / totalLoaded) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">Fleet On-Road Stock</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time inventory inside delivery vans</p>
        </div>

        {/* Van Selector Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          {vehicles.map((v) => {
            const isSelected = (currentVehicle?.id === v.id);
            return (
              <button
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.van_code}
              </button>
            );
          })}
        </div>
      </div>

      {currentVehicle && (
        <>
          {/* Driver & Van Status Card */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-700">
                  {currentVehicle.van_code.replace('VAN-', 'V')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{currentVehicle.driver_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      currentVehicle.status === 'on_route'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : currentVehicle.status === 'loading'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {currentVehicle.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {currentVehicle.driver_phone}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-700">{currentVehicle.license_plate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="flex items-center gap-1 text-slate-500">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <b className="text-slate-800">{currentVehicle.battery_level}%</b>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Compass className="w-3.5 h-3.5 text-sky-600" />
                  <b className="text-slate-800">{currentVehicle.speed_kmh.toFixed(0)} km/h</b>
                </span>
              </div>
            </div>

            {/* Quick KPI stats for this van */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Loaded Today</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">{totalLoaded} <span className="text-xs font-normal text-slate-500">pcs</span></div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-emerald-700 uppercase font-semibold">Delivered</div>
                <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{totalDelivered} <span className="text-xs font-normal text-slate-500">pcs</span></div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] text-amber-700 uppercase font-semibold">On-Board Now</div>
                <div className="text-lg font-extrabold text-amber-600 mt-0.5">{totalRemaining} <span className="text-xs font-normal text-slate-500">pcs</span></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Delivery Completion Progress</span>
                <span className="font-bold text-sky-700">{deliveryRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${deliveryRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Product stock breakdown for this van */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-2 text-center">Loaded</th>
                  <th className="py-2.5 px-2 text-center text-emerald-700">Delivered</th>
                  <th className="py-2.5 px-3 text-right text-amber-700">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentStocks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                      No stock currently assigned to this vehicle.
                    </td>
                  </tr>
                ) : (
                  currentStocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{stock.product?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{stock.product?.sku}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-700">
                        {stock.loaded_quantity}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                        {stock.delivered_quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-extrabold text-sm text-amber-600">
                          {stock.current_quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
