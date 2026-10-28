import { useState, useEffect, useRef, useCallback } from 'react';
import { getCustomers, createCustomer } from '../services/customerService';
import { MdSearch, MdPerson, MdClose, MdPersonAdd, MdArrowBack, MdCheck, MdKeyboardReturn } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function CustomerSelector({ onSelect, onClose }) {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cache customer pool for 0ms instantaneous typing response
    const poolRef = useRef([]);
    const lastSearchRef = useRef('');

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

    // Helper: Local in-memory filter & ranker for 0ms typing feedback
    const filterAndRank = useCallback((term, pool) => {
        const clean = (term || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!clean) return pool;

        const words = clean.split(' ').filter(Boolean);

        return pool
            .filter((c) => {
                const name = (c.name || '').toLowerCase();
                const phone = (c.phone || '').toLowerCase();
                const vat = (c.vatNumber || '').toLowerCase();
                const email = (c.email || '').toLowerCase();

                // Match if all search words appear in customer info
                return words.every(
                    (w) => name.includes(w) || phone.includes(w) || vat.includes(w) || email.includes(w)
                );
            })
            .sort((a, b) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                const aPhone = (a.phone || '').toLowerCase();
                const bPhone = (b.phone || '').toLowerCase();

                // Exact match at top
                const aExact = aName === clean || aPhone === clean;
                const bExact = bName === clean || bPhone === clean;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                // Prefix match next
                const aPrefix = aName.startsWith(clean) || aPhone.startsWith(clean);
                const bPrefix = bName.startsWith(clean) || bPhone.startsWith(clean);
                if (aPrefix && !bPrefix) return -1;
                if (!aPrefix && bPrefix) return 1;

                return aName.localeCompare(bName);
            });
    }, []);

    // Initial load: Fetch customer pool
    useEffect(() => {
        let isMounted = true;
        const loadInitial = async () => {
            setLoading(true);
            try {
                const res = await getCustomers({ limit: 100 });
                if (isMounted) {
                    const data = res.data.data || [];
                    poolRef.current = data;
                    setCustomers(data);
                }
            } catch (err) {
                console.error('Failed to fetch customers', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadInitial();
        return () => { isMounted = false; };
    }, []);

    // Instant local filter on typing + debounced server query for deep search
    useEffect(() => {
        if (showAddForm) return;

        const clean = search.trim().replace(/\s+/g, ' ');

        // 1. Instant 0ms local response from cached pool
        const localResults = filterAndRank(search, poolRef.current);
        setCustomers(localResults);

        // 2. If trimmed search hasn't changed (e.g. user just pressed space), DO NOT call server
        if (clean === lastSearchRef.current) {
            return;
        }

        // 3. Debounce server search (250ms) to find any matches not in current pool
        const timer = setTimeout(async () => {
            lastSearchRef.current = clean;
            setLoading(true);
            try {
                const res = await getCustomers({ search: clean });
                const serverData = res.data.data || [];

                // Merge into pool
                const existingIds = new Set(poolRef.current.map((c) => c._id));
                const newItems = serverData.filter((c) => !existingIds.has(c._id));
                if (newItems.length > 0) {
                    poolRef.current = [...poolRef.current, ...newItems];
                }

                setCustomers(serverData);
            } catch (err) {
                console.error('Failed to fetch customers from server', err);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [search, showAddForm, filterAndRank]);

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
                        <div className="relative mb-3">
                            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                            <input
                                type="text"
                                placeholder="Type name, phone number, or email... (Press Enter to select top match)"
                                className="input pl-14 pr-24 py-4 text-lg bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white transition-all rounded-2xl w-full"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customers.length > 0) {
                                        e.preventDefault();
                                        onSelect(customers[0]);
                                        onClose();
                                    } else if (e.key === 'Escape') {
                                        onClose();
                                    }
                                }}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                                    title="Clear search"
                                >
                                    <MdClose size={18} />
                                </button>
                            )}
                        </div>

                        {/* Top Match Quick Hint */}
                        {customers.length > 0 && search.trim() && (
                            <div className="flex items-center justify-between px-2 mb-3 text-xs text-slate-500">
                                <span>
                                    Top match: <strong className="text-slate-800 font-black">{customers[0].name}</strong>
                                </span>
                                <span className="inline-flex items-center gap-1 font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                                    <MdKeyboardReturn size={13} /> Enter to select
                                </span>
                            </div>
                        )}

                        {/* Add New Customer button */}
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full mb-3 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700 font-black text-sm hover:bg-primary-100 hover:border-primary-400 transition-all"
                        >
                            <MdPersonAdd size={20} />
                            Add New Customer
                        </button>

                        {/* Customer list */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-sm relative">
                            {loading && customers.length === 0 ? (
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
                            ) : (
                                customers.map((c, index) => {
                                    const cleanTerm = search.trim().toLowerCase();
                                    const isExactMatch = cleanTerm && (
                                        (c.name || '').toLowerCase() === cleanTerm ||
                                        (c.phone || '').toLowerCase() === cleanTerm
                                    );

                                    return (
                                        <button
                                            key={c._id}
                                            onClick={() => { onSelect(c); onClose(); }}
                                            className={`w-full text-left p-4 hover:bg-primary-50 transition-all flex items-center gap-4 group border-l-4 ${
                                                index === 0 && search.trim()
                                                    ? 'border-primary-500 bg-primary-50/40'
                                                    : 'border-transparent hover:border-primary-500'
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:text-primary-600 font-black text-lg shadow-sm transition-all shrink-0">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-slate-800 text-base group-hover:text-primary-700 leading-tight truncate">
                                                        {c.name}
                                                    </p>
                                                    {isExactMatch && (
                                                        <span className="shrink-0 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                            Exact Match
                                                        </span>
                                                    )}
                                                    {index === 0 && search.trim() && !isExactMatch && (
                                                        <span className="shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                            Top Match
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                        <span className="text-slate-300">#</span> {c.phone || 'No phone'}
                                                    </p>
                                                    {c.vatNumber && (
                                                        <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                                            VAT: {c.vatNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase shrink-0">
                                                Select
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-slate-400 text-xs">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-primary-500'}`} />
                                <span className="uppercase font-black tracking-wider text-[11px]">
                                    {loading ? 'Updating...' : `Total ${customers.length} results`}
                                </span>
                            </div>
                            <span className="text-slate-400 text-[11px]">
                                Esc to close
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
