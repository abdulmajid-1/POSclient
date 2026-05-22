import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../hooks/useProducts';
import { createProduct, updateProduct, deleteProduct } from '../services/productService';
import { getSuppliers, createSupplier } from "../services/supplierService";
import { getCategories, createCategory } from "../services/categoryService";
import { MdAdd, MdSearch, MdClose, MdInventory2 } from 'react-icons/md';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/SkeletonLoader';

const CATEGORIES = ['Electronics', 'Stationery', 'Hardware', 'Other'];
const EMPTY_FORM = { name: '', sku: '', category: '', purchasePrice: '', salePrice: '', quantity: '', lowStockThreshold: 10, supplier: '', description: '', baseUnit: 'unit', units: [] };
let searchText = "";


function ProductModal({ product, onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
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

  const field = (label, key, type = 'text', required = false) => (
    <div key={key}>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="input" required={required} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} />
    </div>
  );


  // 🔥 LOAD CATEGORIES and SUPPLIERS FROM BACKEND
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          getCategories(),
          getSuppliers(),
        ]);

        setCategories(catRes.data.data);
        setSuppliers(supRes.data.data);
      } catch (err) {
        console.log(err);
      }
    };

    loadData();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.sku || !form.category || !form.salePrice)
      return toast.error("Fill required fields");

    setLoading(true);

    try {
      if (isEdit) await updateProduct(product._id, form);
      else await createProduct(form);

      toast.success(`Product ${isEdit ? "updated" : "created"} successfully`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = () => {
    setForm({ ...form, units: [...form.units, { name: '', unitsPerBase: 1, sellingPrice: 0 }] });
  };

  const handleUpdateUnit = (index, field, value) => {
    const newUnits = [...form.units];
    newUnits[index][field] = value;
    setForm({ ...form, units: newUnits });
  };

  const handleRemoveUnit = (index) => {
    setForm({ ...form, units: form.units.filter((_, i) => i !== index) });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* NAME + SKU */}
          <div className="grid grid-cols-2 gap-4">
            {field('Product Name', 'name', 'text', true)}
            {field('SKU / Product Code', 'sku', 'text', true)}
          </div>

          {/* CATEGORY */}
          <div>
            <label className="label">
              Category <span className="text-red-500">*</span>
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="input"
              required
            >
              <option value="">Select category</option>

              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* ADD CATEGORY */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add new category"
                className="input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />

              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2"
                onClick={async () => {
                  const value = newCategory.trim();
                  if (!value) return;

                  try {
                    // 🔥 REAL BACKEND CALL (THIS WAS MISSING)
                    const res = await createCategory({
                      name: value,
                    });

                    const newCat = res.data.data;

                    // update dropdown
                    setCategories((prev) => [...prev, newCat]);

                    // auto select
                    setForm({ ...form, category: newCat._id });

                    setNewCategory("");
                    toast.success("Category added");
                  } catch (err) {
                    toast.error("Failed to add category");
                  }
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* PRICES */}
          <div className="grid grid-cols-2 gap-4">
            {field('Purchase Price (SAR)', 'purchasePrice', 'number', true)}
            {field('Sale Price (SAR)', 'salePrice', 'number', true)}
          </div>

          {/* QUANTITY AND BASE UNIT */}
          <div className="grid grid-cols-2 gap-4">
            {field('Stock Quantity (in Base Unit)', 'quantity', 'number', true)}
            {field('Base Unit (e.g. roll, box)', 'baseUnit', 'text', true)}
            {field('Low Stock Threshold', 'lowStockThreshold', 'number')}
          </div>

          {/* DYNAMIC SELLABLE UNITS */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Sellable Units (Optional)</label>
              <button type="button" onClick={handleAddUnit} className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded hover:bg-primary-100">
                + Add Unit
              </button>
            </div>

            {form.units.length === 0 && (
              <p className="text-xs text-slate-500">No alternate units. Product will be sold only in its base unit.</p>
            )}

            {form.units.map((u, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sub Unit Name</label>
                  <input type="text" value={u.name} onChange={(e) => handleUpdateUnit(i, 'name', e.target.value)} className="input text-xs py-1.5" placeholder="e.g. meter" required />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{u.name} in {form.baseUnit}</label>
                  <input type="number" value={u.unitsPerBase} onChange={(e) => handleUpdateUnit(i, 'unitsPerBase', Number(e.target.value))} className="input text-xs py-1.5" min="0.01" step="any" required />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Price per {u.name}</label>
                  <input type="number" value={u.sellingPrice} onChange={(e) => handleUpdateUnit(i, 'sellingPrice', Number(e.target.value))} className="input text-xs py-1.5" min="0" step="any" required />
                </div>


                <button type="button" onClick={() => handleRemoveUnit(i)} className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100 mb-[2px]">
                  <MdClose size={14} />
                </button>
              </div>
            ))}
            {form.units.length > 0 && form.baseUnit && (
              <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                Example conversion: 1 <span className="font-bold">{form.baseUnit}</span> = <span className="font-bold">{form.units[0]?.unitsPerBase || '?'} {form.units[0]?.name || '?'}</span>
              </div>
            )}
          </div>

          {/* {field('Supplier', 'supplier')} */}

          <div>
            <label className="label">Supplier</label>

            {/* dropdown */}
            <select
              value={form.supplier}
              onChange={(e) =>
                setForm({ ...form, supplier: e.target.value })
              }
              className="input"
            >
              <option value="">Select supplier</option>

              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* add supplier */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add new supplier"
                className="input"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
              />
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2"
                onClick={async () => {
                  const value = newSupplier.trim();
                  if (!value) return;

                  try {
                    const res = await createSupplier({
                      name: value,
                    });

                    const newSup = res.data.data;

                    setSuppliers((prev) => [...prev, newSup]);

                    setForm({ ...form, supplier: newSup._id });

                    setNewSupplier("");

                    toast.success("Supplier added");
                  } catch (err) {
                    toast.error("Failed to add supplier");
                  }
                }}
              >
                + Add
              </button>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [catFilter, setCatFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
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

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [catFilter, supplierFilter]);

  const { data: productData, isLoading, isFetching } = useProducts({
    search: debouncedSearch,
    category: catFilter,
    supplier: supplierFilter,
    page,
    limit,
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
        <button id="add-product-btn" onClick={() => setModal('add')} className="btn-primary">
          <MdAdd size={18} /> Add Product
        </button>
      </div>

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
