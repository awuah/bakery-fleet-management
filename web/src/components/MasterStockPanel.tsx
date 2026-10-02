import React, { useState, useEffect, useCallback } from 'react';
import type { MasterStock, Product, Vehicle, ProductCategory } from '../types/bakery';
import { supabase } from '../lib/supabase';
import { 
  Package, 
  Plus, 
  Truck, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Flame, 
  Tag, 
  FolderTree, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  RefreshCw 
} from 'lucide-react';

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

  // Categories State
  const [dbCategories, setDbCategories] = useState<ProductCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [deletingCat, setDeletingCat] = useState<ProductCategory | null>(null);
  const [reassignTargetCat, setReassignTargetCat] = useState<string>('Bread');
  const [categoryFeedback, setCategoryFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Other Modal states
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

  const fetchDbCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('bk_categories').select('*').order('name');
      if (data && !error) {
        setDbCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchDbCategories();
  }, [fetchDbCategories]);

  const showCatFeedback = (type: 'success' | 'error', text: string) => {
    setCategoryFeedback({ type, text });
    setTimeout(() => setCategoryFeedback(null), 4000);
  };

  // Combine categories from bk_categories table and any products
  const categoryNamesSet = new Set<string>();
  dbCategories.forEach((c) => categoryNamesSet.add(c.name));
  products.forEach((p) => {
    if (p.category) categoryNamesSet.add(p.category);
  });
  const categories = ['All', ...Array.from(categoryNamesSet)];

  const filteredStock = masterStock.filter((ms) => {
    const nameMatch =
      ms.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ms.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch =
      selectedCategory === 'All' ||
      ms.product?.category?.toLowerCase() === selectedCategory.toLowerCase();
    return nameMatch && catMatch;
  });

  // ==========================================
  // CATEGORY CRUD HANDLERS
  // ==========================================
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (dbCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showCatFeedback('error', `Category "${trimmed}" already exists.`);
      return;
    }

    setIsSubmittingCat(true);
    try {
      const { error } = await supabase.from('bk_categories').insert([
        {
          name: trimmed,
          description: newCatDesc.trim() || '',
        },
      ]);

      if (error) throw error;
      showCatFeedback('success', `Category "${trimmed}" created successfully.`);
      setNewCatName('');
      setNewCatDesc('');
      await fetchDbCategories();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add category';
      showCatFeedback('error', msg);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleUpdateCategory = async (cat: ProductCategory) => {
    const trimmed = editCatName.trim();
    if (!trimmed) return;

    try {
      const oldName = cat.name;
      const { error } = await supabase
        .from('bk_categories')
        .update({
          name: trimmed,
          description: editCatDesc.trim(),
        })
        .eq('id', cat.id);

      if (error) throw error;

      // If category name changed, update all products that used oldName
      if (oldName.toLowerCase() !== trimmed.toLowerCase()) {
        const { error: prodErr } = await supabase
          .from('bk_products')
          .update({ category: trimmed })
          .eq('category', oldName);
        if (prodErr) console.error('Error updating products category:', prodErr);

        if (selectedCategory === oldName) {
          setSelectedCategory(trimmed);
        }
      }

      showCatFeedback('success', `Category "${trimmed}" updated.`);
      setEditingCatId(null);
      await fetchDbCategories();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      showCatFeedback('error', msg);
    }
  };

  const confirmDeleteCategory = async (cat: ProductCategory) => {
    try {
      const catProducts = products.filter(
        (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
      );

      // If products exist, reassign them to selected target
      if (catProducts.length > 0) {
        const target = reassignTargetCat || 'Bread';
        const { error: prodErr } = await supabase
          .from('bk_products')
          .update({ category: target })
          .eq('category', cat.name);
        if (prodErr) throw prodErr;
      }

      // Delete from bk_categories
      const { error } = await supabase.from('bk_categories').delete().eq('id', cat.id);
      if (error) throw error;

      showCatFeedback(
        'success',
        `Category "${cat.name}" removed${
          catProducts.length > 0 ? ` and ${catProducts.length} product(s) reassigned to "${reassignTargetCat}".` : '.'
        }`
      );

      if (selectedCategory === cat.name) {
        setSelectedCategory('All');
      }

      setDeletingCat(null);
      await fetchDbCategories();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      showCatFeedback('error', msg);
    }
  };

  // ==========================================
  // PRODUCTION & DISPATCH HANDLERS
  // ==========================================
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log production';
      alert(`Error logging production: ${msg}`);
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const handleDispatchToVan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispVehicleId || !dispProductId || dispQuantity <= 0) return;

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch to van';
      alert(`Error dispatching to van: ${msg}`);
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

      {/* Filters & Category Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative min-w-[170px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bakery product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Manage Categories Action Button */}
        <button
          onClick={() => {
            setShowCategoryModal(true);
            setEditingCatId(null);
            setDeletingCat(null);
            setCategoryFeedback(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
          title="Create, rename, or manage bakery categories"
        >
          <FolderTree className="w-3.5 h-3.5 text-amber-700" />
          <span>Manage Categories</span>
        </button>
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
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No products found matching "{searchTerm}" {selectedCategory !== 'All' ? `in category "${selectedCategory}"` : ''}
                </td>
              </tr>
            ) : (
              filteredStock.map((item) => {
                const isLow = item.quantity <= item.low_stock_threshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.product?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.product?.sku}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {item.product?.category}
                      </span>
                    </td>
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MANAGE CATEGORIES MODAL                                   */}
      {/* ========================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Manage Product Categories</h3>
                  <p className="text-xs text-slate-500">Organize and group items under Master Production Stock</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCatId(null);
                  setDeletingCat(null);
                  setCategoryFeedback(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Feedback alert */}
              {categoryFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                    categoryFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span>{categoryFeedback.text}</span>
                  <button onClick={() => setCategoryFeedback(null)} className="opacity-70 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Add New Category Card */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                  <span>Create New Category</span>
                </div>
                <form onSubmit={handleAddCategory} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cakes, Meat Pies"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Birthday & snack cakes"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingCat || !newCatName.trim()}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isSubmittingCat ? 'Creating...' : 'Add Category'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories Table */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Current Categories ({dbCategories.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Click edit to rename • products update automatically
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Category Name</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-2 text-center">Products</th>
                        <th className="py-2.5 px-2 text-right">Master Stock</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dbCategories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No categories registered yet.
                          </td>
                        </tr>
                      ) : (
                        dbCategories.map((cat) => {
                          const isEditing = editingCatId === cat.id;
                          const isDeleting = deletingCat?.id === cat.id;
                          const catProducts = products.filter(
                            (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
                          );
                          const catStockUnits = masterStock
                            .filter((ms) => ms.product?.category?.toLowerCase() === cat.name.toLowerCase())
                            .reduce((sum, ms) => sum + ms.quantity, 0);

                          if (isEditing) {
                            return (
                              <tr key={cat.id} className="bg-amber-50/60">
                                <td colSpan={5} className="p-3 space-y-2">
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Rename Category: {cat.name}</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={editCatName}
                                      onChange={(e) => setEditCatName(e.target.value)}
                                      placeholder="Category Name"
                                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                                      required
                                    />
                                    <input
                                      type="text"
                                      value={editCatDesc}
                                      onChange={(e) => setEditCatDesc(e.target.value)}
                                      placeholder="Category Description"
                                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                                    />
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    Renaming will automatically update all <strong>{catProducts.length}</strong> assigned products in the database.
                                  </p>
                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCatId(null)}
                                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCategory(cat)}
                                      disabled={!editCatName.trim()}
                                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span>Save Changes</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          if (isDeleting) {
                            return (
                              <tr key={cat.id} className="bg-rose-50/70">
                                <td colSpan={5} className="p-3 space-y-2">
                                  <div className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Delete Category: "{cat.name}"?</span>
                                  </div>
                                  {catProducts.length > 0 ? (
                                    <div className="space-y-1.5 text-xs text-slate-700">
                                      <p>
                                        There are <strong>{catProducts.length} product(s)</strong> currently assigned to this category.
                                        Select a replacement category to safely reassign them:
                                      </p>
                                      <select
                                        value={reassignTargetCat}
                                        onChange={(e) => setReassignTargetCat(e.target.value)}
                                        className="px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
                                      >
                                        {dbCategories
                                          .filter((c) => c.id !== cat.id)
                                          .map((c) => (
                                            <option key={c.id} value={c.name}>
                                              Reassign products to: {c.name}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-600">
                                      No products are currently assigned to this category. It is safe to remove.
                                    </p>
                                  )}
                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setDeletingCat(null)}
                                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirmDeleteCategory(cat)}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Confirm Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={cat.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{cat.name}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate" title={cat.description || ''}>
                                {cat.description || <span className="text-slate-300 italic">No description</span>}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {catProducts.length}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">
                                {catStockUnits}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCatId(cat.id);
                                      setEditCatName(cat.name);
                                      setEditCatDesc(cat.description || '');
                                      setDeletingCat(null);
                                    }}
                                    title="Edit Category Name & Description"
                                    className="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingCat(cat);
                                      setEditingCatId(null);
                                      const other = dbCategories.find((c) => c.id !== cat.id);
                                      if (other) setReassignTargetCat(other.name);
                                    }}
                                    title="Delete Category"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <button
                onClick={fetchDbCategories}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Categories</span>
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCatId(null);
                  setDeletingCat(null);
                  setCategoryFeedback(null);
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl font-bold transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
