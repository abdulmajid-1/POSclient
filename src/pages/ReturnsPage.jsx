import { useState, useEffect, useCallback, useRef } from 'react';
import { getReturns, createReturn } from '../services/returnService';
import { getSales } from '../services/saleService';

import {
  MdAdd,
  MdSearch,
  MdClose,
  MdKeyboardReturn,
  MdVisibility,
  MdPrint,
} from 'react-icons/md';

import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

/* =========================================================
   RETURN REPORT MODAL
========================================================= */
function ReturnReportModal({ data, onClose }) {
  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Return-${data.returnNumber}`,
  });

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

          <div className="flex items-center gap-2">

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
                      {item.productName}
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

  const [searching, setSearching] = useState(false);

  const [selectedItems, setSelectedItems] =
    useState([]);

  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);

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

      setSale(found);

      setSelectedItems(
        found.items.map((item) => ({
          productId: item.product,
          productName: item.productName,
          unitPrice: item.unitPrice,
          maxQty:
            item.quantity -
            (item.returnedQuantity || 0),
          quantity: 0,
          returnedQuantity:
            item.returnedQuantity || 0,
          originalQuantity: item.quantity,
        }))
      );
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      await createReturn({
        saleId: sale._id,
        items: itemsToReturn,
        reason,
      });

      toast.success('Return processed');

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
      <div className="modal-box">

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
              placeholder="Enter invoice number..."
              className="input flex-1"
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

          {/* SALE */}
          {sale && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <p className="text-sm text-slate-500">
                Invoice:{' '}
                <span className="font-semibold text-slate-700">
                  {sale.invoiceNumber}
                </span>{' '}
                • Customer:{' '}
                {sale.customer?.name}
              </p>

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
              <div className="text-sm font-medium text-right text-primary-600">

                Refund: SAR{' '}
                {selectedItems
                  .reduce(
                    (s, i) =>
                      s +
                      i.quantity * i.unitPrice,
                    0
                  )
                  .toLocaleString()}

              </div>

              {/* BUTTONS */}
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-danger flex-1"
                >
                  {loading
                    ? 'Processing...'
                    : 'Process Return'}
                </button>

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
        />
      )}

    </div>
  );
}