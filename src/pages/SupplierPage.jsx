import { useState, useEffect, useCallback } from 'react';

import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierPurchase,
    updateSupplierPayment,
    getSupplierPayments
} from '../services/supplierService';

import {
    MdSearch,
    MdVisibility,
    MdAdd,
    MdClose,
    MdEdit,
    MdDelete,
    MdHistory,
    MdPayments,
    MdShoppingBag,
    MdPeople,
    MdReceipt,
    MdCalendarToday,
    MdFilterList,
    MdAccountBalance
} from 'react-icons/md';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { getPurchases, createPurchase } from '../services/purchaseService';
import { useSuppliers } from '../hooks/useSuppliers';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/SkeletonLoader';
import { calculateDates, formatBillDateOnly } from '../utils/dateUtils';

const formatSAR = (n) =>
    `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

function RecordPurchaseModal({ supplier, onClose, onSaved }) {
    const [form, setForm] = useState({ 
        amount: '', 
        paidAmount: '0', 
        totalItems: '',
        notes: '', 
        date: new Date().toISOString().split('T')[0] 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
        
        setLoading(true);
        try {
            // We create a purchase record with no items, just the total
                await createPurchase({
                    supplierId: supplier._id,
                    items: [], // No products, just the financial record
                    subtotal: Number(form.amount),
                    tax: 0,
                    total: Number(form.amount),
                    paidAmount: Number(form.paidAmount || 0),
                    totalItems: Number(form.totalItems || 0),
                    notes: form.notes,
                    date: form.date,
                    status: 'received'
                });

            // If they paid something during purchase, we record that too
            if (Number(form.paidAmount) > 0) {
                await updateSupplierPayment(supplier._id, {
                    amount: Number(form.paidAmount),
                    paymentMethod: 'cash',
                    notes: 'Paid during purchase',
                    date: form.date
                });
            }

            toast.success('Purchase recorded');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record purchase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">New Purchase - {supplier.name}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><MdClose size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Purchase Amount</label>
                            <input 
                                type="number" 
                                className="input font-bold text-lg" 
                                placeholder="0.00"
                                required 
                                value={form.amount} 
                                onChange={e => setForm({ ...form, amount: e.target.value })} 
                            />
                        </div>
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Total Items (Optional)</label>
                            <input 
                                type="number" 
                                className="input font-bold" 
                                placeholder="0"
                                value={form.totalItems} 
                                onChange={e => setForm({ ...form, totalItems: e.target.value })} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={form.date} 
                            onChange={e => setForm({ ...form, date: e.target.value })} 
                        />
                    </div>

                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Amount Paid (Optional)</label>
                        <input 
                            type="number" 
                            className="input font-bold text-emerald-600" 
                            placeholder="0.00"
                            value={form.paidAmount} 
                            onChange={e => setForm({ ...form, paidAmount: e.target.value })} 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Leave 0 if this is a credit purchase</p>
                    </div>

                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Notes</label>
                        <textarea 
                            className="input min-h-[80px]" 
                            placeholder="Invoice number, items bought, etc."
                            value={form.notes} 
                            onChange={e => setForm({ ...form, notes: e.target.value })} 
                        />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Remaining Balance</span>
                            <span className="font-bold text-primary-600">
                                {formatSAR(Number(form.amount || 0) - Number(form.paidAmount || 0))}
                            </span>
                        </div>
                    </div>

                    <button 
                        disabled={loading} 
                        className="btn-primary w-full justify-center h-12 text-lg"
                    >
                        {loading ? 'Processing...' : 'Save Purchase Record'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AddPaymentModal({ supplier, onClose, onSaved }) {
    const [form, setForm] = useState({ amount: '', paymentMethod: 'cash', referenceNumber: '', notes: '', date: new Date().toISOString().split('T')[0] });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
        setLoading(true);
        try {
            await updateSupplierPayment(supplier._id, form);
            toast.success('Payment recorded');
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Add Payment - {supplier.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Amount</label>
                            <input type="number" className="input" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Date</label>
                            <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Payment Method</label>
                        <select className="input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Ref #</label>
                        <input className="input" placeholder="Ref/Transaction ID" value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} />
                    </div>
                    <textarea className="input" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    <button disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Processing...' : 'Record Payment'}</button>
                </form>
            </div>
        </div>
    );
}

/* =========================================
   ADD SUPPLIER MODAL
========================================= */
function AddSupplierModal({
    onClose,
    onCreated,
}) {

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        vatNumber: '',
        notes: '',
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            return toast.error(
                'Supplier name is required'
            );
        }

        setLoading(true);

        try {

            await createSupplier(formData);

            toast.success(
                'Supplier added successfully'
            );

            onCreated();
            onClose();

        } catch (err) {

            toast.error(
                err.response?.data?.message ||
                'Failed to add supplier'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) =>
                e.target === e.currentTarget && onClose()
            }
        >
            <div className="modal-box max-w-lg w-full p-5">

                <div className="flex justify-between items-center mb-5">

                    <h2 className="font-bold text-lg">
                        Add Supplier
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-slate-500"
                    >
                        <MdClose size={18} />
                    </button>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <div>
                        <label className="label">
                            Supplier Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            placeholder="Enter supplier name"
                        />
                    </div>

                    <div>
                        <label className="label">
                            Company
                        </label>

                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="input"
                            placeholder="Company name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">

                        <div>
                            <label className="label">
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input"
                                placeholder="Phone number"
                            />
                        </div>

                        <div>
                            <label className="label">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="Email"
                            />
                        </div>

                    </div>

                    <div>
                        <label className="label">
                            Address
                        </label>

                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="input min-h-[80px]"
                            placeholder="Address"
                        />
                    </div>

                    <div>
                        <label className="label">
                            VAT Number <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                        </label>

                        <input
                            type="text"
                            name="vatNumber"
                            value={formData.vatNumber}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g. 300000000000003"
                        />
                    </div>

                    <div>
                        <label className="label">
                            Notes
                        </label>

                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="input min-h-[80px]"
                            placeholder="Notes"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center"
                    >
                        {loading
                            ? 'Adding...'
                            : 'Add Supplier'}
                    </button>

                </form>
            </div>
        </div>
    );
}

/* =========================================
   UPDATE SUPPLIER MODAL
========================================= */
function UpdateSupplierModal({
    supplier,
    onClose,
    onUpdated,
}) {

    const [formData, setFormData] = useState({
        name: supplier.name || '',
        company: supplier.company || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        vatNumber: supplier.vatNumber || '',
        notes: supplier.notes || '',
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {

            await updateSupplier(
                supplier._id,
                formData
            );

            toast.success(
                'Supplier updated successfully'
            );

            onUpdated();
            onClose();

        } catch (err) {

            toast.error(
                err.response?.data?.message ||
                'Failed to update supplier'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) =>
                e.target === e.currentTarget && onClose()
            }
        >
            <div className="modal-box max-w-lg w-full p-5">

                <div className="flex justify-between items-center mb-5">

                    <h2 className="font-bold text-lg">
                        Update Supplier
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-slate-500"
                    >
                        <MdClose size={18} />
                    </button>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Supplier Name"
                        className="input"
                    />

                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Company"
                        className="input"
                    />

                    <div className="grid grid-cols-2 gap-3">

                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Phone"
                            className="input"
                        />

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            className="input"
                        />

                    </div>

                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Address"
                        className="input min-h-[80px]"
                    />

                    <input
                        type="text"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleChange}
                        placeholder="VAT Number (Optional)"
                        className="input"
                    />

                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Notes"
                        className="input min-h-[80px]"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center"
                    >
                        {loading
                            ? 'Updating...'
                            : 'Update Supplier'}
                    </button>

                </form>
            </div>
        </div>
    );
}

/* =========================================
   MAIN PAGE
========================================= */
export default function SupplierPage() {

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: suppliers = [], isLoading } = useSuppliers();

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] });

    const [activeView, setActiveView] = useState('suppliers'); // 'suppliers' | 'purchases'
    const [rangeType, setRangeType] = useState('month'); // 'today', 'month', 'yearly', 'custom', 'all'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [purchases, setPurchases] = useState([]);
    const [purchasesSummary, setPurchasesSummary] = useState(null);
    const [loadingPurchases, setLoadingPurchases] = useState(false);
    const [purchaseSearch, setPurchaseSearch] = useState('');

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [purchaseSupplier, setPurchaseSupplier] = useState(null);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    const dateRanges = [
        { key: 'today', label: 'Today' },
        { key: 'month', label: 'This Month' },
        { key: 'yearly', label: 'This Year' },
        { key: 'custom', label: 'Custom' },
        { key: 'all', label: 'All Time' },
    ];

    const fetchPurchases = useCallback(async () => {
        if (rangeType === 'custom' && (!startDate || !endDate)) return;
        setLoadingPurchases(true);
        try {
            const dates = calculateDates(rangeType, startDate, endDate);
            const params = { limit: 200 };
            if (dates) {
                params.startDate = dates.start;
                params.endDate = dates.end;
            }
            const res = await getPurchases(params);
            setPurchases(res.data.purchases || []);
            setPurchasesSummary(res.data.summary || null);
        } catch (err) {
            toast.error('Failed to load purchases');
        } finally {
            setLoadingPurchases(false);
        }
    }, [rangeType, startDate, endDate]);

    useEffect(() => {
        if (activeView === 'purchases') {
            fetchPurchases();
        }
    }, [activeView, fetchPurchases]);

    const handleAddPurchase = async (data) => {
        try {
            await addSupplierPurchase(purchaseSupplier._id, data);
            toast.success('Purchase added successfully');
            setShowPurchaseModal(false);
            invalidate();
            if (activeView === 'purchases') fetchPurchases();
        } catch {
            toast.error('Failed to add purchase');
        }
    };

    const handleDeleteSupplier = async (id) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this supplier?');
        if (!confirmDelete) return;
        try {
            await deleteSupplier(id);
            toast.success('Supplier deleted successfully');
            invalidate();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete supplier');
        }
    };

    const filteredSuppliers = suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.company?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredPurchases = purchases.filter((p) => {
        if (!purchaseSearch.trim()) return true;
        const q = purchaseSearch.toLowerCase();
        const sName = p.supplier?.name?.toLowerCase() || '';
        const sCompany = p.supplier?.company?.toLowerCase() || '';
        const pNum = p.purchaseNumber?.toLowerCase() || '';
        const notes = p.notes?.toLowerCase() || '';
        return sName.includes(q) || sCompany.includes(q) || pNum.includes(q) || notes.includes(q);
    });

    const getPurchasesRangeLabel = () => {
        if (rangeType === 'today') return 'Today';
        if (rangeType === 'month') return 'This Month';
        if (rangeType === 'yearly') return 'This Year';
        if (rangeType === 'custom') return `${startDate || '...'} to ${endDate || '...'}`;
        return 'All Time';
    };

    return (
        <div className="space-y-5 animate-fade-in pb-10">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Suppliers
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Manage supplier balances, payments, and dated purchases
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                    >
                        <MdAdd size={18} />
                        Add Supplier
                    </button>
                </div>
            </div>

            {/* VIEW SWITCHER TABS */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveView('suppliers')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeView === 'suppliers'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MdPeople size={18} />
                    Suppliers Directory ({suppliers.length})
                </button>
                <button
                    onClick={() => setActiveView('purchases')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeView === 'purchases'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MdShoppingBag size={18} />
                    Dated Purchases
                </button>
            </div>

            {/* VIEW 1: SUPPLIERS DIRECTORY */}
            {activeView === 'suppliers' && (
                <>
                    {/* FINANCIAL SUMMARY TOTALS */}
                    {!isLoading && suppliers.length > 0 && (() => {
                        const totalPurchased = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
                        const totalVat = totalPurchased * 0.15;
                        const totalPaid = suppliers.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
                        const totalRemaining = totalPurchased - totalPaid;
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="card bg-white border-l-4 border-blue-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MdShoppingBag size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Purchased</p>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{formatSAR(totalPurchased)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Across all {suppliers.length} suppliers</p>
                                </div>
                                <div className="card bg-white border-l-4 border-violet-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><MdAccountBalance size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total VAT (15%)</p>
                                    </div>
                                    <p className="text-2xl font-black text-violet-600">{formatSAR(totalVat)}</p>
                                    <p className="text-xs text-slate-400 mt-1">15% calculated purchase tax</p>
                                </div>
                                <div className="card bg-white border-l-4 border-emerald-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MdPayments size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Paid</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-600">{formatSAR(totalPaid)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Payments made to suppliers</p>
                                </div>
                                <div className="card bg-slate-900 border-l-4 border-primary-500 p-5 shadow-xl">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-primary-900/50 text-primary-400 rounded-lg"><MdHistory size={20} /></div>
                                        <p className="text-primary-400 text-xs font-bold uppercase tracking-wider">Total Remaining Balance</p>
                                    </div>
                                    <p className="text-2xl font-black text-white">{formatSAR(totalRemaining)}</p>
                                    <p className="text-xs text-primary-400/60 mt-1">Outstanding payable amount</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* SEARCH */}
                    <div className="card p-4 relative">
                        <MdSearch
                            className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search suppliers by name or company..."
                            className="input pl-9"
                        />
                    </div>

                    {/* SUPPLIERS TABLE */}
                    <div className="card p-0 overflow-hidden shadow-md">
                        {isLoading ? (
                            <TableSkeleton rows={5} cols={8} />
                        ) : filteredSuppliers.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                No suppliers found
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Company</th>
                                        <th>VAT Number</th>
                                        <th>Phone</th>
                                        <th>Total Purchases</th>
                                        <th>Total Paid</th>
                                        <th>Remaining</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map((s) => (
                                        <tr key={s._id}>
                                            <td className="font-bold">
                                                <button 
                                                    onClick={() => navigate(`/suppliers/${s._id}/history`)}
                                                    className="hover:text-primary-600 transition-colors text-left"
                                                >
                                                    {s.name}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="text-slate-700">{s.company || '-'}</div>
                                            </td>
                                            <td>
                                                {s.vatNumber ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black">
                                                        {s.vatNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td>
                                                {s.phone || '-'}
                                            </td>
                                            <td>
                                                {formatSAR(s.totalPurchases)}
                                            </td>
                                            <td className="text-green-600">
                                                {formatSAR(s.totalPaid)}
                                            </td>
                                            <td className="font-semibold text-primary-600">
                                                {formatSAR(
                                                    (s.totalPurchases || 0) -
                                                    (s.totalPaid || 0)
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap items-center gap-2 py-2">
                                                    <button 
                                                        onClick={() => {
                                                            setPurchaseSupplier(s);
                                                            setShowPurchaseModal(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-bold text-sm"
                                                        title="New Purchase"
                                                    >
                                                        <MdAdd size={20} />
                                                        <span>New Purchase</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setPurchaseSupplier(s);
                                                            setShowPaymentModal(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm font-bold text-sm"
                                                        title="Add Payment"
                                                    >
                                                        <MdPayments size={20} />
                                                        <span>Add Payment</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/suppliers/${s._id}/history`)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-sm font-bold text-sm"
                                                        title="History"
                                                    >
                                                        <MdHistory size={20} />
                                                        <span>History</span>
                                                    </button>
                                                    <div className="flex gap-2 ml-auto">
                                                        <button
                                                            onClick={() => setEditingSupplier(s)}
                                                            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-sm font-bold text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSupplier(s._id)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-sm font-bold text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* VIEW 2: DATED PURCHASES */}
            {activeView === 'purchases' && (
                <div className="space-y-4">
                    {/* SEARCH AND DATE FILTERS */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                        <div className="relative flex-1">
                            <MdSearch
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={18}
                            />
                            <input
                                value={purchaseSearch}
                                onChange={(e) => setPurchaseSearch(e.target.value)}
                                placeholder="Search purchases by supplier, purchase #, or notes..."
                                className="input pl-9"
                            />
                        </div>

                        {/* Date Range Buttons */}
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
                    </div>

                    {/* CUSTOM DATE RANGE PICKER */}
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
                                    onClick={fetchPurchases}
                                    disabled={!startDate || !endDate}
                                    className="btn-primary shrink-0 px-6 h-11 w-full sm:w-auto"
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PERIOD FINANCIAL SUMMARY CARDS */}
                    {(() => {
                        const totalAmount = purchasesSummary?.totalPurchases ?? filteredPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
                        const vatAmount = totalAmount * 0.15;
                        const paidAmount = purchasesSummary?.totalPaid ?? filteredPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
                        const remainingAmount = purchasesSummary?.totalRemaining ?? (totalAmount - paidAmount);
                        const count = purchasesSummary?.count ?? filteredPurchases.length;

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="card bg-white border-l-4 border-blue-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MdShoppingBag size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Period Purchases</p>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{formatSAR(totalAmount)}</p>
                                    <p className="text-xs text-slate-400 mt-1">{count} purchases in {getPurchasesRangeLabel()}</p>
                                </div>

                                <div className="card bg-white border-l-4 border-violet-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><MdAccountBalance size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Period VAT (15%)</p>
                                    </div>
                                    <p className="text-2xl font-black text-violet-600">{formatSAR(vatAmount)}</p>
                                    <p className="text-xs text-slate-400 mt-1">15% calculated tax in period</p>
                                </div>

                                <div className="card bg-white border-l-4 border-emerald-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MdPayments size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Period Paid</p>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-600">{formatSAR(paidAmount)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Paid on period purchases</p>
                                </div>

                                <div className="card bg-white border-l-4 border-amber-500 p-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><MdReceipt size={20} /></div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Remaining Balance</p>
                                    </div>
                                    <p className="text-2xl font-black text-amber-600">{formatSAR(remainingAmount)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Unpaid balance on purchases</p>
                                </div>

                                <div className="card bg-slate-900 border-l-4 border-primary-500 p-5 shadow-xl">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-primary-900/50 text-primary-400 rounded-lg"><MdCalendarToday size={20} /></div>
                                        <p className="text-primary-400 text-xs font-bold uppercase tracking-wider">Active Period</p>
                                    </div>
                                    <p className="text-2xl font-black text-white">{getPurchasesRangeLabel()}</p>
                                    <p className="text-xs text-primary-400/60 mt-1">{filteredPurchases.length} purchases shown</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* PURCHASES TABLE */}
                    <div className="card p-0 overflow-hidden shadow-md">
                        {loadingPurchases ? (
                            <TableSkeleton rows={6} cols={9} />
                        ) : (rangeType === 'custom' && (!startDate || !endDate)) ? (
                            <div className="text-center py-16 text-slate-400">
                                <MdCalendarToday size={48} className="mx-auto opacity-30 mb-2" />
                                <p className="font-bold">Select both From and To dates to load purchases</p>
                            </div>
                        ) : filteredPurchases.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <MdShoppingBag size={48} className="mx-auto opacity-30 mb-2" />
                                <p className="font-medium">No supplier purchases found for {getPurchasesRangeLabel()}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th>Date</th>
                                            <th>Purchase #</th>
                                            <th>Supplier</th>
                                            <th>Items</th>
                                            <th>Total Amount</th>
                                            <th>VAT (15%)</th>
                                            <th>Paid</th>
                                            <th>Remaining</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPurchases.map((p) => {
                                            const paid = p.paidAmount || 0;
                                            const remaining = (p.total || 0) - paid;
                                            const vat = (p.total || 0) * 0.15;
                                            return (
                                                <tr key={p._id}>
                                                    <td className="text-slate-600 font-medium whitespace-nowrap">
                                                        {formatBillDateOnly(p.date)}
                                                    </td>
                                                    <td className="font-bold text-slate-900">
                                                        {p.purchaseNumber}
                                                    </td>
                                                    <td>
                                                        {p.supplier ? (
                                                            <button
                                                                onClick={() => navigate(`/suppliers/${p.supplier._id}/history`)}
                                                                className="font-bold text-left hover:text-primary-600 transition-colors"
                                                            >
                                                                <div>{p.supplier.name}</div>
                                                                {p.supplier.company && (
                                                                    <div className="text-xs text-slate-400 font-normal">{p.supplier.company}</div>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Unknown</span>
                                                        )}
                                                    </td>
                                                    <td className="text-slate-600">
                                                        {p.items?.length > 0 ? `${p.items.length} Products` : `${p.totalItems || 0} Items`}
                                                    </td>
                                                    <td className="font-black text-slate-900">
                                                        {formatSAR(p.total)}
                                                    </td>
                                                    <td className="font-bold text-violet-700">
                                                        {formatSAR(vat)}
                                                    </td>
                                                    <td className="font-bold text-emerald-600">
                                                        {formatSAR(paid)}
                                                    </td>
                                                    <td>
                                                        {remaining > 0 ? (
                                                            <span className="font-black text-red-500">{formatSAR(remaining)}</span>
                                                        ) : (
                                                            <span className="font-bold text-emerald-500">Fully Paid</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                            p.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {p.supplier && (
                                                            <button
                                                                onClick={() => navigate(`/suppliers/${p.supplier._id}/history`)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all text-xs font-bold shadow-sm"
                                                            >
                                                                <MdHistory size={16} />
                                                                <span>History</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showAddModal && (
                <AddSupplierModal
                    onClose={() => setShowAddModal(false)}
                    onCreated={invalidate}
                />
            )}

            {editingSupplier && (
                <UpdateSupplierModal
                    supplier={editingSupplier}
                    onClose={() => setEditingSupplier(null)}
                    onUpdated={invalidate}
                />
            )}

            {showPurchaseModal && (
                <RecordPurchaseModal
                    supplier={purchaseSupplier}
                    onClose={() => { setShowPurchaseModal(false); setPurchaseSupplier(null); }}
                    onSaved={invalidate}
                />
            )}

            {showPaymentModal && (
                <AddPaymentModal
                    supplier={purchaseSupplier}
                    onClose={() => { setShowPaymentModal(false); setPurchaseSupplier(null); }}
                    onSaved={invalidate}
                />
            )}

        </div>
    );
}