import { useState, useEffect, useCallback, useRef } from 'react';
import { getReturns, createReturn, reportReturnToZatca } from '../services/returnService';
import { getSales } from '../services/saleService';
import ZatcaReturnReportButton from '../components/ZatcaReturnReportButton';

import {
  MdAdd,
  MdSearch,
  MdClose,
  MdKeyboardReturn,
  MdVisibility,
  MdPrint,
  MdOutlineQrCodeScanner,
  MdVerified,
} from 'react-icons/md';

import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

/* =========================================================
   RETURN REPORT MODAL
========================================================= */
function ReturnReportModal({ data, onClose, onUpdated }) {
  const [returnData, setReturnData] = useState(data);
  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Return-${returnData.returnNumber}`,
  });

  const handleReturnUpdated = (updated) => {
    setReturnData(updated);
    if (onUpdated) onUpdated(updated);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="modal-box max-w-4xl">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">

          <h2 className="text-lg font-bold">
            Return Report
          </h2>

          <div className="flex items-center gap-3">

            <ZatcaReturnReportButton
              returnData={returnData}
              onReturnUpdated={handleReturnUpdated}
              onTriggerPrint={handlePrint}
            />

            <button
              onClick={handlePrint}
              className="btn-primary"
            >
              <MdPrint size={18} />
              Print
            </button>

            <button onClick={onClose}>
              <MdClose size={20} />
            </button>

          </div>

        </div>

        {/* REPORT */}
        <div
          ref={reportRef}
          className="p-6 bg-white text-slate-800"
        >

          <div className="mb-6">

            <h1 className="text-2xl font-bold">
              RETURN REPORT
            </h1>

            <div className="mt-3 text-sm space-y-1">

              <p>
                <span className="font-semibold">
                  Return Number:
                </span>{' '}
                {data.returnNumber}
              </p>

              <p>
                <span className="font-semibold">
                  Invoice Number:
                </span>{' '}
                {data.invoiceNumber}
              </p>

              <p>
                <span className="font-semibold">
                  Date:
                </span>{' '}
                {new Date(
                  data.createdAt
                ).toLocaleString('en-SA')}
              </p>

              <p>
                <span className="font-semibold">
                  Reason:
                </span>{' '}
                {data.reason}
              </p>

              <p>
                <span className="font-semibold">
                  Status:
                </span>{' '}
                {data.status}
              </p>

            </div>

          </div>

          {/* ITEMS TABLE */}
          <div className="overflow-x-auto">

            <table className="w-full border border-slate-200">

              <thead className="bg-slate-100">

                <tr>

                  <th className="text-left p-3 border-b">
                    Product
                  </th>

                  <th className="text-left p-3 border-b">
                    Qty Returned
                  </th>

                  <th className="text-left p-3 border-b">
                    Unit Price
                  </th>

                  <th className="text-left p-3 border-b">
                    Refund
                  </th>

                </tr>

              </thead>

              <tbody>

                {data.items.map((item, idx) => (
                  <tr key={idx}>

                    <td className="p-3 border-b">
                      {item.productName} {item.selectedUnit ? `(${item.selectedUnit})` : ''}
                    </td>

                    <td className="p-3 border-b">
                      {item.returnQuantity ||
                        item.quantity}
                    </td>

                    <td className="p-3 border-b">
                      SAR{' '}
                      {Number(
                        item.unitPrice
                      ).toLocaleString('en-SA')}
                    </td>

                    <td className="p-3 border-b font-semibold text-red-500">
                      SAR{' '}
                      {Number(
                        item.totalRefund
                      ).toLocaleString('en-SA')}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* TOTAL */}
          <div className="mt-6 flex justify-end">

            <div className="text-right">

              <p className="text-lg font-bold text-red-500">
                Total Refund: SAR{' '}
                {Number(
                  data.totalRefund
                ).toLocaleString('en-SA')}
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   RETURN MODAL
========================================================= */
function ReturnModal({ onClose, onSaved }) {
  const [invoiceNum, setInvoiceNum] = useState('');
  const [sale, setSale] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [searching, setSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  /* FETCH RECENT 10 SALES ON MOUNT */
  useEffect(() => {
    let isMounted = true;
    getSales({ limit: 10, page: 1 })
      .then(({ data }) => {
        if (isMounted) {
          setRecentSales(data.sales || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingRecent(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  /* SELECT A SALE */
  const handleSelectSale = (targetSale) => {
    setSale(targetSale);
    setInvoiceNum(targetSale.invoiceNumber);
    setSelectedItems(
      targetSale.items.map((item) => ({
        productId: item.product,
        productName: `${item.productName} ${item.selectedUnit ? `(${item.selectedUnit})` : ''}`,
        unitPrice: item.unitPrice,
        maxQty: item.quantity - (item.returnedQuantity || 0),
        quantity: 0,
        returnedQuantity: item.returnedQuantity || 0,
        originalQuantity: item.quantity,
        purchasePrice: item.purchasePrice,
        profit: item.profit,
        isCustomItem: item.isCustomItem,
      }))
    );
  };

  /* SEARCH SALE */
  const searchSale = async () => {
    if (!invoiceNum) return;

    setSearching(true);

    try {
      const { data } = await getSales({
        search: invoiceNum,
      });

      const found = data.sales[0];

      if (!found) {
        toast.error('Invoice not found');
        return;
      }

      handleSelectSale(found);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const isZatcaReported = !!(sale?.zatca && (sale.zatca.reportingStatus === 'REPORTED' || sale.zatca.reportingStatus === 'CLEARED'));

  /* SUBMIT */
  const handleSubmit = async (e, shouldReportZatca = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const itemsToReturn = selectedItems.filter(
      (i) => i.quantity > 0
    );

    if (!itemsToReturn.length) {
      return toast.error(
        'Select items to return'
      );
    }

    if (!reason) {
      return toast.error(
        'Provide a reason'
      );
    }

    setLoading(true);

    try {
      const { data: resData } = await createReturn({
        saleId: sale._id,
        items: itemsToReturn,
        reason,
      });

      const createdReturn = resData.return;

      if (shouldReportZatca && createdReturn?._id) {
        toast.loading('Submitting Credit Note to ZATCA...', { id: 'zatca-ret-submit' });
        try {
          const zatcaRes = await reportReturnToZatca(createdReturn._id);
          const updatedReturn = zatcaRes.data?.data;
          const errorList = updatedReturn?.zatca?.validationResults?.errorMessages;

          if (errorList && errorList.length > 0) {
            toast.error(`Return created, but ZATCA warning: ${errorList[0].message || errorList[0].code}`, { id: 'zatca-ret-submit' });
          } else {
            toast.success('Return processed & Credit Note reported to ZATCA!', { id: 'zatca-ret-submit' });
          }
        } catch (zatcaErr) {
          toast.error(`Return created, but ZATCA reporting failed: ${zatcaErr.response?.data?.message || zatcaErr.message}`, { id: 'zatca-ret-submit' });
        }
      } else {
        toast.success('Return processed');
      }

      onSaved();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="modal-box max-w-3xl w-full">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">

          <h2 className="text-lg font-bold text-slate-800">
            Process Return
          </h2>

          <button onClick={onClose}>
            <MdClose size={20} />
          </button>

        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">

          {/* SEARCH */}
          <div className="flex gap-2">

            <input
              value={invoiceNum}
              onChange={(e) =>
                setInvoiceNum(e.target.value)
              }
              placeholder="Enter or search invoice number..."
              className="input flex-1 font-mono"
              onKeyDown={(e) =>
                e.key === 'Enter' && searchSale()
              }
            />

            <button
              onClick={searchSale}
              disabled={searching}
              className="btn-primary shrink-0"
            >
              {searching
                ? 'Searching...'
                : 'Find'}
            </button>

          </div>

          {/* RECENT SALES SELECTION LIST (Show when no sale is selected) */}
          {!sale && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Or select from Latest 10 Sales
                </h3>
              </div>

              {loadingRecent ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentSales.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No recent sales found
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {recentSales.map((s) => {
                    const isZatca = !!(s.zatca && (s.zatca.reportingStatus === 'REPORTED' || s.zatca.reportingStatus === 'CLEARED'));
                    return (
                      <div
                        key={s._id}
                        onClick={() => handleSelectSale(s)}
                        className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-300 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="badge-blue font-mono text-xs group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            {s.invoiceNumber}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {s.customer?.name || 'Walk-in Customer'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(s.createdAt).toLocaleString('en-SA')} • {s.items?.length || 0} items
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 text-sm">
                            SAR {Number(s.total || 0).toLocaleString()}
                          </span>
                          {isZatca ? (
                            <span className="badge-green text-[10px] flex items-center gap-1">
                              <MdVerified size={12} /> ZATCA
                            </span>
                          ) : (
                            <span className="badge-gray text-[10px]">Non-ZATCA</span>
                          )}
                          <button
                            type="button"
                            className="btn-primary text-xs py-1 px-3 shadow-none"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SELECTED SALE FORM */}
          {sale && (
            <form
              onSubmit={(e) => handleSubmit(e, false)}
              className="space-y-4"
            >

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSale(null)}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    ← Change Sale
                  </button>
                  <span className="text-slate-300">|</span>
                  <p className="text-sm text-slate-500">
                    Invoice:{' '}
                    <span className="font-semibold text-slate-700 font-mono">
                      {sale.invoiceNumber}
                    </span>{' '}
                    • Customer:{' '}
                    <span className="font-semibold text-slate-700">{sale.customer?.name}</span>
                  </p>
                </div>
                {isZatcaReported ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <MdVerified size={14} className="text-emerald-600" />
                    ZATCA Reported
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Non-ZATCA
                  </span>
                )}
              </div>

              {/* ITEMS */}
              <div className="space-y-2">

                {selectedItems.map((item, i) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >

                    <div className="flex-1">

                      <p className="text-sm font-medium">
                        {item.productName}
                      </p>

                      <p className="text-xs text-slate-400">
                        Purchased:{' '}
                        {item.originalQuantity}{' '}
                        • Returned:{' '}
                        {item.returnedQuantity}{' '}
                        • Remaining:{' '}
                        {item.maxQty}
                      </p>

                    </div>

                    <input
                      type="number"
                      min={0}
                      max={item.maxQty}
                      value={item.quantity}
                      onChange={(e) =>
                        setSelectedItems(
                          (prev) =>
                            prev.map(
                              (it, idx) =>
                                idx === i
                                  ? {
                                    ...it,
                                    quantity:
                                      parseInt(
                                        e.target
                                          .value
                                      ) || 0,
                                  }
                                  : it
                            )
                        )
                      }
                      className="input w-20 text-center"
                    />

                  </div>
                ))}

              </div>

              {/* REASON */}
              <div>

                <label className="label">
                  Reason for Return *
                </label>

                <textarea
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  className="input resize-none"
                  rows={2}
                  required
                />

              </div>

              {/* REFUND */}
              <div className="text-sm font-medium text-right text-primary-600 bg-primary-50 p-3 rounded-lg border border-primary-100">
                <p className="text-[10px] uppercase font-bold text-primary-400">Total Refund (Inc. 15% Tax)</p>
                <p className="text-lg font-black">
                  SAR{' '}
                  {(
                    selectedItems.reduce(
                      (s, i) => s + i.quantity * i.unitPrice,
                      0
                    ) * 1.15
                  ).toLocaleString()}
                </p>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                {isZatcaReported ? (
                  <>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => handleSubmit(e, false)}
                      className="btn-secondary flex-1"
                    >
                      {loading ? 'Processing...' : 'Process Return Only'}
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => handleSubmit(e, true)}
                      className="btn-danger flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-bold"
                    >
                      <MdOutlineQrCodeScanner size={18} />
                      {loading ? 'Processing & Submitting...' : 'Process & Report Credit Note'}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-danger flex-1"
                  >
                    {loading ? 'Processing...' : 'Process Return'}
                  </button>
                )}

              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */
export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);

  const [filteredReturns, setFilteredReturns] =
    useState([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [selectedReturn, setSelectedReturn] =
    useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  /* FETCH */
  const fetch = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getReturns({ page, limit });

      setReturns(data.returns || []);
      setFilteredReturns(data.returns || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
    } catch {
      toast.error(
        'Failed to load returns'
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /* SEARCH FILTER */
  useEffect(() => {
    if (!search.trim()) {
      setFilteredReturns(returns);
      return;
    }

    const q = search.toLowerCase();

    setFilteredReturns(
      returns.filter((r) =>
        r.invoiceNumber
          ?.toLowerCase()
          .includes(q)
      )
    );
  }, [search, returns]);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Returns
          </h1>

          <p className="text-slate-500 text-sm">
            {filteredReturns.length}{' '}
            return records
          </p>

        </div>

        <button
          onClick={() =>
            setShowModal(true)
          }
          className="btn-danger"
        >
          <MdAdd size={18} />
          New Return
        </button>

      </div>

      {/* SEARCH */}
      <div className="card p-4">

        <div className="relative">

          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by invoice number..."
            className="input pl-9"
          />

        </div>

      </div>

      {/* TABLE */}
      <div className="card p-0">

        {loading ? (
          <div className="flex justify-center items-center h-48">

            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />

          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">

            <MdKeyboardReturn
              size={48}
              className="opacity-30 mb-3"
            />

            <p>No returns found</p>

          </div>
        ) : (
          <div className="table-wrapper">

            <table className="table">

              <thead>

                <tr>
                  <th>Return #</th>
                  <th>Invoice</th>
                  <th>Items</th>
                  <th>Refund Amount</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>ZATCA</th>
                  <th>Report</th>
                </tr>

              </thead>

              <tbody>

                {filteredReturns.map((r) => (
                  <tr key={r._id}>

                    <td>
                      <span className="badge-red font-mono">
                        {r.returnNumber}
                      </span>
                    </td>

                    <td className="text-primary-600 font-medium">
                      {r.invoiceNumber}
                    </td>

                    <td>
                      {r.items.reduce(
                        (s, i) =>
                          s +
                          (i.returnQuantity ||
                            i.quantity),
                        0
                      )}{' '}
                      items
                    </td>

                    <td className="font-semibold text-red-500">
                      SAR{' '}
                      {Number(
                        r.totalRefund
                      ).toLocaleString()}
                    </td>

                    <td className="text-slate-500 text-xs max-w-xs truncate">
                      {r.reason}
                    </td>

                    <td className="text-slate-400 text-xs">
                      {new Date(
                        r.createdAt
                      ).toLocaleDateString(
                        'en-SA'
                      )}
                    </td>

                    <td>
                      <span className="badge-green capitalize">
                        {r.status}
                      </span>
                    </td>

                    <td>
                      {!r.wasZatcaReported ? (
                        <span className="badge-gray text-[10px]">Non-ZATCA</span>
                      ) : r.zatca?.reportingStatus === 'REPORTED' || r.zatca?.reportingStatus === 'CLEARED' ? (
                        <span className="badge-green text-[10px]">CN Reported</span>
                      ) : r.zatca?.reportingStatus === 'FAILED' ? (
                        <span className="badge-red text-[10px]">CN Failed</span>
                      ) : (
                        <span className="badge-yellow text-[10px]">CN Pending</span>
                      )}
                    </td>

                    <td>

                      <button
                        onClick={() =>
                          setSelectedReturn(r)
                        }
                        className="p-2 rounded-lg hover:bg-primary-50 text-primary-600"
                      >
                        <MdVisibility size={18} />
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between card p-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary text-xs text-black font-bold disabled:opacity-50"
          >
            Previous
          </button>
          <div className="text-sm font-bold text-slate-600">
            Page {page} of {totalPages}
          </div>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary text-xs text-black font-bold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* RETURN MODAL */}
      {showModal && (
        <ReturnModal
          onClose={() =>
            setShowModal(false)
          }
          onSaved={() => {
            setShowModal(false);
            fetch();
          }}
        />
      )}

      {/* REPORT MODAL */}
      {selectedReturn && (
        <ReturnReportModal
          data={selectedReturn}
          onClose={() =>
            setSelectedReturn(null)
          }
          onUpdated={() => {
            fetch();
          }}
        />
      )}

    </div>
  );
}