import { useState, useEffect, useCallback } from 'react';
import { getSalesReport, getExpenseReport, getProfitReport, getInventoryReport } from '../services/reportService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { MdAssessment, MdPrint, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
const round4 = (num) => Math.round((Number(num) || 0) * 10000) / 10000;
const formatSAR = (n) => `SAR ${round4(n).toLocaleString('en-SA')}`;

/* ── Returns { start: ISO string, end: ISO string } ── */
function calculateDates(type, customStart, customEnd) {
  if (type === 'custom') {
    return {
      start: customStart ? new Date(customStart + 'T00:00:00').toISOString() : '',
      end:   customEnd   ? new Date(customEnd   + 'T23:59:59').toISOString() : '',
    };
  }

  const now   = new Date();
  const start = new Date();

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0);          // today at midnight
  } else if (type === 'weekly') {
    // Week starts on Saturday (day 6). Find the most recent Saturday.
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysSinceSaturday = (day + 1) % 7; // Sat=0, Sun=1, Mon=2, ...
    start.setDate(now.getDate() - daysSinceSaturday);
    start.setHours(0, 0, 0, 0);
  } else if (type === 'monthly') {
    // Start from the 1st of the current month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (type === 'yearly') {
    // Start from Jan 1st of current year
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return { start: start.toISOString(), end: now.toISOString() };
}

