import { useState, useEffect } from 'react';
import { MdWarning, MdClose, MdAttachMoney } from 'react-icons/md';
import { getProfitReport } from '../services/reportService';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

export default function MonthlyAlert() {
  const [show, setShow] = useState(false);
  const [commission, setCommission] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const isFirstDay = today.getDate() === 1;

    const sessionKey = `monthly_alert_shown_${today.getMonth()}_${today.getFullYear()}`;
    const alreadyShown = sessionStorage.getItem(sessionKey);

    if (isFirstDay && !alreadyShown) {
      fetchCommission();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCommission = async () => {
    try {
      const now = new Date();
      // Get previous month range
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const params = {
        startDate: firstDayPrevMonth.toISOString().split('T')[0],
        endDate: lastDayPrevMonth.toISOString().split('T')[0]
      };

      const res = await getProfitReport(params);

      const netProfit = res.data.data?.netProfit || 0;
      setCommission(netProfit * 0.10);
      setShow(true);
    } catch (error) {
      console.error('Failed to fetch commission data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    const today = new Date();
    const sessionKey = `monthly_alert_shown_${today.getMonth()}_${today.getFullYear()}`;
    sessionStorage.setItem(sessionKey, 'true');
    setShow(false);
  };

  if (!show || loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-slide-up">
        {/* Header Decor */}
        <div className="bg-amber-500 h-2 w-full" />

        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <MdWarning size={40} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
            Monthly Commission Due
          </h2>

          <p className="text-slate-500 mb-6 leading-relaxed text-sm">
            Based on your net profit from the previous month, your <span className="font-bold text-slate-800 text-lg">10% commission</span> is due now.
          </p>

          <div className="bg-emerald-50 rounded-3xl p-6 mb-8 border border-emerald-100 shadow-inner">
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Amount to Pay</p>
              <p className="text-4xl font-black text-emerald-700">
                {formatSAR(commission)}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            I Understand
          </button>

          <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold italic">
            This alert will disappear until next month once dismissed.
          </p>
        </div>
      </div>
    </div>
  );
}
