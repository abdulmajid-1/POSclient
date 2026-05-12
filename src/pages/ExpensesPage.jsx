import { useState, useEffect, useCallback } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdMoneyOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const CATS = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Supplies', 'Maintenance', 'Transport', 'Other'];
const EMPTY = { title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '' };

function Modal({ expense, onClose, onSaved }) {
  const [form, setForm] = useState(expense ? { ...expense, date: (expense.date || '').split('T')[0] } : EMPTY);
  const [loading, setLoading] = useState(false);
  const isEdit = !!expense?._id;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      isEdit ? await updateExpense(expense._id, form) : await createExpense(form);
      toast.success(`Expense ${isEdit ? 'updated' : 'added'}`);
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? 'Edit' : 'Add'} Expense</h2>
          <button onClick={onClose}><MdClose size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Amount (Rs) *</label><input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" required /></div>
            <div><label className="label">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input resize-none" rows={2} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : isEdit ? 'Update' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getExpenses({ search, category: catFilter });
      setExpenses(data.expenses); setTotal(data.total); setTotalAmount(data.totalAmount);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await deleteExpense(id); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-800">Expenses</h1><p className="text-slate-500 text-sm">{total} records • Total: Rs {Number(totalAmount).toLocaleString()}</p></div>
        <button onClick={() => setModal('add')} className="btn-primary"><MdAdd size={18} /> Add Expense</button>
      </div>
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input pl-9" /></div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input sm:w-44"><option value="">All Categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="card p-0">
        {loading ? <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          : expenses.length === 0 ? <div className="flex flex-col items-center py-16 text-slate-400"><MdMoneyOff size={48} className="opacity-30 mb-3" /><p>No expenses found</p></div>
          : <div className="table-wrapper"><table className="table">
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>{expenses.map((e) => (
                <tr key={e._id}>
                  <td className="font-medium text-slate-700">{e.title}</td>
                  <td><span className="badge-blue">{e.category}</span></td>
                  <td className="font-semibold text-red-500">Rs {Number(e.amount).toLocaleString()}</td>
                  <td className="text-slate-400 text-xs">{new Date(e.date).toLocaleDateString('en-PK')}</td>
                  <td className="text-slate-400 text-xs max-w-xs truncate">{e.notes || '—'}</td>
                  <td><div className="flex gap-1.5">
                    <button onClick={() => setModal(e)} className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg text-slate-400"><MdEdit size={16} /></button>
                    <button onClick={() => handleDelete(e._id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><MdDelete size={16} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table></div>}
      </div>
      {modal && <Modal expense={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetch(); }} />}
    </div>
  );
}
