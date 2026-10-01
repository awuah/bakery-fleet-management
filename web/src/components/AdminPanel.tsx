import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Vehicle, Customer, Product, MasterStock } from '../types/bakery';
import {
  Truck,
  Store,
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Phone,
  MapPin,
  Tag,
  AlertTriangle,
  RefreshCw,
  Sliders,
  User,
  Shield
} from 'lucide-react';

interface AdminPanelProps {
  vehicles: Vehicle[];
  customers: Customer[];
  products: Product[];
  masterStock: MasterStock[];
  onRefresh: () => void;
}

type AdminTab = 'vehicles' | 'customers' | 'inventory';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  vehicles,
  customers,
  products,
  masterStock,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    van_code: '',
    driver_name: '',
    driver_phone: '',
    license_plate: '',
    status: 'idle' as Vehicle['status'],
  });

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: '',
    lat: 5.6037,
    lng: -0.1870,
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Bread',
    unit_price: 3.50,
    initial_stock: 50,
    low_stock_threshold: 20,
  });

  const [isStockAdjustModalOpen, setIsStockAdjustModalOpen] = useState(false);
  const [adjustingStockItem, setAdjustingStockItem] = useState<{ product: Product; currentQty: number } | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [stockNotes, setStockNotes] = useState('');

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // ==========================================
  // VEHICLE / DRIVER CRUD
  // ==========================================
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      van_code: `VAN-0${vehicles.length + 1}`,
      driver_name: '',
      driver_phone: '+233 ',
      license_plate: '',
      status: 'idle',
    });
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehicleForm({
      van_code: veh.van_code,
      driver_name: veh.driver_name,
      driver_phone: veh.driver_phone,
      license_plate: veh.license_plate,
      status: veh.status,
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingVehicle) {
        // Update
        const { error } = await supabase
          .from('vehicles')
          .update({
            van_code: vehicleForm.van_code.trim().toUpperCase(),
            driver_name: vehicleForm.driver_name.trim(),
            driver_phone: vehicleForm.driver_phone.trim(),
            license_plate: vehicleForm.license_plate.trim().toUpperCase(),
            status: vehicleForm.status,
          })
          .eq('id', editingVehicle.id);

        if (error) throw error;
        showFeedback('success', `Vehicle ${vehicleForm.van_code} updated successfully`);
      } else {
        // Create new van
        const { error } = await supabase.from('vehicles').insert([
          {
            van_code: vehicleForm.van_code.trim().toUpperCase(),
            driver_name: vehicleForm.driver_name.trim(),
            driver_phone: vehicleForm.driver_phone.trim(),
            license_plate: vehicleForm.license_plate.trim().toUpperCase(),
            status: vehicleForm.status,
            current_lat: 5.6037 + (Math.random() - 0.5) * 0.02,
            current_lng: -0.1870 + (Math.random() - 0.5) * 0.02,
            heading: 0,
            speed_kmh: 0,
            battery_level: 100,
          },
        ]);

        if (error) throw error;
        showFeedback('success', `New vehicle ${vehicleForm.van_code} deployed into fleet`);
      }
      setIsVehicleModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save vehicle';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (veh: Vehicle) => {
    if (!window.confirm(`Are you sure you want to decommission van ${veh.van_code} (${veh.driver_name})?`)) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', veh.id);
      if (error) throw error;
      showFeedback('success', `Vehicle ${veh.van_code} decommissioned`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete vehicle';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CUSTOMER / SHOP CRUD
  // ==========================================
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      contact_person: '',
      phone: '+233 ',
      address: '',
      lat: 5.6037 + (Math.random() - 0.5) * 0.03,
      lng: -0.1870 + (Math.random() - 0.5) * 0.03,
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustomerForm({
      name: cust.name,
      contact_person: cust.contact_person || '',
      phone: cust.phone || '',
      address: cust.address,
      lat: cust.lat,
      lng: cust.lng,
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: customerForm.name.trim(),
            contact_person: customerForm.contact_person.trim() || null,
            phone: customerForm.phone.trim() || null,
            address: customerForm.address.trim(),
            lat: Number(customerForm.lat),
            lng: Number(customerForm.lng),
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
        showFeedback('success', `Customer ${customerForm.name} updated successfully`);
      } else {
        const { error } = await supabase.from('customers').insert([
          {
            name: customerForm.name.trim(),
            contact_person: customerForm.contact_person.trim() || null,
            phone: customerForm.phone.trim() || null,
            address: customerForm.address.trim(),
            lat: Number(customerForm.lat),
            lng: Number(customerForm.lng),
          },
        ]);

        if (error) throw error;
        showFeedback('success', `New customer ${customerForm.name} registered`);
      }
      setIsCustomerModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save customer';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    if (!window.confirm(`Are you sure you want to remove customer "${cust.name}"?`)) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('customers').delete().eq('id', cust.id);
      if (error) throw error;
      showFeedback('success', `Customer "${cust.name}" removed`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete customer';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // INVENTORY & PRODUCT CRUD
  // ==========================================
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: `PROD-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Bread',
      unit_price: 3.50,
      initial_stock: 50,
      low_stock_threshold: 20,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const mStock = masterStock.find((ms) => ms.product_id === prod.id);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      unit_price: Number(prod.unit_price),
      initial_stock: mStock ? mStock.quantity : 0,
      low_stock_threshold: mStock ? mStock.low_stock_threshold : 20,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Update product metadata
        const { error: prodErr } = await supabase
          .from('products')
          .update({
            name: productForm.name.trim(),
            sku: productForm.sku.trim().toUpperCase(),
            category: productForm.category,
            unit_price: Number(productForm.unit_price),
          })
          .eq('id', editingProduct.id);

        if (prodErr) throw prodErr;

        // Update threshold on master stock
        await supabase
          .from('master_stock')
          .update({
            low_stock_threshold: Number(productForm.low_stock_threshold),
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', editingProduct.id);

        showFeedback('success', `Product ${productForm.name} updated successfully`);
      } else {
        // Create product
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert([
            {
              name: productForm.name.trim(),
              sku: productForm.sku.trim().toUpperCase(),
              category: productForm.category,
              unit_price: Number(productForm.unit_price),
            },
          ])
          .select()
          .single();

        if (prodErr) throw prodErr;

        // Create master stock entry
        const { error: stockErr } = await supabase.from('master_stock').insert([
          {
            product_id: newProd.id,
            quantity: Number(productForm.initial_stock) || 0,
            low_stock_threshold: Number(productForm.low_stock_threshold) || 20,
            updated_at: new Date().toISOString(),
          },
        ]);

        if (stockErr) throw stockErr;

        // Log movement
        if (Number(productForm.initial_stock) > 0) {
          await supabase.from('stock_movements').insert([
            {
              movement_type: 'PRODUCTION_ADD',
              product_id: newProd.id,
              quantity: Number(productForm.initial_stock),
              from_location: 'BAKERY_OVEN',
              to_location: 'MASTER_STOCK',
              notes: 'Initial production batch setup',
            },
          ]);
        }

        showFeedback('success', `Product ${productForm.name} created with ${productForm.initial_stock} units in master stock`);
      }
      setIsProductModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete product "${prod.name}" and remove all its inventory?`)) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', prod.id);
      if (error) throw error;
      showFeedback('success', `Product "${prod.name}" removed from bakery catalog`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Stock Adjust
  const handleOpenStockAdjust = (prod: Product) => {
    const mStock = masterStock.find((ms) => ms.product_id === prod.id);
    const current = mStock ? mStock.quantity : 0;
    setAdjustingStockItem({ product: prod, currentQty: current });
    setNewStockQty(current);
    setStockNotes('Inventory count adjustment');
    setIsStockAdjustModalOpen(true);
  };

  const handleSaveStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockItem) return;
    setIsSubmitting(true);

    try {
      const diff = newStockQty - adjustingStockItem.currentQty;
      const { error } = await supabase
        .from('master_stock')
        .update({
          quantity: newStockQty,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', adjustingStockItem.product.id);

      if (error) throw error;

      // Log movement if changed
      if (diff !== 0) {
        await supabase.from('stock_movements').insert([
          {
            movement_type: diff > 0 ? 'PRODUCTION_ADD' : 'WASTAGE_ADJUSTMENT',
            product_id: adjustingStockItem.product.id,
            quantity: Math.abs(diff),
            from_location: diff > 0 ? 'BAKERY_OVEN' : 'MASTER_STOCK',
            to_location: diff > 0 ? 'MASTER_STOCK' : 'DISPOSED',
            notes: stockNotes || `Manual admin stock adjustment (${diff > 0 ? '+' : ''}${diff})`,
          },
        ]);
      }

      showFeedback('success', `Updated master stock for ${adjustingStockItem.product.name} to ${newStockQty} units`);
      setIsStockAdjustModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to adjust stock';
      showFeedback('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering lists
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.van_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.license_plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Admin Control Center</h2>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              Full Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage fleet vehicles, drivers, customer store destinations, and master bakery product inventory
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab('vehicles');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Vans & Drivers ({vehicles.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('customers');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('inventory');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory & SKUs ({products.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Bar (Search + Add Button) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'vehicles' ? 'vans, drivers, plates...' : activeTab === 'customers' ? 'stores, contacts, address...' : 'product name, SKU, category...'}`}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'vehicles' && (
            <button
              onClick={handleOpenAddVehicle}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Van & Driver</span>
            </button>
          )}

          {activeTab === 'customers' && (
            <button
              onClick={handleOpenAddCustomer}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Customer Store</span>
            </button>
          )}

          {activeTab === 'inventory' && (
            <button
              onClick={handleOpenAddProduct}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Product SKU</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            title="Refresh database records"
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. VANS & DRIVERS LISTING                                 */}
      {/* ========================================================= */}
      {activeTab === 'vehicles' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Van Identifier</th>
                  <th className="py-3.5 px-4">Assigned Driver</th>
                  <th className="py-3.5 px-4">Driver Phone</th>
                  <th className="py-3.5 px-4">License Plate</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">GPS / Coordinates</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No vehicles found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((veh) => {
                    const statusColors = {
                      on_route: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      loading: 'bg-amber-50 text-amber-700 border-amber-200',
                      idle: 'bg-slate-100 text-slate-700 border-slate-200',
                      returned: 'bg-blue-50 text-blue-700 border-blue-200',
                      maintenance: 'bg-rose-50 text-rose-700 border-rose-200',
                    }[veh.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <tr key={veh.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center font-black text-amber-800 text-xs">
                              {veh.van_code.replace('VAN-', '')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{veh.van_code}</div>
                              <div className="text-[10px] text-slate-400">Battery {veh.battery_level}%</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{veh.driver_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{veh.driver_phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                            {veh.license_plate}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors}`}>
                            {veh.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {veh.current_lat.toFixed(4)}, {veh.current_lng.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditVehicle(veh)}
                              title="Edit Van / Driver"
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(veh)}
                              title="Decommission Van"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CUSTOMERS / STORES LISTING                             */}
      {/* ========================================================= */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Customer / Shop Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Coordinates</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No customer stores found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                            <Store className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900">{cust.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {cust.contact_person || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {cust.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={cust.address}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {cust.lat.toFixed(4)}, {cust.lng.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditCustomer(cust)}
                            title="Edit Customer"
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(cust)}
                            title="Delete Customer"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INVENTORY & PRODUCTS LISTING                            */}
      {/* ========================================================= */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4">Master Stock (HQ)</th>
                  <th className="py-3.5 px-4">Alert Threshold</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No products found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const mStock = masterStock.find((ms) => ms.product_id === prod.id);
                    const qty = mStock ? mStock.quantity : 0;
                    const threshold = mStock ? mStock.low_stock_threshold : 20;
                    const isLow = qty <= threshold;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{prod.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{prod.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          GH₵{Number(prod.unit_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                              {qty}
                            </span>
                            <span className="text-[10px] text-slate-400">units</span>
                            {isLow && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-50 border border-amber-200 text-amber-700 rounded">
                                Low
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          Min {threshold} units
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenStockAdjust(prod)}
                              title="Direct Stock Adjustment"
                              className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              title="Edit Product Details"
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod)}
                              title="Delete Product"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT VEHICLE & DRIVER                      */}
      {/* ========================================================= */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingVehicle ? `Edit Van (${editingVehicle.van_code})` : 'Register New Fleet Van'}
                </h3>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Van Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAN-04"
                  value={vehicleForm.van_code}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, van_code: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Driver Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={vehicleForm.driver_name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Driver Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="+233 24 555 0104"
                  value={vehicleForm.driver_phone}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Vehicle License Plate
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GT-4482-24"
                  value={vehicleForm.license_plate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Operational Status
                </label>
                <select
                  value={vehicleForm.status}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as Vehicle['status'] })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                  <option value="idle">Idle (At Bakery HQ)</option>
                  <option value="loading">Loading Stock</option>
                  <option value="on_route">On Route (Active Deliveries)</option>
                  <option value="returned">Returned</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Save Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT CUSTOMER                             */}
      {/* ========================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCustomer ? `Edit Customer (${editingCustomer.name})` : 'Register New Customer Store'}
                </h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Customer / Shop Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Golden Harvest Cafe & Grocers"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ama Serwaa"
                  value={customerForm.contact_person}
                  onChange={(e) => setCustomerForm({ ...customerForm, contact_person: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+233 20 888 1234"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Delivery Address
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Plot 14, Airport Residential Area, Accra"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customerForm.lat}
                    onChange={(e) => setCustomerForm({ ...customerForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customerForm.lng}
                    onChange={(e) => setCustomerForm({ ...customerForm, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Save Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD / EDIT PRODUCT SKU                           */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProduct ? `Edit Product (${editingProduct.sku})` : 'Create New Product SKU'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourdough Rye Loaf"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BREAD-RYE-01"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="Bread">Bread</option>
                    <option value="Pastry">Pastry</option>
                    <option value="Specialty">Specialty</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Buns">Buns</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Unit Price (GH₵)
                  </label>
                  <div className="relative">
                    <span className="text-[11px] font-bold absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                      GH₵
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      required
                      value={productForm.unit_price}
                      onChange={(e) => setProductForm({ ...productForm, unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.low_stock_threshold}
                    onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Initial Master Stock (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.initial_stock}
                    onChange={(e) => setProductForm({ ...productForm, initial_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This quantity will be immediately seeded into the bakery production center.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DIRECT MASTER STOCK ADJUSTMENT                  */}
      {/* ========================================================= */}
      {isStockAdjustModalOpen && adjustingStockItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Adjust Master Stock
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">{adjustingStockItem.product.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsStockAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Current Stock (HQ):</span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  {adjustingStockItem.currentQty} units
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Stock Count (Units)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStockQty(Math.max(0, newStockQty - 10))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-700 flex items-center justify-center transition cursor-pointer"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 py-2 text-center font-mono font-black text-lg bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setNewStockQty(newStockQty + 10)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-700 flex items-center justify-center transition cursor-pointer"
                  >
                    +10
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Audit Reason / Notes
                </label>
                <input
                  type="text"
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="e.g. Physical stock count check"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Apply Count</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
