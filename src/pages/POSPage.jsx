import { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../services/productService';
import { createSale, updateSale } from '../services/saleService';
import { MdSearch, MdAdd, MdRemove, MdDelete, MdSettings, MdReceipt, MdPrint, MdClose, MdShoppingCart, MdPerson, MdPostAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import CustomerSelector from '../components/CustomerSelector';

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
  const currentTaxAmt = ((currentSubtotal - currentDiscountAmt) * (Number(taxRate) || 0)) / 100;
  const currentTotal = currentSubtotal - currentDiscountAmt + currentTaxAmt;

  const handleSave = async () => {
    if (items.length === 0) {
      return toast.error('Invoice must have at least one item before saving.');
    }

    setIsSaving(true);
    try {
      const payload = {
        items: items.map(i => ({
          productId: i.product?._id || i.productId,
          productName: i.productName,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount),
          discountType: i.discountType
        })),
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
          <div ref={invoiceRef} className="p-10 text-sm text-slate-800 bg-white print:p-0">
            <div className="grid grid-cols-3 items-center mb-6">
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
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-widest font-black">
                  <tr>
                    <th className="p-4 text-left w-12 opacity-60">No / رقم</th>
                    <th className="p-4 text-left">Product / المنتج</th>
                    <th className="p-4 text-center w-32">Unit Price / سعر الوحدة</th>
                    <th className="p-4 text-center w-28">Qty / الكمية</th>
                    <th className="p-4 text-center w-32">Disc / خصم</th>
                    <th className="p-4 text-center w-32">Subtotal / الإجمالي</th>
                    <th className="p-4 text-center w-24">VAT % / الضريبة</th>
                    <th className="p-4 text-center w-32">VAT Amt / مبلغ الضريبة</th>
                    <th className="p-4 text-right w-40">Total / الإجمالي النهائي</th>
                    <th className="p-4 text-center w-12 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      {/* Index Row */}
                      <td className="p-4 text-slate-400 font-black text-xs text-center">
                        {String(i + 1).padStart(2, '0')}
                      </td>

                      {/* Product name */}
                      <td className="p-4">
                        <input
                          type="text"
                          value={item.productName}
                          placeholder="Item description..."
                          onChange={(e) => handleUpdateItem(i, 'productName', e.target.value)}
                          className="w-full bg-transparent font-black text-slate-800 outline-none border-none focus:ring-0 p-0 text-base placeholder:text-slate-200"
                        />
                        <span className="hidden print:block font-black">{item.productName}</span>
                      </td>

                      {/* Unit Price */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 bg-slate-100 rounded-xl px-3 py-2 border border-transparent focus-within:border-primary-500 transition-all no-print">
                          <span className="text-[10px] font-black text-slate-400 uppercase">SAR</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(i, 'unitPrice', e.target.value)}
                            className="w-full bg-transparent text-center font-black text-slate-800 outline-none"
                          />
                        </div>
                        <span className="hidden print:block font-bold text-center">{formatSAR(item.unitPrice)}</span>
                      </td>

                      {/* Quantity */}
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
                      <td className="p-4">
                        <div className="flex items-center gap-1 bg-white border-2 border-slate-100 rounded-xl px-2 py-1.5 shadow-sm no-print">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleUpdateItem(i, 'discount', e.target.value)}
                            className="w-full bg-transparent text-center font-black text-red-500 outline-none text-xs"
                          />
                          <select
                            value={item.discountType}
                            onChange={(e) => handleUpdateItem(i, 'discountType', e.target.value)}
                            className="text-[9px] font-black bg-slate-100 rounded px-1 py-0.5 outline-none"
                          >
                            <option value="fixed">SAR</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                        <span className="hidden print:block font-bold text-center text-red-500">
                          {item.discount > 0 ? (item.discountType === 'percentage' ? `${item.discount}%` : formatSAR(item.discount)) : '-'}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-700">{formatSAR(item.totalPrice)}</span>
                      </td>

                      {/* VAT % */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">{taxRate || 0}%</span>
                      </td>

                      {/* VAT Amount */}
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-600">{formatSAR(((Number(item.totalPrice) || 0) * (Number(taxRate) || 0)) / 100)}</span>
                      </td>

                      {/* Final Total */}
                      <td className="p-4 text-right">
                        <span className="text-lg font-black text-slate-900 tracking-tighter">
                          {formatSAR((Number(item.totalPrice) || 0) + (((Number(item.totalPrice) || 0) * (Number(taxRate) || 0)) / 100))}
                        </span>
                      </td>

                      {/* Actions / Remove button */}
                      <td className="p-4 text-center no-print">
                        <button
                          onClick={() => handleRemoveItem(i)}
                          className="w-8 h-8 flex items-center justify-center text-red-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                {currentDiscountAmt > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount / الخصم</span>
                    <span>- {formatSAR(currentDiscountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT / الضريبة</span>
                  <span>{formatSAR(currentTaxAmt)}</span>
                </div>
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

// function InvoiceModal({ sale: initialSale, onClose }) {
//   const invoiceRef = useRef();

//   const [sale, setSale] = useState(initialSale);
//   const [items, setItems] = useState(initialSale.items);
//   const [discount, setDiscount] = useState(initialSale.discount || 0);
//   const [discountType, setDiscountType] = useState(initialSale.discountType || 'fixed');
//   const [taxRate, setTaxRate] = useState(initialSale.taxRate || 15);
//   const [paymentMethod, setPaymentMethod] = useState(initialSale.paymentMethod || 'cash');
//   const [isSaving, setIsSaving] = useState(false);

//   const handlePrint = useReactToPrint({
//     contentRef: invoiceRef,
//     documentTitle: `Invoice-${sale.invoiceNumber}`,
//   });

//   const formatSAR = (value) => {
//     return `SAR ${Number(value || 0).toLocaleString(undefined, {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;
//   };

//   const handleUpdateItem = (index, field, value) => {
//     const newItems = [...items];

//     newItems[index][field] = value;

//     const item = newItems[index];

//     const base =
//       (Number(item.unitPrice) || 0) *
//       (Number(item.quantity) || 0);

//     const itemDisc =
//       item.discountType === 'percentage'
//         ? (base * (Number(item.discount) || 0)) / 100
//         : Number(item.discount || 0);

//     item.totalPrice = base - itemDisc;

//     item.tax =
//       ((item.totalPrice || 0) * (Number(taxRate) || 0)) / 100;

//     setItems(newItems);
//   };

//   const handleAddItem = () => {
//     setItems([
//       ...items,
//       {
//         productName: '',
//         quantity: 1,
//         unitPrice: 0,
//         discount: 0,
//         discountType: 'fixed',
//         totalPrice: 0,
//         tax: 0,
//         productId: `custom-${Date.now()}`,
//       },
//     ]);
//   };

//   const handleRemoveItem = (index) => {
//     setItems(items.filter((_, i) => i !== index));
//   };

//   const currentSubtotal = items.reduce(
//     (acc, item) => acc + (Number(item.totalPrice) || 0),
//     0
//   );

//   const currentDiscountAmt =
//     discountType === 'percentage'
//       ? (currentSubtotal * (Number(discount) || 0)) / 100
//       : Number(discount || 0);

//   const currentTaxAmt =
//     ((currentSubtotal - currentDiscountAmt) *
//       (Number(taxRate) || 0)) /
//     100;

//   const currentTotal =
//     currentSubtotal -
//     currentDiscountAmt +
//     currentTaxAmt;

//   const handleSave = async () => {
//     setIsSaving(true);

//     try {
//       const { data } = await updateSale(sale._id, {
//         items: items.map((i) => ({
//           productId: i.product?._id || i.productId,
//           productName: i.productName,
//           quantity: Number(i.quantity),
//           unitPrice: Number(i.unitPrice),
//           discount: Number(i.discount),
//           discountType: i.discountType,
//         })),
//         customer: sale.customer,
//         discount: Number(discount),
//         discountType,
//         taxRate: Number(taxRate),
//         paymentMethod,
//         notes: sale.notes,
//       });

//       setSale(data.sale);
//       setItems(data.sale.items);
//       setDiscount(data.sale.discount);
//       setDiscountType(data.sale.discountType);
//       setTaxRate(data.sale.taxRate);

//       toast.success('Sale updated successfully!');
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || 'Update failed'
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-box max-w-7xl w-full h-[96vh] flex flex-col p-0 overflow-hidden">

//         {/* HEADER */}
//         <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-50 no-print">
//           <div>
//             <h2 className="text-xl font-black text-slate-900 tracking-tight">
//               Tax Invoice Editor
//             </h2>

//             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
//               Live Billing Customization
//             </p>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleAddItem}
//               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-600 border border-primary-100 font-black text-xs hover:bg-primary-100 transition-all"
//             >
//               <MdAdd size={18} />
//               Add Row
//             </button>

//             <button
//               onClick={handleSave}
//               disabled={isSaving}
//               className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all disabled:opacity-50"
//             >
//               {isSaving ? 'Saving...' : 'Finalize Bill'}
//             </button>

//             <button
//               onClick={handlePrint}
//               className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-black transition-all"
//             >
//               <MdPrint size={18} />
//               Print / PDF
//             </button>

//             <button
//               onClick={onClose}
//               className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
//             >
//               <MdClose size={22} />
//             </button>
//           </div>
//         </div>

//         {/* BODY */}
//         <div className="flex-1 overflow-y-auto bg-slate-100">
//           <div
//             ref={invoiceRef}
//             className="bg-white max-w-[1200px] mx-auto min-h-full p-10 text-sm text-slate-800 print:p-0"
//           >

//             {/* COMPANY HEADER */}
//             <div className="grid grid-cols-3 items-center mb-10 border-b pb-8">
//               <div>
//                 <h1 className="text-xl font-black text-slate-900">
//                   Ewan Al-Hazm Trading Establishment
//                 </h1>

//                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
//                   Hand Tools - Equipment - Safety - Workshop Supplies
//                 </p>

//                 <div className="mt-3 text-xs text-slate-500 space-y-1">
//                   <p>
//                     Address: As Saadah, OAJA4419,
//                     Al-Kharj 16443, Saudi Arabia
//                   </p>

//                   <p>Mobile: 059 571 7520</p>
//                 </div>
//               </div>

//               <div className="text-center">
//                 <h1 className="text-4xl font-black tracking-tight text-slate-900">
//                   TAX INVOICE
//                 </h1>

//                 <p className="text-slate-400 font-bold">
//                   فاتورة ضريبية
//                 </p>

//                 <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-primary-50 border border-primary-100">
//                   <span className="w-2 h-2 rounded-full bg-primary-500"></span>

//                   <span className="text-xs font-black text-primary-700">
//                     VAT No: 313147090700003
//                   </span>
//                 </div>
//               </div>

//               <div className="text-right">
//                 <h1 className="text-xl font-black text-slate-900">
//                   مؤسسة ايوان الحزم التجارية
//                 </h1>

//                 <p className="text-[10px] font-bold text-slate-500 mt-1">
//                   عدد يدوية - معدات - سلامة - لوازم ورش
//                 </p>

//                 <div className="mt-3 text-xs text-slate-500 space-y-1">
//                   <p>العنوان: السعادة، الخرج، السعودية</p>

//                   <p>الجوال: ٠٥٩٥٧١٧٥٢٠</p>
//                 </div>
//               </div>
//             </div>

//             {/* BILL INFO */}
//             <div className="grid grid-cols-2 gap-6 mb-8">
//               <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
//                 <div className="flex items-center gap-2 mb-4">
//                   <span className="w-2 h-2 rounded-full bg-primary-500"></span>

//                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//                     Bill From / من
//                   </span>
//                 </div>

//                 <p className="font-black text-slate-900 text-base">
//                   Ewan Al-Hazm Trading Establishment
//                 </p>

//                 <p className="text-xs text-slate-500 mt-1">
//                   VAT: 313147090700003
//                 </p>
//               </div>

//               <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
//                 <div className="flex items-center gap-2 mb-4">
//                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

//                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//                     Bill To / إلى
//                   </span>
//                 </div>

//                 <p className="font-black text-slate-900 text-base">
//                   {sale.customer?.name || 'Walk-in Customer'}
//                 </p>

//                 {sale.customer?.phone && (
//                   <p className="text-xs text-slate-500 mt-1">
//                     Mobile: {sale.customer.phone}
//                   </p>
//                 )}

//                 {sale.customer?.vatNumber && (
//                   <p className="text-xs text-slate-500 mt-1">
//                     VAT: {sale.customer.vatNumber}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* META */}
//             <div className="grid grid-cols-4 gap-4 mb-8">
//               <div className="border rounded-2xl p-4 bg-white shadow-sm">
//                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
//                   Invoice No
//                 </p>

//                 <p className="font-black text-slate-900">
//                   {sale.invoiceNumber}
//                 </p>
//               </div>

//               <div className="border rounded-2xl p-4 bg-white shadow-sm">
//                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
//                   Date
//                 </p>

//                 <p className="font-black text-slate-900">
//                   {new Date(
//                     sale.createdAt
//                   ).toLocaleDateString()}
//                 </p>
//               </div>

//               <div className="border rounded-2xl p-4 bg-white shadow-sm">
//                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
//                   Payment
//                 </p>

//                 <p className="font-black text-primary-600 uppercase">
//                   {paymentMethod}
//                 </p>
//               </div>

//               <div className="border rounded-2xl p-4 bg-white shadow-sm">
//                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
//                   Currency
//                 </p>

//                 <p className="font-black text-slate-900">
//                   SAR / ريال
//                 </p>
//               </div>
//             </div>

//             {/* TABLE */}
//             <div className="overflow-hidden rounded-3xl border border-slate-100 mb-10">
//               <table className="w-full">
//                 <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
//                   <tr>
//                     <th className="p-4 text-left">#</th>
//                     <th className="p-4 text-left">
//                       Product / المنتج
//                     </th>
//                     <th className="p-4 text-center">
//                       Unit Price
//                     </th>
//                     <th className="p-4 text-center">
//                       Qty
//                     </th>
//                     <th className="p-4 text-center">
//                       Discount
//                     </th>
//                     <th className="p-4 text-center">
//                       VAT %
//                     </th>
//                     <th className="p-4 text-right">
//                       Total
//                     </th>
//                     <th className="p-4 no-print"></th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-100">
//                   {items.map((item, i) => (
//                     <tr
//                       key={i}
//                       className="hover:bg-slate-50 transition-all"
//                     >
//                       <td className="p-4 font-black text-slate-300">
//                         {String(i + 1).padStart(2, '0')}
//                       </td>

//                       <td className="p-4">
//                         <input
//                           type="text"
//                           value={item.productName}
//                           onChange={(e) =>
//                             handleUpdateItem(
//                               i,
//                               'productName',
//                               e.target.value
//                             )
//                           }
//                           className="w-full bg-transparent outline-none font-black text-slate-900"
//                         />
//                       </td>

//                       <td className="p-4">
//                         <input
//                           type="number"
//                           value={item.unitPrice}
//                           onChange={(e) =>
//                             handleUpdateItem(
//                               i,
//                               'unitPrice',
//                               e.target.value
//                             )
//                           }
//                           className="w-full text-center bg-slate-50 border rounded-xl p-2 font-black outline-none"
//                         />
//                       </td>

//                       <td className="p-4">
//                         <input
//                           type="number"
//                           value={item.quantity}
//                           onChange={(e) =>
//                             handleUpdateItem(
//                               i,
//                               'quantity',
//                               e.target.value
//                             )
//                           }
//                           className="w-full text-center bg-slate-50 border rounded-xl p-2 font-black outline-none"
//                         />
//                       </td>

//                       <td className="p-4">
//                         <div className="flex gap-2">
//                           <input
//                             type="number"
//                             value={item.discount}
//                             onChange={(e) =>
//                               handleUpdateItem(
//                                 i,
//                                 'discount',
//                                 e.target.value
//                               )
//                             }
//                             className="w-full text-center bg-slate-50 border rounded-xl p-2 font-black outline-none"
//                           />

//                           <select
//                             value={item.discountType}
//                             onChange={(e) =>
//                               handleUpdateItem(
//                                 i,
//                                 'discountType',
//                                 e.target.value
//                               )
//                             }
//                             className="bg-slate-50 border rounded-xl px-2 font-black outline-none"
//                           >
//                             <option value="fixed">
//                               SAR
//                             </option>

//                             <option value="percentage">
//                               %
//                             </option>
//                           </select>
//                         </div>
//                       </td>

//                       <td className="p-4 text-center font-black text-primary-600">
//                         {taxRate}%
//                       </td>

//                       <td className="p-4 text-right font-black text-slate-900">
//                         {formatSAR(item.totalPrice)}
//                       </td>

//                       <td className="p-4 text-center no-print">
//                         <button
//                           onClick={() =>
//                             handleRemoveItem(i)
//                           }
//                           className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
//                         >
//                           <MdDelete size={18} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* FOOTER AREA */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

//               {/* SETTINGS */}
//               <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 space-y-6 no-print">

//                 <div>
//                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
//                     Global Discount
//                   </label>

//                   <div className="flex gap-2 mt-2">
//                     <input
//                       type="number"
//                       value={discount}
//                       onChange={(e) =>
//                         setDiscount(e.target.value)
//                       }
//                       className="w-full rounded-2xl border bg-white p-3 font-black outline-none"
//                     />

//                     <select
//                       value={discountType}
//                       onChange={(e) =>
//                         setDiscountType(e.target.value)
//                       }
//                       className="rounded-2xl border bg-white px-4 font-black outline-none"
//                     >
//                       <option value="fixed">
//                         SAR
//                       </option>

//                       <option value="percentage">
//                         %
//                       </option>
//                     </select>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
//                     Tax Percent
//                   </label>

//                   <div className="mt-2">
//                     <input
//                       type="number"
//                       value={taxRate}
//                       onChange={(e) =>
//                         setTaxRate(e.target.value)
//                       }
//                       className="w-full rounded-2xl border bg-white p-3 font-black outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
//                     Payment Method
//                   </label>

//                   <select
//                     value={paymentMethod}
//                     onChange={(e) =>
//                       setPaymentMethod(
//                         e.target.value
//                       )
//                     }
//                     className="w-full mt-2 rounded-2xl border bg-white p-3 font-black outline-none"
//                   >
//                     <option value="cash">
//                       Cash
//                     </option>

//                     <option value="card">
//                       Card
//                     </option>

//                     <option value="bank_transfer">
//                       Bank Transfer
//                     </option>
//                   </select>
//                 </div>
//               </div>

//               {/* TOTALS */}
//               <div className="rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
//                 <div className="space-y-5">

//                   <div className="flex justify-between text-sm uppercase tracking-widest text-white/50 font-black">
//                     <span>Subtotal</span>

//                     <span className="text-white">
//                       {formatSAR(currentSubtotal)}
//                     </span>
//                   </div>

//                   {currentDiscountAmt > 0 && (
//                     <div className="flex justify-between text-sm uppercase tracking-widest text-red-400 font-black">
//                       <span>Discount</span>

//                       <span>
//                         - {formatSAR(currentDiscountAmt)}
//                       </span>
//                     </div>
//                   )}

//                   <div className="flex justify-between text-sm uppercase tracking-widest text-white/50 font-black border-b border-white/10 pb-5">
//                     <span>
//                       VAT ({taxRate}%)
//                     </span>

//                     <span className="text-white">
//                       {formatSAR(currentTaxAmt)}
//                     </span>
//                   </div>

//                   <div className="pt-4">
//                     <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">
//                       Total Payable
//                     </p>

//                     <h1 className="text-5xl font-black tracking-tight text-emerald-400">
//                       {formatSAR(currentTotal)}
//                     </h1>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* SIGNATURES */}
//             <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between">
//               <div>
//                 <div className="w-52 h-px bg-slate-300 mb-4"></div>

//                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//                   Receiver Signature
//                 </p>
//               </div>

//               <div className="text-right">
//                 <div className="w-52 h-px bg-slate-300 mb-4 ml-auto"></div>

//                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//                   Authorized Signature
//                 </p>
//               </div>
//             </div>

//             {/* FOOTER */}
//             <div className="mt-10 text-center text-[10px] text-slate-400">
//               <p>
//                 AB Traders POS System
//               </p>

//               <p>
//                 Thank you for your business /
//                 شكراً لتعاملكم معنا
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
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
    if (product.quantity === 0) return toast.error('Out of stock');
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) return toast.error('Insufficient stock') || prev;
        return prev.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
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
        maxQty: product.quantity
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
        quantity: 1,
        isCustom: true,
      },
    ]);
  };

  const updateItemName = (productId, name) => {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, productName: name } : i)));
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
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100;
  const total = subtotal - discountAmt + taxAmt;

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
          unitPrice: Number(i.unitPrice) || 0
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
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Sale failed'); }
    finally { setLoading(false); }
  };

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer({
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
              <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
              <p className="text-[10px] font-bold text-blue-600 truncate">{p.sku}</p>
              <p className="text-sm font-black text-primary-600 mt-1">SAR {Number(p.salePrice).toLocaleString()}</p>
              <p className="text-[11px] text-slate-900 font-bold">Cost: SAR {Number(p.purchasePrice || 0).toLocaleString()}</p>
              <p className={`text-xs mt-0.5 font-black ${p.quantity <= p.lowStockThreshold ? 'text-red-600' : 'text-emerald-700'}`}>
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
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {item.productName}
                    </p>
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
