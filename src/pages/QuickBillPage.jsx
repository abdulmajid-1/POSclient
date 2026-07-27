import { useState, useRef } from 'react';
import { MdAdd, MdRemove, MdDelete, MdReceipt, MdPrint, MdClose, MdPerson, MdSettings, MdHistory } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import CustomerSelector from '../components/CustomerSelector';
import { InvoiceQRFooter } from '../components/InvoiceQR';

const round4 = (num) => Math.round((Number(num) || 0) * 10000) / 10000;
const formatSAR = (n) => `SAR ${round4(n).toLocaleString('en-SA')}`;

function InvoiceModal({ sale, onClose }) {
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale.invoiceNumber}`,
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-4xl w-full">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800 text-xl">Tax Invoice Preview</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary">
              <MdPrint size={16} /> Print / PDF
            </button>
            <button onClick={onClose} className="btn-secondary">
              <MdClose size={16} />
            </button>
          </div>
        </div>

        <div ref={invoiceRef} className="print-container p-8 text-sm text-slate-800 bg-white">
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
              <p className="font-semibold">{new Date(sale.createdAt).toLocaleDateString()}</p>
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
                  <td className="p-2 text-center">{formatSAR(item.tax || 0)}</td>
                  <td className="p-2 text-center font-semibold">{formatSAR(item.totalPrice + (item.tax || 0))}</td>
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
            </div>
          </div>

          {/* QR Code Footer — only works for saved sales */}
          {sale._id ? (
            <InvoiceQRFooter saleId={sale._id} />
          ) : (
            <div className="text-center text-[10px] text-slate-400 border-t pt-4 mt-4">
              <p>AB Traders — Powered POS System</p>
              <p>Thank you for your business / شكراً لتعاملكم معنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuickBillPage() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '', vatNumber: '' });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [taxRate, setTaxRate] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [invoice, setInvoice] = useState(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

  const addRow = () => {
    const id = `item-${Date.now()}`;
    setCart((prev) => [...prev, {
      productId: id,
      productName: '',
      unitPrice: 0,
      quantity: 1,
      discount: 0,
      discountType: 'fixed'
    }]);
  };

  const updateItem = (id, field, value) => {
    setCart(prev => prev.map(item => item.productId === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.productId !== id));

  const subtotal = cart.reduce((acc, item) => {
    const base = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
    const disc = item.discountType === 'percentage' ? (base * (Number(item.discount) || 0)) / 100 : (Number(item.discount) || 0);
    return acc + (base - disc);
  }, 0);

  const discountAmt = discountType === 'percentage' ? (subtotal * (Number(discount) || 0)) / 100 : (Number(discount) || 0);
  const taxAmt = ((subtotal - discountAmt) * (Number(taxRate) || 0)) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const handleGenerate = () => {
    if (cart.length === 0) return toast.error('Add at least one item');
    if (cart.some(i => !i.productName)) return toast.error('Some items are missing names');

    const finalSale = {
      invoiceNumber,
      customer,
      items: cart.map(i => {
        const base = Number(i.unitPrice) * Number(i.quantity);
        const disc = i.discountType === 'percentage' ? (base * Number(i.discount)) / 100 : Number(i.discount);
        const totalPrice = base - disc;
        return {
          ...i,
          totalPrice,
          tax: (totalPrice * taxRate) / 100
        };
      }),
      subtotal,
      discount: discountAmt,
      tax: taxAmt,
      taxRate,
      total,
      paymentMethod,
      createdAt: billDate
    };

    setInvoice(finalSale);
    toast.success('Invoice ready!');
  };

  const handleCustomerSelect = (c) => {
    setCustomer({ _id: c._id, name: c.name, phone: c.phone || '', vatNumber: c.vatNumber || '' });
    setShowCustomerSelector(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-xl"><MdReceipt size={28} /></div>
            Quick Bill Generator
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manual invoice creation for rapid documentation.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={addRow} className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary-700 transition-all shadow-xl shadow-primary-100">
            <MdAdd size={24} /> Add New Row
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col gap-6">
        {/* Table Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-100">
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-40">Unit Price</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-44">Quantity</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-52">Discount</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-40">Total</th>
                  <th className="p-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cart.map((item, idx) => {
                  const itemSub = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
                  const itemDisc = item.discountType === 'percentage' ? (itemSub * (Number(item.discount) || 0)) / 100 : (Number(item.discount) || 0);
                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <input
                          autoFocus={idx === cart.length - 1}
                          placeholder="What are you selling?"
                          value={item.productName}
                          onChange={e => updateItem(item.productId, 'productName', e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-slate-800 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">SAR</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItem(item.productId, 'unitPrice', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-xl text-sm font-black text-primary-600 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-1 shadow-md">
                          <button onClick={() => updateItem(item.productId, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))} className="w-8 h-8 flex items-center justify-center text-white hover:text-primary-400"><MdRemove size={18} /></button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(item.productId, 'quantity', e.target.value)}
                            className="w-10 bg-transparent text-center text-white font-black text-sm focus:outline-none"
                          />
                          <button onClick={() => updateItem(item.productId, 'quantity', (Number(item.quantity) || 0) + 1)} className="w-8 h-8 flex items-center justify-center text-white hover:text-primary-400"><MdAdd size={18} /></button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 bg-white border-2 border-slate-100 rounded-xl px-3 py-1.5 shadow-sm">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={e => updateItem(item.productId, 'discount', e.target.value)}
                            className="w-12 text-center font-black text-slate-800 focus:outline-none text-sm"
                          />
                          <select
                            value={item.discountType}
                            onChange={e => updateItem(item.productId, 'discountType', e.target.value)}
                            className="text-[10px] font-black text-primary-600 bg-slate-100 px-2 py-1 rounded-lg outline-none cursor-pointer"
                          >
                            <option value="fixed">SAR</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-8">
                        <span className="text-lg font-black text-slate-900">{formatSAR(itemSub - itemDisc)}</span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => removeItem(item.productId)} className="w-10 h-10 flex items-center justify-center text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <MdDelete size={22} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <div className="p-6 bg-slate-50 rounded-full mb-4"><MdReceipt size={64} className="opacity-20" /></div>
                        <p className="text-xl font-black">No items added yet</p>
                        <button onClick={addRow} className="mt-4 text-primary-600 font-bold hover:underline flex items-center gap-2">
                          <MdAdd /> Click here to add your first item
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Settings & Summary Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          {/* Customer & Info */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <MdPerson className="text-primary-600" size={24} />
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Customer Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                <div className="relative">
                  <input
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, _id: undefined, name: e.target.value })}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Walk-in Customer"
                  />
                  <button onClick={() => setShowCustomerSelector(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white shadow-sm rounded-lg text-primary-600 hover:scale-110 transition-transform">
                    <MdPerson size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <input
                  value={customer.phone}
                  onChange={e => setCustomer({ ...customer, _id: undefined, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="05x..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">VAT Number</label>
                <input
                  value={customer.vatNumber}
                  onChange={e => setCustomer({ ...customer, _id: undefined, vatNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="31xx..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-primary-600 flex items-center gap-1">
                  <MdHistory /> Invoice #
                </label>
                <input
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border-none rounded-2xl font-black text-emerald-400 focus:ring-2 focus:ring-emerald-500 transition-all tracking-widest"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bill Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary & Actions */}
          <div className="bg-slate-900 rounded-3xl shadow-xl p-6 flex flex-col justify-between text-white border border-slate-800">
            <div className="space-y-4">
              <div className="flex justify-between items-center opacity-60">
                <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                <span className="font-bold">{formatSAR(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2 border-y border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Discount</span>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                    <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-16 bg-transparent text-center font-black text-amber-400 focus:outline-none" />
                    <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="bg-white/10 text-[10px] font-black p-1 rounded-lg outline-none">
                      <option value="fixed">SAR</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tax (VAT)</span>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                    <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-12 bg-transparent text-center font-black text-primary-400 focus:outline-none" />
                    <span className="text-xs font-black pr-2">%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Grand Total</span>
                  <span className="text-4xl font-black text-emerald-400 tracking-tighter">{formatSAR(total)}</span>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} className="mt-6 w-full bg-emerald-500 text-slate-900 font-black text-xl py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              <MdReceipt size={28} /> Print Invoice Now
            </button>
          </div>
        </div>
      </div>

      {invoice && <InvoiceModal sale={invoice} onClose={() => setInvoice(null)} />}
      {showCustomerSelector && (
        <CustomerSelector onSelect={handleCustomerSelect} onClose={() => setShowCustomerSelector(false)} />
      )}
    </div>
  );
}
