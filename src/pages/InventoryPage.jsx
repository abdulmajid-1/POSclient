import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../hooks/useProducts';
import { createProduct, updateProduct, deleteProduct, getProducts } from '../services/productService';
import { getSuppliers, createSupplier } from "../services/supplierService";
import { getCategories, createCategory } from "../services/categoryService";
import { MdAdd, MdSearch, MdClose, MdInventory2, MdWarning } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getLowStockProducts } from '../services/productService';
import { TableSkeleton } from '../components/SkeletonLoader';

const EMPTY_FORM = { name: '', sku: '', category: '', purchasePrice: '', salePrice: '', quantity: '', lowStockThreshold: 10, supplier: '', description: '', baseUnit: 'unit', units: [] };

// ── Reusable searchable select ──────────────────────────────────────────────
function SearchableSelect({ label, options, value, onChange, required, placeholder = 'Select...' }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input w-full flex items-center justify-between text-left"
      >
        <span className={selected ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[200] w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-primary-400 bg-slate-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">No results</div>
            ) : filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors flex items-center justify-between ${value === o.value ? 'bg-primary-50 font-bold text-primary-700' : 'text-slate-700'}`}
              >
                {o.label}
                {value === o.value && (
                  <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Product Modal ───────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [form, setForm] = useState(() => {
    if (product) {
      return {
        ...product,
        category: product.category?._id || product.category || '',
        supplier: product.supplier?._id || product.supplier || '',
        baseUnit: product.baseUnit || 'unit',
        units: product.units || [],
      };
    }
    return EMPTY_FORM;
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!product?._id;

  // ── Suggestions & Templates ──
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);
  const suggestRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isEdit) return;
    const fetchRecent = async () => {
      try {
        const res = await getProducts({ limit: 5 });
        setRecentProducts(res.data.products || []);
      } catch {}
    };
    fetchRecent();
  }, [isEdit]);

  useEffect(() => {
    if (!form.name || form.name.length < 2 || isEdit) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await getProducts({ search: form.name, limit: 8 });
        const list = res.data.products || [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch {}
    }, 280);
    return () => clearTimeout(timer);
  }, [form.name, isEdit]);

  const handleSuggestionSelect = (p) => {
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category?._id || p.category || '',
      supplier: p.supplier?._id || p.supplier || '',
      purchasePrice: p.purchasePrice ?? '',
      salePrice: p.salePrice ?? '',
      baseUnit: p.baseUnit || 'unit',
      units: (p.units || []).map(u => ({ name: u.name, unitsPerBase: u.unitsPerBase, sellingPrice: u.sellingPrice })),
      description: p.description || '',
      lowStockThreshold: p.lowStockThreshold ?? 10,
      quantity: '',   // intentionally blank — user must enter new stock qty
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Load categories + suppliers
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, supRes] = await Promise.all([getCategories(), getSuppliers()]);
        setCategories(catRes.data.data);
        setSuppliers(supRes.data.data);
      } catch {}
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.category || !form.salePrice) return toast.error('Fill required fields');
    setLoading(true);
    try {
      if (isEdit) await updateProduct(product._id, form);
      else await createProduct(form);
      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  const handleAddUnit = () => setForm({ ...form, units: [...form.units, { name: '', unitsPerBase: 1, sellingPrice: 0 }] });
  const handleUpdateUnit = (index, field, value) => {
    const u = [...form.units]; u[index][field] = value; setForm({ ...form, units: u });
  };
  const handleRemoveUnit = (index) => setForm({ ...form, units: form.units.filter((_, i) => i !== index) });

  const catOptions = categories.map(c => ({ value: c._id, label: c.name }));
  const supOptions = suppliers.map(s => ({ value: s._id, label: s.name }));

  const addCat = async () => {
    const v = newCategory.trim(); if (!v) return;
    try {
      const res = await createCategory({ name: v });
      const nc = res.data.data;
      setCategories(prev => [...prev, nc]);
      setForm(f => ({ ...f, category: nc._id }));
      setNewCategory('');
      toast.success('Category added');
    } catch { toast.error('Failed to add category'); }
  };

  const addSup = async () => {
    const v = newSupplier.trim(); if (!v) return;
    try {
      const res = await createSupplier({ name: v });
      const ns = res.data.data;
      setSuppliers(prev => [...prev, ns]);
      setForm(f => ({ ...f, supplier: ns._id }));
      setNewSupplier('');
      toast.success('Supplier added');
    } catch { toast.error('Failed to add supplier'); }
  };

  const hasRecent = !isEdit && recentProducts.length > 0;
  const hasSimilar = !isEdit && suggestions.length > 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box !max-w-7xl w-full !rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-scale-up" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{isEdit ? 'Update product details below' : 'Starred fields are required. Focus or search to use recent products as a template.'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><MdClose size={24} /></button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-8 grid grid-cols-4 gap-x-6 gap-y-5 flex-1">

            {/* ── Product Name (full width) + suggestions ── */}
            <div className="col-span-4" ref={suggestRef}>
              <label className="label font-bold text-slate-700">Product Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="input w-full font-bold text-slate-800"
                  placeholder="e.g. Stanley Screwdriver 8in"
                  required
                  autoFocus={!isEdit}
                />

                {!isEdit && showSuggestions && (hasSimilar || hasRecent) && (
                  <div className="absolute z-[200] w-full mt-1 bg-white border border-primary-200 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MdSearch size={14} className="text-primary-500" />
                        <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">
                          {hasSimilar ? "Similar Products (Search Matches)" : "Recently Added Templates"}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold">Click to auto-fill as template</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {(hasSimilar ? suggestions : recentProducts).map(p => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => handleSuggestionSelect(p)}
                          className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800 text-sm group-hover:text-primary-700">{p.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-bold">SKU: {p.sku}</span>
                                {p.category?.name && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">{p.category.name}</span>}
                                <span className="text-[10px] font-black text-emerald-600">SAR {Number(p.salePrice).toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400">Cost: SAR {Number(p.purchasePrice || 0).toLocaleString()}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-primary-600 bg-primary-100 px-2 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Apply Template ↵
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {!isEdit && <p className="text-[10px] text-slate-400 mt-1.5">💡 Focus/type to see suggestions & recent products. Selecting one auto-fills the form for quick adjustment.</p>}
            </div>

            {/* SKU */}
            <div className="col-span-2">
              <label className="label font-bold text-slate-700">SKU / Product Code <span className="text-red-500">*</span></label>
              <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input font-bold" placeholder="e.g. STAN-SD-8IN" required />
            </div>

            {/* Base Unit */}
            <div className="col-span-2">
              <label className="label font-bold text-slate-700">Base Unit <span className="text-red-500">*</span></label>
              <input type="text" value={form.baseUnit} onChange={(e) => setForm({ ...form, baseUnit: e.target.value })} className="input font-bold" placeholder="e.g. piece, roll, box" required />
            </div>

            {/* Category selection */}
            <div className="col-span-2">
              <SearchableSelect label="Category" required placeholder="Search & select category..." options={catOptions} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
              <div className="mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">+ Create New Category</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Category name" className="input text-xs py-1.5 flex-1 bg-white" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCat())} />
                  <button type="button" onClick={addCat} className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs rounded-lg transition-all whitespace-nowrap">+ Add</button>
                </div>
              </div>
            </div>

            {/* Supplier selection */}
            <div className="col-span-2">
              <SearchableSelect label="Supplier (Optional)" placeholder="Search & select supplier..." options={supOptions} value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} />
              <div className="mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">+ Create New Supplier</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Supplier name" className="input text-xs py-1.5 flex-1 bg-white" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSup())} />
                  <button type="button" onClick={addSup} className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs rounded-lg transition-all whitespace-nowrap">+ Add</button>
                </div>
              </div>
            </div>

            {/* Purchase Price */}
            <div className="col-span-1">
              <label className="label font-bold text-slate-700">Purchase Cost (SAR) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                onWheel={(e) => e.target.blur()}
                className="input font-black text-primary-600"
                min={0}
                step="any"
                required
              />
            </div>

            {/* Sale Price */}
            <div className="col-span-1">
              <label className="label font-bold text-slate-700">Selling Price (SAR) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                onWheel={(e) => e.target.blur()}
                className="input font-black text-emerald-600"
                min={0}
                step="any"
                required
              />
            </div>

            {/* Quantity */}
            <div className="col-span-1">
              <label className="label font-bold text-slate-700">Stock Quantity <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, quantity: Math.max(0, (Number(f.quantity) || 0) - 1) }))}
                  className="w-9 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg font-black text-lg transition-colors shrink-0"
                  title="Decrease by 1"
                >
                  -
                </button>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="input font-black text-center text-slate-900 dark:text-slate-100"
                  min={0}
                  step="any"
                  required
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, quantity: (Number(f.quantity) || 0) + 1 }))}
                  className="w-9 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg font-black text-lg transition-colors shrink-0"
                  title="Increase by 1"
                >
                  +
                </button>
              </div>
            </div>

            {/* Low Stock Threshold */}
            <div className="col-span-1">
              <label className="label font-bold text-slate-700">Alert Threshold</label>
              <input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                onWheel={(e) => e.target.blur()}
                className="input"
                min={0}
              />
            </div>

            {/* Description — full width */}
            <div className="col-span-4">
              <label className="label font-bold text-slate-700">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none h-20 font-medium" placeholder="Optional product description..." />
            </div>

            {/* Sellable Units — full width */}
            <div className="col-span-4 border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label mb-0 font-bold text-slate-800">Alternate Sellable Units <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <p className="text-[11px] text-slate-400 mt-0.5">Specify alternate quantities and pricing (e.g. roll vs meters, box vs pieces)</p>
                </div>
                <button type="button" onClick={handleAddUnit} className="flex items-center gap-1.5 text-xs font-black text-primary-600 bg-primary-50 px-3 py-2 rounded-xl hover:bg-primary-100 border border-primary-100 transition-all">
                  <MdAdd size={15} /> Add Alternate Unit
                </button>
              </div>

              {form.units.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {form.units.map((unit, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Unit Name</label>
                        <input
                          type="text"
                          value={unit.name}
                          placeholder="e.g. Box, Dozen"
                          onChange={(e) => handleUpdateUnit(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Units per Base ({form.baseUnit || 'unit'})</label>
                        <input
                          type="number"
                          value={unit.unitsPerBase}
                          placeholder="e.g. 12"
                          onChange={(e) => handleUpdateUnit(idx, 'unitsPerBase', Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                          min={0.001}
                          step="any"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Selling Price (SAR)</label>
                        <input
                          type="number"
                          value={unit.sellingPrice}
                          placeholder="e.g. 150"
                          onChange={(e) => handleUpdateUnit(idx, 'sellingPrice', Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-black text-emerald-600"
                          min={0}
                          step="any"
                          required
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveUnit(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg self-end">
                        <MdClose size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl font-medium">
                  No alternate units defined. The product will only sell in base units ({form.baseUnit || 'unit'}).
                </div>
              )}
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex gap-4 p-8 border-t bg-slate-50/50 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3.5 rounded-2xl justify-center font-bold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5 rounded-2xl justify-center font-black shadow-lg">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : isEdit ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [catFilter, setCatFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(null);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryClient = useQueryClient();

  // 300ms debounce on search — resets page to 1
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch low stock count for badge
  useEffect(() => {
    getLowStockProducts()
      .then((r) => setLowStockCount(r.data.count ?? r.data.products?.length ?? 0))
      .catch(() => {});
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [catFilter, supplierFilter, lowStockOnly]);

  const { data: productData, isLoading, isFetching } = useProducts({
    search: debouncedSearch,
    category: catFilter,
    supplier: supplierFilter,
    page,
    limit,
    ...(lowStockOnly ? { lowStock: 'true' } : {}),
  });

  const products = productData?.products || [];
  const categories = productData?.categories || [];
  const suppliers = productData?.suppliers || [];
  const total = productData?.total || 0;
  const totalPages = productData?.totalPages || Math.ceil(total / limit) || 1;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      invalidate();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="text-slate-500 text-sm">{total} products total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Low Stock Filter Button */}
          <button
            id="low-stock-filter-btn"
            onClick={() => setLowStockOnly(v => !v)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
              lowStockOnly
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200'
                : 'bg-white border-slate-200 text-slate-700 hover:border-red-400 hover:text-red-600'
            }`}
          >
            <MdWarning size={16} />
            Low Stock
            {lowStockCount !== null && lowStockCount > 0 && (
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                  lowStockOnly ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                }`}
              >
                {lowStockCount}
              </span>
            )}
          </button>
          <button id="add-product-btn" onClick={() => setModal('add')} className="btn-primary">
            <MdAdd size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Banner */}
      {lowStockOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
          <MdWarning size={20} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            Showing only low-stock items — {lowStockCount !== null ? `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} need restocking` : 'loading…'}
          </p>
          <button
            onClick={() => setLowStockOnly(false)}
            className="ml-auto text-xs font-black text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Filters */}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="input pl-9"
          />
        </div>

        {/* Supplier Filter */}
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="input sm:w-44"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input sm:w-44"
        >
          <option value="">All Categories</option>

          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <MdInventory2 size={48} className="mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm">Add your first product to get started</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th>
                  <th>Purchase Price</th><th>Sale Price</th><th>Stock</th>
                  <th>Supplier</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{p.baseUnit || 'unit'}</span>
                        {p.units && p.units.length > 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{p.units.length} units</span>
                        )}
                      </div>
                      {p.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-1">
                          {p.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="badge-blue">{p.sku}</span>
                    </td>

                    <td>
                      <span className="badge-gray">{p.category?.name}</span>
                    </td>

                    <td>SAR {Number(p.purchasePrice).toLocaleString()}</td>

                    <td className="font-semibold text-emerald-600">
                      SAR {Number(p.salePrice).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={
                          p.quantity <= p.lowStockThreshold ? "badge-red" : "badge-green"
                        }
                      >
                        {p.quantity}
                      </span>
                    </td>

                    <td className="text-slate-500">
                      {p.supplier?.name || "—"}
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all font-bold text-xs"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between card p-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
          >
            Previous
          </button>
          <div className="text-sm font-bold text-slate-600">
            Page {page} of {totalPages}
          </div>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
          >
            Next
          </button>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate(); }}
        />
      )}
    </div>
  );
}
