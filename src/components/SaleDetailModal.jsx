import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSale, updateSaleCustomer } from '../services/saleService';
import { MdClose, MdPrint, MdEditLocation, MdSave } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import ZatcaReportButton from './ZatcaReportButton';
import ZatcaReceiptQR from './ZatcaReceiptQR';
import { formatBillDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

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

export default function SaleDetailModal({ saleId, onClose }) {
  const { isDeveloper } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    vatNumber: '',
    address: ''
  });

  const queryClient = useQueryClient();
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale?.invoiceNumber}`,
  });

  useEffect(() => {
    if (!saleId) return;
    setLoading(true);
    getSale(saleId)
      .then(({ data }) => {
        setSale(data.sale);
        if (data.sale?.customer) {
          setCustomerForm({
            name: data.sale.customer.name || '',
            phone: data.sale.customer.phone || '',
            vatNumber: data.sale.customer.vatNumber || '',
            address: data.sale.customer.address || ''
          });
        }
      })
      .catch(() => toast.error('Failed to load sale'))
      .finally(() => setLoading(false));
  }, [saleId]);

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!sale?._id) return;
    setIsSavingCustomer(true);
    try {
      const { data } = await updateSaleCustomer(sale._id, customerForm);
      if (data.success && data.sale) {
        setSale(data.sale);
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        queryClient.invalidateQueries({ queryKey: ['detailedSales'] });
        toast.success('Customer address & details updated!');
        setIsEditingCustomer(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update customer details');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-4xl w-full">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800 dark:text-white">Invoice Preview</h2>

          <div className="flex items-center gap-3">
            {sale && isDeveloper && (
              <button
                onClick={() => setIsEditingCustomer(true)}
                className="btn-secondary text-xs py-1.5 flex items-center gap-1.5 border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100"
              >
                <MdEditLocation size={16} /> Edit Address / العميل
              </button>
            )}
            {sale && (
              <ZatcaReportButton
                sale={sale}
                onSaleUpdated={(updated) => setSale(updated)}
                onTriggerPrint={handlePrint}
              />
            )}
            {sale && (
              <button onClick={handlePrint} className="btn-primary text-xs py-1.5 flex items-center gap-1">
                <MdPrint size={14} /> Print
              </button>
            )}

            <button onClick={onClose} className="btn-secondary text-xs py-1.5">
              <MdClose size={14} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sale ? (
          <div ref={invoiceRef} className="print-container p-8 text-sm text-slate-800 bg-white">

            {/* ================= TITLE ================= */}
            <div className="grid grid-cols-3 items-center mb-4 px-2">

              {/* LEFT SIDE (English) */}
              <div className="text-left">
                <h1 className="text-base font-bold leading-tight">
                  Ewan Al-Hazm Trading Est.
                </h1>

                <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5">
                  Hand Tools - Equipment - Safety - Workshop Supplies
                </p>

                <p className="text-[10px] text-slate-500 leading-tight">
                  Address: As Saadah, OAJA4419, Al-Kharj 16443, Saudi Arabia
                </p>

                <p className="text-[10px] text-slate-500 leading-tight">
                  Mobile: 059 571 7520
                </p>
              </div>

              {/* CENTER TITLE */}
              <div className="text-center px-1">
                <h1 className="text-xl font-bold leading-tight">
                  TAX INVOICE
                </h1>

                <p className="text-slate-500 text-xs">
                  فاتورة ضريبية
                </p>

                <p className="text-[10px] text-slate-500">
                  VAT No: 314852932200003
                </p>
              </div>

              {/* RIGHT SIDE (Arabic) */}
              <div className="text-right">
                <h1 className="text-base font-bold leading-tight">
                  مؤسسة ايوان الحزم التجارية
                </h1>

                <p className="text-[9px] font-semibold text-slate-600 mb-0.5 leading-tight">
                  عدد يدوية - معدات - سلامة - لوازم ورش
                </p>

                <p className="text-[10px] text-slate-500 leading-tight">
                  العنوان: السعادة، الخرج، السعودية
                </p>

                <p className="text-[10px] text-slate-500 leading-tight">
                  الجوال: ٠٥٩٥٧١٧٥٢٠
                </p>
              </div>

            </div>

            {/* ================= FROM / TO ================= */}
            <div className="grid grid-cols-2 gap-4 mb-6 min-h-[125px]">
              <div className="p-3.5 border rounded-lg flex flex-col justify-between text-xs h-full bg-slate-50/40">
                <div>
                  <p className="font-bold text-slate-800 mb-1">From / من</p>
                  <p className="font-semibold text-slate-900">Ewan Al-Hazm Trading Establishment</p>
                  <p className="text-slate-500">مؤسسة ايوان الحزم التجارية</p>
                  <p className="text-slate-500">VAT / ضريبة: 314852932200003</p>
                </div>
              </div>

              <div className="p-3.5 border rounded-lg flex flex-col justify-between text-xs h-full bg-slate-50/40">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-800">To / إلى</p>
                    {isDeveloper && (
                      <button
                        onClick={() => setIsEditingCustomer(true)}
                        className="no-print text-[10px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 transition-colors"
                      >
                        Edit / تعديل
                      </button>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900">Customer / العميل: {sale.customer?.name || 'Walk-in Customer'}</p>
                  {sale.customer?.phone && <p className="text-slate-500">Mobile / الجوال: {sale.customer.phone}</p>}
                  {sale.customer?.vatNumber && <p className="text-slate-500">VAT / ضريبة: {sale.customer.vatNumber}</p>}
                  {sale.customer?.address && (
                    <p className="text-slate-700 font-medium mt-1">
                      Address: <span className="text-slate-900 font-semibold">{sale.customer.address}</span>
                    </p>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] mt-2 pt-1 border-t border-slate-200/60">
                  Payment / طريقة الدفع: <span className="font-bold text-slate-800">{paymentMethodLabel(sale.paymentMethod)}</span>
                </p>
              </div>
            </div>

            {/* ================= META ================= */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
              <div className="border p-3 rounded">
                <p className="text-slate-500">Invoice No / رقم</p>
                <p className="font-semibold">{sale.invoiceNumber}</p>
              </div>
              <div className="border p-3 rounded">
                <p className="text-slate-500">Date / التاريخ</p>
                <p className="font-semibold">{formatBillDate(sale.createdAt, true)}</p>
              </div>
              <div className="border p-3 rounded">
                <p className="text-slate-500">Currency / العملة</p>
                <p className="font-semibold">SAR / ريال</p>
              </div>
            </div>

            {/* ================= TABLE ================= */}
            <table className="w-full border text-[11px] mb-6 table-fixed">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-1 w-[4%] text-left">No / رقم</th>
                  <th className="p-1 w-[28%] text-left">Product / المنتج</th>
                  <th className="p-1 w-[8%] text-center">Unit / الوحدة</th>
                  <th className="p-1 w-[10%] text-center">Unit Price / سعر الوحدة</th>
                  <th className="p-1 w-[6%] text-center">Qty / الكمية</th>
                  <th className="p-1 w-[8%] text-center">Disc / خصم</th>
                  <th className="p-1 w-[10%] text-center">Subtotal / الإجمالي</th>
                  <th className="p-1 w-[6%] text-center">VAT %</th>
                  <th className="p-1 w-[10%] text-center">VAT Amt</th>
                  <th className="p-1 w-[10%] text-center">Total</th>
                </tr>
              </thead>

              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1 text-center">{i + 1}</td>
                    <td className="p-1 text-left whitespace-normal break-words">
                      {item.productName}
                    </td>
                    <td className="p-1 text-center font-bold text-slate-600">
                      {item.selectedUnit || 'Unit'}
                    </td>
                    <td className="p-1 text-center">
                      {formatSAR(item.unitPrice)}
                    </td>
                    <td className="p-1 text-center">
                      {item.quantity}
                    </td>
                    <td className="p-1 text-center text-red-500">
                      {item.discount > 0
                        ? (item.discountType === 'percentage'
                          ? `${item.discount}%`
                          : formatSAR(item.discount))
                        : '-'}
                    </td>
                    <td className="p-1 text-center">
                      {formatSAR(item.totalPrice)}
                    </td>
                    <td className="p-1 text-center">
                      {sale.taxRate || 0}%
                    </td>
                    <td className="p-1 text-center">
                      {formatSAR((item.totalPrice * (sale.taxRate || 0)) / 100)}
                    </td>
                    <td className="p-1 text-center font-semibold">
                      {formatSAR(
                        item.totalPrice +
                        ((item.totalPrice * (sale.taxRate || 0)) / 100)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ================= SUMMARY ================= */}
            <div className="flex justify-end">
              <div className="w-80 border rounded p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal / المجموع</span>
                  <span>{formatSAR(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total / الإجمالي</span>
                  <span className="text-primary-600">{formatSAR(sale.total)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>VAT / الضريبة</span>
                  <span>{formatSAR(sale.tax)}</span>
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
              </div>
            </div>

            {/* ZATCA Phase 2 E-Invoice QR Code */}
            <ZatcaReceiptQR qrCode={sale.zatca?.qrCode} />
          </div>
        ) : null}

        {/* EDIT CUSTOMER & ADDRESS MODAL */}
        {isEditingCustomer && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <MdEditLocation className="text-primary-600" size={22} />
                  <h3 className="font-bold text-slate-800 text-base">Edit Customer & Address</h3>
                </div>
                <button
                  onClick={() => setIsEditingCustomer(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name / اسم العميل
                  </label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="Walk-in Customer"
                    className="input text-xs py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile / الجوال
                    </label>
                    <input
                      type="text"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      placeholder="05XXXXXXXX"
                      className="input text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      VAT Number / الرقم الضريبي
                    </label>
                    <input
                      type="text"
                      value={customerForm.vatNumber}
                      onChange={(e) => setCustomerForm({ ...customerForm, vatNumber: e.target.value })}
                      placeholder="3XXXXXXXXXXXXXX"
                      className="input text-xs py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address / العنوان (Street, City, Postal Code)
                  </label>
                  <textarea
                    rows={3}
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    placeholder="e.g. Al-Kharj Industrial Area, Street 14, Building 5"
                    className="input text-xs py-2 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCustomer}
                    className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
                  >
                    <MdSave size={16} />
                    {isSavingCustomer ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
