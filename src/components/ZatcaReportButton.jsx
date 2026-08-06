import { useState } from 'react';
import { reportSaleToZatca } from '../services/saleService';
import { MdOutlineQrCodeScanner, MdCheckCircle, MdError, MdRefresh, MdVerified } from 'react-icons/md';

/**
 * ZATCA Report & Status Component
 * Supports both B2C (Reporting) and B2B (Clearance) status rendering & execution.
 *
 * @param {{
 *   sale: object,
 *   onSaleUpdated: function,
 *   onTriggerPrint: function
 * }} props
 */
export default function ZatcaReportButton({ sale, onSaleUpdated, onTriggerPrint }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const reportingStatus = sale?.zatca?.reportingStatus;
  const invoiceType = sale?.zatca?.invoiceType || (sale?.customer?.vatNumber ? 'B2B' : 'B2C');
  const isProcessed = reportingStatus === 'REPORTED' || reportingStatus === 'CLEARED';

  const handleReportAndPrint = async (shouldPrint = true) => {
    if (!sale?._id) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await reportSaleToZatca(sale._id);
      if (res.data?.success && res.data?.data) {
        const updatedSale = res.data.data;
        if (onSaleUpdated) {
          onSaleUpdated(updatedSale);
        }

        const newStatus = updatedSale.zatca?.reportingStatus;
        const type = updatedSale.zatca?.invoiceType || invoiceType;

        // Check if ZATCA returned any validation error messages
        const errorList = updatedSale.zatca?.validationResults?.errorMessages;
        if (errorList && errorList.length > 0) {
          setErrorMsg(errorList.map((e) => e.message || e.code).join(' | '));
        } else {
          const msg =
            newStatus === 'CLEARED' || type === 'B2B'
              ? 'Invoice successfully cleared with ZATCA (B2B Clearance)'
              : 'Invoice successfully reported to ZATCA (B2C Reporting)';
          setSuccessMsg(msg);

          if (shouldPrint && onTriggerPrint) {
            setTimeout(() => onTriggerPrint(), 400);
          }
        }
      } else {
        setErrorMsg('Failed to process ZATCA reporting.');
      }
    } catch (err) {
      console.error('ZATCA Reporting Error:', err);
      const apiErr =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error connecting to ZATCA service';
      setErrorMsg(apiErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 no-print">
      {/* STATUS DISPLAY BADGE */}
      <div className="flex items-center gap-2">
        {isProcessed ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm">
            <MdVerified className="text-emerald-600 text-base" />
            <span>
              ZATCA {reportingStatus === 'CLEARED' ? 'B2B Cleared (مفلترة)' : 'B2C Reported (مبلغة)'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => handleReportAndPrint(true)}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting to ZATCA ({invoiceType})...</span>
              </>
            ) : (
              <>
                <MdOutlineQrCodeScanner size={16} />
                <span>Report & Print ZATCA ({invoiceType})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* SUCCESS NOTIFICATION */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl animate-fade-in">
          <MdCheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* ON-SCREEN ERROR DISPLAY */}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl shadow-sm animate-fade-in">
          <MdError size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">ZATCA Status Warning/Error:</span>
            <span className="text-[11px] font-mono leading-relaxed">{errorMsg}</span>
          </div>
          <button
            onClick={() => handleReportAndPrint(false)}
            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold px-2 py-1 rounded text-[10px] shrink-0 transition-colors"
          >
            <MdRefresh size={12} /> Retry
          </button>
        </div>
      )}
    </div>
  );
}

