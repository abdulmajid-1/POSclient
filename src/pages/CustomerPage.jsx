import { useState, useEffect, useCallback } from 'react';
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
} from '../services/customerService';
import {
    MdSearch,
    MdAdd,
    MdClose,
    MdEdit,
    MdDelete,
    MdHistory,
    MdPerson
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

function CustomerModal({ customer, onClose, onSaved }) {
    const [form, setForm] = useState(customer || {
        name: '',
        phone: '',
        email: '',
        vatNumber: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (customer) {
                await updateCustomer(customer._id, form);
                toast.success('Customer updated');
            } else {
                await createCustomer(form);
                toast.success('Customer created');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><MdClose size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Customer Name *</label>
                        <input
                            type="text"
                            className="input"
                            required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">Phone</label>
                            <input
                                type="text"
                                className="input"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label text-xs font-bold uppercase text-slate-500">VAT Number</label>
                            <input
                                type="text"
                                className="input"
                                value={form.vatNumber}
                                onChange={e => setForm({ ...form, vatNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label text-xs font-bold uppercase text-slate-500">Address</label>
                        <textarea
                            className="input min-h-[80px]"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 text-lg mt-4"
                    >
                        {loading ? 'Saving...' : (customer ? 'Update Customer' : 'Add Customer')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function CustomerPage() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // { type: 'add'|'edit', data: customer }
    const navigate = useNavigate();

    const fetchCustomers = useCallback(async () => {
        try {
            const res = await getCustomers({ search });
            setCustomers(res.data.data);
        } catch {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timer);
    }, [fetchCustomers]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await deleteCustomer(id);
            toast.success('Customer deleted');
            fetchCustomers();
        } catch {
            toast.error('Failed to delete customer');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
                    <p className="text-slate-500 text-sm">Manage your client database and view their history.</p>
                </div>
                <button
                    onClick={() => setModal({ type: 'add' })}
                    className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
                >
                    <MdAdd size={24} />
                    Add New Customer
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card p-4">
                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or phone number..."
                        className="input pl-12 bg-slate-50 border-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Stats</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center">
                                        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">No customers found</td>
                                </tr>
                            ) : customers.map(c => (
                                <tr key={c._id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => navigate(`/customers/${c._id}/history`)}
                                                    className="font-bold text-slate-800 hover:text-primary-600 transition-colors block text-left"
                                                >
                                                    {c.name}
                                                </button>
                                                <p className="text-xs text-slate-400">{c.vatNumber || 'No VAT'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700">{c.phone || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">{c.email || ''}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <div>
                                                {console.log(c)}
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Purchases</p>
                                                <p className="text-sm font-bold text-slate-700">{c.totalPurchases || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Spent</p>
                                                <p className="text-sm font-bold text-emerald-600">{formatSAR(c.totalSpent)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Returns</p>
                                                <p className="text-sm font-bold text-red-600">{c.totalReturns || 0}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/customers/${c._id}/history`)}
                                                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-xs font-bold shadow-sm"
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => setModal({ type: 'edit', data: c })}
                                                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-xs font-bold shadow-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs font-bold shadow-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {modal?.type === 'add' && (
                <CustomerModal
                    onClose={() => setModal(null)}
                    onSaved={fetchCustomers}
                />
            )}
            {modal?.type === 'edit' && (
                <CustomerModal
                    customer={modal.data}
                    onClose={() => setModal(null)}
                    onSaved={fetchCustomers}
                />
            )}
        </div>
    );
}
