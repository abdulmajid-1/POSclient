import { useState, useEffect } from 'react';
import { getSalesReport, getExpenseReport, getProfitReport, getInventoryReport } from '../services/reportService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { MdAssessment, MdDownload, MdPrint } from 'react-icons/md';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };
      let res;
      if (tab === 'sales') res = await getSalesReport(params);
      else if (tab === 'expenses') res = await getExpenseReport(params);
      else if (tab === 'profit') res = await getProfitReport(params);
      else res = await getInventoryReport();
      setData(res.data);
    } catch { toast.error('Failed to load report'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [tab]);

  const tabs = [
    { key: 'sales', label: 'Sales Report' },
    { key: 'expenses', label: 'Expense Report' },
    { key: 'profit', label: 'Profit Report' },
    { key: 'inventory', label: 'Inventory Report' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1><p className="text-slate-500 text-sm">Business insights and performance data</p></div>
        <button onClick={() => window.print()} className="btn-secondary"><MdPrint size={18} /> Print Report</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      {tab !== 'inventory' && (
        <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1"><label className="label">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" /></div>
          <div className="flex-1"><label className="label">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" /></div>
          <button onClick={fetchReport} className="btn-primary shrink-0">Apply Filter</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !data ? null : (
        <>
          {/* Sales Report */}
          {tab === 'sales' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sales', value: data.totals?.count || 0 },
                  { label: 'Revenue', value: formatSAR(data.totals?.revenue) },
                  { label: 'Discount Given', value: formatSAR(data.totals?.discount) },
                  { label: 'Tax Collected', value: formatSAR(data.totals?.tax) },
                ].map((s) => (
                  <div key={s.label} className="card text-center">
                    <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>
              {data.byDay?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-slate-800 mb-4">Daily Revenue</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.byDay} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v) => [formatSAR(v), 'Revenue']} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Expense Report */}
          {tab === 'expenses' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card text-center"><p className="text-slate-400 text-xs mb-1">Total Expenses</p><p className="text-2xl font-bold text-red-500">{formatSAR(data.totals?.total)}</p></div>
                <div className="card text-center"><p className="text-slate-400 text-xs mb-1">Categories</p><p className="text-2xl font-bold text-slate-800">{data.byCategory?.length}</p></div>
              </div>
              {data.byCategory?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-slate-800 mb-4">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={data.byCategory} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label={({ _id, percent }) => `${_id} (${(percent * 100).toFixed(0)}%)`}>
                        {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatSAR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Profit Report */}
          {tab === 'profit' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Revenue', value: formatSAR(data.data?.revenue), color: 'text-emerald-600' },
                  { label: 'Expenses', value: formatSAR(data.data?.expenses), color: 'text-red-500' },
                  { label: 'Returns', value: formatSAR(data.data?.returns), color: 'text-amber-500' },
                  { label: 'Gross Profit', value: formatSAR(data.data?.grossProfit), color: 'text-blue-600' },
                  { label: 'Net Profit', value: formatSAR(data.data?.netProfit), color: data.data?.netProfit >= 0 ? 'text-teal-600' : 'text-red-600' },
                ].map((s) => (
                  <div key={s.label} className="card text-center">
                    <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Profit Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Revenue', value: data.data?.revenue },
                    { name: 'Expenses', value: data.data?.expenses },
                    { name: 'Returns', value: data.data?.returns },
                    { name: 'Net Profit', value: data.data?.netProfit },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v) => formatSAR(v)} />
                    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                      {['#10b981', '#ef4444', '#f59e0b', '#2563eb'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Inventory Report */}
          {tab === 'inventory' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Products', value: data.totals?.totalProducts || 0 },
                  { label: 'Stock Value (Cost)', value: formatSAR(data.totals?.totalStockValue) },
                  { label: 'Stock Value (Sale)', value: formatSAR(data.totals?.totalSaleValue) },
                ].map((s) => (
                  <div key={s.label} className="card text-center">
                    <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="card p-0">
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Purchase Price</th><th>Sale Price</th><th>Stock Value</th></tr></thead>
                    <tbody>{data.products?.slice(0, 50).map((p) => (
                      <tr key={p._id}>
                        <td className="font-medium text-slate-700">{p.name}</td>
                        <td><span className="badge-blue">{p.sku}</span></td>
                        <td><span className="badge-gray">{p.category}</span></td>
                        <td><span className={p.quantity <= p.lowStockThreshold ? 'badge-red' : 'badge-green'}>{p.quantity}</span></td>
                        <td>SAR {Number(p.purchasePrice).toLocaleString()}</td>
                        <td>SAR {Number(p.salePrice).toLocaleString()}</td>
                        <td className="font-semibold">SAR {Number(p.purchasePrice * p.quantity).toLocaleString()}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
