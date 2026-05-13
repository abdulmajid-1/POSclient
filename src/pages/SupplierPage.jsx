import { useState, useEffect, useCallback } from 'react';

import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierPurchase,
} from '../services/supplierService';

import {
    MdSearch,
    MdVisibility,
    MdAdd,
    MdClose,
    MdEdit,
    MdDelete,
} from 'react-icons/md';

import toast from 'react-hot-toast';

const formatPKR = (n) =>
    `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

/* =========================================
   SUPPLIER DETAILS MODAL
========================================= */
function SupplierDetailsModal({ supplier, onClose }) {

    if (!supplier) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) =>
                e.target === e.currentTarget && onClose()
            }
        >
            <div className="modal-box max-w-md w-full p-5">

                <div className="flex justify-between items-center mb-4">

                    <h2 className="font-bold text-slate-800">
                        Supplier Details
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-slate-500"
                    >
                        <MdClose size={18} />
                    </button>

                </div>

                <div className="space-y-3 text-sm">

                    <div>
                        <p className="text-slate-400 text-xs">
                            Name
                        </p>

                        <p className="font-semibold">
                            {supplier.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs">
                            Company
                        </p>

                        <p className="font-medium">
                            {supplier.company || '-'}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs">
                            Phone
                        </p>

                        <p>{supplier.phone || '-'}</p>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs">
                            Email
                        </p>

                        <p>{supplier.email || '-'}</p>
                    </div>

                    <hr />

                    <div className="flex justify-between">
                        <span>Total Purchases</span>

                        <span className="font-semibold text-slate-800">
                            {formatPKR(supplier.totalPurchases)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Total Paid</span>

                        <span className="font-semibold text-green-600">
                            {formatPKR(supplier.totalPaid)}
                        </span>
                    </div>

                    <div className="flex justify-between border-t pt-2 font-bold">

                        <span>Remaining</span>

                        <span className="text-primary-600">
                            {formatPKR(
                                (supplier.totalPurchases || 0) -
                                (supplier.totalPaid || 0)
                            )}
                        </span>

                    </div>

                    {supplier.address && (
                        <div>
                            <p className="text-slate-400 text-xs">
                                Address
                            </p>

                            <p>{supplier.address}</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function AddPurchaseModal({ supplier, onClose, onSubmit }) {
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');

    const remaining =
        Number(purchaseAmount || 0) - Number(paidAmount || 0);

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            purchaseAmount: Number(purchaseAmount),
            paidAmount: Number(paidAmount),
        });
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) =>
                e.target === e.currentTarget && onClose()
            }
        >
            <div className="modal-box max-w-md w-full p-5">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">
                            Add Purchase
                        </h2>

                        <p className="text-xs text-slate-400">
                            {supplier?.name}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-red-500"
                    >
                        <MdClose size={20} />
                    </button>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    {/* PURCHASE */}
                    <div>
                        <label className="label text-xs">
                            Purchase Amount
                        </label>

                        <input
                            type="number"
                            min={0}
                            required
                            value={purchaseAmount}
                            onChange={(e) =>
                                setPurchaseAmount(e.target.value)
                            }
                            className="input"
                            placeholder="Enter purchase amount"
                        />
                    </div>

                    {/* PAID */}
                    <div>
                        <label className="label text-xs">
                            Paid Amount
                        </label>

                        <input
                            type="number"
                            min={0}
                            required
                            value={paidAmount}
                            onChange={(e) =>
                                setPaidAmount(e.target.value)
                            }
                            className="input"
                            placeholder="Enter paid amount"
                        />
                    </div>

                    {/* REMAINING */}
                    <div className="bg-slate-50 rounded-xl p-4">

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">
                                Remaining Amount
                            </span>

                            <span className="font-bold text-primary-600">
                                {formatPKR(remaining)}
                            </span>
                        </div>

                    </div>

                    {/* BUTTONS */}
                    <div className="flex justify-end gap-2 pt-2">

                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Save Purchase
                        </button>

                    </div>

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

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseSupplier, setPurchaseSupplier] = useState(null);

    const [search, setSearch] = useState('');

    const [selectedSupplier, setSelectedSupplier] =
        useState(null);

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

                                    <td className="font-medium">
                                        {s.name}
                                    </td>

                                    <td>
                                        {s.company || '-'}
                                    </td>

                                    <td>
                                        {s.phone || '-'}
                                    </td>

                                    <td>
                                        {formatPKR(s.totalPurchases)}
                                    </td>

                                    <td className="text-green-600">
                                        {formatPKR(s.totalPaid)}
                                    </td>

                                    <td className="font-semibold text-primary-600">
                                        {formatPKR(
                                            (s.totalPurchases || 0) -
                                            (s.totalPaid || 0)
                                        )}
                                    </td>

                                    <td>

                                        <div className="flex items-center gap-1">

                                            {/* VIEW */}
                                            <button
                                                onClick={() =>
                                                    setSelectedSupplier(s)
                                                }
                                                className="p-1.5 rounded hover:bg-primary-50 text-slate-500 hover:text-primary-600"
                                            >
                                                <MdVisibility size={16} />
                                            </button>

                                            {/* EDIT */}
                                            <button
                                                onClick={() =>
                                                    setEditingSupplier(s)
                                                }
                                                className="p-1.5 rounded hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                                            >
                                                <MdEdit size={16} />
                                            </button>

                                            {/* DELETE */}
                                            <button
                                                onClick={() =>
                                                    handleDeleteSupplier(s._id)
                                                }
                                                className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPurchaseSupplier(s);
                                                    setShowPurchaseModal(true);
                                                }}
                                                className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition"
                                                title="Add Purchase"
                                            >
                                                +
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                )}

            </div>

            {/* DETAILS MODAL */}
            {selectedSupplier && (
                <SupplierDetailsModal
                    supplier={selectedSupplier}
                    onClose={() =>
                        setSelectedSupplier(null)
                    }
                />
            )}

            {/* ADD MODAL */}
            {showAddModal && (
                <AddSupplierModal
                    onClose={() =>
                        setShowAddModal(false)
                    }
                    onCreated={fetchSuppliers}
                />
            )}

            {/* UPDATE MODAL */}
            {editingSupplier && (
                <UpdateSupplierModal
                    supplier={editingSupplier}
                    onClose={() =>
                        setEditingSupplier(null)
                    }
                    onUpdated={fetchSuppliers}
                />
            )}

            {showPurchaseModal && (
                <AddPurchaseModal
                    supplier={purchaseSupplier}
                    onClose={() => setShowPurchaseModal(false)}
                    onSubmit={handleAddPurchase}
                />
            )}

        </div>
    );
}