/* ── Stat Card ── */
function StatCard({ label, value, color = 'text-slate-800', sub }) {
  return (
    <div className="card text-center hover:shadow-md transition-shadow">
      <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab]             = useState('sales');
  const [rangeType, setRangeType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryLimit = 20;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const { start, end } = calculateDates(rangeType, startDate, endDate);
      const params = { startDate: start, endDate: end };
      let res;
      if      (tab === 'sales')     res = await getSalesReport(params);
      else if (tab === 'expenses')  res = await getExpenseReport(params);
      else if (tab === 'profit')    res = await getProfitReport(params);
      else                          res = await getInventoryReport();
      setData(res.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [tab, rangeType, startDate, endDate]);

  /* Re-fetch whenever tab or range changes (not on every custom date keystroke) */
  useEffect(() => {
    if (rangeType !== 'custom') {
      fetchReport();
    }
    if (tab === 'inventory') setInventoryPage(1);
  }, [tab, rangeType]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = [
    { key: 'sales',     label: '📊 Sales Report'    },
    { key: 'expenses',  label: '💸 Expense Report'  },
    { key: 'profit',    label: '💰 Profit Report'   },
    { key: 'inventory', label: '📦 Inventory Report' },
  ];

  const ranges = [
    { key: 'daily',   label: 'Daily'   },
    { key: 'weekly',  label: 'Weekly'  },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly',  label: 'Yearly'  },
    { key: 'custom',  label: 'Custom'  },
  ];

  const rangeLabel = ranges.find((r) => r.key === rangeType)?.label || '';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdAssessment className="text-primary-600" size={28} />
            Reports &amp; Analytics
          </h1>
          <p className="text-slate-500 text-sm">Business insights and performance data</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary no-print">
          <MdPrint size={18} /> Print Report
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Range Selector ── */}
      {tab !== 'inventory' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap bg-slate-100 p-1 rounded-2xl w-fit">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeType(r.key)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  rangeType === r.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {rangeType === 'custom' && (
            <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="label text-[10px] font-black uppercase text-slate-400">From Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
              </div>
              <div className="flex-1">
                <label className="label text-[10px] font-black uppercase text-slate-400">To Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
              </div>
              <button onClick={fetchReport} className="btn-primary shrink-0 px-8">Apply</button>
            </div>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? null : (
        <>
          {/* ════════════════════ SALES ════════════════════ */}
          {tab === 'sales' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Total Sales"        value={data.data?.count    || 0}                  />
                <StatCard label="Revenue"            value={formatSAR(data.data?.revenue)}     color="text-emerald-600" />
                <StatCard label="Gross Profit"       value={formatSAR(data.data?.totalProfit)} color="text-blue-600"    />
                <StatCard label="Discount Given"     value={formatSAR(data.data?.discount)}    color="text-amber-600"   />
                <StatCard label="Tax Collected"      value={formatSAR(data.data?.tax)}         color="text-purple-600"  />
              </div>

              {/* ── Per-day Revenue & Profit Chart ── */}
              {data.byDay?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-slate-800 mb-4">
                    Daily Revenue &amp; Profit — <span className="text-primary-600">{rangeLabel}</span>
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.byDay} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v) => formatSAR(v)} />
                      <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="profit"  name="Profit"  fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.byDay?.length === 0 && (
                <div className="card flex flex-col items-center py-16 text-slate-400">
                  <MdTrendingUp size={48} className="opacity-20 mb-3" />
                  <p className="font-semibold">No sales data for this period</p>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════ EXPENSES ════════════════════ */}
          {tab === 'expenses' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="Total Expenses"  value={formatSAR(data.totals?.total)}   color="text-red-500"  />
                <StatCard label="Categories"      value={data.byCategory?.length || 0}                          />
              </div>

              {data.byCategory?.length > 0 ? (
                <div className="card">
                  <h3 className="font-bold text-slate-800 mb-4">Expenses by Category</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={data.byCategory}
                          dataKey="total"
                          nameKey="_id"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ _id, percent }) => `${_id} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {data.byCategory.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatSAR(v)} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Category list */}
                    <div className="space-y-2">
                      {data.byCategory.map((c, i) => (
                        <div key={c._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-semibold text-slate-700">{c._id}</span>
                            <span className="text-xs text-slate-400">({c.count} entries)</span>
                          </div>
                          <span className="text-sm font-bold text-red-500">{formatSAR(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card flex flex-col items-center py-16 text-slate-400">
                  <MdTrendingDown size={48} className="opacity-20 mb-3" />
                  <p className="font-semibold">No expense data for this period</p>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════ PROFIT ════════════════════ */}
          {tab === 'profit' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Revenue"      value={formatSAR(data.data?.revenue)}     color="text-emerald-600" />
                <StatCard label="Expenses"     value={formatSAR(data.data?.expenses)}    color="text-red-500"     />
                <StatCard label="Returns"      value={formatSAR(data.data?.returns)}     color="text-amber-500"   />
                <StatCard label="Gross Profit" value={formatSAR(data.data?.grossProfit)} color="text-blue-600"    />
                <StatCard
                  label="Net Profit"
                  value={formatSAR(data.data?.netProfit)}
                  color={data.data?.netProfit >= 0 ? 'text-teal-600' : 'text-red-600'}
                />
              </div>

              <div className="card">
                <h3 className="font-bold text-slate-800 mb-4">
                  Profit Breakdown — <span className="text-primary-600">{rangeLabel}</span>
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[
                      { name: 'Revenue',      value: data.data?.revenue     },
                      { name: 'Expenses',     value: data.data?.expenses    },
                      { name: 'Returns',      value: data.data?.returns     },
                      { name: 'Gross Profit', value: data.data?.grossProfit },
                      { name: 'Net Profit',   value: data.data?.netProfit   },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v) => formatSAR(v)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {['#10b981', '#ef4444', '#f59e0b', '#2563eb', '#14b8a6'].map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ════════════════════ INVENTORY ════════════════════ */}
          {tab === 'inventory' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Total Products"      value={data.totals?.totalProducts || 0}              />
                <StatCard label="Stock Value (Cost)"  value={formatSAR(data.totals?.totalStockValue)}      />
                <StatCard label="Stock Value (Sale)"  value={formatSAR(data.totals?.totalSaleValue)}       />
              </div>

              <div className="card p-0">
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Purchase Price</th>
                        <th>Sale Price</th>
                        <th>Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const start = (inventoryPage - 1) * inventoryLimit;
                        return data.products?.slice(start, start + inventoryLimit).map((p) => (
                          <tr key={p._id}>
                            <td className="font-bold text-slate-900">{p.name}</td>
                            <td><span className="badge-blue font-bold">{p.sku}</span></td>
                            <td><span className="badge-gray font-bold">{p.category?.name}</span></td>
                            <td>
                              <span className={`font-bold ${p.quantity <= p.lowStockThreshold ? 'badge-red' : 'badge-green'}`}>
                                {p.quantity}
                              </span>
                            </td>
                            <td className="text-slate-900 font-medium">SAR {Number(p.purchasePrice).toLocaleString()}</td>
                            <td className="text-slate-900 font-medium">SAR {Number(p.salePrice).toLocaleString()}</td>
                            <td className="font-extrabold text-slate-950">SAR {Number(p.purchasePrice * p.quantity).toLocaleString()}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {data.products?.length > inventoryLimit && (
                  <div className="flex items-center justify-between p-4 border-t bg-slate-50/30">
                    <button
                      disabled={inventoryPage === 1}
                      onClick={() => setInventoryPage((p) => p - 1)}
                      className="px-4 py-2 text-xs font-black rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 disabled:opacity-50 transition-all uppercase"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-slate-600">
                      Page {inventoryPage} of {Math.ceil(data.products.length / inventoryLimit)}
                    </span>
                    <button
                      disabled={inventoryPage === Math.ceil(data.products.length / inventoryLimit)}
                      onClick={() => setInventoryPage((p) => p + 1)}
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
