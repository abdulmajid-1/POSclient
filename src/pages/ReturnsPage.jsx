import { useState, useEffect, useCallback } from 'react';
import { getReturns, createReturn } from '../services/returnService';
import { getSales } from '../services/saleService';
import { MdAdd, MdSearch, MdClose, MdKeyboardReturn } from 'react-icons/md';
import toast from 'react-hot-toast';

function ReturnModal({ onClose, onSaved }) {
  const [invoiceNum, setInvoiceNum] = useState('');
  const [sale, setSale] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const searchSale = async () => {
    if (!invoiceNum) return;
    setSearching(true);
    try {
      const { data } = await getSales({ search: invoiceNum });
      const found = data.sales[0];
      if (!found) return toast.error('Invoice not found');
      setSale(found);
      setSelectedItems(found.items.map((item) => ({ productId: item.product, productName: item.productName, unitPrice: item.unitPrice, maxQty: item.quantity, quantity: 0 })));
    } catch { toast.error('Search failed'); } finally { setSearching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = selectedItems.filter((i) => i.quantity > 0);
    if (!itemsToReturn.length) return toast.error('Select items to return');
    if (!reason) return toast.error('Provide a reason');
    setLoading(true);
    try {
      await createReturn({ saleId: sale._id, items: itemsToReturn, reason });
      toast.success('Return processed');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-slate-800">Process Return</h2>
          <button onClick={onClose}><MdClose size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} placeholder="Enter invoice number..." className="input flex-1" onKeyDown={(e) => e.key === 'Enter' && searchSale()} />
            <button onClick={searchSale} disabled={searching} className="btn-primary shrink-0">{searching ? 'Searching...' : 'Find'}</button>
          </div>
          {sale && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-500">Invoice: <span className="font-semibold text-slate-700">{sale.invoiceNumber}</span> • Customer: {sale.customer?.name}</p>
              <div className="space-y-2">
                {selectedItems.map((item, i) => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1"><p className="text-sm font-medium">{item.productName}</p><p className="text-xs text-slate-400">Max: {item.maxQty} • Rs {Number(item.unitPrice).toLocaleString()} each</p></div>
                    <input type="number" min={0} max={item.maxQty} value={item.quantity}
                      onChange={(e) => setSelectedItems((prev) => prev.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 0 } : it))}
                      className="input w-20 text-center" />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Reason for Return *</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" rows={2} required />
              </div>
              <div className="text-sm font-medium text-right text-primary-600">
                Refund: Rs {selectedItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString()}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-danger flex-1">{loading ? 'Processing...' : 'Process Return'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getReturns();
      setReturns(data.returns); setTotal(data.total);
    } catch { toast.error('Failed to load returns'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-800">Returns</h1><p className="text-slate-500 text-sm">{total} return records</p></div>
        <button onClick={() => setShowModal(true)} className="btn-danger"><MdAdd size={18} /> New Return</button>
      </div>
      <div className="card p-0">
        {loading ? <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          : returns.length === 0 ? <div className="flex flex-col items-center py-16 text-slate-400"><MdKeyboardReturn size={48} className="opacity-30 mb-3" /><p>No returns yet</p></div>
          : <div className="table-wrapper"><table className="table">
              <thead><tr><th>Return #</th><th>Invoice</th><th>Items</th><th>Refund Amount</th><th>Reason</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>{returns.map((r) => (
                <tr key={r._id}>
                  <td><span className="badge-red font-mono">{r.returnNumber}</span></td>
                  <td className="text-primary-600 font-medium">{r.invoiceNumber}</td>
                  <td>{r.items?.length} items</td>
                  <td className="font-semibold text-red-500">Rs {Number(r.totalRefund).toLocaleString()}</td>
                  <td className="text-slate-500 text-xs max-w-xs truncate">{r.reason}</td>
                  <td className="text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString('en-PK')}</td>
                  <td><span className="badge-green capitalize">{r.status}</span></td>
                </tr>
              ))}</tbody>
            </table></div>}
      </div>
      {showModal && <ReturnModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetch(); }} />}
    </div>
  );
}
