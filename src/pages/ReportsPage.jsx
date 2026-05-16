import { useState, useEffect } from 'react';
import { getSalesReport, getExpenseReport, getProfitReport, getInventoryReport } from '../services/reportService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { MdAssessment, MdDownload, MdPrint } from 'react-icons/md';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [rangeType, setRangeType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryLimit = 20;

  const calculateDates = (type) => {
    const end = new Date();
    let start = new Date();

    if (type === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (type === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else if (type === 'monthly') {
      start.setDate(end.getDate() - 30);
    } else if (type === 'yearly') {
      start.setDate(end.getDate() - 365);
    } else if (type === 'custom') {
      return { start: startDate, end: endDate };
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { start, end } = calculateDates(rangeType);
      const params = { startDate: start, endDate: end };
      let res;
      if (tab === 'sales') res = await getSalesReport(params);
      else if (tab === 'expenses') res = await getExpenseReport(params);
      else if (tab === 'profit') res = await getProfitReport(params);
      else res = await getInventoryReport();
      setData(res.data);
    } catch { toast.error('Failed to load report'); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchReport();
    if (tab === 'inventory') setInventoryPage(1);
  }, [tab, rangeType]);

  const tabs = [
    { key: 'sales', label: 'Sales Report' },
    { key: 'expenses', label: 'Expense Report' },
    { key: 'profit', label: 'Profit Report' },
    { key: 'inventory', label: 'Inventory Report' },
  ];

  const ranges = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'custom', label: 'Custom' },
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
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Range Selector */}
      {tab !== 'inventory' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap bg-slate-100 p-1 rounded-2xl w-fit">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeType(r.key)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${rangeType === r.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {rangeType === 'custom' && (
            <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end animate-slide-down">
              <div className="flex-1"><label className="label text-[10px] font-black uppercase text-slate-400">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" /></div>
              <div className="flex-1"><label className="label text-[10px] font-black uppercase text-slate-400">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" /></div>
              <button onClick={fetchReport} className="btn-primary shrink-0 px-8">Apply</button>
            </div>
          )}
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
                  { label: 'Number of Sales', value: data.data?.count || 0 },
                  { label: 'Total Sales Amount', value: formatSAR(data.data?.revenue) },
                  { label: 'Total Profit', value: formatSAR(data.data?.totalProfit) },
                  { label: 'Discount Given', value: formatSAR(data.data?.discount) },
                  { label: 'Tax Collected', value: formatSAR(data.data?.tax) },
                ].map((s) => (
                  <div key={s.label} className="card text-center">
                    <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>

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
                    <tbody>
                      {(() => {
                        const start = (inventoryPage - 1) * inventoryLimit;
                        const end = start + inventoryLimit;
                        return data.products?.slice(start, end).map((p) => (
                          <tr key={p._id}>
                            <td className="font-bold text-slate-900">{p.name}</td>
                            <td><span className="badge-blue font-bold">{p.sku}</span></td>
                            <td><span className="badge-gray font-bold">{p.category.name}</span></td>
                            <td><span className={`font-bold ${p.quantity <= p.lowStockThreshold ? 'badge-red' : 'badge-green'}`}>{p.quantity}</span></td>
                            <td className="text-slate-900 font-medium">SAR {Number(p.purchasePrice).toLocaleString()}</td>
                            <td className="text-slate-900 font-medium">SAR {Number(p.salePrice).toLocaleString()}</td>
                            <td className="font-extrabold text-slate-950">SAR {Number(p.purchasePrice * p.quantity).toLocaleString()}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {data.products?.length > inventoryLimit && (
                  <div className="flex items-center justify-between p-4 border-t bg-slate-50/30">
                    <button
                      disabled={inventoryPage === 1}
                      onClick={() => setInventoryPage(p => p - 1)}
                      className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
                    >
                      Previous
                    </button>
                    <div className="text-xs font-bold text-slate-600">
                      Page {inventoryPage} of {Math.ceil(data.products.length / inventoryLimit)}
                    </div>
                    <button
                      disabled={inventoryPage === Math.ceil(data.products.length / inventoryLimit)}
                      onClick={() => setInventoryPage(p => p + 1)}
                      className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


