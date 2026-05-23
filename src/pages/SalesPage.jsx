import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSales, getSale } from '../services/saleService';
import { MdSearch, MdVisibility, MdClose, MdHistory, MdPrint } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { useRef as usePrintRef } from 'react';
import { TableSkeleton } from '../components/SkeletonLoader';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

function SaleDetailModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale?.invoiceNumber}`,
  });

  useEffect(() => {
    getSale(saleId)
      .then(({ data }) => setSale(data.sale))
      .catch(() => toast.error('Failed to load sale'))
      .finally(() => setLoading(false));
  }, [saleId]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-4xl w-full">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800">Invoice Preview</h2>

          <div className="flex gap-2">
            {sale && (
              <button onClick={handlePrint} className="btn-primary text-xs py-1.5">
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
          <div ref={invoiceRef} className="p-8 text-sm text-slate-800">

            {/* ================= TITLE ================= */}
            {/* <div className="grid grid-cols-3 items-center mb-6">
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
                <p className="text-[10px] font-semibold text-slate-600 mb-1">عدد يدوية - معدات - سلامة - لوازم ورش</p>
                <p className="text-xs text-slate-500">العنوان: السعادة، الخرج، السعودية</p>
                <p className="text-xs text-slate-500">الجوال:٠٥٩٥٧١٧٥٢٠</p>
              </div>
            </div> */}

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
                  VAT No: 313147090700003
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
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 border rounded-lg">
                <p className="font-bold mb-2">From / من</p>
                <p className="font-semibold">Ewan Al-Hazm Trading Establishment</p>
                <p className="text-xs text-slate-400">مؤسسة ايوان الحزم التجارية</p>
                <p className="text-xs text-slate-400">VAT / ضريبة: 313147090700003</p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-bold mb-2">To / إلى</p>
                <p className="font-semibold">Customer / العميل: {sale.customer?.name || 'Walk-in Customer'}</p>
                {sale.customer?.phone && <p className="text-slate-500">Mobile / الجوال: {sale.customer.phone}</p>}
                {sale.customer?.vatNumber && <p className="text-slate-500">VAT / ضريبة: {sale.customer.vatNumber}</p>}
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
                <p className="font-semibold">{new Date(sale.createdAt).toLocaleString()}</p>
              </div>
              <div className="border p-3 rounded">
                <p className="text-slate-500">Currency / العملة</p>
                <p className="font-semibold">SAR / ريال</p>
              </div>
            </div>

            {/* ================= TABLE ================= */}
            {/* <table className="w-full border text-xs mb-6">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">No / رقم</th>
                  <th className="p-2 text-left">Product / المنتج</th>
                  <th className="p-2 text-center">Unit / الوحدة</th>
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
                    <td className="p-2 text-center font-bold text-slate-600">{item.selectedUnit || 'Unit'}</td>
                    <td className="p-2 text-center">{formatSAR(item.unitPrice)}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center text-red-500">
                      {item.discount > 0 ? (item.discountType === 'percentage' ? `${item.discount}%` : formatSAR(item.discount)) : '-'}
                    </td>
                    <td className="p-2 text-center">{formatSAR(item.totalPrice)}</td>
                    <td className="p-2 text-center">{sale.taxRate || 0}%</td>
                    <td className="p-2 text-center">{formatSAR((item.totalPrice * (sale.taxRate || 0)) / 100)}</td>
                    <td className="p-2 text-center font-semibold">
                      {formatSAR(item.totalPrice + ((item.totalPrice * (sale.taxRate || 0)) / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table> */}


            <table className="w-full border text-[11px] mb-6 table-fixed">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-1 w-[4%] text-left">No / رقم</th>

                  {/* PRODUCT COLUMN - BIGGER */}
                  <th className="p-1 w-[28%] text-left">
                    Product / المنتج
                  </th>

                  <th className="p-1 w-[8%] text-center">
                    Unit / الوحدة
                  </th>

                  <th className="p-1 w-[10%] text-center">
                    Unit Price / سعر الوحدة
                  </th>

                  <th className="p-1 w-[6%] text-center">
                    Qty / الكمية
                  </th>

                  <th className="p-1 w-[8%] text-center">
                    Disc / خصم
                  </th>

                  <th className="p-1 w-[10%] text-center">
                    Subtotal / الإجمالي
                  </th>

                  <th className="p-1 w-[6%] text-center">
                    VAT %
                  </th>

                  <th className="p-1 w-[10%] text-center">
                    VAT Amt
                  </th>

                  <th className="p-1 w-[10%] text-center">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1 text-center">{i + 1}</td>

                    {/* PRODUCT CELL - BETTER SPACING */}
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: calculate date range from a range type string
// ──────────────────────────────────────────────────────────────────────────────
function calculateDates(type, startDate, endDate) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'weekly') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'monthly') {
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'yearly') {
    start.setDate(now.getDate() - 365);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'custom') {
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T23:59:59');
    return { start: s.toISOString(), end: e.toISOString() };
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

export default function SalesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);

  const [rangeType, setRangeType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // 300ms debounce — reset page on new search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Reset page when range or dates change
  useEffect(() => { setPage(1); }, [rangeType, startDate, endDate]);

  const dates = calculateDates(rangeType, startDate, endDate);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sales', debouncedSearch, rangeType, startDate, endDate, page],
    queryFn: () =>
      getSales({ search: debouncedSearch, startDate: dates.start, endDate: dates.end, page, limit })
        .then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const sales = data?.sales || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || Math.ceil(total / limit) || 1;

  const ranges = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales History</h1>
          <p className="text-slate-500 text-sm">{total} total transactions</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice or customer..."
              className="input pl-9 pr-9"
            />
            {isFetching && !isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeType(r.key)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${rangeType === r.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {rangeType === 'custom' && (
          <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end animate-slide-down">
            <div className="flex-1"><label className="label text-[10px] font-black uppercase text-slate-400">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" /></div>
            <div className="flex-1"><label className="label text-[10px] font-black uppercase text-slate-400">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" /></div>
            <button onClick={() => refetch()} className="btn-primary shrink-0 px-8">Apply</button>
          </div>
        )}
      </div>

      <div className="card p-0">
        {isLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400"><MdHistory size={48} className="opacity-30 mb-3" /><p>No sales found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Subtotal</th><th>Discount</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id}>
                    <td><span className="badge-blue font-mono">{s.invoiceNumber}</span></td>
                    <td className="font-medium text-slate-700">{s.customer?.name}</td>
                    <td className="text-slate-500">{s?.items[0]?.quantity || '0'} items</td>
                    <td>{formatSAR(s.subtotal)}</td>
                    <td className="text-red-500">{s.discount > 0 ? `- ${formatSAR(s.discount)}` : '—'}</td>
                    <td className="font-semibold text-emerald-600">{formatSAR(s.total)}</td>
                    <td className="capitalize"><span className="badge-gray">{s.paymentMethod}</span></td>
                    <td className="text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString('en-SA')}</td>
                    <td><span className={`badge-${s.status === 'completed' ? 'green' : 'red'}`}>{s.status}</span></td>
                    <td>
                      <button onClick={() => setSelectedSaleId(s._id)} className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors text-slate-400">
                        <MdVisibility size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSaleId && <SaleDetailModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />}

      <div className="flex items-center justify-between p-4 border-t">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
        >
          Previous
        </button>
        <div className="text-sm font-bold text-slate-500">Page {page} of {totalPages}</div>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
        >
          Next
        </button>
      </div>
    </div>
  );
}
