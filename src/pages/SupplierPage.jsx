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
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { createPurchase } from '../services/purchaseService';

import toast from 'react-hot-toast';

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
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [purchaseSupplier, setPurchaseSupplier] = useState(null);

    const [search, setSearch] = useState('');

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [editingSupplier, setEditingSupplier] =
        useState(null);

    const fetchSuppliers = useCallback(async () => {

        setLoading(true);

        try {

            const { data } = await getSuppliers();

            setSuppliers(data.data || []);

        } catch {

            toast.error('Failed to load suppliers');

        } finally {

            setLoading(false);

        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleAddPurchase = async (data) => {
        try {

            await addSupplierPurchase(
                purchaseSupplier._id,
                data
            );

            toast.success('Purchase added successfully');

            setShowPurchaseModal(false);

            fetchSuppliers();

        } catch {
            toast.error('Failed to add purchase');
        }
    };

    const handleDeleteSupplier = async (id) => {

        const confirmDelete = window.confirm(
            'Are you sure you want to delete this supplier?'
        );

        if (!confirmDelete) return;

        try {

            await deleteSupplier(id);

            toast.success(
                'Supplier deleted successfully'
            );

            fetchSuppliers();

        } catch (err) {

            toast.error(
                err.response?.data?.message ||
                'Failed to delete supplier'
            );

        }
    };

    const filteredSuppliers = suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.company?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 animate-fade-in">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-2xl font-bold text-slate-800">
                        Suppliers
                    </h1>

                    <p className="text-slate-500 text-sm">
                        Manage supplier balances and payments
                    </p>

                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                >
                    <MdAdd size={18} />
                    Add Supplier
                </button>


            </div>

            {/* SEARCH */}
            <div className="card p-4 relative">

                <MdSearch
                    className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                />

                <input
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    placeholder="Search suppliers..."
                    className="input pl-9"
                />

            </div>

            {/* TABLE */}
            <div className="card p-0 overflow-hidden">

                {loading ? (

                    <div className="p-10 text-center text-slate-400">
                        Loading...
                    </div>

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
                                        {s.company || '-'}
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

            {/* MODALS */}
            {showAddModal && (
                <AddSupplierModal
                    onClose={() => setShowAddModal(false)}
                    onCreated={fetchSuppliers}
                />
            )}

            {editingSupplier && (
                <UpdateSupplierModal
                    supplier={editingSupplier}
                    onClose={() => setEditingSupplier(null)}
                    onUpdated={fetchSuppliers}
                />
            )}

            {showPurchaseModal && (
                <RecordPurchaseModal
                    supplier={purchaseSupplier}
                    onClose={() => {
                        setShowPurchaseModal(false);
                        setPurchaseSupplier(null);
                    }}
                    onSaved={fetchSuppliers}
                />
            )}

            {showPaymentModal && (
                <AddPaymentModal
                    supplier={purchaseSupplier}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setPurchaseSupplier(null);
                    }}
                    onSaved={fetchSuppliers}
                />
            )}

        </div>
    );
}