import { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../services/productService';
import { MdSearch, MdAdd, MdRemove, MdDelete, MdReceipt, MdPrint, MdClose, MdShoppingCart } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

function InvoiceModal({ sale, onClose }) {
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Fake-Invoice-${sale.invoiceNumber}`,
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-4xl w-full">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800">Fake Invoice Preview (No Sale Recorded)</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary">
              <MdPrint size={16} /> Print / PDF
            </button>
            <button onClick={onClose} className="btn-secondary">
              <MdClose size={16} />
            </button>
          </div>
        </div>

        <div ref={invoiceRef} className="p-8 text-sm text-slate-800">
          {/* TITLE SECTION */}
          <div className="grid grid-cols-3 items-center mb-6">
            <div className="text-left">
              <h1 className="text-lg font-bold">Ewan Al-Hazm Trading Establishment</h1>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Hand Tools - Equipment - Safety - Workshop Supplies
              </p>
              <p className="text-xs text-slate-500">Address: As Saadah, OAJA4419, Al-Kharj 16443, Saudi Arabia</p>
              <p className="text-xs text-slate-500">Mobile: 059 571 7520</p>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">TAX INVOICE</h1>
              <p className="text-slate-500 text-sm">فاتورة ضريبية</p>
              <p className="text-xs text-slate-500">VAT No: 313147090700003</p>
            </div>
            <div className="text-right">
              <h1 className="text-lg font-bold">مؤسسة ايوان الحزم التجارية</h1>
              <p className="text-[10px] font-semibold text-slate-600 mb-1">
                عدد يدوية - معدات - سلامة - لوازم ورش
              </p>
              <p className="text-xs text-slate-500">العنوان: السعادة، الخرج، السعودية</p>
              <p className="text-xs text-slate-500">الجوال:٠٥٩٥٧١٧٥٢٠</p>
            </div>
          </div>

          {/* TOP SECTION */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="p-4 border rounded-lg">
              <p className="font-bold mb-2">From / من</p>
              <p className="font-semibold">Ewan Al-Hazm Trading Establishment</p>
              <p className="text-xs text-slate-400">مؤسسة ايوان الحزم التجارية</p>
              <p className="text-xs text-slate-400">VAT / ضريبة: 313147090700003</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-bold mb-2">To / إلى</p>
              <p className="font-semibold">Customer / العميل: {sale.customer?.name || "Walk-in Customer"}</p>
              {sale.customer?.phone && <p className="text-slate-500">Mobile / الجوال: {sale.customer.phone}</p>}
              {sale.customer?.vatNumber && <p className="text-slate-500">VAT / ضريبة: {sale.customer.vatNumber}</p>}
            </div>
          </div>

          {/* INVOICE META */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
            <div className="border p-3 rounded">
              <p className="text-slate-500">Invoice No / رقم الفاتورة</p>
              <p className="font-semibold">{sale.invoiceNumber}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-slate-500">Date / التاريخ</p>
              <p className="font-semibold">{new Date().toLocaleString()}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-slate-500">Currency / العملة</p>
              <p className="font-semibold">SAR / ريال</p>
            </div>
          </div>

          {/* TABLE */}
          <table className="w-full border text-xs mb-6">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">No / رقم</th>
                <th className="p-2 text-left">Product / المنتج</th>
                <th className="p-2">Unit Price / سعر الوحدة</th>
                <th className="p-2">Qty / الكمية</th>
                <th className="p-2">Disc / خصم</th>
                <th className="p-2">Subtotal / الإجمالي</th>
                <th className="p-2">VAT % / الضريبة</th>
                <th className="p-2">VAT Amt / مبلغ الضريبة</th>
                <th className="p-2">Total / الإجمالي النهائي</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 text-center">{i + 1}</td>
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2 text-center">{formatSAR(item.unitPrice)}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-center text-red-500">
                    {item.discount > 0 ? (item.discountType === 'percentage' ? `${item.discount}%` : formatSAR(item.discount)) : '-'}
                  </td>
                  <td className="p-2 text-center">{formatSAR(item.totalPrice)}</td>
                  <td className="p-2 text-center">{sale.taxRate || 0}%</td>
                  <td className="p-2 text-center">{formatSAR(sale.tax || 0)}</td>
                  <td className="p-2 text-center font-semibold">{formatSAR(item.totalPrice + (sale.tax || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SUMMARY */}
          <div className="flex justify-end mb-6">
            <div className="w-80 border rounded p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Subtotal / المجموع</span>
                <span>{formatSAR(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount / الخصم</span>
                  <span>- {formatSAR(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT / الضريبة</span>
                <span>{formatSAR(sale.tax)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Grand Total / الإجمالي</span>
                <span className="text-primary-600">{formatSAR(sale.total)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount on Subtotal Bill / خصم الفاتورة الفرعي</span>
                  <span>- {formatSAR(sale.discount)}</span>
                </div>
              )}

              {(() => {
                const itemDiscSum = sale.items.reduce((acc, item) => {
                  const base = item.unitPrice * item.quantity;
                  const d = item.discountType === 'percentage' ? (base * item.discount) / 100 : item.discount;
                  return acc + (Number(d) || 0);
                }, 0);
                const totalDisc = itemDiscSum + (Number(sale.discount) || 0);
                
                if (totalDisc > 0) {
                  return (
                    <div className="flex justify-between text-red-600 font-bold border-t border-dashed pt-2 mt-2">
                      <span>Total Discount Given / إجمالي الخصم</span>
                      <span>- {formatSAR(totalDisc)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between text-slate-500 pt-2">
                <span>Payment / الدفع</span>
                <span className="capitalize">{sale.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t pt-4">
            <p>AB Traders - Fake Invoice Generator</p>
            <p>This is a non-commercial document</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FakeBillPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '', vatNumber: '' });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [taxRate, setTaxRate] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [invoice, setInvoice] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await getProducts({ search, page, limit: 20 });
      setProducts(data.products);
      setTotalPages(Math.ceil(data.total / 20));
    } catch { toast.error('Failed to load products'); }
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) => i.productId === product._id ? { ...i, quantity: (Number(i.quantity) || 0) + 1 } : i);
      }
      return [...prev, { 
        productId: product._id, 
        productName: product.name, 
        unitPrice: product.salePrice, 
        purchasePrice: product.purchasePrice,
        quantity: 1, 
        discount: 0,
        discountType: 'fixed',
        maxQty: 999999 
      }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty !== '' && qty < 0) return;
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  };

  const updateItemDiscount = (productId, disc, type) => {
    setCart((prev) => prev.map((i) => 
      i.productId === productId ? { ...i, discount: disc, discountType: type || i.discountType } : i
    ));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const subtotal = (Array.isArray(cart) ? cart : []).reduce(
    (s, i) => {
      const base = i.unitPrice * (Number(i.quantity) || 0);
      const itemDisc = (i.discountType === 'percentage') 
        ? (base * (Number(i.discount) || 0)) / 100 
        : Number(i.discount || 0);
      return s + (base - itemDisc);
    },
    0
  );
  const discountAmt = discountType === 'percentage' ? (subtotal * discount) / 100 : Number(discount);
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const handleGenerate = () => {
    if (cart.length === 0) return toast.error('Cart is empty');

    const fakeSale = {
      invoiceNumber: `FAKE-${Math.floor(1000 + Math.random() * 9000)}`,
      items: cart.filter(i => Number(i.quantity) > 0).map(i => {
        const base = i.unitPrice * Number(i.quantity);
        const itemDisc = i.discountType === 'percentage' ? (base * Number(i.discount)) / 100 : Number(i.discount);
        return {
          productName: i.productName,
          quantity: Number(i.quantity),
          unitPrice: i.unitPrice,
          discount: Number(i.discount) || 0,
          discountType: i.discountType || 'fixed',
          totalPrice: base - itemDisc
        };
      }),
      customer,
      subtotal,
      discount: discountAmt,
      tax: taxAmt,
      taxRate,
      total,
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    setInvoice(fakeSale);
    toast.success('Fake bill generated!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in">
      <div className="flex-1 space-y-4 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fake Bill Generator</h1>
          <p className="text-slate-500 text-sm">Create invoices without affecting inventory</p>
        </div>
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {products.map((p) => (
            <button key={p._id} onClick={() => addToCart(p)} className="p-3 text-left rounded-xl border border-slate-100 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 hover:border-primary-200 hover:bg-primary-50">
              <div className="w-full h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-2 text-slate-300">
                <MdShoppingCart size={28} />
              </div>
              <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
              <p className="text-[10px] font-bold text-blue-600 truncate">{p.sku}</p>
              <p className="text-sm font-black text-primary-600 mt-1">SAR {Number(p.salePrice).toLocaleString()}</p>
              <p className="text-[11px] text-slate-900 font-bold">Cost: SAR {Number(p.purchasePrice || 0).toLocaleString()}</p>
              <p className="text-xs mt-0.5 font-black text-emerald-700">
                {p.quantity} in stock
              </p>
            </button>
          ))}
          {products.length === 0 && <p className="col-span-full text-center text-slate-400 py-12">No products found</p>}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <div className="text-xs font-bold text-slate-600">
              Page {page} of {totalPages}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 flex flex-col card p-0 shrink-0 h-[90vh]">
        <div className="p-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <MdShoppingCart className="text-primary-600" />
            Cart
            <span className="ml-auto bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <MdShoppingCart size={48} />
              <p className="text-sm mt-2">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{item.productName}</p>
                  <div className="flex gap-2 text-[10px]">
                    <p className="text-primary-600 font-bold">Sale: {Number(item.unitPrice).toLocaleString()}</p>
                    <p className="text-slate-400 font-medium">Pur: {Number(item.purchasePrice || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.productId, (Number(item.quantity) || 0) - 1)} className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center transition-colors hover:bg-slate-800"><MdRemove size={16} /></button>
                    <input type="number" value={item.quantity} onChange={(e) => updateQty(item.productId, e.target.value === '' ? '' : parseInt(e.target.value))} className="w-12 text-center text-black text-sm font-bold border border-slate-300 rounded-lg py-1" />
                    <button onClick={() => updateQty(item.productId, (Number(item.quantity) || 0) + 1)} className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center transition-colors hover:bg-slate-800"><MdAdd size={16} /></button>
                    <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center ml-1"><MdDelete size={14} /></button>
                  </div>
                  
                  {/* Item Discount */}
                  <div className="flex items-center gap-1 bg-white border-2 border-slate-300 rounded-lg px-2 py-1 shadow-sm mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Disc:</span>
                    <input 
                      type="number" 
                      value={item.discount} 
                      onChange={(e) => updateItemDiscount(item.productId, e.target.value, item.discountType)}
                      className="w-12 text-sm text-center font-extrabold focus:outline-none text-black"
                    />
                    <select 
                      value={item.discountType}
                      onChange={(e) => updateItemDiscount(item.productId, item.discount, e.target.value)}
                      className="text-xs bg-transparent focus:outline-none font-black text-primary-700 appearance-none cursor-pointer"
                    >
                      <option value="fixed">SAR</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer + Options */}
        <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-3 lg:gap-4 p-1">
            <div>
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Customer Name</label>
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="input text-sm py-2 font-medium"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Phone Number</label>
              <input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="input text-sm py-2"
                placeholder="Phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4 p-1">
            <div className="col-span-1">
              <label className="label text-[11px] font-bold mb-1 text-slate-700">VAT Number</label>
              <input
                value={customer.vatNumber}
                onChange={(e) => setCustomer({ ...customer, vatNumber: e.target.value })}
                className="input text-sm py-2"
                placeholder="VAT Number"
              />
            </div>
            <div className="col-span-1">
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input text-sm py-2 font-medium"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4 p-1">
            <div>
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Global Discount</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input text-sm py-2 flex-1 text-black font-extrabold bg-amber-50 border-amber-200"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="input text-xs py-1 w-12 px-0 text-center font-bold"
                >
                  <option value="fixed">SAR</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="input text-sm py-2 font-bold"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 text-sm shadow-lg">
            <div className="flex justify-between opacity-80">
              <span>Subtotal</span>
              <span className="font-semibold">{formatSAR(subtotal)}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-amber-400 font-medium">
                <span>Discount on Subtotal Bill</span>
                <span>- {formatSAR(discountAmt)}</span>
              </div>
            )}

            {/* Total Discount Given (Items + Global) */}
            {(() => {
              const itemDiscSum = cart.reduce((acc, item) => {
                const base = item.unitPrice * (Number(item.quantity) || 0);
                const d = item.discountType === 'percentage' ? (base * (Number(item.discount) || 0)) / 100 : Number(item.discount || 0);
                return acc + (Number(d) || 0);
              }, 0);
              const totalDisc = itemDiscSum + (Number(discountAmt) || 0);
              if (totalDisc > 0) {
                return (
                  <div className="flex justify-between text-red-400 font-bold border-t border-slate-700 pt-1 mt-1">
                    <span>Total Discount Given</span>
                    <span>- {formatSAR(totalDisc)}</span>
                  </div>
                );
              }
              return null;
            })()}

            {taxAmt > 0 && (
              <div className="flex justify-between opacity-80">
                <span>Tax ({taxRate}%)</span>
                <span>{formatSAR(taxAmt)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-xl pt-2 border-t border-slate-700 mt-2">
              <span>Grand Total</span>
              <span className="text-emerald-400">{formatSAR(total)}</span>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={cart.length === 0} className="btn-success w-full justify-center text-base py-3">
            <MdReceipt size={18} /> Generate Fake Bill
          </button>
        </div>
      </div>

      {invoice && <InvoiceModal sale={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
