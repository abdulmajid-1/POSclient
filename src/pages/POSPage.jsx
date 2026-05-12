import { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../services/productService';
import { createSale } from '../services/saleService';
import { MdSearch, MdAdd, MdRemove, MdDelete, MdReceipt, MdPrint, MdClose, MdShoppingCart } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

const formatPKR = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

function InvoiceModal({ sale, onClose }) {
  const invoiceRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: invoiceRef, documentTitle: `Invoice-${sale.invoiceNumber}` });

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800">Invoice Preview</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary"><MdPrint size={16} /> Print / PDF</button>
            <button onClick={onClose} className="btn-secondary"><MdClose size={16} /></button>
          </div>
        </div>
        <div ref={invoiceRef} className="p-8 font-sans">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AB Traders</h1>
              <p className="text-slate-500 text-sm">Business Management Suite</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">INVOICE</p>
              <p className="text-slate-500 text-sm">{sale.invoiceNumber}</p>
              <p className="text-slate-500 text-sm">{new Date(sale.createdAt || Date.now()).toLocaleString('en-PK')}</p>
            </div>
          </div>
          {/* Customer */}
          {sale.customer?.name && sale.customer.name !== 'Walk-in Customer' && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Bill To</p>
              <p className="font-semibold text-slate-800">{sale.customer.name}</p>
              {sale.customer.phone && <p className="text-sm text-slate-500">{sale.customer.phone}</p>}
            </div>
          )}
          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-slate-600 font-semibold">Product</th>
                <th className="text-center py-2 text-slate-600 font-semibold">Qty</th>
                <th className="text-right py-2 text-slate-600 font-semibold">Unit Price</th>
                <th className="text-right py-2 text-slate-600 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{formatPKR(item.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">{formatPKR(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPKR(sale.subtotal)}</span></div>
              {sale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>- {formatPKR(sale.discount)}</span></div>}
              {sale.tax > 0 && <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatPKR(sale.tax)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
                <span>Total</span><span className="text-primary-600">{formatPKR(sale.total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Payment</span><span className="capitalize">{sale.paymentMethod}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            <p>Thank you for your business!</p>
            <p>AB Traders — Powered by AB Business Suite</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await getProducts({ search, limit: 50 });
      setProducts(data.products);
    } catch { toast.error('Failed to load products'); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addToCart = (product) => {
    if (product.quantity === 0) return toast.error('Out of stock');
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) return toast.error('Insufficient stock') || prev;
        return prev.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product._id, productName: product.name, unitPrice: product.salePrice, quantity: 1, maxQty: product.quantity }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      if (qty > i.maxQty) { toast.error('Insufficient stock'); return i; }
      return { ...i, quantity: qty };
    }));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountAmt = discountType === 'percentage' ? (subtotal * discount) / 100 : Number(discount);
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setLoading(true);
    try {
      const { data } = await createSale({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer,
        discount: Number(discount),
        discountType,
        taxRate: Number(taxRate),
        paymentMethod,
      });
      setInvoice(data.sale);
      setCart([]);
      setDiscount(0);
      setTaxRate(0);
      setCustomer({ name: 'Walk-in Customer', phone: '' });
      toast.success('Sale completed!');
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Sale failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in">
      {/* Left: Products */}
      <div className="flex-1 space-y-4 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">POS / Billing</h1>
          <p className="text-slate-500 text-sm">Click products to add to cart</p>
        </div>
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..." className="input pl-9" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {products.map((p) => (
            <button key={p._id} onClick={() => addToCart(p)}
              className={`p-3 text-left rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${p.quantity === 0 ? 'border-red-100 bg-red-50 opacity-60 cursor-not-allowed' : 'border-slate-100 bg-white hover:border-primary-200 hover:bg-primary-50'}`}>
              <div className="w-full h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-2 text-slate-300">
                <MdShoppingCart size={28} />
              </div>
              <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
              <p className="text-xs text-slate-400 truncate">{p.sku}</p>
              <p className="text-sm font-bold text-primary-600 mt-1">Rs {Number(p.salePrice).toLocaleString()}</p>
              <p className={`text-xs mt-0.5 ${p.quantity <= p.lowStockThreshold ? 'text-amber-500' : 'text-slate-400'}`}>
                {p.quantity} in stock
              </p>
            </button>
          ))}
          {products.length === 0 && <p className="col-span-full text-center text-slate-400 py-12">No products found</p>}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col card p-0 shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MdShoppingCart className="text-primary-600" /> Cart
            <span className="ml-auto badge-blue">{cart.length} items</span>
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-64 lg:max-h-none">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <MdShoppingCart size={48} />
              <p className="text-sm mt-2">Cart is empty</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{item.productName}</p>
                <p className="text-xs text-primary-600">Rs {Number(item.unitPrice).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"><MdRemove size={14} /></button>
                <input type="number" value={item.quantity} min={1} max={item.maxQty}
                  onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)}
                  className="w-10 text-center text-sm border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"><MdAdd size={14} /></button>
                <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center ml-1"><MdDelete size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Customer + Options */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Customer Name</label>
              <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="input text-xs py-1.5" />
            </div>
            <div>
              <label className="label text-xs">Phone</label>
              <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="input text-xs py-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Discount</label>
              <div className="flex gap-1">
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min={0} className="input text-xs py-1.5 flex-1" />
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="input text-xs py-1.5 w-14 px-1">
                  <option value="fixed">Rs</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label text-xs">Tax %</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min={0} className="input text-xs py-1.5" />
            </div>
          </div>
          <div>
            <label className="label text-xs">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input text-xs py-1.5">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>- {formatPKR(discountAmt)}</span></div>}
            {taxAmt > 0 && <div className="flex justify-between text-slate-500"><span>Tax ({taxRate}%)</span><span>{formatPKR(taxAmt)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-200">
              <span>Total</span><span className="text-primary-600">{formatPKR(total)}</span>
            </div>
          </div>

          <button id="checkout-btn" onClick={handleCheckout} disabled={loading || cart.length === 0}
            className="btn-success w-full justify-center text-base py-3">
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing...</span>
            ) : (<><MdReceipt size={18} /> Complete Sale</>)}
          </button>
        </div>
      </div>

      {invoice && <InvoiceModal sale={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
