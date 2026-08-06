import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ZatcaReceiptQR from '../components/ZatcaReceiptQR';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

const paymentMethodLabel = (method) => {
  const labels = {
    cash: 'Cash / نقداً',
    card: 'Credit Card / بطاقة ائتمان',
    bank_transfer: 'Bank Transfer / تحويل بنكي',
    other: 'Other / أخرى',
  };
  return labels[method] || method || 'Cash / نقداً';
};

/**
 * PUBLIC Receipt Page — accessible without login.
 * Renders the EXACT same invoice structure, layout, and bilingual formatting as SalesPage.jsx.
 * Guarantees zero truncation on PDF download across all device screen sizes.
 */
export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef();

  useEffect(() => {
    // SECURITY: Direct fetch — no auth interceptors, no tokens
    const apiBase = import.meta.env.VITE_API_URL || 'https://posserver-production-4b29.up.railway.app/api';
    fetch(`${apiBase}/public/receipt/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
    })
      .then((res) => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.receipt) {
          setReceipt(data.receipt);
        } else {
          setError('not_found');
        }
      })
      .catch(() => setError('not_found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);

    try {
      // Capture canvas with html2canvas using onclone to force 800px full desktop layout
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const area = clonedDoc.getElementById('receipt-capture-area');
          if (area) {
            area.style.width = '800px';
            area.style.maxWidth = 'none';
            area.style.margin = '0 auto';
            area.style.padding = '32px';
            area.style.boxShadow = 'none';
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages if receipt height exceeds 1 A4 page height
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${receipt.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-semibold">Loading Tax Invoice...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────────────────
  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white font-sans">
        <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">🔒</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Invoice Not Found</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            This invoice does not exist or the link is invalid. Please contact the merchant for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Calculate discounts
  const itemDiscSum = receipt.items.reduce((acc, item) => {
    const base = item.unitPrice * item.quantity;
    const d = item.discountType === 'percentage' ? (base * item.discount) / 100 : item.discount;
    return acc + (Number(d) || 0);
  }, 0);
  const totalDisc = itemDiscSum + (Number(receipt.discount) || 0);

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-2 sm:px-4 font-sans text-slate-800">
      {/* CSS for Native Print */}
      <style>{`
        @media print {
          body { background: #ffffff !important; color: #000000 !important; }
          .no-print { display: none !important; }
          #receipt-capture-area {
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md z-50 flex justify-center gap-3 border-t border-slate-800 no-print">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 max-w-sm py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </>
          )}
        </button>

        <button
          onClick={handleNativePrint}
          className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Main Outer Container */}
      <div className="max-w-4xl mx-auto pb-24 overflow-x-auto">
        {/* Printable/Capturable Invoice Card — EXACT MATCH TO SalesPage.jsx */}
        <div
          ref={receiptRef}
          id="receipt-capture-area"
          className="print-container bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-sm text-slate-800 min-w-[700px] sm:min-w-0"
        >
          {/* ================= TITLE ================= */}
          <div className="grid grid-cols-3 items-center mb-6 w-full px-2">
            {/* LEFT SIDE (English) */}
            <div className="text-left">
              <h1 className="text-base font-bold leading-tight">
                Ewan Al-Hazm Trading Est.
              </h1>
              <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5">
                Hand Tools - Equipment - Safety - Workshop Supplies
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Address: As Saadah, OAJA4419, Al-Kharj 16443, Saudi Arabia
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Mobile: 059 571 7520
              </p>
            </div>

            {/* CENTER TITLE */}
            <div className="text-center px-1">
              <h1 className="text-xl font-bold leading-tight">
                TAX INVOICE
              </h1>
              <p className="text-slate-500 text-xs">
                فاتورة ضريبية
              </p>
              <p className="text-[10px] text-slate-500">
                VAT No: 314852932200003
              </p>
            </div>

            {/* RIGHT SIDE (Arabic) */}
            <div className="text-right">
              <h1 className="text-base font-bold leading-tight">
                مؤسسة ايوان الحزم التجارية
              </h1>
              <p className="text-[9px] font-semibold text-slate-600 mb-0.5 leading-tight">
                عدد يدوية - معدات - سلامة - لوازم ورش
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                العنوان: السعادة، الخرج، السعودية
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                الجوال: ٠٥٩٥٧١٧٥٢٠
              </p>
            </div>
          </div>

          {/* ================= FROM / TO ================= */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="p-4 border rounded-lg">
              <p className="font-bold mb-2">From / من</p>
              <p className="font-semibold">Ewan Al-Hazm Trading Establishment</p>
              <p className="text-xs text-slate-400">مؤسسة ايوان الحزم التجارية</p>
              <p className="text-xs text-slate-400">VAT / ضريبة: 314852932200003</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="font-bold mb-2">To / إلى</p>
              <p className="font-semibold">Customer / العميل: {receipt.customer?.name || 'Walk-in Customer'}</p>
              {receipt.customer?.phone && <p className="text-slate-500">Mobile / الجوال: {receipt.customer.phone}</p>}
              {receipt.customer?.vatNumber && <p className="text-slate-500">VAT / ضريبة: {receipt.customer.vatNumber}</p>}
              <p className="text-slate-500">Payment / طريقة الدفع: <span className="font-bold text-slate-800">{paymentMethodLabel(receipt.paymentMethod)}</span></p>
            </div>
          </div>

          {/* ================= META ================= */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
            <div className="border p-3 rounded">
              <p className="text-slate-500">Invoice No / رقم</p>
              <p className="font-semibold">{receipt.invoiceNumber}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-slate-500">Date / التاريخ</p>
              <p className="font-semibold">{new Date(receipt.createdAt).toLocaleString()}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-slate-500">Currency / العملة</p>
              <p className="font-semibold">SAR / ريال</p>
            </div>
          </div>

          {/* ================= TABLE ================= */}
          <table className="w-full border text-[11px] mb-6 table-fixed">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-1 w-[4%] text-left">No / رقم</th>
                <th className="p-1 w-[28%] text-left">Product / المنتج</th>
                <th className="p-1 w-[8%] text-center">Unit / الوحدة</th>
                <th className="p-1 w-[10%] text-center">Unit Price / سعر الوحدة</th>
                <th className="p-1 w-[6%] text-center">Qty / الكمية</th>
                <th className="p-1 w-[8%] text-center">Disc / خصم</th>
                <th className="p-1 w-[10%] text-center">Subtotal / الإجمالي</th>
                <th className="p-1 w-[6%] text-center">VAT %</th>
                <th className="p-1 w-[10%] text-center">VAT Amt</th>
                <th className="p-1 w-[10%] text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => {
                const vatAmt = (item.totalPrice * (receipt.taxRate || 0)) / 100;
                const itemTotalWithVat = item.totalPrice + vatAmt;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-1 text-center">{i + 1}</td>
                    <td className="p-1 text-left whitespace-normal break-words">{item.productName}</td>
                    <td className="p-1 text-center font-bold text-slate-600">{item.selectedUnit || 'Unit'}</td>
                    <td className="p-1 text-center">{formatSAR(item.unitPrice)}</td>
                    <td className="p-1 text-center">{item.quantity}</td>
                    <td className="p-1 text-center text-red-500">
                      {item.discount > 0
                        ? (item.discountType === 'percentage'
                          ? `${item.discount}%`
                          : formatSAR(item.discount))
                        : '-'}
                    </td>
                    <td className="p-1 text-center">{formatSAR(item.totalPrice)}</td>
                    <td className="p-1 text-center">{receipt.taxRate || 0}%</td>
                    <td className="p-1 text-center">{formatSAR(vatAmt)}</td>
                    <td className="p-1 text-center font-semibold">{formatSAR(itemTotalWithVat)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ================= SUMMARY ================= */}
          <div className="flex justify-end mb-6">
            <div className="w-80 border rounded p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Subtotal / المجموع</span>
                <span>{formatSAR(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total / الإجمالي</span>
                <span className="text-primary-600">{formatSAR(receipt.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>VAT / الضريبة</span>
                <span>{formatSAR(receipt.tax)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount on Subtotal Bill / خصم الفاتورة الفرعي</span>
                  <span>- {formatSAR(receipt.discount)}</span>
                </div>
              )}
              {totalDisc > 0 && (
                <div className="flex justify-between text-red-600 font-bold border-t border-dashed pt-2 mt-2">
                  <span>Total Discount Given / إجمالي الخصم</span>
                  <span>- {formatSAR(totalDisc)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ZATCA Phase 2 QR Code */}
          <ZatcaReceiptQR qrCode={receipt.zatca?.qrCode} />

          {/* ================= FOOTER ================= */}
          <div className="text-center text-[10px] text-slate-400 border-t pt-4">
            <p>AB Traders — Powered POS System</p>
            <p>Thank you for your business / شكراً لتعاملكم معنا</p>
          </div>
        </div>
      </div>
    </div>
  );
}
