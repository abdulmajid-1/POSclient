import { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../services/productService';
import { createSale } from '../services/saleService';
import { MdSearch, MdAdd, MdRemove, MdDelete, MdReceipt, MdPrint, MdClose, MdShoppingCart } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

const formatPKR = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;


// function InvoiceModal({ sale, onClose }) {
//   const invoiceRef = useRef();
//   const handlePrint = useReactToPrint({
//     contentRef: invoiceRef,
//     documentTitle: `Invoice-${sale.invoiceNumber}`,
//   });

//   return (
//     <div className="modal-overlay">
//       <div className="modal-box max-w-4xl w-full">

//         {/* Header Actions */}
//         <div className="flex items-center justify-between p-4 border-b no-print">
//           <h2 className="font-bold text-slate-800">Invoice Preview</h2>
//           <div className="flex gap-2">
//             <button onClick={handlePrint} className="btn-primary">
//               <MdPrint size={16} /> Print / PDF
//             </button>
//             <button onClick={onClose} className="btn-secondary">
//               <MdClose size={16} />
//             </button>
//           </div>
//         </div>

//         {/* INVOICE CONTENT */}
//         <div ref={invoiceRef} className="p-8 text-sm text-slate-800">
//           {/* TITLE */}
//           <div className="grid grid-cols-3 items-center mb-6">

//             {/* LEFT SIDE (English) */}
//             <div className="text-left">
//               <h1 className="text-lg font-bold">
//                 Ewan Al-Hazm Trading Establishment
//               </h1>

//               <h2>Address : As Saadah, OAJA4419، 4419 ابن الحدادية، 9624, Al-Kharj 16443, Saudi Arabia</h2>
//               <h2>Mobile: 059 571 7520</h2>

//             </div>

//             {/* CENTER */}
//             <div className="text-center">
//               <h1 className="text-2xl font-bold">TAX INVOICE</h1>
//               <p className="text-slate-500 text-sm">فاتورة ضريبية</p>
//               <p className="text-xs text-slate-500">
//                 VAT No: 313147090700003
//               </p>

//             </div>

//             {/* RIGHT SIDE (Arabic) */}
//             <div className="text-right">
//               <h1 className="text-lg font-bold">
//                 مؤسسة ايوان الحزم التجارية
//               </h1>
//               <p className="text-xs text-slate-500">
//                 رقم ضريبة : 313147090700003
//               </p>
//             </div>

//           </div>


//           {/* TOP SECTION */}
//           <div className="grid grid-cols-2 gap-6 mb-6">

//             {/* FROM */}
//             <div className="p-4 border rounded-lg">
//               <p className="font-bold mb-2">From</p>
//               <p className="font-semibold">مؤسسة ايوان الحزم التجارية</p>
//               <p className="text-xs text-slate-400">VAT: 313147090700003</p>
//             </div>

//             {/* TO */}
//             <div className="p-4 border rounded-lg">
//               <p className="font-bold mb-2">To</p>
//               <p className="font-semibold">Customer : {sale.customer?.name || "Walk-in Customer"}</p>
//               {sale.customer?.phone && (
//                 <p className="text-slate-500">Mobile: {sale.customer.phone}</p>
//               )}
//             </div>

//           </div>

//           {/* INVOICE META */}
//           <div className="grid grid-cols-3 gap-4 mb-6 text-xs">

//             <div className="border p-3 rounded">
//               <p className="text-slate-500">Invoice No</p>
//               <p className="font-semibold">{sale.invoiceNumber}</p>
//             </div>

//             <div className="border p-3 rounded">
//               <p className="text-slate-500">Date</p>
//               <p className="font-semibold">
//                 {new Date(sale.createdAt || Date.now()).toLocaleString()}
//               </p>
//             </div>

//             <div className="border p-3 rounded">
//               <p className="text-slate-500">Currency</p>
//               <p className="font-semibold">SAR</p>
//             </div>

//           </div>

//           {/* TABLE */}
//           <table className="w-full border text-xs mb-6">
//             <thead className="bg-slate-100">
//               <tr>
//                 <th className="p-2 text-left">No. </th>
//                 <th className="p-2 text-left">Product Name</th>
//                 <th className="p-2">Unit Price</th>
//                 <th className="p-2">Qty</th>
//                 <th className="p-2">Subtotal</th>
//                 <th className="p-2">VAT %</th>
//                 <th className="p-2">VAT Amt</th>
//                 <th className="p-2">Total inc VAT</th>
//               </tr>
//             </thead>

//             <tbody>
//               {sale.items.map((item, i) => (
//                 <tr key={i} className="border-t">

//                   {/* No. column */}
//                   <td className="p-2 text-center">{i + 1}</td>

//                   <td className="p-2">{item.productName}</td>

//                   <td className="p-2 text-center">
//                     {formatPKR(item.unitPrice)}
//                   </td>

//                   <td className="p-2 text-center">
//                     {item.quantity}
//                   </td>

//                   <td className="p-2 text-center">
//                     {formatPKR(item.totalPrice)}
//                   </td>

//                   <td className="p-2 text-center">
//                     {sale.taxRate || 0}%
//                   </td>

//                   <td className="p-2 text-center">
//                     {formatPKR(sale.tax || 0)}
//                   </td>

//                   <td className="p-2 text-center font-semibold">
//                     {formatPKR(item.totalPrice + (sale.tax || 0))}
//                   </td>

//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* SUMMARY */}
//           <div className="flex justify-end mb-6">
//             <div className="w-80 border rounded p-4 text-xs space-y-2">

//               <div className="flex justify-between">
//                 <span>Subtotal</span>
//                 <span>{formatPKR(sale.subtotal)}</span>
//               </div>

//               {sale.discount > 0 && (
//                 <div className="flex justify-between text-red-500">
//                   <span>Discount</span>
//                   <span>- {formatPKR(sale.discount)}</span>
//                 </div>
//               )}

//               <div className="flex justify-between">
//                 <span>VAT</span>
//                 <span>{formatPKR(sale.tax)}</span>
//               </div>

//               <div className="flex justify-between font-bold border-t pt-2">
//                 <span>Grand Total</span>
//                 <span className="text-primary-600">{formatPKR(sale.total)}</span>
//               </div>

//               <div className="flex justify-between text-slate-500">
//                 <span>Payment</span>
//                 <span className="capitalize">{sale.paymentMethod}</span>
//               </div>

//             </div>
//           </div>

//           {/* AMOUNT IN WORDS */}
//           {/* <div className="mb-6 text-xs border p-3 rounded">
//             <p className="text-slate-500">Amount in Words</p>
//             <p className="font-medium">
//               {sale.amountInWords || "Not available"}
//             </p>
//           </div> */}

//           {/* FOOTER */}
//           <div className="text-center text-[10px] text-slate-400 border-t pt-4">
//             <p>AB Traders - Powered POS System</p>
//             <p>Thank you for your business</p>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }

function InvoiceModal({ sale, onClose }) {
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale.invoiceNumber}`,
  });

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-4xl w-full">

        {/* HEADER ACTIONS */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800">Invoice Preview</h2>

          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary">
              <MdPrint size={16} /> Print / PDF
            </button>

            <button onClick={onClose} className="btn-secondary">
              <MdClose size={16} />
            </button>
          </div>
        </div>

        {/* INVOICE CONTENT */}
        <div ref={invoiceRef} className="p-8 text-sm text-slate-800">

          {/* TITLE SECTION */}
          <div className="grid grid-cols-3 items-center mb-6">

            {/* LEFT - ENGLISH */}
            <div className="text-left">
              <h1 className="text-lg font-bold">
                Ewan Al-Hazm Trading Establishment
              </h1>
              <p className="text-xs text-slate-500">
                Address: As Saadah, OAJA4419, Al-Kharj 16443, Saudi Arabia
              </p>
              <p className="text-xs text-slate-500">
                Mobile: 059 571 7520
              </p>
            </div>

            {/* CENTER */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">TAX INVOICE</h1>
              <p className="text-slate-500 text-sm">فاتورة ضريبية</p>
              <p className="text-xs text-slate-500">
                VAT No: 313147090700003
              </p>
            </div>

            {/* RIGHT - ARABIC */}
            <div className="text-right">
              <h1 className="text-lg font-bold">
                مؤسسة ايوان الحزم التجارية
              </h1>
              <p className="text-xs text-slate-500">
                العنوان: السعادة، الخرج، السعودية
              </p>
              <p className="text-xs text-slate-500">
                الجوال:٠٥٩٥٧١٧٥٢٠
              </p>
            </div>

          </div>

          {/* TOP SECTION */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* FROM */}
            <div className="p-4 border rounded-lg">
              <p className="font-bold mb-2">From / من</p>

              <p className="font-semibold">
                Ewan Al-Hazm Trading Establishment
              </p>

              <p className="text-xs text-slate-400">
                مؤسسة ايوان الحزم التجارية
              </p>

              <p className="text-xs text-slate-400">
                VAT / ضريبة: 313147090700003
              </p>
            </div>

            {/* TO */}
            <div className="p-4 border rounded-lg">
              <p className="font-bold mb-2">To / إلى</p>

              <p className="font-semibold">
                Customer / العميل: {sale.customer?.name || "Walk-in Customer"}
              </p>

              {sale.customer?.phone && (
                <p className="text-slate-500">
                  Mobile / الجوال: {sale.customer.phone}
                </p>
              )}
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
              <p className="font-semibold">
                {new Date(sale.createdAt || Date.now()).toLocaleString()}
              </p>
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

                  <td className="p-2 text-center">
                    {formatPKR(item.unitPrice)}
                  </td>

                  <td className="p-2 text-center">
                    {item.quantity}
                  </td>

                  <td className="p-2 text-center">
                    {formatPKR(item.totalPrice)}
                  </td>

                  <td className="p-2 text-center">
                    {sale.taxRate || 0}%
                  </td>

                  <td className="p-2 text-center">
                    {formatPKR(sale.tax || 0)}
                  </td>

                  <td className="p-2 text-center font-semibold">
                    {formatPKR(item.totalPrice + (sale.tax || 0))}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {/* SUMMARY */}
          <div className="flex justify-end mb-6">

            <div className="w-80 border rounded p-4 text-xs space-y-2">

              <div className="flex justify-between">
                <span>Subtotal / المجموع</span>
                <span>{formatPKR(sale.subtotal)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount / الخصم</span>
                  <span>- {formatPKR(sale.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>VAT / الضريبة</span>
                <span>{formatPKR(sale.tax)}</span>
              </div>

              <div className="flex justify-between font-bold border-t pt-2">
                <span>Grand Total / الإجمالي</span>
                <span className="text-primary-600">
                  {formatPKR(sale.total)}
                </span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Payment / الدفع</span>
                <span className="capitalize">{sale.paymentMethod}</span>
              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="text-center text-[10px] text-slate-400 border-t pt-4">
            <p>AB Traders - Powered POS System</p>
            <p>Thank you for your business / شكراً لتعاملكم معنا</p>
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
  const [taxRate, setTaxRate] = useState(15);
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

  // const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const subtotal = (Array.isArray(cart) ? cart : []).reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0
  );
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
  const cartEndRef = useRef(null);

  // auto scroll when cart updates
  useEffect(() => {
    if (cartEndRef.current) {
      cartEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [cart]);
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
      {/* Right: Cart */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col card p-0 shrink-0 h-[90vh]">

        {/* Header */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MdShoppingCart className="text-primary-600" />
            Cart
            <span className="ml-auto badge-blue">{cart.length} items</span>
          </h2>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <MdShoppingCart size={48} />
              <p className="text-sm mt-2">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-primary-600">
                    Rs {Number(item.unitPrice).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
                  >
                    <MdRemove size={14} />
                  </button>

                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    max={item.maxQty}
                    onChange={(e) =>
                      updateQty(item.productId, parseInt(e.target.value) || 1)
                    }
                    className="w-10 text-center text-sm border border-slate-200 rounded-lg py-0.5"
                  />

                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
                  >
                    <MdAdd size={14} />
                  </button>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center ml-1"
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* 👇 THIS is the magic scroll anchor */}
          <div ref={cartEndRef} />
        </div>

        {/* Customer + Options */}
        <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Customer Name</label>
              <input
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                className="input text-xs py-1.5"
              />
            </div>

            <div>
              <label className="label text-xs">Phone</label>
              <input
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="input text-xs py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Discount</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min={0}
                  className="input text-xs py-1.5 flex-1"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="input text-xs py-1.5 w-14 px-1"
                >
                  <option value="fixed">Rs</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>

            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              min={0}
              className="input text-xs py-1.5"
            />
          </div>

          <div>
            <label className="label text-xs">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input text-xs py-1.5"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>- {formatPKR(discountAmt)}</span>
              </div>
            )}

            {taxAmt > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({taxRate}%)</span>
                <span>{formatPKR(taxAmt)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-200">
              <span>Total</span>
              <span className="text-primary-600">{formatPKR(total)}</span>
            </div>
          </div>

          <button
            id="checkout-btn"
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="btn-success w-full justify-center text-base py-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <MdReceipt size={18} /> Complete Sale
              </>
            )}
          </button>
        </div>
      </div>

      {invoice && <InvoiceModal sale={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
