import { useState, useEffect } from 'react';
import { getCustomers } from '../services/customerService';
import { MdSearch, MdPerson, MdClose } from 'react-icons/md';

export default function CustomerSelector({ onSelect, onClose }) {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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
    }, [search]);

    return (
        <div className="modal-overlay z-[60]" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-2xl w-full p-8 animate-slide-up shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Select Customer</h2>
                        <p className="text-sm text-slate-500">Search and select a customer from your database</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-full">
                        <MdClose size={28} />
                    </button>
                </div>

                <div className="relative mb-6">
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

                <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500 font-bold">Searching...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <MdPerson size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No customers found</p>
                            <p className="text-xs">Try searching for a different name or phone number</p>
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

                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                    <p className="text-xs uppercase font-black tracking-widest">
                        Total {customers.length} results found
                    </p>
                </div>
            </div>
        </div>
    );
}
