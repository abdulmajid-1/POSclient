import { useState, useEffect, useCallback } from 'react';

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService';

import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdClose,
} from 'react-icons/md';

import toast from 'react-hot-toast';

/* ================================
   DEFAULT CATEGORIES
================================ */
const DEFAULT_CATS = [
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Supplies',
  'Maintenance',
  'Transport',
  'Purchase',
  'Other',
];

/* ================================
   EMPTY FORM
================================ */
const EMPTY = {
  title: '',
  amount: '',
  category: 'Other',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

/* ================================
   EXPENSE MODAL
================================ */
function ExpenseModal({ expense, categories, onAddCategory, onClose, onSaved }) {
  const isEdit = !!expense?._id;

  const [form, setForm] = useState(
    expense
      ? { ...expense, date: (expense.date || '').split('T')[0] }
      : EMPTY
  );

  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await updateExpense(expense._id, form);
        toast.success('Expense updated');
      } else {
        await createExpense(form);
        toast.success('Expense created');
      }

      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    const cat = newCategory.trim();
    if (!cat) return;

    if (categories.includes(cat)) {
      toast.error('Category already exists');
      return;
    }

    onAddCategory(cat);
    setForm((prev) => ({ ...prev, category: cat }));
    setNewCategory('');
    toast.success('Category added');
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg w-full p-5">

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>

          <button onClick={onClose}>
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="Title"
            required
          />

          <div className="grid grid-cols-2 gap-3">

            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
              placeholder="Amount"
              required
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
            />

          </div>

          <div className="flex gap-2">

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input flex-1"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button type="button" onClick={handleAddCategory} className="btn-secondary">
              + Cat
            </button>

          </div>

          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="input"
            placeholder="New category"
          />

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Notes"
          />

          <div className="flex gap-3 pt-2">

            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>

            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Expense'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

/* ================================
   MAIN PAGE
================================ */
export default function ExpensesPage() {

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  /* DATE FILTERS */
  const [rangeType, setRangeType] = useState('all'); // all, daily, weekly, monthly, yearly
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [modal, setModal] = useState(null);

  /* BUILD DATE RANGE */
  const getDateRange = () => {
    const today = new Date();

    let start = '';
    let end = '';

    if (rangeType === 'daily') {
      start = end = today.toISOString().split('T')[0];
    }

    if (rangeType === 'weekly') {
      const first = new Date(today);
      first.setDate(today.getDate() - 7);
      start = first.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    }

    if (rangeType === 'monthly') {
      const first = new Date(today);
      first.setMonth(today.getMonth() - 1);
      start = first.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    }

    if (rangeType === 'yearly') {
      const first = new Date(today);
      first.setFullYear(today.getFullYear() - 1);
      start = first.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    }

    if (rangeType === 'custom') {
      start = startDate;
      end = endDate;
    }

    return { startDate: start, endDate: end };
  };

  /* FETCH */
  const fetchExpenses = useCallback(async () => {
    setLoading(true);

    try {
      const { startDate, endDate } = getDateRange();

      const { data } = await getExpenses({
        search,
        category: catFilter,
        startDate,
        endDate,
      });

      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
      setTotalAmount(data.totalAmount || 0);

    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, rangeType, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddCategory = (cat) => {
    setCategories((prev) => [...prev, cat]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      await deleteExpense(id);
      toast.success('Deleted');
      fetchExpenses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-slate-500 text-sm">
            {total} records • SAR {Number(totalAmount || 0).toLocaleString('en-SA')}
          </p>
        </div>

        <button onClick={() => setModal('add')} className="btn-primary">
          <MdAdd />
          Add Expense
        </button>

      </div>

      {/* FILTERS */}
      <div className="card p-4 flex flex-col gap-3">

        {/* SEARCH + CATEGORY */}
        <div className="flex gap-3">

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
            placeholder="Search..."
          />

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="input w-48"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

        </div>

        {/* TIME FILTER */}
        <div className="flex gap-3 flex-wrap">

          {['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'].map((t) => (
            <button
              key={t}
              onClick={() => setRangeType(t)}
              className={`px-3 py-1 rounded ${rangeType === t ? 'bg-primary-600 text-white' : 'bg-slate-100'
                }`}
            >
              {t}
            </button>
          ))}

        </div>

        {/* CUSTOM RANGE */}
        {rangeType === 'custom' && (
          <div className="flex gap-3">

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />

          </div>
        )}

      </div>

      {/* TABLE */}
      <div className="card p-0">

        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="p-10 text-center">No expenses found</div>
        ) : (
          <table className="table">

            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((e) => (
                <tr key={e._id}>

                  <td>{e.title}</td>
                  <td>{e.category}</td>

                  <td className="text-red-500">
                    SAR {Number(e.amount).toLocaleString('en-SA')}
                  </td>

                  <td>
                    {new Date(e.date).toLocaleDateString('en-SA')}
                  </td>

                  <td className="flex gap-2">

                    <button onClick={() => setModal(e)}>
                      <MdEdit />
                    </button>

                    <button onClick={() => handleDelete(e._id)}>
                      <MdDelete />
                    </button>

                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

      {/* MODAL */}
      {modal && (
        <ExpenseModal
          expense={modal === 'add' ? null : modal}
          categories={categories}
          onAddCategory={handleAddCategory}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchExpenses();
          }}
        />
      )}

    </div>
  );
}