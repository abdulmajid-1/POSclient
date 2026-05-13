import { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { getSuppliers, createSupplier } from "../services/supplierService";
import { getCategories, createCategory } from "../services/categoryService";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdInventory2 } from 'react-icons/md';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Stationery', 'Hardware', 'Other'];
const EMPTY_FORM = { name: '', sku: '', category: '', purchasePrice: '', salePrice: '', quantity: '', lowStockThreshold: 10, supplier: '', description: '' };
let searchText = "";


function ProductModal({ product, onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState(product || EMPTY_FORM);
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

          {/* QUANTITY */}
          <div className="grid grid-cols-2 gap-4">
            {field('Quantity', 'quantity', 'number', true)}
            {field('Low Stock Threshold', 'lowStockThreshold', 'number')}
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product object

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProducts({
        search,
        category: catFilter,
        supplier: supplierFilter,
        limit: 100,
      }); setProducts(data.products);
      setCategories(data.categories);
      setSuppliers(data.suppliers);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, catFilter, supplierFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
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
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
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
                      {p.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors text-slate-400"
                        >
                          <MdEdit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400"
                        >
                          <MdDelete size={16} />
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

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}
