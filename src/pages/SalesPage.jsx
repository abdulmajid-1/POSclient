import { useState, useEffect, useCallback } from 'react';
import { getSales, getSale } from '../services/saleService';
import { MdSearch, MdVisibility, MdClose, MdHistory, MdPrint } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const formatPKR = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

function SaleDetailModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Invoice-${sale?.invoiceNumber}` });

  useEffect(() => {
    getSale(saleId).then(({ data }) => setSale(data.sale)).catch(() => toast.error('Failed to load sale')).finally(() => setLoading(false));
  }, [saleId]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-bold text-slate-800">Sale Details</h2>
          <div className="flex gap-2">
            {sale && <button onClick={handlePrint} className="btn-primary text-xs py-1.5"><MdPrint size={14} /> Print</button>}
            <button onClick={onClose} className="btn-secondary text-xs py-1.5"><MdClose size={14} /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : sale && (
          <div ref={printRef} className="p-6">
            <div className="flex justify-between mb-6">
              <div><h3 className="font-bold text-slate-800 text-lg">AB Traders</h3><p className="text-slate-400 text-xs">Invoice</p></div>
              <div className="text-right">
                <p className="font-bold text-primary-600">{sale.invoiceNumber}</p>
                <p className="text-xs text-slate-400">{new Date(sale.createdAt).toLocaleString('en-PK')}</p>
                <span className={`badge-${sale.status === 'completed' ? 'green' : 'red'} mt-1`}>{sale.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-slate-400 text-xs">Customer</p><p className="font-medium">{sale.customer?.name}</p>{sale.customer?.phone && <p className="text-slate-400">{sale.customer.phone}</p>}</div>
              <div><p className="text-slate-400 text-xs">Payment</p><p className="font-medium capitalize">{sale.paymentMethod}</p></div>
            </div>
            <table className="w-full text-sm mb-4">
              <thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-slate-500 font-medium">Product</th><th className="text-center py-2 text-slate-500 font-medium">Qty</th><th className="text-right py-2 text-slate-500 font-medium">Price</th><th className="text-right py-2 text-slate-500 font-medium">Total</th></tr></thead>
              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2">{item.productName}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatPKR(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatPKR(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>{formatPKR(sale.subtotal)}</span></div>
                {sale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatPKR(sale.discount)}</span></div>}
                {sale.tax > 0 && <div className="flex justify-between"><span className="text-slate-400">Tax</span><span>{formatPKR(sale.tax)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-primary-600">{formatPKR(sale.total)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getSales({ search, startDate, endDate });
      setSales(data.sales);
      setTotal(data.total);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  }, [search, startDate, endDate]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sales History</h1>
        <p className="text-slate-500 text-sm">{total} total transactions</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice or customer..." className="input pl-9" />
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input sm:w-40" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input sm:w-40" />
      </div>

      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
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
                    <td className="text-slate-500">{s.items?.length} items</td>
                    <td>{formatPKR(s.subtotal)}</td>
                    <td className="text-red-500">{s.discount > 0 ? `- ${formatPKR(s.discount)}` : '—'}</td>
                    <td className="font-semibold text-emerald-600">{formatPKR(s.total)}</td>
                    <td className="capitalize"><span className="badge-gray">{s.paymentMethod}</span></td>
                    <td className="text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString('en-PK')}</td>
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
    </div>
  );
}
