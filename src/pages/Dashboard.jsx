import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';
import { getWeeklySummary, getMonthlySummary } from '../services/saleService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { MdShoppingCart, MdAttachMoney, MdInventory2, MdMoneyOff, MdKeyboardReturn, MdWarning, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import toast from 'react-hot-toast';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs font-medium truncate">{title}</p>
        <p className="text-xl font-bold text-slate-800 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeType, setRangeType] = useState('daily');

  const calculateDates = (type) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'weekly') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'monthly') {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'yearly') {
      start.setDate(now.getDate() - 365);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const dates = calculateDates(rangeType);
        const [dashRes, weekRes, monthRes] = await Promise.all([
          getDashboardStats(dates),
          getWeeklySummary(),
          getMonthlySummary(),
        ]);
        setStats(dashRes.data);
        setWeeklyData(weekRes.data.data.map((d) => ({ ...d, name: d._id ? new Date(d._id).toLocaleDateString('en', { weekday: 'short' }) : d._id })));
        setMonthlyData(monthRes.data.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [rangeType]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = stats?.stats || {};

  const cards = [
    { title: "Sales", value: s.rangeSales?.count || 0, icon: MdShoppingCart, color: 'bg-primary-600', sub: `${rangeType.charAt(0).toUpperCase() + rangeType.slice(1)} count` },
    { title: "Revenue", value: formatSAR(s.rangeSales?.revenue), icon: MdAttachMoney, color: 'bg-emerald-500', sub: `${rangeType.charAt(0).toUpperCase() + rangeType.slice(1)} total` },
    { title: 'Total Products', value: s.productCount || 0, icon: MdInventory2, color: 'bg-violet-500', sub: `${s.lowStockCount || 0} low stock` },
    { title: 'Expenses', value: formatSAR(s.rangeExpenses), icon: MdMoneyOff, color: 'bg-amber-500', sub: `${rangeType.charAt(0).toUpperCase() + rangeType.slice(1)} total` },
    { title: 'Net Profit', value: formatSAR(s.rangeProfit), icon: MdTrendingUp, color: s.rangeProfit >= 0 ? 'bg-teal-500' : 'bg-red-500', sub: '' },
    { title: 'Returns', value: s.rangeReturns?.count || 0, icon: MdKeyboardReturn, color: 'bg-rose-500', sub: formatSAR(s.rangeReturns?.total) },
  ];

  const ranges = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Business performance overview.</p>
        </div>

        {/* Range Selector */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeType(r.key)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${rangeType === r.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => <StatCard key={c.title} {...c} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Weekly Sales (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => [`SAR ${v?.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Line Chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Monthly Revenue (This Year)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => [`SAR ${v?.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MdWarning className="text-amber-500" size={20} />
            <h2 className="font-semibold text-slate-800">Low Stock Alerts</h2>
            {stats?.lowStockProducts?.length > 0 && (
              <span className="badge-yellow ml-auto">{stats.lowStockProducts.length} items</span>
            )}
          </div>
          {stats?.lowStockProducts?.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">✅ All products are well-stocked</p>
          ) : (
            <div className="space-y-2">
              {stats?.lowStockProducts?.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <span className="badge-yellow">{p.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Recent Transactions</h2>
          {stats?.recentSales?.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No recent transactions</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentSales?.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{sale.invoiceNumber}</p>
                    <p className="text-xs text-slate-400">{sale.customer?.name} • {new Date(sale.createdAt).toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{formatSAR(sale.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
