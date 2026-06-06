import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../hooks/useProducts';
import { createSale, updateSale } from '../services/saleService';
import { MdSearch, MdAdd, MdRemove, MdDelete, MdReceipt, MdPrint, MdClose, MdShoppingCart, MdPerson, MdPostAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import CustomerSelector from '../components/CustomerSelector';
import { CardSkeleton, InlineSpinner } from '../components/SkeletonLoader';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;


function InvoiceModal({ sale: initialSale, onClose }) {
  const invoiceRef = useRef();
  const [sale, setSale] = useState(initialSale);
  const [items, setItems] = useState(initialSale.items);
  const [discount, setDiscount] = useState(initialSale.discount || 0);
  const [discountType, setDiscountType] = useState(initialSale.discountType || 'fixed');
  const [taxRate, setTaxRate] = useState(initialSale.taxRate || 15);
  const [paymentMethod, setPaymentMethod] = useState(initialSale.paymentMethod || 'cash');
  const [isSaving, setIsSaving] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale.invoiceNumber}`,
  });

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Recalculate item total
    const item = newItems[index];
    const base = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
    const itemDisc = (item.discountType === 'percentage')
      ? (base * (Number(item.discount) || 0)) / 100
      : Number(item.discount || 0);
    item.totalPrice = base - itemDisc;

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, {
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'fixed',
      totalPrice: 0,
      productId: `custom-${Date.now()}`
    }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Recalculate Sale Totals
  const currentSubtotal = items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
  const currentDiscountAmt = discountType === 'percentage' ? (currentSubtotal * (Number(discount) || 0)) / 100 : Number(discount || 0);
  const currentTaxAmt = (currentSubtotal * (Number(taxRate) || 0)) / 100;
  const currentTotal = currentSubtotal + currentTaxAmt - currentDiscountAmt;

  const handleSave = async () => {
    if (items.length === 0) {
      return toast.error('Invoice must have at least one item before saving.');
    }

    setIsSaving(true);
    try {
      const payload = {
        items: items.map(i => {
          let pId = i.productId;
          if (i.product) {
            pId = typeof i.product === 'object' ? i.product._id : i.product;
          }
          return {
            productId: pId,
            productName: i.productName,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            purchasePrice: Number(i.purchasePrice) || 0,
            discount: Number(i.discount),
            discountType: i.discountType
          };
        }),
        customer: sale.customer,
        discount: Number(discount),
        discountType: discountType,
        taxRate: Number(taxRate),
        paymentMethod: paymentMethod,
        notes: sale.notes
      };

      let data;
      if (sale._id) {
        const response = await updateSale(sale._id, payload);
        data = response.data;
      } else {
        const response = await createSale(payload);
        data = response.data;
      }

      setSale(data.sale);
      setItems(data.sale.items);
      setDiscount(data.sale.discount);
      setDiscountType(data.sale.discountType);
      setTaxRate(data.sale.taxRate);
      toast.success(sale._id ? 'Sale updated successfully!' : 'Sale finalized and saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay !p-0">
      <div className="modal-box !max-w-none !w-screen !h-screen !max-h-none !rounded-none flex flex-col p-0">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b no-print bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="font-black text-slate-800 text-xl tracking-tight">Invoice Customization</h2>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live Editor</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleAddItem} className="flex items-center gap-2 py-2 px-4 bg-primary-50 text-primary-600 rounded-xl text-xs font-black hover:bg-primary-100 transition-all border border-primary-100">
              <MdAdd size={18} /> Add New Row
            </button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 py-2 px-6 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Finalize & Save'}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black shadow-xl transition-all">
              <MdPrint size={18} /> Print Now
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <MdClose size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div
            ref={invoiceRef}
            className="print-container p-10 text-sm text-slate-800 bg-white print:p-2">
            {/* <div className="grid grid-cols-3 items-center mb-6">
              <div className="text-left">
                <h1 className="text-lg font-bold">Ewan Al-Hazm Trading Establishment</h1>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Hand Tools - Equipment - Safety - Workshop Supplies
                </p>
                <p className="text-xs text-slate-500">Address: As Saadah, OAJA4419, Al-Kharj 16443, Saudi Arabia</p>
                <p className="text-xs text-slate-500">Mobile: 059 571 7520</p>
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-[30px] font-bold">TAX INVOICE</h1>
                <p className="text-slate-500 text-[20px]">فاتورة ضريبية</p>
                <p className="text-md text-slate-500">VAT No: 313147090700003</p>
              </div>
              <div className="text-right space-y-2">
                <h1 className="text-[30px] font-bold leading-[1.2]">
                  مؤسسة ايوان الحزم التجارية
                </h1>

                <p className="text-[20px] font-semibold text-slate-600">
                  عدد يدوية - معدات - سلامة - لوازم ورش
                </p>

                <p className="text-md text-slate-500">
                  العنوان: السعادة، الخرج، السعودية
                </p>

                <p className="text-md text-slate-500 tracking-[0.2em]">
                  الجوال: ٠٥٩٥٧١٧٥٢٠
                </p>
              </div>
            </div> */}

            <div className="w-full max-w-[210mm] mx-auto px-6 py-4 box-border overflow-hidden">

              <div className="grid grid-cols-3 items-center mb-6 w-full">

                {/* LEFT */}
                <div className="text-left">
                  <h1 className="text-lg font-bold">
                    Ewan Al-Hazm Trading Establishment
                  </h1>

                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Hand Tools - Equipment - Safety - Workshop Supplies
                  </p>

                  <p className="text-xs text-slate-500">
                    Address: As Saadah, OAJA4419, Al-Kharj 16443, Saudi Arabia
                  </p>

                  <p className="text-xs text-slate-500">
                    Mobile: 059 571 7520
                  </p>
                </div>

                {/* CENTER */}
                <div className="text-center space-y-2">
                  <h1 className="text-[30px] font-bold">
                    TAX INVOICE
                  </h1>

                  <p className="text-slate-500 text-[20px]">
                    فاتورة ضريبية
                  </p>

                  <p className="text-md text-slate-500">
                    VAT No: 313147090700003
                  </p>
                </div>

                {/* RIGHT */}
                <div className="text-right space-y-2">
                  <h1 className="text-[30px] font-bold leading-[1.2]">
                    مؤسسة ايوان الحزم التجارية
                  </h1>

                  <p className="text-[20px] font-semibold text-slate-600">
                    عدد يدوية - معدات - سلامة - لوازم ورش
                  </p>

                  <p className="text-md text-slate-500">
                    العنوان: السعادة، الخرج، السعودية
                  </p>

                  <p className="text-md text-slate-500 tracking-[0.2em]">
                    الجوال: ٠٥٩٥٧١٧٥٢٠
                  </p>
                </div>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 border rounded-lg space-y-2">
                <p className="font-bold">From / من</p>
                <p className="font-semibold">Ewan Al-Hazm Trading Establishment</p>
                <p className="text-md text-slate-400">مؤسسة ايوان الحزم التجارية</p>
                <p className="text-md text-slate-400">VAT / ضريبة: 313147090700003</p>
              </div>
              <div className="p-4 border rounded-lg space-y-2">
                <p className="font-bold mb-2">To / إلى</p>
                <p className="font-semibold">Customer / العميل: {sale.customer?.name || "Walk-in Customer"}</p>
                {sale.customer?.phone && <p className="text-slate-500">Mobile / الجوال: {sale.customer.phone}</p>}
                {sale.customer?.vatNumber && <p className="text-slate-500">VAT / ضريبة: {sale.customer.vatNumber}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
              <div className="border p-3 rounded">
                <p className="text-slate-500">Invoice No / رقم الفاتورة</p>
                <p className="text-lg font-semibold">{sale.invoiceNumber}</p>
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


            <div className="border-2 border-slate-50 rounded-3xl overflow-hidden mb-10">
              <table className="w-full text-sm table-fixed">

                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-2 w-[4%] text-left opacity-60">No / رقم</th>

                    {/* ✅ PRODUCT COLUMN MADE BIGGER */}
                    <th className="p-2 w-[26%] text-left">
                      Product / المنتج
                    </th>

                    <th className="p-2 w-[8%] text-center">
                      Unit / الوحدة
                    </th>

                    <th className="p-2 w-[10%] text-center">
                      Unit Price / سعر الوحدة
                    </th>

                    <th className="p-2 w-[6%] text-center no-print">
                      Sell price / التكلفة
                    </th>

                    <th className="p-2 w-[7%] text-center">
                      Qty / الكمية
                    </th>

                    <th className="p-2 w-[8%] text-center">
                      Discount / خصم
                    </th>

                    <th className="p-2 w-[9%] text-center">
                      Subtotal / الإجمالي
                    </th>

                    <th className="p-2 w-[6%] text-center">
                      VAT % / الضريبة
                    </th>

                    <th className="p-2 w-[9%] text-center">
                      VAT Amt / مبلغ الضريبة
                    </th>

                    <th className="p-2 w-[11%] text-right">
                      Total / الإجمالي النهائي
                    </th>

                    <th className="p-2 w-[4%] text-center no-print"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">

                  {items.map((item, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">

                      {/* No */}
                      <td className="p-4 text-slate-400 font-black text-xs text-center">
                        {String(i + 1).padStart(2, '0')}
                      </td>

                      {/* ✅ PRODUCT CELL (UNCHANGED UI) */}
                      <td className="p-4">
                        <input
                          type="text"
                          value={item.productName}
                          placeholder="Item description..."
                          onChange={(e) =>
                            handleUpdateItem(i, 'productName', e.target.value)
                          }
                          className="w-full bg-transparent font-black text-slate-800 outline-none border-none focus:ring-0 p-0 text-sm placeholder:text-slate-200 print:hidden"
                        />

                        <span className="hidden print:block font-black text-sm">
                          {item.productName}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">
                          {item.selectedUnit || 'Unit'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="p-4 no-print text-center">
                        {item.productId?.startsWith('custom-') || item.isCustomItem ? (
                          <input
                            type="number"
                            value={item.purchasePrice || ''}
                            onChange={(e) =>
                              handleUpdateItem(i, 'purchasePrice', e.target.value)
                            }
                            className="w-full text-center font-black text-slate-800 outline-none bg-slate-100 rounded px-2 py-1"
                          />
                        ) : (
                          <span className="font-bold text-slate-400">
                            {formatSAR(item.purchasePrice || 0)}
                          </span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(i, 'unitPrice', e.target.value)
                          }
                          className="w-full text-center font-black text-slate-800 outline-none bg-slate-100 rounded px-2 py-1 no-print"
                        />

                        <span className="hidden print:block font-bold">
                          {formatSAR(item.unitPrice)}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 bg-slate-900 rounded-xl p-1 shadow-lg no-print">
                          <button
                            onClick={() => handleUpdateItem(i, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))}
                            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                          >
                            <MdRemove size={14} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(i, 'quantity', e.target.value)}
                            className="w-8 bg-transparent text-center font-black text-white outline-none"
                          />
                          <button
                            onClick={() => handleUpdateItem(i, 'quantity', (Number(item.quantity) || 0) + 1)}
                            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                          >
                            <MdAdd size={14} />
                          </button>
                        </div>
                        <span className="hidden print:block font-bold text-center">{item.quantity}</span>
                      </td>


                      {/* Discount */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-red-500">
                          {item.discount > 0
                            ? (item.discountType === 'percentage'
                              ? `${item.discount}%`
                              : formatSAR(item.discount))
                            : '-'}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-700">
                          {formatSAR(item.totalPrice)}
                        </span>
                      </td>

                      {/* VAT % */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">
                          {taxRate || 0}%
                        </span>
                      </td>

                      {/* VAT Amt */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">
                          {formatSAR(
                            ((Number(item.totalPrice) || 0) *
                              (Number(taxRate) || 0)) /
                            100
                          )}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="p-4 text-right">
                        <span className="text-lg font-black text-slate-900">
                          {formatSAR(
                            (Number(item.totalPrice) || 0) +
                            ((Number(item.totalPrice) || 0) *
                              (Number(taxRate) || 0)) /
                            100
                          )}
                        </span>
                      </td>

                      {/* Remove */}
                      <td className="p-4 text-center no-print">
                        <button
                          onClick={() => handleRemoveItem(i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <MdDelete size={18} />
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>
            </div>

            <div className="flex justify-end mb-6">
              <div className="w-full max-w-md border rounded p-4 text-xs space-y-2">                <div className="flex justify-between">
                <span>Subtotal / المجموع</span>
                <span>{formatSAR(currentSubtotal)}</span>
              </div>
                <div className="flex justify-between">
                  <span>VAT / الضريبة</span>
                  <span>{formatSAR(currentTaxAmt)}</span>
                </div>
                {currentDiscountAmt > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount / الخصم</span>
                    <span>- {formatSAR(currentDiscountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Grand Total / الإجمالي</span>
                  <span className="text-primary-600">{formatSAR(currentTotal)}</span>
                </div>
              </div>
            </div>



            <div className="text-center text-[10px] text-slate-400 mt-10 opacity-50 no-print">
              <p>AB Traders POS System </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}



export default function POSPage() {
  // Immediate search state (bound to input)
  const [search, setSearch] = useState('');
  // Debounced search state (sent to API after 300ms pause)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '', vatNumber: '' });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [taxRate, setTaxRate] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // Debounce: wait 300ms after user stops typing, then update debouncedSearch
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // React Query — cached, 30s stale time. placeholderData keeps previous results visible.
  const { data: productData, isLoading: productsInitialLoading, isFetching: productsFetching } = useProducts({
    search: debouncedSearch,
    page,
    limit: 20,
  });

  const products = productData?.products || [];
  const totalPages = Math.ceil((productData?.total || 0) / 20) || 1;

  const addToCart = (product) => {
    if (product.quantity === 0) {
      return toast.error(`"${product.name}" is out of stock`);
    }

    // Check current cart quantity before calling setCart
    const existingItem = cart.find((i) => i.productId === product._id);
    if (existingItem && existingItem.quantity >= product.quantity) {
      return toast.error(`Only ${product.quantity} unit${product.quantity !== 1 ? 's' : ''} of "${product.name}" available in stock`);
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productId: product._id,
        productName: product.name,
        unitPrice: product.salePrice,
        originalSalePrice: product.salePrice,
        purchasePrice: product.purchasePrice,
        quantity: 1,
        discount: 0,
        discountType: 'fixed',
        maxQty: product.quantity,
        baseQty: product.quantity,
        baseUnit: product.baseUnit || 'unit',
        units: product.units || [],
        selectedUnit: product.baseUnit || 'unit',
        conversionFactor: 1
      }];
    });
  };

  const addManualItem = () => {
    const customId = `custom-${Date.now()}`;
    setCart((prev) => [
      ...prev,
      {
        productId: customId,
        productName: 'New Item',
        unitPrice: 0,
        purchasePrice: 0,
        quantity: 1,
        isCustom: true,
      },
    ]);
  };

  const updateItemName = (productId, name) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, productName: name } : i)));
  };

  const updateUnit = (productId, unitName) => {
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;

      let newFactor = 1;
      let newPrice = i.originalSalePrice;

      if (unitName !== i.baseUnit) {
        const u = i.units.find(u => u.name === unitName);
        if (u) {
          newFactor = u.unitsPerBase;
          newPrice = u.sellingPrice;
        }
      }

      const newMaxQty = Math.floor(i.baseQty * newFactor);
      let newQty = i.quantity;
      if (newQty > newMaxQty) newQty = newMaxQty;

      return {
        ...i,
        selectedUnit: unitName,
        conversionFactor: newFactor,
        unitPrice: newPrice,
        maxQty: newMaxQty,
        quantity: newQty
      };
    }));
  };

  const updateQty = (productId, qty) => {
    // allow 0 or empty string so they can type
    if (qty !== '' && qty < 0) return;

    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      if (qty !== '' && qty > i.maxQty) { toast.error(`Only ${i.maxQty} in stock`); return i; }
      return { ...i, quantity: qty };
    }));
  };

  const updateUnitPrice = (productId, price) => {
    setCart((prev) => prev.map((i) =>
      i.productId === productId ? { ...i, unitPrice: price } : i
    ));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  // const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const subtotal = (Array.isArray(cart) ? cart : []).reduce(
    (s, i) => {
      const base = (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0);
      const itemDisc = (i.discountType === 'percentage')
        ? (base * (Number(i.discount) || 0)) / 100
        : Number(i.discount || 0);
      return s + (base - itemDisc);
    },
    0
  );
  const discountAmt = discountType === 'percentage' ? (subtotal * discount) / 100 : Number(discount);
  const taxAmt = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmt - discountAmt;

  const handleCheckout = async () => {
    const validItems = cart.filter((i) => Number(i.quantity) > 0);

    if (validItems.length === 0) {
      // Open a draft sale in the preview instead of creating an empty record
      setInvoice({
        items: [],
        discount: Number(discount) || 0,
        discountType: discountType || 'fixed',
        taxRate: Number(taxRate) || 15,
        paymentMethod: paymentMethod || 'cash',
        customer: customer || { name: 'Walk-in Customer' },
        invoiceNumber: `DRAFT-${Math.floor(Date.now() / 1000)}`,
        createdAt: new Date().toISOString(),
        subtotal: 0,
        tax: 0,
        total: 0
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await createSale({
        items: validItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice) || 0,
          purchasePrice: Number(i.purchasePrice) || 0,
          selectedUnit: i.selectedUnit,
          conversionFactor: i.conversionFactor,
          discount: Number(i.discount) || 0,
          discountType: i.discountType
        })),
        customer,
        discount: Number(discount),
        discountType,
        taxRate: Number(taxRate),
        paymentMethod,
      });
      setInvoice(data.sale);
      setCart([]);
      setDiscount(0);
      setTaxRate(15);
      setCustomer({ name: 'Walk-in Customer', phone: '', vatNumber: '' });
      toast.success('Sale completed!');
      // Invalidate products cache so stock counts update immediately
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) { toast.error(err.response?.data?.message || 'Sale failed'); }
    finally { setLoading(false); }
  };
  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer({
      _id: selectedCustomer._id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone || '',
      vatNumber: selectedCustomer.vatNumber || ''
    });
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input pl-9 pr-9"
          />
          {/* Non-blocking inline spinner while fetching (not on initial load) */}
          {productsFetching && !productsInitialLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <InlineSpinner size={16} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {/* Show skeleton only on the very first load (no cached data yet) */}
          {productsInitialLoading ? (
            <CardSkeleton count={12} />
          ) : products.length === 0 ? (
            <p className="col-span-full text-center text-slate-400 py-12">No products found</p>
          ) : (
            products.map((p) => (
              <button key={p._id} onClick={() => addToCart(p)}
                className={`p-3 text-left rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${p.quantity === 0 ? 'border-red-100 bg-red-50 opacity-60 cursor-not-allowed' : 'border-slate-100 bg-white hover:border-primary-200 hover:bg-primary-50'}`}>
                <div className="w-full h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-2 text-slate-300">
                  <MdShoppingCart size={28} />
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                <p className="text-[10px] font-bold text-blue-600 truncate">{p.sku}</p>
                <p className="text-sm font-black text-primary-600 mt-1">SAR {Number(p.salePrice).toLocaleString()}</p>
                <p className="text-[11px] text-slate-900 font-bold">Cost: SAR {Number(p.purchasePrice || 0).toLocaleString()}</p>
                <p className={`text-xs mt-0.5 font-black ${p.quantity <= p.lowStockThreshold ? 'text-red-600' : 'text-emerald-700'}`}>
                  {p.quantity} in stock
                </p>
              </button>
            ))
          )}
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

      {/* Right: Cart */}
      {/* Right: Cart */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col card p-0 shrink-0 h-[90vh]">

        {/* Header */}
        <div className="p-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <MdShoppingCart className="text-primary-600" />
            Cart
            <span className="ml-auto bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
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
                  {item.productId.startsWith('custom-') ? (
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItemName(item.productId, e.target.value)}
                      className="w-full bg-white border-2 border-indigo-100 rounded px-2 py-0.5 text-sm font-bold text-indigo-700 outline-none focus:border-indigo-400"
                      placeholder="Item Name"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {item.productName}
                      </p>
                      {item.units && item.units.length > 0 && (
                        <select
                          value={item.selectedUnit}
                          onChange={(e) => updateUnit(item.productId, e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded px-1 py-0.5 outline-none font-bold text-primary-700 shadow-sm"
                        >
                          <option value={item.baseUnit}>{item.baseUnit} (base)</option>
                          {item.units.map(u => (
                            <option key={u.name} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-emerald-700 uppercase">Bill Price:</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateUnitPrice(item.productId, e.target.value)}
                        className="w-24 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 text-sm font-black text-emerald-700 focus:border-emerald-500 outline-none shadow-sm"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-900 uppercase">Pur:</span>
                        <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {Number(item.purchasePrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-900 uppercase">Org Sale:</span>
                        <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {Number(item.originalSalePrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-end shrink-0 ml-auto">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.productId, (Number(item.quantity) || 0) - 1)}
                      className="w-8 h-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center transition-colors shadow-md"
                    >
                      <MdRemove size={18} />
                    </button>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                        updateQty(item.productId, val);
                      }}
                      className="w-14 text-center text-lg font-black border-2 border-slate-200 rounded-xl py-1 text-slate-900"
                    />

                    <button
                      onClick={() => updateQty(item.productId, (Number(item.quantity) || 0) + 1)}
                      className="w-8 h-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center transition-colors shadow-md"
                    >
                      <MdAdd size={18} />
                    </button>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center ml-1 transition-all border border-red-100"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* 👇 THIS is the magic scroll anchor */}
          <div ref={cartEndRef} />
        </div>

        {/* Customer + Options */}
        <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
          <button
            onClick={() => setShowCustomerSelector(true)}
            className="w-full bg-primary-50 text-primary-600 py-2 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all flex items-center justify-center gap-2 border border-primary-100 mb-2"
          >
            <MdPerson size={16} /> Search Existing Customer
          </button>

          <div className="grid grid-cols-2 gap-3 lg:gap-4 p-1">
            <div>
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Customer Name</label>
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, _id: undefined, name: e.target.value })}
                className="input text-sm py-2 font-medium"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="label text-[11px] font-bold mb-1 text-slate-700">Phone Number</label>
              <input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, _id: undefined, phone: e.target.value })}
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
                onChange={(e) => setCustomer({ ...customer, _id: undefined, vatNumber: e.target.value })}
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

            {taxAmt > 0 && (
              <div className="flex justify-between opacity-80">
                <span>Tax ({taxRate}%)</span>
                <span>{formatSAR(taxAmt)}</span>
              </div>
            )}

            {discountAmt > 0 && (
              <div className="flex justify-between text-amber-400 font-medium">
                <span>Discount on Grand Total</span>
                <span>- {formatSAR(discountAmt)}</span>
              </div>
            )}

            {/* Total Discount Given (Items + Global) */}
            {(() => {
              const itemDiscSum = cart.reduce((acc, item) => {
                const base = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
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

            <div className="flex justify-between font-bold text-xl pt-2 border-t border-slate-700 mt-2">
              <span>Grand Total</span>
              <span className="text-emerald-400">{formatSAR(total)}</span>
            </div>
          </div>

          <button
            id="checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
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

      {showCustomerSelector && (
        <CustomerSelector
          onSelect={handleCustomerSelect}
          onClose={() => setShowCustomerSelector(false)}
        />
      )}
    </div>
  );
}

