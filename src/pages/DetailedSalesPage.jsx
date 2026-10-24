import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDetailedSales } from '../services/saleService';
import SaleDetailModal from '../components/SaleDetailModal';
import {
  MdSearch, MdClose, MdFileDownload, MdPrint, MdReceiptLong,
  MdTrendingUp, MdTrendingDown, MdAttachMoney, MdShoppingCart,
  MdShoppingBag, MdPercent, MdPayment, MdFilterList, MdCheckCircle,
  MdChevronRight, MdExpandMore, MdKeyboardArrowRight, MdInfo, MdHistory
} from 'react-icons/md';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import { formatBillDate, formatBillDateOnly } from '../utils/dateUtils';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (n) => Number(n || 0).toLocaleString();

const PAYMENT_COLORS = {
  cash: '#10b981',
  card: '#3b82f6',
  bank_transfer: '#8b5cf6',
  other: '#f59e0b',
};

const PAYMENT_LABELS = {
  cash: 'Cash / نقداً',
  card: 'Credit Card / بطاقة',
  bank_transfer: 'Bank Transfer / تحويل',
  other: 'Other / أخرى',
};

export default function DetailedSalesPage() {
  // Filters State
  const [period, setPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [skuInput, setSkuInput] = useState('');
  const [activeSku, setActiveSku] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [profitFilter, setProfitFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // View Mode: 'itemized' (product line level) or 'invoices' (accordion invoice level)
  const [viewMode, setViewMode] = useState('itemized');

  // Expanded rows for Invoice Accordion View
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());

  // Modal for Invoice Preview / Print
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  // Print ref for summary sheet
  const summaryPrintRef = useRef();

  // Query parameters
  const queryParams = {
    period,
    ...(period === 'custom' && customStart ? { startDate: customStart } : {}),
    ...(period === 'custom' && customEnd ? { endDate: customEnd } : {}),
    ...(activeSku ? { sku: activeSku } : {}),
    ...(paymentMethod !== 'all' ? { paymentMethod } : {}),
    ...(profitFilter !== 'all' ? { profitFilter } : {}),
    ...(searchInput ? { search: searchInput } : {}),
    page,
    limit,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['detailedSales', queryParams],
    queryFn: async () => {
      const res = await getDetailedSales(queryParams);
      return res.data;
    },
    staleTime: 30000,
  });

  const summary = data?.summary || {};
  const skuAnalytics = data?.skuAnalytics || null;
  const chartData = data?.chartData || [];
  const sales = data?.sales || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // Handle SKU Search Form
  const handleSkuSubmit = (e) => {
    e.preventDefault();
    setActiveSku(skuInput.trim());
    setPage(1);
  };

  const clearSku = () => {
    setSkuInput('');
    setActiveSku('');
    setPage(1);
  };

  // Toggle accordion item
  const toggleExpand = (id) => {
    setExpandedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand / Collapse all
  const toggleExpandAll = () => {
    if (expandedInvoices.size === sales.length) {
      setExpandedInvoices(new Set());
    } else {
      setExpandedInvoices(new Set(sales.map((s) => s._id)));
    }
  };

  // Export full detailed sales to CSV
  const handleExportCSV = async () => {
    try {
      toast.loading('Generating detailed CSV export...', { id: 'csv-export' });
      const exportParams = { ...queryParams, all: true };
      const res = await getDetailedSales(exportParams);
      const allSales = res.data?.sales || [];

      if (allSales.length === 0) {
        toast.error('No sales to export', { id: 'csv-export' });
        return;
      }

      // Build CSV rows
      const headers = [
        'Invoice Number',
        'Date',
        'Time',
        'Customer Name',
        'Customer Phone',
        'Customer VAT',
        'Customer Address',
        'SKU',
        'Product Name',
        'Sold Qty',
        'Selected Unit',
        'Conversion Factor',
        'Cost Price (SAR)',
        'Unit Selling Price (SAR)',
        'Item Discount',
        'Line Total Price (SAR)',
        'Line Profit (SAR)',
        'Line Margin %',
        'Invoice Subtotal (SAR)',
        'Invoice Discount (SAR)',
        'Invoice Tax (SAR)',
        'Invoice Grand Total (SAR)',
        'Invoice Net Profit (SAR)',
        'Payment Method',
        'Status',
        'Cashier / Created By',
      ];

      const csvRows = [headers.join(',')];

      allSales.forEach((sale) => {
        const dateObj = new Date(sale.createdAt);
        const dateStr = formatBillDateOnly(sale.createdAt);
        const timeStr = dateObj.toLocaleTimeString('en-US');
        const custName = `"${(sale.customer?.name || 'Walk-in Customer').replace(/"/g, '""')}"`;
        const custPhone = `"${(sale.customer?.phone || '').replace(/"/g, '""')}"`;
        const custVat = `"${(sale.customer?.vatNumber || '').replace(/"/g, '""')}"`;
        const custAddr = `"${(sale.customer?.address || '').replace(/"/g, '""')}"`;
        const cashier = `"${(sale.createdBy?.name || 'Admin').replace(/"/g, '""')}"`;

        if (sale.items && sale.items.length > 0) {
          sale.items.forEach((item) => {
            const marginPct = item.totalPrice > 0 ? ((item.profit / item.totalPrice) * 100).toFixed(2) : '0.00';
            const row = [
              sale.invoiceNumber,
              dateStr,
              timeStr,
              custName,
              custPhone,
              custVat,
              custAddr,
              `"${(item.sku || '').replace(/"/g, '""')}"`,
              `"${(item.productName || '').replace(/"/g, '""')}"`,
              item.quantity,
              `"${item.selectedUnit || ''}"`,
              item.conversionFactor || 1,
              item.purchasePrice || 0,
              item.unitPrice || 0,
              item.discount ? `${item.discount}${item.discountType === 'percentage' ? '%' : ' SAR'}` : '0',
              item.totalPrice || 0,
              item.profit || 0,
              `${marginPct}%`,
              sale.subtotal || 0,
              sale.discount || 0,
              sale.tax || 0,
              sale.total || 0,
              sale.totalProfit || 0,
              sale.paymentMethod || 'cash',
              sale.status || 'completed',
              cashier,
            ];
            csvRows.push(row.join(','));
          });
        } else {
          const row = [
            sale.invoiceNumber,
            dateStr,
            timeStr,
            custName,
            custPhone,
            custVat,
            custAddr,
            '-',
            'No items',
            0,
            '-',
            1,
            0,
            0,
            0,
            0,
            0,
            '0%',
            sale.subtotal || 0,
            sale.discount || 0,
            sale.tax || 0,
            sale.total || 0,
            sale.totalProfit || 0,
            sale.paymentMethod || 'cash',
            sale.status || 'completed',
            cashier,
          ];
          csvRows.push(row.join(','));
        }
      });

      // UTF-8 BOM for Arabic support in Excel
      const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `detailed_sales_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV downloaded successfully!', { id: 'csv-export' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  // Quick SKU click from table
  const handleQuickSkuSelect = (sku) => {
    if (!sku) return;
    setSkuInput(sku);
    setActiveSku(sku);
    setPage(1);
  };

  // Calculate itemized flattened rows from sales
  const itemizedRows = [];
  sales.forEach((sale) => {
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item, idx) => {
        itemizedRows.push({
          key: `${sale._id}-${idx}`,
          sale,
          item,
        });
      });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold">
              <MdReceiptLong size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Detailed Sales & Profit Analysis
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comprehensive item-level cost, profit margins, SKU spotlight, and transaction auditing
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm hover:border-primary-500"
            title="Download full detailed records as Excel / CSV"
          >
            <MdFileDownload size={16} className="text-primary-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            title="Print this page or report"
          >
            <MdPrint size={16} className="text-slate-600 dark:text-slate-300" />
            <span>Print Report</span>
          </button>

          <NavLink
            to="/sales"
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm hover:text-primary-600"
          >
            <MdHistory size={16} />
            <span>Sales History</span>
          </NavLink>
        </div>
      </div>

      {/* ── CONTROLS BAR: TIMEFRAME & SKU SEARCH ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Timeframe Tabs & Date Range */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Timeframe / الفترة
            </span>
            {summary?.startDate && (
              <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-full border border-primary-200 dark:border-primary-900">
                {new Date(summary.startDate).toLocaleDateString('en-GB')}
                {period !== 'daily' && ` – ${new Date(summary.endDate).toLocaleDateString('en-GB')}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            {[
              { id: 'daily', label: 'Daily (Today)' },
              { id: 'weekly', label: 'Weekly (This Week)' },
              { id: 'monthly', label: 'Monthly (This Month)' },
              { id: 'custom', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setPeriod(tab.id);
                  setPage(1);
                }}
                className={`text-xs font-semibold py-2 px-2 rounded-lg transition-all text-center truncate ${
                  period === tab.id
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if Custom selected */}
          {period === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input text-xs py-1.5 w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input text-xs py-1.5 w-full"
                />
              </div>
              <button
                onClick={() => {
                  setPage(1);
                  refetch();
                }}
                className="btn-primary text-xs py-2 px-4 mt-4"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Right: SKU Filter Box */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filter by Product SKU / رمز المنتج
            </span>
            {activeSku && (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                Active: <strong>{activeSku}</strong>
              </span>
            )}
          </div>

          <form onSubmit={handleSkuSubmit} className="relative">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              placeholder="Type SKU (e.g. ROD-001) & press Enter..."
              className="input pl-10 pr-20 text-xs py-2.5 w-full font-mono uppercase"
            />
            {skuInput && (
              <button
                type="button"
                onClick={clearSku}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear SKU"
              >
                <MdClose size={16} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors"
            >
              Filter
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            {activeSku ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Filtering all sales containing SKU: <strong>{activeSku}</strong>. Click (X) to clear.
              </span>
            ) : (
              'Enter any product SKU to open all sales containing it with individual item profits.'
            )}
          </p>
        </div>
      </div>

      {/* ── SKU SPOTLIGHT BANNER (When SKU Filter is Active) ── */}
      {activeSku && skuAnalytics && (
        <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-primary-800/40 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary-800/40 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-300 font-bold text-lg">
                <MdShoppingBag size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-primary-400">Product Spotlight</span>
                  <span className="bg-primary-500/20 text-primary-300 font-mono text-xs px-2 py-0.5 rounded border border-primary-500/30">
                    SKU: {skuAnalytics.sku}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">{skuAnalytics.productName}</h2>
                <p className="text-xs text-slate-400">Category: {skuAnalytics.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {skuAnalytics.currentStock !== null && (
                <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Stock</p>
                  <p className="text-base font-bold text-white">
                    {skuAnalytics.currentStock} <span className="text-xs font-normal text-slate-400">{skuAnalytics.baseUnit}</span>
                  </p>
                </div>
              )}
              <button
                onClick={clearSku}
                className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs py-2 px-3 flex items-center gap-1"
              >
                <MdClose size={14} /> Clear Spotlight
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Units Sold</p>
              <p className="text-lg font-bold text-white mt-0.5">{formatNumber(skuAnalytics.totalSold)}</p>
              <p className="text-[10px] text-slate-400">In {skuAnalytics.invoiceCount} invoices</p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">SKU Revenue</p>
              <p className="text-lg font-bold text-white mt-0.5">{formatSAR(skuAnalytics.totalRevenue)}</p>
              <p className="text-[10px] text-slate-400">Gross sales value</p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">SKU Total Cost (COGS)</p>
              <p className="text-lg font-bold text-amber-300 mt-0.5">{formatSAR(skuAnalytics.totalCost)}</p>
              <p className="text-[10px] text-slate-400">Cost of goods sold</p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">SKU Net Profit</p>
              <p className={`text-lg font-bold mt-0.5 ${skuAnalytics.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatSAR(skuAnalytics.totalProfit)}
              </p>
              <p className="text-[10px] text-slate-400">Revenue − Cost</p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Profit Margin</p>
              <p className="text-lg font-bold text-emerald-300 mt-0.5">{skuAnalytics.margin}%</p>
              <p className="text-[10px] text-slate-400">Return on SKU sales</p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Listed Prices</p>
              <p className="text-xs font-bold text-slate-200 mt-1">Cost: {formatSAR(skuAnalytics.purchasePrice)}</p>
              <p className="text-xs font-bold text-primary-300">Sell: {formatSAR(skuAnalytics.salePrice)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── EXECUTIVE KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <MdAttachMoney size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatSAR(summary.totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.totalInvoices || 0} total invoices
          </p>
        </div>

        {/* Card 2: Cost of Goods Sold (COGS) */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Cost (COGS)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <MdShoppingCart size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatSAR(summary.totalCost)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Original inventory purchase cost
          </p>
        </div>

        {/* Card 3: Net Profit */}
        <div className="card hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Net Profit</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <MdTrendingUp size={18} />
            </div>
          </div>
          <p className={`text-xl font-extrabold ${summary.totalNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {formatSAR(summary.totalNetProfit)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            After item & invoice discounts
          </p>
        </div>

        {/* Card 4: Profit Margin */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Profit Margin</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <MdPercent size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {summary.profitMargin || 0}%
            </p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              (summary.profitMargin || 0) >= 20
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                : (summary.profitMargin || 0) >= 10
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
            }`}>
              {(summary.profitMargin || 0) >= 20 ? 'High' : (summary.profitMargin || 0) >= 10 ? 'Healthy' : 'Moderate'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Net profit / revenue
          </p>
        </div>

        {/* Card 5: Items Sold */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Items Sold</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
              <MdShoppingBag size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatNumber(summary.totalItemsSold)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Total product units
          </p>
        </div>

        {/* Card 6: Average Order Value */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Order Value</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
              <MdPayment size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatSAR(summary.avgOrderValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Per customer invoice
          </p>
        </div>
      </div>

      {/* ── CHARTS SECTION: TREND & PAYMENT BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue vs Profit Over Time */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Sales & Profit Trend / اتجاه المبيعات والأرباح
              </h3>
              <p className="text-xs text-slate-400">
                {period === 'daily' ? 'Hourly breakdown for today' : 'Daily comparison over selected timeframe'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-3 h-3 rounded-sm bg-primary-600 inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Net Profit
              </span>
            </div>
          </div>

          <div className="h-64">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val, name) => [formatSAR(val), name === 'revenue' ? 'Revenue' : 'Net Profit']}
                    labelFormatter={(lbl) => `Time / Date: ${lbl}`}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', background: '#0f172a', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="revenue" />
                  <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="profit" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No trend data available for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* Right: Payment Method Breakdown */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              Payment Methods / طرق الدفع
            </h3>
            <p className="text-xs text-slate-400 mb-3">Distribution of transaction revenue</p>
          </div>

          <div className="space-y-3 my-auto">
            {summary?.paymentBreakdown && summary.paymentBreakdown.length > 0 ? (
              summary.paymentBreakdown.map((item) => {
                const pct = summary.totalRevenue > 0 ? ((item.amount / summary.totalRevenue) * 100).toFixed(1) : 0;
                const color = PAYMENT_COLORS[item._id] || '#64748b';
                return (
                  <div key={item._id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {PAYMENT_LABELS[item._id] || item._id}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatSAR(item.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{item.count} transactions</span>
                      <span>{pct}% of revenue</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No payment data in this period
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span>Subtotal: <strong>{formatSAR(summary.totalSubtotal)}</strong></span>
            <span>VAT: <strong>{formatSAR(summary.totalTax)}</strong></span>
          </div>
        </div>
      </div>

      {/* ── ADVANCED FILTERS & VIEW MODE SWITCHER ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">View Mode:</span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('itemized')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'itemized'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MdShoppingBag size={15} />
              <span>Itemized Product View</span>
            </button>
            <button
              onClick={() => setViewMode('invoices')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'invoices'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MdReceiptLong size={15} />
              <span>Invoice Grouped View</span>
            </button>
          </div>

          {viewMode === 'invoices' && sales.length > 0 && (
            <button
              onClick={toggleExpandAll}
              className="text-[11px] font-semibold text-primary-600 hover:underline ml-2"
            >
              {expandedInvoices.size === sales.length ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>

        {/* Right: Fast Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search by Invoice / Customer */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice / customer..."
              className="input pl-9 pr-3 text-xs py-1.5 w-48 md:w-56"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="input text-xs py-1.5 pr-8"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash / نقداً</option>
            <option value="card">Card / بطاقة</option>
            <option value="bank_transfer">Bank Transfer / تحويل</option>
          </select>

          {/* Profit Status Filter */}
          <select
            value={profitFilter}
            onChange={(e) => {
              setProfitFilter(e.target.value);
              setPage(1);
            }}
            className="input text-xs py-1.5 pr-8"
          >
            <option value="all">All Profit Levels</option>
            <option value="profitable">Profitable Only (&gt; 0)</option>
            <option value="loss">Loss / Zero Profit (&le; 0)</option>
          </select>
        </div>
      </div>

      {/* ── TABLE CONTENT ── */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Loading detailed sales data...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-6 rounded-2xl text-center text-red-600 text-xs">
          Failed to load detailed sales. Please refresh or try again.
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-400">
          <MdReceiptLong size={40} className="mx-auto mb-2 opacity-30" />
          <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No sales found</p>
          <p className="text-xs text-slate-400 mt-1">
            {activeSku ? `No transactions contain SKU "${activeSku}" in this timeframe.` : 'No transactions recorded for the selected filters.'}
          </p>
          {activeSku && (
            <button onClick={clearSku} className="btn-primary text-xs py-1.5 px-4 mt-4">
              Clear SKU Filter
            </button>
          )}
        </div>
      ) : viewMode === 'itemized' ? (
        /* ═══════════════════════════════════════════════════════════
           VIEW 1: ITEMIZED PRODUCT LEVEL VIEW (EACH ROW = SOLD ITEM)
           ═══════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5 min-w-[180px]">Product Name</th>
                  <th className="p-3.5 text-center">Unit & Qty</th>
                  <th className="p-3.5 text-right">Cost Price</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  <th className="p-3.5 text-right">Disc.</th>
                  <th className="p-3.5 text-right">Total Price</th>
                  <th className="p-3.5 text-right">Item Profit</th>
                  <th className="p-3.5 text-right">Margin %</th>
                  <th className="p-3.5 text-center">Payment</th>
                  <th className="p-3.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {itemizedRows.map(({ key, sale, item }) => {
                  const dateObj = new Date(sale.createdAt);
                  const isMatchingSku = activeSku && item.sku?.toLowerCase() === activeSku.toLowerCase();
                  const marginPct = item.totalPrice > 0 ? ((item.profit / item.totalPrice) * 100).toFixed(1) : '0.0';
                  const isProfitable = item.profit > 0;
                  const isLoss = item.profit < 0;

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isMatchingSku ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatBillDate(sale.createdAt, true)}
                        </div>
                      </td>

                      {/* Invoice # */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSaleId(sale._id)}
                          className="font-mono font-bold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {sale.invoiceNumber}
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {sale.customer?.name || 'Walk-in'}
                        </p>
                        {sale.customer?.phone && (
                          <p className="text-[10px] text-slate-400">{sale.customer.phone}</p>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="p-3.5 whitespace-nowrap">
                        {item.sku ? (
                          <button
                            onClick={() => handleQuickSkuSelect(item.sku)}
                            title="Click to filter by this SKU"
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border transition-colors ${
                              isMatchingSku
                                ? 'bg-primary-600 text-white border-primary-600 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-500'
                            }`}
                          >
                            {item.sku}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Product Name */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.productName}
                        </div>
                        {item.isCustomItem && (
                          <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                            Custom Item
                          </span>
                        )}
                      </td>

                      {/* Unit & Qty */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          {item.selectedUnit || 'unit'}
                        </span>
                      </td>

                      {/* Purchase Cost Price */}
                      <td className="p-3.5 text-right whitespace-nowrap font-mono text-slate-500">
                        {formatSAR(item.purchasePrice)}
                      </td>

                      {/* Unit Selling Price */}
                      <td className="p-3.5 text-right whitespace-nowrap font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatSAR(item.unitPrice)}
                      </td>

                      {/* Item Discount */}
                      <td className="p-3.5 text-right whitespace-nowrap text-red-500 font-mono text-[11px]">
                        {item.discount > 0 ? (
                          item.discountType === 'percentage' ? `${item.discount}%` : formatSAR(item.discount)
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>

                      {/* Line Total Price */}
                      <td className="p-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        {formatSAR(item.totalPrice)}
                      </td>

                      {/* Item Profit */}
                      <td className="p-3.5 text-right whitespace-nowrap font-mono">
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          isProfitable
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : isLoss
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                            : 'text-slate-500'
                        }`}>
                          {formatSAR(item.profit)}
                        </span>
                      </td>

                      {/* Margin % */}
                      <td className="p-3.5 text-right whitespace-nowrap font-bold text-xs">
                        <span className={Number(marginPct) >= 20 ? 'text-emerald-600' : Number(marginPct) > 0 ? 'text-blue-600' : 'text-slate-400'}>
                          {marginPct}%
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sale.paymentMethod || 'cash'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSaleId(sale._id)}
                          className="btn-secondary text-[10px] py-1 px-2.5 font-bold hover:bg-primary-50 text-primary-600"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════
           VIEW 2: INVOICE GROUPED VIEW (ACCORDION WITH SUB-TABLES)
           ═══════════════════════════════════════════════════════════ */
        <div className="space-y-3">
          {sales.map((sale) => {
            const isExpanded = expandedInvoices.has(sale._id);
            const dateObj = new Date(sale.createdAt);
            const marginPct = sale.total > 0 ? ((sale.totalProfit / sale.total) * 100).toFixed(1) : '0.0';

            return (
              <div
                key={sale._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
              >
                {/* Invoice Main Summary Row */}
                <div
                  onClick={() => toggleExpand(sale._id)}
                  className="p-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                      <MdExpandMore
                        size={20}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {sale.invoiceNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatBillDate(sale.createdAt, true)} • Customer: <strong className="text-slate-700 dark:text-slate-200">{sale.customer?.name || 'Walk-in'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Right side totals */}
                  <div className="flex items-center gap-6 justify-between md:justify-end text-xs">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Items</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{sale.items?.length || 0} line items</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Grand Total</p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{formatSAR(sale.total)}</p>
                    </div>

                    <div className="text-right bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold">Net Profit</p>
                      <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatSAR(sale.totalProfit)}
                        <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300 ml-1">({marginPct}%)</span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSaleId(sale._id);
                      }}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Receipt
                    </button>
                  </div>
                </div>

                {/* Accordion Expanded Sub-Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 animate-fade-in">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      Invoice Item Profit & Cost Breakdown:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-2.5">SKU</th>
                            <th className="p-2.5">Product Name</th>
                            <th className="p-2.5 text-center">Qty / Unit</th>
                            <th className="p-2.5 text-right">Cost Price</th>
                            <th className="p-2.5 text-right">Sell Price</th>
                            <th className="p-2.5 text-right">Discount</th>
                            <th className="p-2.5 text-right">Line Total</th>
                            <th className="p-2.5 text-right">Item Profit</th>
                            <th className="p-2.5 text-right">Margin %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {sale.items.map((item, idx) => {
                            const itemMargin = item.totalPrice > 0 ? ((item.profit / item.totalPrice) * 100).toFixed(1) : '0.0';
                            return (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                <td className="p-2.5 font-mono text-[11px] font-bold text-primary-600">
                                  {item.sku || '-'}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                  {item.productName}
                                </td>
                                <td className="p-2.5 text-center">
                                  {item.quantity} {item.selectedUnit}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-500">
                                  {formatSAR(item.purchasePrice)}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-800 dark:text-slate-200 font-semibold">
                                  {formatSAR(item.unitPrice)}
                                </td>
                                <td className="p-2.5 text-right text-red-500">
                                  {item.discount > 0 ? `${item.discount}${item.discountType === 'percentage' ? '%' : ''}` : '-'}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatSAR(item.totalPrice)}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatSAR(item.profit)}
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-600 dark:text-slate-300">
                                  {itemMargin}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs text-slate-500">
          <div>
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total sales)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (pagination.totalPages > 5 && page > 3) {
                pNum = page - 3 + i + 1;
                if (pNum > pagination.totalPages) pNum = pagination.totalPages - (4 - i);
              }
              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-7 h-7 rounded-lg font-bold transition-colors ${
                    page === pNum
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── INVOICE DETAIL & RECEIPT MODAL ── */}
      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </div>
  );
}
