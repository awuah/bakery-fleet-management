import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Vehicle, Customer } from '../types/bakery';
import { Truck, Navigation, MapPin } from 'lucide-react';

interface FleetMapProps {
  vehicles: Vehicle[];
  customers: Customer[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

const TILE_LAYERS = {
  osm_standard: {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  carto_voyager: {
    name: 'Carto Voyager (OSM Roads)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  osm_humanitarian: {
    name: 'OSM Humanitarian Streets',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

type TileStyleKey = keyof typeof TILE_LAYERS;

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  customers,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const initialFitDoneRef = useRef(false);

  const [activeTileStyle, setActiveTileStyle] = useState<TileStyleKey>('osm_standard');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center to Accra, Ghana [5.6037, -0.1870]
      const map = L.map(mapContainerRef.current, {
        center: [5.6037, -0.1870],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Free Tile Layer (Zero API keys, zero fees, full street names)
      const currentLayerConfig = TILE_LAYERS[activeTileStyle];
      tileLayerRef.current = L.tileLayer(currentLayerConfig.url, {
        attribution: currentLayerConfig.attribution,
        maxZoom: currentLayerConfig.maxZoom,
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Tile Layer if user switches style
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentLayerConfig = TILE_LAYERS[activeTileStyle];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(currentLayerConfig.url, {
      attribution: currentLayerConfig.attribution,
      maxZoom: currentLayerConfig.maxZoom,
    }).addTo(map);
  }, [activeTileStyle]);

  // Plot and update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Plot Customer Stores
    customers.forEach((customer) => {
      const markerId = `cust-${customer.id}`;
      if (!markersRef.current[markerId]) {
        const shopIcon = L.divIcon({
          className: 'custom-shop-icon',
          html: `
            <div style="
              background: #ffffff;
              border: 2px solid #0284c7;
              color: #0284c7;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                <path d="M2 7h20"/>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([customer.lat, customer.lng], { icon: shopIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 4px; min-width: 190px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #0284c7; margin-bottom: 4px;">
              <span>🏪</span> ${customer.name}
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">📍 ${customer.address}</div>
            <div style="font-size: 11px; color: #1e293b;">👤 Contact: <b>${customer.contact_person || 'N/A'}</b></div>
            <div style="font-size: 11px; color: #64748b;">📞 ${customer.phone || 'N/A'}</div>
          </div>
        `);
        markersRef.current[markerId] = marker;
      }
    });

    // 2. Plot Fleet Vehicles
    vehicles.forEach((vehicle) => {
      const markerId = `veh-${vehicle.id}`;
      const isSelected = selectedVehicleId === vehicle.id;
      const statusColor = vehicle.status === 'on_route' ? '#059669' : vehicle.status === 'loading' ? '#d97706' : '#64748b';

      const vanIcon = L.divIcon({
        className: 'custom-van-icon',
        html: `
          <div style="position: relative; cursor: pointer;">
            <div style="
              background: #ffffff;
              border: 2px solid ${statusColor};
              color: #0f172a;
              padding: 4px 8px;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.18);
              font-family: system-ui;
              font-size: 11px;
              font-weight: 700;
              transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'};
              transition: all 0.3s ease;
            ">
              <span style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${statusColor};
                display: inline-block;
                box-shadow: 0 0 6px ${statusColor};
              "></span>
              <span>${vehicle.van_code}</span>
              <span style="font-size: 10px; color: #64748b; font-weight: 600;">${vehicle.speed_kmh.toFixed(0)} km/h</span>
            </div>
          </div>
        `,
        iconSize: [110, 36],
        iconAnchor: [55, 18],
      });

      if (!markersRef.current[markerId]) {
        const marker = L.marker([vehicle.current_lat, vehicle.current_lng], { icon: vanIcon }).addTo(map);
        marker.on('click', () => onSelectVehicle(vehicle.id));
        markersRef.current[markerId] = marker;
      } else {
        markersRef.current[markerId].setLatLng([vehicle.current_lat, vehicle.current_lng]);
        markersRef.current[markerId].setIcon(vanIcon);
      }

      markersRef.current[markerId].bindPopup(`
        <div style="font-family: system-ui; padding: 6px; min-width: 190px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 14px; color: #0f172a;">${vehicle.van_code}</span>
            <span style="
              background: ${statusColor}18;
              color: ${statusColor};
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            ">${vehicle.status.replace('_', ' ')}</span>
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">👤 Driver: <b>${vehicle.driver_name}</b></div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 3px;">📞 ${vehicle.driver_phone}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">🚗 Plate: <b class="font-mono text-slate-800">${vehicle.license_plate}</b></div>
          <div style="font-size: 11px; color: #64748b; display: flex; gap: 12px; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span>⚡ ${vehicle.battery_level}% Batt</span>
            <span>⏱️ ${vehicle.speed_kmh.toFixed(0)} km/h</span>
          </div>
        </div>
      `);
    });

    // Auto-fit bounds on first load if we have points
    if (!initialFitDoneRef.current && (vehicles.length > 0 || customers.length > 0)) {
      const allPoints: L.LatLngExpression[] = [
        ...vehicles.map((v) => [v.current_lat, v.current_lng] as L.LatLngExpression),
        ...customers.map((c) => [c.lat, c.lng] as L.LatLngExpression),
      ];
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        initialFitDoneRef.current = true;
      }
    }

    // Pan to selected vehicle if changed
    if (selectedVehicleId) {
      const selectedVeh = vehicles.find((v) => v.id === selectedVehicleId);
      if (selectedVeh) {
        map.panTo([selectedVeh.current_lat, selectedVeh.current_lng], { animate: true });
      }
    }
  }, [vehicles, customers, selectedVehicleId, onSelectVehicle]);

  // Recenter map on all fleet & customers
  const handleRecenterFleet = () => {
    if (!mapInstanceRef.current) return;
    const allPoints: L.LatLngExpression[] = [
      ...vehicles.map((v) => [v.current_lat, v.current_lng] as L.LatLngExpression),
      ...customers.map((c) => [c.lat, c.lng] as L.LatLngExpression),
    ];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left: Map Legend & Free OpenStreetMap Notice */}
      <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-md flex flex-col gap-2 max-w-xs">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-slate-900">Live Fleet Radar</span>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span> On Route
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Loading
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span> Customer
          </span>
        </div>

        {/* OpenStreetMap Zero Cost Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1 text-emerald-700 font-bold">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>OpenStreetMap • Zero API Fees</span>
          </div>
        </div>
      </div>

      {/* Top Right: Layer Switcher & Recenter Button */}
      <div className="absolute top-4 right-14 z-[500] flex items-center gap-2">
        {/* Recenter Button */}
        <button
          onClick={handleRecenterFleet}
          title="Fit all vans and shops on screen"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-md backdrop-blur-md transition cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-600" />
          <span>Fit Fleet</span>
        </button>

        {/* Map Tile Style Switcher */}
        <div className="flex items-center bg-white/95 rounded-xl border border-slate-200 shadow-md p-0.5 backdrop-blur-md">
          <button
            onClick={() => setActiveTileStyle('osm_standard')}
            title="Standard OpenStreetMap (High Detail Streets & Landmarks)"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              activeTileStyle === 'osm_standard'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OSM Streets
          </button>
          <button
            onClick={() => setActiveTileStyle('carto_voyager')}
            title="Carto Voyager (Soft Clean Streets)"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              activeTileStyle === 'carto_voyager'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clean
          </button>
          <button
            onClick={() => setActiveTileStyle('osm_humanitarian')}
            title="Humanitarian OSM (Bold Roads & Labels)"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              activeTileStyle === 'osm_humanitarian'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bold
          </button>
        </div>
      </div>

      {/* Bottom vehicle quick-switcher bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[500] flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
        {vehicles.map((v) => {
          const isSelected = selectedVehicleId === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelectVehicle(v.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all backdrop-blur-md shrink-0 border cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Truck className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-600'}`} />
              <span>{v.van_code}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-amber-600/30 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {v.driver_name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
