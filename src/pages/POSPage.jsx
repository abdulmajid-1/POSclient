import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../hooks/useProducts';
import { createSale, updateSale } from '../services/saleService';
import { MdSearch, MdAdd, MdRemove, MdDelete, MdReceipt, MdPrint, MdClose, MdShoppingCart, MdPerson, MdPostAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import CustomerSelector from '../components/CustomerSelector';
import { CardSkeleton, InlineSpinner } from '../components/SkeletonLoader';
import ZatcaReportButton from '../components/ZatcaReportButton';
import ZatcaReceiptQR from '../components/ZatcaReceiptQR';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

const paymentMethodLabel = (method) => {
  const labels = {
    cash: 'Cash / نقداً',
    card: 'Credit Card / بطاقة ائتمان',
    bank_transfer: 'Bank Transfer / تحويل بنكي',
    other: 'Other / أخرى',
  };
  return labels[method] || method || 'Cash / نقداً';
};


function InvoiceModal({ sale: initialSale, onClose }) {
  const invoiceRef = useRef();
  const [sale, setSale] = useState(initialSale);
  const [items, setItems] = useState(initialSale.items);
  const [discount, setDiscount] = useState(
    initialSale.discountType === 'percentage'
      ? (initialSale.subtotal > 0 ? (initialSale.discount / initialSale.subtotal) * 100 : 0)
      : (initialSale.discount || 0)
  );
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
            discountType: i.discountType,
            selectedUnit: i.selectedUnit || '',
            conversionFactor: Number(i.conversionFactor) || 1
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
      setDiscount(
        data.sale.discountType === 'percentage'
          ? (data.sale.subtotal > 0 ? (data.sale.discount / data.sale.subtotal) * 100 : 0)
          : (data.sale.discount || 0)
      );
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

          <div className="flex items-center gap-2">
            {sale._id && (
              <ZatcaReportButton
                sale={sale}
                onSaleUpdated={(updated) => setSale(updated)}
                onTriggerPrint={handlePrint}
              />
            )}
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
                <p className="text-md text-slate-500">VAT No: 314852932200003</p>
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

              <div className="grid grid-cols-3 items-center mb-3 w-full">

                {/* LEFT */}
                <div className="text-left">
                  <h1 className="text-lg font-bold">
                    Ewan Al-Hazm Trading Establishment
                  </h1>

                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-0.5">
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
                <div className="text-center space-y-1">
                  <h1 className="text-[26px] font-bold">
                    TAX INVOICE
                  </h1>

                  <p className="text-slate-500 text-[18px]">
                    فاتورة ضريبية
                  </p>

                  <p className="text-xs text-slate-500">
                    VAT No: 314852932200003
                  </p>
                </div>

                {/* RIGHT */}
                <div className="text-right space-y-1">
                  <h1 className="text-[26px] font-bold leading-[1.2]">
                    مؤسسة ايوان الحزم التجارية
                  </h1>

                  <p className="text-[18px] font-semibold text-slate-600">
                    عدد يدوية - معدات - سلامة - لوازم ورش
                  </p>

                  <p className="text-xs text-slate-500">
                    العنوان: السعادة، الخرج، السعودية
                  </p>

                  <p className="text-xs text-slate-500 tracking-[0.1em]">
                    الجوال: ٠٥٩٥٧١٧٥٢٠
                  </p>
                </div>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 w-[94%] mx-auto">
              <div className="p-2.5 border rounded-lg space-y-0.5 text-[11px]">
                <p className="font-bold text-slate-800">From / من</p>
                <p className="font-semibold text-slate-900">Ewan Al-Hazm Trading Establishment</p>
                <p className="text-slate-500">مؤسسة ايوان الحزم التجارية</p>
                <p className="text-slate-500">VAT / ضريبة: 314852932200003</p>
              </div>
              <div className="p-2.5 border rounded-lg space-y-0.5 text-[11px]">
                <p className="font-bold text-slate-800 mb-0.5">To / إلى</p>
                <p className="font-semibold text-slate-900">Customer / العميل: {sale.customer?.name || "Walk-in Customer"}</p>
                {sale.customer?.phone && <p className="text-slate-500">Mobile / الجوال: {sale.customer.phone}</p>}
                {sale.customer?.vatNumber && <p className="text-slate-500">VAT / ضريبة: {sale.customer.vatNumber}</p>}
                <p className="text-slate-500">Payment / طريقة الدفع: <span className="font-bold text-slate-800">{paymentMethodLabel(paymentMethod)}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-3.5 text-[11px] w-[94%] mx-auto">
              <div className="border p-2 rounded">
                <p className="text-slate-500 text-[10px]">Invoice No / رقم الفاتورة</p>
                <p className="text-sm font-semibold">{sale.invoiceNumber}</p>
              </div>
              <div className="border p-2 rounded">
                <p className="text-slate-500 text-[10px]">Date / التاريخ</p>
                <p className="font-semibold">{new Date(sale.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="border p-2 rounded">
                <p className="text-slate-500 text-[10px]">Currency / العملة</p>
                <p className="font-semibold">SAR / ريال</p>
              </div>
            </div>

            {/* TABLE */}
            <div className="w-[94%] mx-auto border-2 border-slate-200 rounded-none overflow-hidden mb-6">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-2 w-[4%] text-center opacity-60">No / رقم</th>
                    <th className="p-2 w-[28%] text-left pl-3 text-[11px]">Product / المنتج</th>
                    <th className="p-2 w-[8%] text-center">Unit / الوحدة</th>
                    <th className="p-2 w-[13%] text-center">
                      <span className="no-print">Purchase Rate / سعر الشراء</span>
                      <span className="hidden print:inline">Unit Price / سعر الوحدة</span>
                    </th>
                    <th className="p-2 w-[7%] text-center no-print">Cost / التكلفة</th>
                    <th className="p-2 w-[8%] text-center">Qty / الكمية</th>
                    <th className="p-2 w-[12%] text-center">Subtotal / الإجمالي</th>
                    <th className="p-2 w-[11%] text-center">VAT Amt / مبلغ الضريبة</th>
                    <th className="p-2 w-[12%] text-right">Total / الإجمالي النهائي</th>
                    <th className="p-2 w-[5%] text-center no-print"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">

                  {items.map((item, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">

                      {/* No */}
                      <td className="p-2.5 text-slate-400 font-bold text-xs text-center">
                        {String(i + 1).padStart(2, '0')}
                      </td>

                      {/* PRODUCT CELL */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.productName}
                          placeholder="Item description..."
                          onChange={(e) =>
                            handleUpdateItem(i, 'productName', e.target.value)
                          }
                          className="w-full bg-transparent font-bold text-slate-900 outline-none border-none focus:ring-0 p-0 text-xs placeholder:text-slate-300 print:hidden"
                        />

                        <span className="hidden print:block font-bold text-xs leading-snug">
                          {item.productName}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="p-2.5 text-center">
                        <span className="font-bold text-xs text-slate-600">
                          {item.selectedUnit || 'Unit'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="p-2.5 no-print text-center">
                        {item.productId?.startsWith('custom-') || item.isCustomItem ? (
                          <input
                            type="number"
                            value={item.purchasePrice || ''}
                            onChange={(e) =>
                              handleUpdateItem(i, 'purchasePrice', e.target.value)
                            }
                            placeholder="0"
                            className="w-full text-center font-bold text-slate-900 bg-white border border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg px-2 py-1 text-xs shadow-2xs"
                          />
                        ) : (
                          <span className="font-bold text-xs text-slate-400">
                            {formatSAR(item.purchasePrice || 0)}
                          </span>
                        )}
                      </td>

                      {/* Purchase Rate (Unit Price) */}
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(i, 'unitPrice', e.target.value)
                          }
                          placeholder="0"
                          className="w-full text-center font-bold text-slate-900 bg-white border border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg px-2 py-1 text-xs shadow-2xs no-print"
                        />

                        <span className="hidden print:block font-bold text-xs">
                          {formatSAR(item.unitPrice)}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="p-2.5">
                        <div className="flex items-center justify-center gap-2 bg-slate-900 rounded-xl p-1 shadow-lg no-print">
                          <button
                            onClick={() => handleUpdateItem(i, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))}
                            className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                          >
                            <MdRemove size={12} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(i, 'quantity', e.target.value)}
                            className="w-7 bg-transparent text-center font-bold text-xs text-white outline-none"
                          />
                          <button
                            onClick={() => handleUpdateItem(i, 'quantity', (Number(item.quantity) || 0) + 1)}
                            className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                          >
                            <MdAdd size={12} />
                          </button>
                        </div>
                        <span className="hidden print:block font-bold text-xs text-center">{item.quantity}</span>
                      </td>



                      {/* Subtotal */}
                      <td className="p-2.5 text-center">
                        <span className="font-bold text-xs text-slate-700">
                          {formatSAR(item.totalPrice)}
                        </span>
                      </td>

                      {/* VAT Amt */}
                      <td className="p-2.5 text-center">
                        <span className="font-bold text-xs text-slate-600">
                          {formatSAR(
                            ((Number(item.totalPrice) || 0) *
                              (Number(taxRate) || 0)) /
                            100
                          )}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="p-2.5 text-right">
                        <span className="text-xs font-black text-slate-900">
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

            <div className="w-[94%] mx-auto flex justify-end mb-6">
              <div className="w-full max-w-md border rounded p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal / المجموع</span>
                  <span>{formatSAR(currentSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT Rate / نسبة الضريبة</span>
                  <span className="font-bold">{taxRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT Amount / مبلغ الضريبة</span>
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
            {/* ZATCA Phase 2 E-Invoice QR Code */}
            <ZatcaReceiptQR qrCode={sale.zatca?.qrCode} />

            {/* Fallback footer when not saved */}
            {!sale._id && (
              <div className="text-center text-[10px] text-slate-400 mt-10 opacity-50">
              </div>
            )}
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
    if (existingItem) {
      const currentQtyInBase = (existingItem.quantity || 0) / (existingItem.conversionFactor || 1);
      const nextQtyInBase = currentQtyInBase + 1;
      if (nextQtyInBase > product.quantity) {
        return toast.error(`Only ${product.quantity} base unit${product.quantity !== 1 ? 's' : ''} of "${product.name}" available in stock`);
      }
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
        sku: product.sku || '',
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

  const updatePurchasePrice = (productId, price) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, purchasePrice: price } : i)));
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

      const newMaxQty = newFactor > 0 ? Math.floor(i.baseQty * newFactor) : 0;
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

  const cartContainerRef = useRef(null);

  // Auto-scroll ONLY inside the inner cart container without jumping the whole page
  useEffect(() => {
    if (cartContainerRef.current) {
      cartContainerRef.current.scrollTop = cartContainerRef.current.scrollHeight;
    }
  }, [cart.length]);
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-90px)] min-h-[650px] animate-fade-in">
      {/* ========================================================================= */}
      {/* COLUMN 1: PRODUCT CATALOG (Left 35% on XL, 50% on LG) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full space-y-3">
        {/* Search Bar */}
        <div className="relative w-full shrink-0">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-12 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all"
          />
          {productsFetching && !productsInitialLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <InlineSpinner size={16} />
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {productsInitialLoading ? (
              <CardSkeleton count={12} />
            ) : products.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                <MdShoppingCart size={40} className="opacity-30 mb-2" />
                <p className="text-xs font-semibold">No products match your search</p>
              </div>
            ) : (
              products.map((p) => (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className={`p-2.5 text-left rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between ${p.quantity === 0
                    ? 'border-red-100 bg-red-50/50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200/80 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 font-mono truncate max-w-[90px]">{p.sku}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${p.quantity <= p.lowStockThreshold ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.quantity} left
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight" title={p.name}>{p.name}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block leading-none">Price</span>
                      <span className="text-sm font-black text-primary-600">SAR {Number(p.salePrice).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">Pur: {Number(p.purchasePrice || 0).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs shrink-0">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all uppercase"
            >
              Prev
            </button>
            <div className="text-xs font-extrabold text-slate-600">
              Page {page} of {totalPages}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-all uppercase"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 2: ACTIVE CART WORKSPACE (Middle 43% on XL, 50% on LG) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[430px] flex flex-col card p-0 shrink-0 h-full border border-slate-200/80 shadow-sm overflow-hidden bg-white">
        {/* Cart Header & Quick Action Buttons */}
        <div className="p-3.5 border-b border-slate-100 shrink-0 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-100 text-primary-700 rounded-lg">
              <MdShoppingCart size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm leading-none flex items-center gap-2">
                Active Sale Cart
                <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{cart.length}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addManualItem}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
              title="Add a custom/non-inventory item"
            >
              <MdPostAdd size={16} /> + Custom Item
            </button>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="px-2 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all items"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Compact Cart Items Table */}
        <div ref={cartContainerRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-16">
              <MdShoppingCart size={48} className="opacity-30 mb-2" />
              <p className="text-xs font-bold text-slate-400">Cart is empty</p>
              <p className="text-[11px] text-slate-300 mt-1">Select products from left catalog or add custom item</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all shadow-2xs flex items-center gap-2"
              >
                {/* Item Details Column */}
                <div className="flex-1 min-w-0">
                  {item.productId.startsWith('custom-') ? (
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItemName(item.productId, e.target.value)}
                      className="w-full bg-indigo-50/60 border border-indigo-200 rounded px-2 py-0.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-400"
                      placeholder="Item Name"
                    />
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.sku && (
                          <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-100 shrink-0">
                            {item.sku}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 leading-snug break-words">
                          {item.productName}
                        </span>
                        {item.units && item.units.length > 0 && (
                          <select
                            value={item.selectedUnit}
                            onChange={(e) => updateUnit(item.productId, e.target.value)}
                            className="text-[10px] bg-primary-50 text-primary-700 font-extrabold border border-primary-200 rounded px-1 py-0.5 outline-none cursor-pointer shrink-0"
                          >
                            <option value={item.baseUnit}>{item.baseUnit}</option>
                            {item.units.map(u => (
                              <option key={u.name} value={u.name}>{u.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Micro Metadata or Custom Item Purchase Price Input */}
                  {item.isCustom || item.productId.startsWith('custom-') ? (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-indigo-800">
                      <span>Pur Price:</span>
                      <input
                        type="number"
                        value={item.purchasePrice}
                        onChange={(e) => updatePurchasePrice(item.productId, e.target.value)}
                        className="w-12 bg-indigo-50/80 border border-indigo-300 rounded px-1 py-0.5 text-xs font-black text-indigo-900 outline-none focus:border-indigo-500 shadow-2xs"
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-700 mt-1">
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-slate-800">
                        Pur: SAR {Number(item.purchasePrice || 0).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-slate-800">
                        Org: SAR {Number(item.originalSalePrice || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unit Bill Price Column (Slimmer Width) */}
                <div className="shrink-0 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 block leading-none mb-0.5">Price</span>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateUnitPrice(item.productId, e.target.value)}
                    className="w-16 bg-emerald-50/60 border border-emerald-300 rounded-md px-1 py-0.5 text-xs font-black text-emerald-800 text-center outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Quantity Controller [- N +] */}
                <div className="shrink-0 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 block leading-none mb-0.5">Qty</span>
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQty(item.productId, (Number(item.quantity) || 0) - 1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs font-bold shadow-2xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                        updateQty(item.productId, val);
                      }}
                      className="w-9 text-center text-xs font-black bg-transparent outline-none text-slate-900"
                    />
                    <button
                      onClick={() => updateQty(item.productId, (Number(item.quantity) || 0) + 1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs font-bold shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Item Total Column */}
                <div className="shrink-0 text-right min-w-[60px]">
                  <span className="text-[9px] font-black uppercase text-slate-400 block leading-none mb-0.5">Total</span>
                  <span className="text-xs font-black text-slate-900 block">
                    SAR {((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title="Remove Item"
                >
                  <MdDelete size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 3: CUSTOMER & CHECKOUT PANEL (Right 25% on XL, Full width on LG) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[300px] flex flex-col card p-4 shrink-0 h-full border border-slate-200/80 shadow-sm bg-white overflow-y-auto space-y-3 justify-between">
        <div className="space-y-3">
          {/* Customer Selection Block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Customer Info</label>
              <button
                type="button"
                onClick={() => setShowCustomerSelector(true)}
                className="text-[11px] font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                <MdPerson size={14} /> Search Existing
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, _id: undefined, name: e.target.value })}
                className="input text-xs py-1.5 bg-white font-semibold"
                placeholder="Customer Name"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, _id: undefined, phone: e.target.value })}
                  className="input text-xs py-1.5 bg-white"
                  placeholder="Phone"
                />
                <input
                  value={customer.vatNumber}
                  onChange={(e) => setCustomer({ ...customer, _id: undefined, vatNumber: e.target.value })}
                  className="input text-xs py-1.5 bg-white"
                  placeholder="VAT Number"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Quick Chips */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'cash', label: 'Cash' },
                { key: 'card', label: 'Card' },
                { key: 'bank_transfer', label: 'Bank' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${paymentMethod === m.key
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount & Tax Rates */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Global Discount</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input text-xs py-1 flex-1 font-bold text-amber-700 bg-amber-50 border-amber-200"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="input text-[10px] py-1 w-11 px-0 text-center font-bold"
                >
                  <option value="fixed">SAR</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="input text-xs py-1 font-bold bg-white"
              />
            </div>
          </div>
        </div>

        {/* Grand Total Summary Box & Complete Sale CTA */}
        <div className="space-y-3 pt-2">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1.5 text-xs shadow-lg">
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
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>Discount</span>
                <span>- {formatSAR(discountAmt)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-lg pt-2 border-t border-slate-800 mt-1">
              <span>Grand Total</span>
              <span className="text-emerald-400">{formatSAR(total)}</span>
            </div>
          </div>

          <button
            id="checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
            className="btn-success w-full justify-center text-sm py-3 font-black shadow-lg uppercase tracking-wide"
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

