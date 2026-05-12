import { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdInventory2 } from 'react-icons/md';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverages', 'Stationery', 'Hardware', 'Cosmetics', 'Groceries', 'Other'];
const EMPTY_FORM = { name: '', sku: '', category: '', purchasePrice: '', salePrice: '', quantity: '', lowStockThreshold: 10, supplier: '', description: '' };

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const isEdit = !!product?._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.category || !form.salePrice) return toast.error('Fill required fields');
    setLoading(true);
    try {
      if (isEdit) await updateProduct(product._id, form);
      else await createProduct(form);
      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setLoading(false); }
  };

  const field = (label, key, type = 'text', required = false) => (
    <div key={key}>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="input" required={required} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><MdClose size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('Product Name', 'name', 'text', true)}
            {field('SKU / Product Code', 'sku', 'text', true)}
          </div>
          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" required>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Purchase Price (Rs)', 'purchasePrice', 'number', true)}
            {field('Sale Price (Rs)', 'salePrice', 'number', true)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Quantity', 'quantity', 'number', true)}
            {field('Low Stock Threshold', 'lowStockThreshold', 'number')}
          </div>
          {field('Supplier', 'supplier')}
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product object

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProducts({ search, category: catFilter, limit: 100 });
      setProducts(data.products);
      setCategories(data.categories);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, catFilter]);

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
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..." className="input pl-9" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input sm:w-44">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
                      {p.description && <div className="text-xs text-slate-400 truncate max-w-xs">{p.description}</div>}
                    </td>
                    <td><span className="badge-blue">{p.sku}</span></td>
                    <td><span className="badge-gray">{p.category}</span></td>
                    <td>Rs {Number(p.purchasePrice).toLocaleString()}</td>
                    <td className="font-semibold text-emerald-600">Rs {Number(p.salePrice).toLocaleString()}</td>
                    <td>
                      <span className={p.quantity <= p.lowStockThreshold ? 'badge-red' : 'badge-green'}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="text-slate-500">{p.supplier || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal(p)} className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors text-slate-400">
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400">
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
