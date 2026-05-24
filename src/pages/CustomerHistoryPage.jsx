import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerById } from '../services/customerService';
import {
    MdArrowBack,
    MdPerson,
    MdPhone,
    MdEmail,
    MdLocationOn,
    MdReceipt,
    MdCalendarToday,
    MdAttachMoney,
    MdCreditCard,
    MdKeyboardReturn
} from 'react-icons/md';
import toast from 'react-hot-toast';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

export default function CustomerHistoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [sales, setSales] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getCustomerById(id);
                setCustomer(res.data.data);
                setSales(res.data.sales || []);
                setReturns(res.data.returns || []);
            } catch {
                toast.error('Failed to load customer details');
                navigate('/customers');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    // Always derive stats from the actual fetched arrays (server recomputes these live)
    const totalSpent = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalRefunded = returns.reduce((sum, r) => sum + (Number(r.totalRefund) || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!customer) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/customers')}
                    className="p-2 hover:bg-white rounded-xl text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-200"
                >
                    <MdArrowBack size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Customer History</h1>
                    <p className="text-slate-500 text-sm">Detailed profile and transaction history for {customer.name}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card overflow-hidden">
                        <div className="bg-primary-600 h-24 relative">
                            <div className="absolute -bottom-10 left-6">
                                <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary-600 text-3xl font-black border-4 border-white">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                        <div className="pt-14 p-6 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{customer.name}</h2>
                                <p className="text-sm text-slate-400">VAT: {customer.vatNumber || 'N/A'}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MdPhone className="text-slate-400" />
                                    <span className="text-sm font-medium">{customer.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MdEmail className="text-slate-400" />
                                    <span className="text-sm font-medium">{customer.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MdLocationOn className="text-slate-400" size={20} />
                                    <span className="text-sm leading-tight">{customer.address || 'No address provided'}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
                                    <p className="text-lg font-black text-slate-700">{sales.length}</p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-emerald-600/60">Total Spent</p>
                                    <p className="text-lg font-black text-emerald-700">{formatSAR(totalSpent)}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-red-600/60">Total Returns</p>
                                    <p className="text-lg font-black text-red-700">{returns.length}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-red-600/60">Total Refunded</p>
                                    <p className="text-lg font-black text-red-700">{formatSAR(totalRefunded)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Sales History */}
                    <div className="card p-0 overflow-hidden shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <MdReceipt size={22} className="text-primary-600" />
                                Purchase History
                            </h3>
                            <span className="badge-primary font-black">{sales.length} Bills</span>
                        </div>

                        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                            {sales.length === 0 ? (
                                <div className="p-16 text-center text-slate-400 font-medium">No purchase transactions found.</div>
                            ) : sales.map((sale) => (
                                <div key={sale._id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{sale.invoiceNumber}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${sale.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {sale.paymentStatus || 'Completed'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1 font-bold"><MdCalendarToday size={14} /> {new Date(sale.createdAt).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 font-bold"><MdAttachMoney size={14} /> {sale.paymentMethod}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">{sale.items?.length || 0} items · Total Paid</p>
                                                <p className="text-lg font-black text-slate-800">{formatSAR(sale.total)}</p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/sales`)}
                                                className="bg-white border border-slate-200 p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:shadow-sm transition-all"
                                            >
                                                <MdArrowBack className="rotate-180" size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Returns History */}
                    <div className="card p-0 overflow-hidden shadow-sm border border-red-100">
                        <div className="p-6 border-b border-red-50 flex items-center justify-between bg-red-50/30">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <MdKeyboardReturn size={22} className="text-red-600" />
                                Return History
                            </h3>
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">{returns.length} Returns</span>
                        </div>

                        <div className="divide-y divide-red-50 max-h-[500px] overflow-y-auto">
                            {returns.length === 0 ? (
                                <div className="p-16 text-center text-slate-400 font-medium">No return transactions found.</div>
                            ) : returns.map((ret) => (
                                <div key={ret._id} className="p-6 hover:bg-red-50/30 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{ret.returnNumber}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-700">
                                                    Refunded
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold border-l pl-2 border-slate-200 ml-1">Ref: {ret.invoiceNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1 font-bold"><MdCalendarToday size={14} /> {new Date(ret.createdAt).toLocaleDateString()}</span>
                                                <span className="text-red-500 font-bold italic">Reason: {ret.reason}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-red-400/60">Total Refunded</p>
                                                <p className="text-lg font-black text-red-600">{formatSAR(ret.totalRefund)}</p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/returns`)}
                                                className="bg-white border border-red-200 p-2 rounded-xl text-red-300 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all"
                                            >
                                                <MdArrowBack className="rotate-180" size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
