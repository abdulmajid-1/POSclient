import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSupplier, getSupplierPayments } from '../services/supplierService';
import { getPurchases } from '../services/purchaseService';
import { MdArrowBack, MdReceipt, MdPayments, MdHistory, MdShoppingBag } from 'react-icons/md';
import toast from 'react-hot-toast';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

export default function SupplierPurchaseHistoryPage() {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('purchases'); // purchases, payments

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, pRes, payRes] = await Promise.all([
                getSupplier(id),
                getPurchases({ supplierId: id, limit: 100 }),
                getSupplierPayments(id)
            ]);
            setSupplier(sRes.data.data);
            setPurchases(pRes.data.purchases);
            setPayments(payRes.data.data);
        } catch (err) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
    if (!supplier) return <div className="text-center p-10 card">Supplier not found</div>;

    const remaining = (supplier.totalPurchases || 0) - (supplier.totalPaid || 0);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/suppliers" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <MdArrowBack size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{supplier.name}</h1>
                    <p className="text-slate-500 text-sm font-medium">{supplier.company || 'Private Supplier'}</p>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-white border-l-4 border-blue-500 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MdShoppingBag size={20} /></div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Purchases</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{formatSAR(supplier.totalPurchases)}</p>
                </div>

                <div className="card bg-white border-l-4 border-emerald-500 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MdPayments size={20} /></div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Paid</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">{formatSAR(supplier.totalPaid)}</p>
                </div>

                <div className="card bg-slate-900 border-l-4 border-primary-500 p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-900/50 text-primary-400 rounded-lg"><MdReceipt size={20} /></div>
                        <p className="text-primary-400 text-sm font-bold uppercase tracking-wider">Remaining Balance</p>
                    </div>
                    <p className="text-2xl font-black text-white">{formatSAR(remaining)}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button 
                    onClick={() => setActiveTab('purchases')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'purchases' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MdHistory size={18} />
                    Purchase History
                </button>
                <button 
                    onClick={() => setActiveTab('payments')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MdPayments size={18} />
                    Payment History
                </button>
            </div>

            {/* Content Table */}
            <div className="card p-0 overflow-hidden shadow-md">
                {activeTab === 'purchases' ? (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th>Date</th>
                                    <th>Purchase #</th>
                                    <th>Items</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-slate-400">No purchase records found</td></tr>
                                ) : (
                                    purchases.map((p) => (
                                        <tr key={p._id}>
                                            <td className="text-slate-600 font-medium">{new Date(p.date).toLocaleDateString('en-SA')}</td>
                                            <td className="font-bold text-slate-900">{p.purchaseNumber}</td>
                                            <td className="text-slate-600">
                                                {p.items?.length > 0 ? `${p.items.length} Products` : `${p.totalItems || 0} Items`}
                                            </td>
                                            <td className="font-black text-slate-900">{formatSAR(p.total)}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
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
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-slate-400">No payment records found</td></tr>
                                ) : (
                                    payments.map((p) => (
                                        <tr key={p._id}>
                                            <td className="text-slate-600 font-medium">{new Date(p.date).toLocaleDateString('en-SA')}</td>
                                            <td className="text-slate-500 font-bold">{p.referenceNumber || '-'}</td>
                                            <td><span className="badge-blue uppercase text-[10px] font-black">{p.paymentMethod}</span></td>
                                            <td className="font-black text-emerald-600">{formatSAR(p.amount)}</td>
                                            <td className="text-slate-500 text-xs italic">{p.notes || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
