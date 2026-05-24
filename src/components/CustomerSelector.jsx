import { useState, useEffect } from 'react';
import { getCustomers, createCustomer } from '../services/customerService';
import { MdSearch, MdPerson, MdClose, MdPersonAdd, MdArrowBack, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function CustomerSelector({ onSelect, onClose }) {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // "Add New Customer" panel state
    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        vatNumber: '',
        address: '',
    });

    useEffect(() => {
        if (showAddForm) return; // don't fetch while add-form is open
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const res = await getCustomers({ search });
                setCustomers(res.data.data);
            } catch (err) {
                console.error('Failed to fetch customers', err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timer);
    }, [search, showAddForm]);

    const handleNewChange = (e) => {
        setNewCustomer((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveNew = async () => {
        if (!newCustomer.name.trim()) {
            toast.error('Customer name is required');
            return;
        }
        setSaving(true);
        try {
            const res = await createCustomer(newCustomer);
            const saved = res.data.data || res.data.customer || res.data;
            toast.success(`Customer "${saved.name}" created!`);
            onSelect(saved);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create customer');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay z-[60]" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-2xl w-full p-8 animate-slide-up shadow-2xl">

                {/* ── Header ── */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        {showAddForm && (
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                                title="Back to search"
                            >
                                <MdArrowBack size={22} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">
                                {showAddForm ? 'Add New Customer' : 'Select Customer'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {showAddForm
                                    ? 'Fill in the details and save'
                                    : 'Search and select a customer from your database'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-full">
                        <MdClose size={28} />
                    </button>
                </div>

                {/* ══════════════════════════════════════
                    ADD NEW CUSTOMER FORM
                ══════════════════════════════════════ */}
                {showAddForm ? (
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="name"
                                value={newCustomer.name}
                                onChange={handleNewChange}
                                autoFocus
                                placeholder="e.g. Ahmed Al-Rashidi"
                                className="input py-3 text-sm font-medium"
                            />
                        </div>

                        {/* Phone + Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                                <input
                                    name="phone"
                                    value={newCustomer.phone}
                                    onChange={handleNewChange}
                                    placeholder="05x xxx xxxx"
                                    className="input py-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={handleNewChange}
                                    placeholder="email@example.com"
                                    className="input py-3 text-sm"
                                />
                            </div>
                        </div>

                        {/* VAT + Address */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">VAT Number</label>
                                <input
                                    name="vatNumber"
                                    value={newCustomer.vatNumber}
                                    onChange={handleNewChange}
                                    placeholder="3xxxxxxxxx"
                                    className="input py-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Address</label>
                                <input
                                    name="address"
                                    value={newCustomer.address}
                                    onChange={handleNewChange}
                                    placeholder="City / Street"
                                    className="input py-3 text-sm"
                                />
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNew}
                                disabled={saving}
                                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {saving ? (
                                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <><MdCheck size={18} /> Save &amp; Select</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ══════════════════════════════════════
                        SEARCH LIST
                    ══════════════════════════════════════ */
                    <>
                        {/* Search bar */}
                        <div className="relative mb-4">
                            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                            <input
                                type="text"
                                placeholder="Type name, phone number, or email..."
                                className="input pl-14 py-4 text-lg bg-slate-50 border-2 border-transparent focus:border-primary-500 transition-all rounded-2xl"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Add New Customer button */}
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full mb-4 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700 font-black text-sm hover:bg-primary-100 hover:border-primary-400 transition-all"
                        >
                            <MdPersonAdd size={20} />
                            Add New Customer
                        </button>

                        {/* Customer list */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-bold">Searching...</p>
                                </div>
                            ) : customers.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <MdPerson size={48} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-bold">No customers found</p>
                                    <p className="text-xs">Try a different name or create a new one above</p>
                                </div>
                            ) : customers.map(c => (
                                <button
                                    key={c._id}
                                    onClick={() => { onSelect(c); onClose(); }}
                                    className="w-full text-left p-5 hover:bg-primary-50 transition-all flex items-center gap-5 group border-l-4 border-transparent hover:border-primary-500"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-primary-600 font-black text-xl shadow-sm transition-all">
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-800 text-lg group-hover:text-primary-700 leading-tight">{c.name}</p>
                                        <div className="flex gap-4 mt-1">
                                            <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                                <span className="text-slate-300">#</span> {c.phone || 'No phone'}
                                            </p>
                                            {c.vatNumber && (
                                                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                                    VAT: {c.vatNumber}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">
                                        Select
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                            <p className="text-xs uppercase font-black tracking-widest">
                                Total {customers.length} results found
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
