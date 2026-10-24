import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MdClose,
  MdAdd,
  MdDelete,
  MdSave,
  MdSearch,
  MdWarning,
  MdShoppingCart,
  MdAttachMoney,
  MdInventory2,
  MdLocalOffer,
  MdCalendarToday,
} from 'react-icons/md';
import { getSale, updateSale } from '../services/saleService';
import { getProducts } from '../services/productService';
import { formatBillDate, toInputDateValue, combineDateWithCurrentTime } from '../utils/dateUtils';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const isEditLocked = (sale) => {
  if (!sale) return true;
  const isZatca = !!(sale.zatca && ['REPORTED', 'CLEARED', 'PENDING'].includes(sale.zatca.reportingStatus));
  const isReturned = ['refunded', 'partial_refund'].includes(sale.status);
  return isZatca || isReturned;
};

export default function EditBillModal({ saleId, onClose, onSaleUpdated }) {
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', vatNumber: '', address: '' });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [taxRate, setTaxRate] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [billDate, setBillDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Product Search for adding new inventory item
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load sale details on mount
  useEffect(() => {
    if (!saleId) return;
    setLoading(true);
    getSale(saleId)
      .then(({ data }) => {
        const s = data.sale;
        setSale(s);
        setCustomer({
          name: s.customer?.name || '',
          phone: s.customer?.phone || '',
          vatNumber: s.customer?.vatNumber || '',
          address: s.customer?.address || '',
        });
        setDiscount(s.discount || 0);
        setDiscountType(s.discountType || 'fixed');
        setTaxRate(s.taxRate !== undefined ? s.taxRate : 15);
        setPaymentMethod(s.paymentMethod || 'cash');
        setBillDate(toInputDateValue(s.createdAt));
        setNotes(s.notes || '');

        // Map items
        const mappedItems = (s.items || []).map((item, idx) => {
          const prodId = item.product?._id || (typeof item.product === 'string' ? item.product : null);
          return {
            tempId: `item-${Date.now()}-${idx}`,
            productId: prodId,
            productName: item.productName || item.product?.name || 'Item',
            sku: item.sku || item.product?.sku || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            purchasePrice: Number(item.purchasePrice) || 0,
            discount: Number(item.discount) || 0,
            discountType: item.discountType || 'fixed',
            selectedUnit: item.selectedUnit || '',
            conversionFactor: Number(item.conversionFactor) || 1,
            isCustomItem: item.isCustomItem ?? !prodId,
          };
        });
        setItems(mappedItems);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load sale for editing');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [saleId, onClose]);

  // Handle outside click to close product dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products when typing in add search box
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await getProducts({ search: val.trim(), limit: 8 });
        setSearchResults(data.products || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Add an inventory product to items
  const handleSelectProduct = (prod) => {
    // Check if already in items
    const existingIndex = items.findIndex((i) => i.productId === prod._id);
    if (existingIndex >= 0) {
      // Increase quantity by 1
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: Number((item.quantity + 1).toFixed(2)) } : item
        )
      );
      toast.success(`Increased quantity for ${prod.name}`);
    } else {
      // Add new row
      const newItem = {
        tempId: `item-${Date.now()}`,
        productId: prod._id,
        productName: prod.name,
        sku: prod.sku || '',
        quantity: 1,
        unitPrice: Number(prod.salePrice) || 0,
        purchasePrice: Number(prod.purchasePrice) || 0,
        discount: 0,
        discountType: 'fixed',
        selectedUnit: prod.unit || '',
        conversionFactor: 1,
        isCustomItem: false,
        stock: prod.quantity,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success(`Added ${prod.name}`);
    }
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  // Add custom non-inventory item
  const handleAddCustomItem = () => {
    const newItem = {
      tempId: `custom-${Date.now()}`,
      productId: null,
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      purchasePrice: 0,
      discount: 0,
      discountType: 'fixed',
      selectedUnit: 'Unit',
      conversionFactor: 1,
      isCustomItem: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove an item row
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Bill must contain at least one item');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update field of an item
  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Calculations mirroring backend logic exactly
  const calculateItemTotal = (item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const base = qty * price;
    const disc = Number(item.discount) || 0;
    let discAmount = 0;
    if (disc > 0) {
      discAmount = item.discountType === 'percentage' ? (base * disc) / 100 : disc;
    }
    return Math.max(0, base - discAmount);
  };

  const subtotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);

  const billDiscountNum = Number(discount) || 0;
  let billDiscountAmount = 0;
  if (billDiscountNum > 0) {
    billDiscountAmount =
      discountType === 'percentage' ? (subtotal * billDiscountNum) / 100 : billDiscountNum;
  }

  const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - billDiscountAmount);

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Bill must have at least one item');
      return;
    }

    // Validation
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName || !item.productName.trim()) {
        toast.error(`Item #${i + 1} must have a name`);
        return;
      }
      if (Number(item.quantity) <= 0) {
        toast.error(`Item #${i + 1} quantity must be greater than 0`);
        return;
      }
      if (Number(item.unitPrice) < 0) {
        toast.error(`Item #${i + 1} price cannot be negative`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId || (item.isCustomItem ? null : undefined),
          productName: item.productName.trim(),
          sku: item.sku || '',
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          purchasePrice: Number(item.purchasePrice) || 0,
          discount: Number(item.discount) || 0,
          discountType: item.discountType || 'fixed',
          selectedUnit: item.selectedUnit || '',
          conversionFactor: Number(item.conversionFactor) || 1,
          isCustomItem: !!item.isCustomItem,
        })),
        customer: {
          name: customer.name.trim() || 'Walk-in Customer',
          phone: customer.phone.trim() || '',
          vatNumber: customer.vatNumber?.trim() || '',
          address: customer.address?.trim() || '',
        },
        discount: billDiscountNum,
        discountType: discountType,
        taxRate: Number(taxRate) || 0,
        paymentMethod: paymentMethod,
        notes: notes.trim(),
        createdAt: combineDateWithCurrentTime(billDate),
      };

      const { data } = await updateSale(saleId, payload);
      if (data.success) {
        toast.success('Bill updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['detailed-sales'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });

        if (onSaleUpdated && data.sale) {
          onSaleUpdated(data.sale);
        }
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bill');
    } finally {
      setIsSaving(false);
    }
  };

  const isLocked = isEditLocked(sale);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-4xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
              <MdShoppingCart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Edit Bill / تعديل الفاتورة
                </h2>
                {sale?.invoiceNumber && (
                  <span className="badge-blue font-mono text-xs">
                    {sale.invoiceNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {sale?.createdAt ? formatBillDate(sale.createdAt, true) : 'Loading sale...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading bill data...</p>
          </div>
        ) : isLocked ? (
          /* LOCKED GUARD STATE */
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <MdWarning size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                Bill is Locked for Editing
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                This bill cannot be modified because it has either been reported/cleared with ZATCA or has already been refunded. Under tax regulations and accounting rules, completed tax invoices and returns are immutable.
              </p>
            </div>
            <button onClick={onClose} className="btn-secondary px-6 mt-2">
              Close
            </button>
          </div>
        ) : (
          /* FORM BODY */
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* CUSTOMER, PAYMENT & DATE ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <label className="label text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Customer Name / اسم العميل
                </label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Walk-in Customer"
                  className="input text-xs py-1.5"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Customer Phone / الجوال
                </label>
                <input
                  type="text"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  className="input text-xs py-1.5"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Payment Method / طريقة الدفع
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input text-xs py-1.5 bg-white dark:bg-slate-900"
                >
                  <option value="cash">Cash / نقداً</option>
                  <option value="card">Credit Card / بطاقة ائتمان</option>
                  <option value="bank_transfer">Bank Transfer / تحويل بنكي</option>
                  <option value="other">Other / أخرى</option>
                </select>
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MdCalendarToday size={12} className="text-primary-600" />
                  <span>Bill Date / التاريخ</span>
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="input text-xs py-1.5 bg-white dark:bg-slate-900 font-semibold"
                />
              </div>
            </div>

            {/* ADD ITEM SECTION */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Product search input */}
              <div className="relative flex-1" ref={dropdownRef}>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSearchDropdown(true);
                    }}
                    placeholder="Search product to add to bill (name or SKU)..."
                    className="input pl-9 pr-8 text-xs py-2"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Dropdown search results */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-slide-in">
                    {searchResults.map((prod) => (
                      <div
                        key={prod._id}
                        onClick={() => handleSelectProduct(prod)}
                        className="p-2.5 px-3.5 hover:bg-primary-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <MdInventory2 size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{prod.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              SKU: {prod.sku || 'N/A'} • Stock: {prod.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600 dark:text-primary-400">
                            {formatSAR(prod.salePrice)}
                          </p>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-medium">
                            + Add to bill
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Non-Inventory Item Button */}
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 border-dashed border-primary-300 text-primary-700 bg-primary-50/50 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 shrink-0"
              >
                <MdAdd size={16} />
                <span>+ Add Custom Item</span>
              </button>
            </div>

            {/* ITEMS TABLE */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Item Description</th>
                      <th className="py-2.5 px-2 w-24">Price (SAR)</th>
                      <th className="py-2.5 px-2 w-20">Quantity</th>
                      <th className="py-2.5 px-2 w-28">Discount</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total (SAR)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, index) => {
                      const itemTotal = calculateItemTotal(item);
                      return (
                        <tr
                          key={item.tempId || index}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Index & Type Badge */}
                          <td className="py-2.5 px-3 text-slate-400 font-mono">
                            {index + 1}
                          </td>

                          {/* Item Description */}
                          <td className="py-2.5 px-3">
                            {item.isCustomItem ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={item.productName}
                                  onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                  placeholder="Enter custom item name..."
                                  className="input text-xs py-1 w-full font-medium"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="inline-block text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                    Custom Non-Inventory Item
                                  </span>
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <span className="font-semibold">Unit:</span>
                                    <input
                                      type="text"
                                      value={item.selectedUnit || ''}
                                      onChange={(e) => handleItemChange(index, 'selectedUnit', e.target.value)}
                                      placeholder="Unit"
                                      className="input text-xs py-0.5 px-1.5 w-20 font-medium"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {item.productName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                  {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                                  {item.selectedUnit && <span>• Unit: {item.selectedUnit}</span>}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="input text-xs py-1 px-2 w-full text-right font-medium"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="input text-xs py-1 px-2 w-full text-center font-bold text-primary-600 dark:text-primary-400"
                            />
                          </td>

                          {/* Discount */}
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.discount || 0}
                                onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                                className="input text-xs py-1 px-1.5 w-16 text-right"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(
                                    index,
                                    'discountType',
                                    item.discountType === 'percentage' ? 'fixed' : 'percentage'
                                  )
                                }
                                className={`px-1.5 py-1 rounded text-[10px] font-bold uppercase transition-colors shrink-0 ${
                                  item.discountType === 'percentage'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                                title="Toggle SAR or %"
                              >
                                {item.discountType === 'percentage' ? '%' : 'SAR'}
                              </button>
                            </div>
                          </td>

                          {/* Item Total */}
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-100">
                            {formatSAR(itemTotal)}
                          </td>

                          {/* Remove button */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <MdDelete size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BILL-LEVEL ADJUSTMENTS & SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Bill Discount, Tax & Notes */}
              <div className="space-y-4">
                <div>
                  <label className="label text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Bill-level Discount / خصم إجمالي الفاتورة
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="input text-xs py-1.5 flex-1"
                    />
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          discountType === 'fixed'
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        SAR
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          discountType === 'percentage'
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Notes / ملاحظات
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    className="input text-xs py-1.5 resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Calculations & Totals Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal / المجموع الفرعي:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatSAR(subtotal)}
                  </span>
                </div>

                {billDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>
                      Bill Discount ({discountType === 'percentage' ? `${discount}%` : 'SAR'}) / الخصم:
                    </span>
                    <span className="font-semibold">
                      - {formatSAR(billDiscountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT ({taxRate}%) / ضريبة القيمة المضافة:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatSAR(taxAmount)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Net Total / الإجمالي النهائي:
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatSAR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS FOOTER */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="btn-secondary px-5 py-2 text-xs"
              >
                Cancel / إلغاء
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary px-6 py-2 text-xs font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <MdSave size={16} />
                    <span>Save Changes / حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
