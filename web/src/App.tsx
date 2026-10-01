import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { Product, MasterStock, Vehicle, VehicleStock, Customer, Delivery, StockMovement } from './types/bakery';
import { FleetMap } from './components/FleetMap';
import { MasterStockPanel } from './components/MasterStockPanel';
import { FleetStockPanel } from './components/FleetStockPanel';
import { StockActivityFeed } from './components/StockActivityFeed';
import { DeliveriesPanel } from './components/DeliveriesPanel';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { 
  Croissant, 
  Truck, 
  Package, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2,
  Shield,
  LogOut,
  User,
} from 'lucide-react';

interface AuthUser {
  username: string;
  role: string;
}

export function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('crust_fleet_auth') || sessionStorage.getItem('crust_fleet_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [masterStock, setMasterStock] = useState<MasterStock[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStock, setVehicleStock] = useState<VehicleStock[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'master_stock' | 'fleet_stock' | 'deliveries' | 'admin'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const handleLogout = () => {
    localStorage.removeItem('crust_fleet_auth');
    sessionStorage.removeItem('crust_fleet_auth');
    setCurrentUser(null);
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // Products
      const { data: prods } = await supabase.from('products').select('*').order('name');
      if (prods) setProducts(prods);

      // Master Stock
      const { data: mStock } = await supabase
        .from('master_stock')
        .select('*, product:products(*)')
        .order('quantity', { ascending: false });
      if (mStock) setMasterStock(mStock);

      // Vehicles
      const { data: vehs } = await supabase.from('vehicles').select('*').order('van_code');
      if (vehs) {
        setVehicles(vehs);
        if (vehs.length > 0 && !selectedVehicleId) {
          setSelectedVehicleId(vehs[0].id);
        }
      }

      // Vehicle Stock
      const { data: vStock } = await supabase
        .from('vehicle_stock')
        .select('*, product:products(*), vehicle:vehicles(*)');
      if (vStock) setVehicleStock(vStock);

      // Customers
      const { data: custs } = await supabase.from('customers').select('*').order('name');
      if (custs) setCustomers(custs);

      // Deliveries
      const { data: dels } = await supabase
        .from('deliveries')
        .select('*, vehicle:vehicles(*), customer:customers(*)')
        .order('delivered_at', { ascending: false })
        .limit(25);
      if (dels) setDeliveries(dels);

      // Movements
      const { data: movs } = await supabase
        .from('stock_movements')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false })
        .limit(40);
      if (movs) setMovements(movs);
    } catch (err) {
      console.error('Failed to load bakery data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!currentUser) return;

    fetchData();

    // Setup Supabase Realtime channel subscription
    const channel = supabase
      .channel('bakery_realtime_hub')
      // 1. Vehicle updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setVehicles((prev) =>
              prev.map((v) => (v.id === payload.new.id ? { ...v, ...payload.new } : v))
            );
          } else {
            fetchData();
          }
        }
      )
      // 2. Master stock changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'master_stock' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setMasterStock((prev) =>
              prev.map((ms) => (ms.id === payload.new.id ? { ...ms, ...payload.new } : ms))
            );
          } else {
            fetchData();
          }
        }
      )
      // 3. Products changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchData();
        }
      )
      // 4. Customers changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          fetchData();
        }
      )
      // 5. Vehicle stock changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicle_stock' },
        () => {
          fetchData();
        }
      )
      // 6. Deliveries
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries' },
        () => {
          fetchData();
        }
      )
      // 7. Stock movements
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_movements' },
        () => {
          fetchData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchData]);

  // If not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Aggregate stats
  const totalMasterStock = masterStock.reduce((sum, item) => sum + item.quantity, 0);
  const totalInTransitStock = vehicleStock.reduce((sum, item) => sum + item.current_quantity, 0);
  const totalDeliveredToday = deliveries.reduce((sum, d) => sum + d.total_items_delivered, 0);
  const totalRevenueToday = deliveries.reduce((sum, d) => sum + Number(d.total_value), 0);
  const activeVansCount = vehicles.filter((v) => v.status === 'on_route' || v.status === 'loading').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Croissant className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base lg:text-lg tracking-tight text-slate-900">
                  CRUST & FLEET
                </h1>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                  Bakery HQ
                </span>
              </div>
              <p className="text-xs text-slate-500">Master Stock & Fleet Distribution Control</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Radar
            </button>
            <button
              onClick={() => setActiveTab('master_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'master_stock'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Bakery
            </button>
            <button
              onClick={() => setActiveTab('fleet_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'fleet_stock'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Van Stock
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'deliveries'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deliveries
            </button>

            {/* Admin Management Tab */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-amber-800 bg-amber-100/60 hover:bg-amber-100 hover:text-amber-950'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin Center</span>
            </button>
          </div>

          {/* Status, User & Logout */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  realtimeStatus === 'connected' ? 'bg-emerald-600' : 'bg-amber-500'
                }`}></span>
              </span>
              <span className="text-slate-700 font-medium">
                {realtimeStatus === 'connected' ? 'Live' : 'Syncing...'}
              </span>
            </div>

            <button
              onClick={fetchData}
              title="Manual refresh"
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* User Session Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-800 hidden md:inline">{currentUser.username}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out from HQ"
                className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Stats Banner */}
      <section className="border-b border-slate-200 bg-white/70 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Master Stock */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Master Stock (HQ)</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {totalMasterStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
              </div>
            </div>
          </div>

          {/* Van Stock In-Transit */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">On-Road Transit</div>
              <div className="text-xl font-black text-sky-600 mt-0.5">
                {totalInTransitStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
              </div>
            </div>
          </div>

          {/* Active Vans */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Fleet</div>
              <div className="text-xl font-black text-emerald-600 mt-0.5">
                {activeVansCount} / {vehicles.length} <span className="text-xs font-normal text-slate-500">vans</span>
              </div>
            </div>
          </div>

          {/* Today's Deliveries & Revenue */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today's Deliveries</div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {totalDeliveredToday} <span className="text-xs font-normal text-slate-500">drops (${totalRevenueToday.toFixed(0)})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Areas */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Connecting to Bakery Central Database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Interactive Map & Van On-Road Stock (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  <div className="h-[420px]">
                    <FleetMap
                      vehicles={vehicles}
                      customers={customers}
                      selectedVehicleId={selectedVehicleId}
                      onSelectVehicle={setSelectedVehicleId}
                    />
                  </div>

                  <div className="h-[360px]">
                    <FleetStockPanel
                      vehicles={vehicles}
                      vehicleStock={vehicleStock}
                      selectedVehicleId={selectedVehicleId}
                      onSelectVehicle={setSelectedVehicleId}
                    />
                  </div>
                </div>

                {/* Right Column: Master Stock Inventory & Live Movements (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <div className="h-[420px]">
                    <MasterStockPanel
                      masterStock={masterStock}
                      products={products}
                      vehicles={vehicles}
                      onRefresh={fetchData}
                    />
                  </div>

                  <div className="h-[360px]">
                    <StockActivityFeed movements={movements} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="h-[76vh]">
                <FleetMap
                  vehicles={vehicles}
                  customers={customers}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                />
              </div>
            )}

            {activeTab === 'master_stock' && (
              <div className="h-[76vh]">
                <MasterStockPanel
                  masterStock={masterStock}
                  products={products}
                  vehicles={vehicles}
                  onRefresh={fetchData}
                />
              </div>
            )}

            {activeTab === 'fleet_stock' && (
              <div className="h-[76vh]">
                <FleetStockPanel
                  vehicles={vehicles}
                  vehicleStock={vehicleStock}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                />
              </div>
            )}

            {activeTab === 'deliveries' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[76vh]">
                <div className="lg:col-span-7 h-full">
                  <DeliveriesPanel deliveries={deliveries} />
                </div>
                <div className="lg:col-span-5 h-full">
                  <StockActivityFeed movements={movements} />
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                vehicles={vehicles}
                customers={customers}
                products={products}
                masterStock={masterStock}
                onRefresh={fetchData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 shadow-xs">
        Bakery Production & Realtime Fleet Logistics • Connected to Supabase Realtime • Driver Android Companion Sync Active
      </footer>
    </div>
  );
}

export default App;
