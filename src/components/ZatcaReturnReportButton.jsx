import { useState } from 'react';
import { reportReturnToZatca } from '../services/returnService';
import { MdOutlineQrCodeScanner, MdCheckCircle, MdError, MdRefresh, MdVerified } from 'react-icons/md';

/**
 * ZATCA Return Report & Status Component (Credit Note)
 *
 * @param {{
 *   returnData: object,
 *   onReturnUpdated: function,
 *   onTriggerPrint: function
 * }} props
 */
export default function ZatcaReturnReportButton({ returnData, onReturnUpdated, onTriggerPrint }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!returnData?.wasZatcaReported) {
    return null; // Not a ZATCA sale return — no Credit Note needed
  }

  const reportingStatus = returnData?.zatca?.reportingStatus;
  const hasVat = returnData?.customer?.vatNumber && String(returnData.customer.vatNumber).trim().length > 0;
  const invoiceType = returnData?.zatca?.invoiceType || (hasVat ? 'B2B' : 'B2C');
  const isProcessed = reportingStatus === 'REPORTED' || reportingStatus === 'CLEARED';

  const handleReportAndPrint = async (shouldPrint = true) => {
    if (!returnData?._id) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await reportReturnToZatca(returnData._id);
      if (res.data?.success && res.data?.data) {
        const updatedReturn = res.data.data;
        if (onReturnUpdated) {
          onReturnUpdated(updatedReturn);
        }

        const newStatus = updatedReturn.zatca?.reportingStatus;
        const errorList = updatedReturn.zatca?.validationResults?.errorMessages;

        if (errorList && errorList.length > 0) {
          setErrorMsg(errorList.map((e) => e.message || e.code).join(' | '));
        } else {
          const msg =
            newStatus === 'CLEARED'
              ? 'Credit Note successfully cleared with ZATCA (B2B Clearance)'
              : 'Credit Note successfully reported to ZATCA (B2C Reporting)';
          setSuccessMsg(msg);

          if (shouldPrint && onTriggerPrint) {
            setTimeout(() => onTriggerPrint(), 400);
          }
        }
      } else {
        setErrorMsg('Failed to process Credit Note ZATCA reporting.');
      }
    } catch (err) {
      console.error('ZATCA Credit Note Error:', err);
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
              ZATCA CN {reportingStatus === 'CLEARED' ? 'B2B Cleared (مفلترة)' : 'B2C Reported (مبلغة)'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => handleReportAndPrint(true)}
            disabled={loading}
            className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-xl text-xs font-black hover:from-amber-700 hover:to-red-700 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting CN to ZATCA...</span>
              </>
            ) : (
              <>
                <MdOutlineQrCodeScanner size={16} />
                <span>Report Credit Note ({invoiceType})</span>
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
            <span className="font-bold block">ZATCA CN Warning/Error:</span>
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
