import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSupplier, getSupplierPayments, editSupplierPayment, deleteSupplierPayment } from '../services/supplierService';
import { getPurchases, updatePurchase, deletePurchase } from '../services/purchaseService';
import { MdArrowBack, MdReceipt, MdPayments, MdHistory, MdShoppingBag, MdEdit, MdDelete, MdClose, MdCalendarToday, MdFilterList, MdAccountBalance } from 'react-icons/md';
import toast from 'react-hot-toast';
import { formatBillDateOnly, calculateDates } from '../utils/dateUtils';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

function EditPurchaseModal({ purchase, onClose, onSaved }) {
    const [form, setForm] = useState({
        amount: purchase.total || 0,
        totalItems: purchase.totalItems || purchase.items?.length || 0,
        notes: purchase.notes || '',
        date: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updatePurchase(purchase._id, {
                items: purchase.items || [], // keeps existing items
                subtotal: Number(form.amount),
                tax: purchase.tax || 0,
                total: Number(form.amount),
                totalItems: Number(form.totalItems),
                notes: form.notes,
                date: form.date
            });
            toast.success('Purchase updated successfully');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update purchase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Edit Purchase - {purchase.purchaseNumber}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><MdClose size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Purchase Amount</label>
                            <input type="number" className="input font-bold text-lg" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Total Items</label>
                            <input type="number" className="input font-bold" value={form.totalItems} onChange={e => setForm({ ...form, totalItems: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Date</label>
                        <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Notes</label>
                        <textarea className="input min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <button disabled={loading} className="btn-primary w-full justify-center h-12 text-lg">
                        {loading ? 'Processing...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function EditPaymentModal({ payment, onClose, onSaved }) {
    const [form, setForm] = useState({
        amount: payment.amount || 0,
        paymentMethod: payment.paymentMethod || 'cash',
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || '',
        date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await editSupplierPayment(payment._id, form);
            toast.success('Payment updated successfully');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Edit Payment</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><MdClose size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Amount</label>
                            <input type="number" className="input font-bold text-lg" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Date</label>
                            <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Payment Method</label>
                        <select className="input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Ref #</label>
                        <input className="input" placeholder="Ref/Transaction ID" value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} />
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Notes</label>
                        <textarea className="input min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <button disabled={loading} className="btn-primary w-full justify-center h-12 text-lg">
                        {loading ? 'Processing...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function SupplierPurchaseHistoryPage() {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('purchases'); // purchases, payments

    const [rangeType, setRangeType] = useState('all'); // all, today, month, yearly, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [periodSummary, setPeriodSummary] = useState(null);

    const [editingPurchase, setEditingPurchase] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);

    const dateRanges = [
        { key: 'all', label: 'All Time' },
        { key: 'today', label: 'Today' },
        { key: 'month', label: 'This Month' },
        { key: 'yearly', label: 'This Year' },
        { key: 'custom', label: 'Custom' },
    ];

    const customIncomplete = rangeType === 'custom' && (!startDate || !endDate);

    const fetchData = useCallback(async () => {
        if (rangeType === 'custom' && (!startDate || !endDate)) {
            return;
        }

        setLoading(true);
        try {
            const dates = calculateDates(rangeType, startDate, endDate);
            const purchaseParams = { supplierId: id, limit: 100 };
            const paymentParams = {};

            if (dates) {
                purchaseParams.startDate = dates.start;
                purchaseParams.endDate = dates.end;
                paymentParams.startDate = dates.start;
                paymentParams.endDate = dates.end;
            }

            const [sRes, pRes, payRes] = await Promise.all([
                getSupplier(id),
                getPurchases(purchaseParams),
                getSupplierPayments(id, paymentParams)
            ]);
            setSupplier(sRes.data.data);
            setPurchases(pRes.data.purchases || []);
            setPayments(payRes.data.data || []);
            setPeriodSummary(pRes.data.summary || null);
        } catch (err) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    }, [id, rangeType, startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeletePurchase = async (purchaseId) => {
        if (!window.confirm("Are you sure you want to delete this purchase? This will update product inventory and supplier balance.")) return;
        try {
            await deletePurchase(purchaseId);
            toast.success("Purchase deleted");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete purchase");
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm("Are you sure you want to delete this payment? This will update the supplier balance.")) return;
        try {
            await deleteSupplierPayment(paymentId);
            toast.success("Payment deleted");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete payment");
        }
    };

    if (loading && !supplier) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
    if (!supplier) return <div className="text-center p-10 card">Supplier not found</div>;

    const lifetimeRemaining = (supplier.totalPurchases || 0) - (supplier.totalPaid || 0);

    const isFiltered = rangeType !== 'all';
    const periodPurchasesTotal = periodSummary?.totalPurchases ?? purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const periodPaidTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const periodNet = periodPurchasesTotal - periodPaidTotal;

    const getRangeLabel = () => {
        if (rangeType === 'today') return 'Today';
        if (rangeType === 'month') return 'This Month';
        if (rangeType === 'yearly') return 'This Year';
        if (rangeType === 'custom') return `${startDate || '...'} to ${endDate || '...'}`;
        return 'All Time';
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/suppliers" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                        <MdArrowBack size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{supplier.name}</h1>
                        <p className="text-slate-500 text-sm font-medium">{supplier.company || 'Private Supplier'}</p>
                        {supplier.vatNumber && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black">
                                VAT: {supplier.vatNumber}
                            </span>
                        )}
                    </div>
                </div>

                {/* Date Filter Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
                        {dateRanges.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setRangeType(r.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                                    rangeType === r.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {isFiltered && (
                        <button
                            onClick={() => {
                                setRangeType('all');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="text-xs font-bold text-primary-600 hover:text-primary-700 underline px-2 py-1"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Date Range Picker */}
            {rangeType === 'custom' && (
                <div className="card p-4 bg-slate-50 border border-slate-200 animate-slide-down">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="label text-[10px] font-black uppercase text-slate-500">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input bg-white"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="label text-[10px] font-black uppercase text-slate-500">To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input bg-white"
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={!startDate || !endDate}
                            className="btn-primary shrink-0 px-6 h-11 w-full sm:w-auto"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            )}

            {/* Financial Summary */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFiltered ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
                <div className="card bg-white border-l-4 border-blue-500 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MdShoppingBag size={20} /></div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                            {isFiltered ? `${getRangeLabel()} Purchases` : 'Total Purchases'}
                        </p>
                    </div>
                    <p className="text-2xl font-black text-slate-900">
                        {formatSAR(isFiltered ? periodPurchasesTotal : supplier.totalPurchases)}
                    </p>
                    {isFiltered ? (
                        <p className="text-[11px] text-slate-400 mt-1">
                            {purchases.length} purchases in period (Lifetime: {formatSAR(supplier.totalPurchases)})
                        </p>
                    ) : (
                        <p className="text-[11px] text-slate-400 mt-1">Lifetime supplier purchases</p>
                    )}
                </div>

                <div className="card bg-white border-l-4 border-violet-500 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><MdAccountBalance size={20} /></div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                            {isFiltered ? `${getRangeLabel()} VAT (15%)` : 'Total VAT (15%)'}
                        </p>
                    </div>
                    <p className="text-2xl font-black text-violet-600">
                        {formatSAR((isFiltered ? periodPurchasesTotal : supplier.totalPurchases || 0) * 0.15)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {isFiltered ? '15% tax on period purchases' : '15% calculated purchase tax'}
                    </p>
                </div>

                <div className="card bg-white border-l-4 border-emerald-500 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MdPayments size={20} /></div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                            {isFiltered ? `${getRangeLabel()} Paid` : 'Total Paid'}
                        </p>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">
                        {formatSAR(isFiltered ? periodPaidTotal : supplier.totalPaid)}
                    </p>
                    {isFiltered ? (
                        <p className="text-[11px] text-slate-400 mt-1">
                            {payments.length} payments in period (Lifetime: {formatSAR(supplier.totalPaid)})
                        </p>
                    ) : (
                        <p className="text-[11px] text-slate-400 mt-1">Lifetime payments made</p>
                    )}
                </div>

                {isFiltered && (
                    <div className="card bg-white border-l-4 border-amber-500 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><MdFilterList size={20} /></div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Period Net</p>
                        </div>
                        <p className={`text-2xl font-black ${periodNet > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {formatSAR(periodNet)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Period purchases minus period paid</p>
                    </div>
                )}

                <div className="card bg-slate-900 border-l-4 border-primary-500 p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-900/50 text-primary-400 rounded-lg"><MdReceipt size={20} /></div>
                        <p className="text-primary-400 text-xs font-bold uppercase tracking-wider">Remaining Balance</p>
                    </div>
                    <p className="text-2xl font-black text-white">{formatSAR(lifetimeRemaining)}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Total outstanding payable to supplier</p>
                </div>
            </div>

            {/* Filter Active Indicator */}
            {isFiltered && (
                <div className="flex items-center justify-between bg-primary-50 border border-primary-200 px-4 py-2.5 rounded-xl text-primary-900 text-xs font-medium">
                    <span className="flex items-center gap-2">
                        <MdCalendarToday size={16} className="text-primary-600" />
                        Viewing dated purchases and payments for: <strong className="font-black">{getRangeLabel()}</strong>
                    </span>
                    <button
                        onClick={() => { setRangeType('all'); setStartDate(''); setEndDate(''); }}
                        className="text-primary-700 hover:text-primary-900 font-bold underline text-xs"
                    >
                        Clear Date Filter
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'purchases' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MdHistory size={18} />
                    Purchase History ({purchases.length})
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MdPayments size={18} />
                    Payment History ({payments.length})
                </button>
            </div>

            {/* Content Table */}
            <div className="card p-0 overflow-hidden shadow-md">
                {customIncomplete ? (
                    <div className="text-center py-16 text-slate-400">
                        <MdCalendarToday size={48} className="mx-auto opacity-30 mb-2" />
                        <p className="font-bold">Select both From and To dates to load history</p>
                    </div>
                ) : activeTab === 'purchases' ? (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th>Date</th>
                                    <th>Purchase #</th>
                                    <th>Items</th>
                                    <th>Total Amount</th>
                                    <th>VAT (15%)</th>
                                    <th>Paid</th>
                                    <th>Remaining</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-12 text-slate-400">
                                            <MdHistory size={36} className="mx-auto opacity-30 mb-2" />
                                            <p className="font-medium">
                                                {isFiltered ? `No purchases found for ${getRangeLabel()}` : 'No purchase records found'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map((p) => {
                                        const paid = p.paidAmount || 0;
                                        const remaining = (p.total || 0) - paid;
                                        const vat = (p.total || 0) * 0.15;
                                        return (
                                        <tr key={p._id}>
                                            <td className="text-slate-600 font-medium">{formatBillDateOnly(p.date)}</td>
                                            <td className="font-bold text-slate-900">{p.purchaseNumber}</td>
                                            <td className="text-slate-600">
                                                {p.items?.length > 0 ? `${p.items.length} Products` : `${p.totalItems || 0} Items`}
                                            </td>
                                            <td className="font-black text-slate-900">{formatSAR(p.total)}</td>
                                            <td className="font-bold text-violet-700">{formatSAR(vat)}</td>
                                            <td className="font-bold text-emerald-600">{formatSAR(paid)}</td>
                                            <td>
                                                {remaining > 0 ? (
                                                    <span className="font-black text-red-500">{formatSAR(remaining)}</span>
                                                ) : (
                                                    <span className="font-bold text-emerald-500">Fully Paid</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th>Date</th>
                                    <th>Ref #</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Notes</th>
                                    {/* <th className="text-right">Actions</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400">
                                            <MdPayments size={36} className="mx-auto opacity-30 mb-2" />
                                            <p className="font-medium">
                                                {isFiltered ? `No payments found for ${getRangeLabel()}` : 'No payment records found'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p) => (
                                        <tr key={p._id}>
                                            <td className="text-slate-600 font-medium">{formatBillDateOnly(p.date)}</td>
                                            <td className="text-slate-500 font-bold">{p.referenceNumber || '-'}</td>
                                            <td><span className="badge-blue uppercase text-[10px] font-black">{p.paymentMethod}</span></td>
                                            <td className="font-black text-emerald-600">{formatSAR(p.amount)}</td>
                                            <td className="text-slate-500 text-xs italic">{p.notes || '-'}</td>
                                            {/* <td className="text-right space-x-2">
                                                <button onClick={() => setEditingPayment(p)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <MdEdit size={18} />
                                                </button>
                                                <button onClick={() => handleDeletePayment(p._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <MdDelete size={18} />
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* {editingPurchase && (
                <EditPurchaseModal
                    purchase={editingPurchase}
                    onClose={() => setEditingPurchase(null)}
                    onSaved={fetchData}
                />
            )}

            {editingPayment && (
                <EditPaymentModal
                    payment={editingPayment}
                    onClose={() => setEditingPayment(null)}
                    onSaved={fetchData}
                />
            )} */}
        </div>
    );
}
