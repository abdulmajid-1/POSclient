import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const formatSAR = (n) => `SAR ${Number(n || 0).toLocaleString('en-SA')}`;

/**
 * PUBLIC Receipt Page — accessible without login.
 * 
 * SECURITY NOTES:
 * - This page fetches from /api/public/receipt/:id (rate-limited, sanitized)
 * - No auth tokens are sent — uses a separate axios instance
 * - No internal app state (AuthContext, etc.) is accessed
 * - No links to internal dashboard pages
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
    const apiBase = import.meta.env.VITE_API_URL || 'https://posserver-4t0u.onrender.com/api';
    fetch(`${apiBase}/public/receipt/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // SECURITY: Never send credentials to public endpoints
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
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${receipt.invoiceNumber}.pdf`);
    } catch {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Loading receipt...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────────────────
  if (error || !receipt) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: 24,
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 24,
          padding: '48px 32px',
          maxWidth: 400,
        }}>
          <div style={{
            width: 72, height: 72,
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 32,
          }}>🔒</div>
          <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Receipt Not Found</h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            This receipt doesn't exist or the link has expired. Please contact the store if you need assistance.
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // RECEIPT VIEW
  // ──────────────────────────────────────────────────────────────────────
  const itemDiscountSum = receipt.items.reduce((acc, item) => {
    const base = item.unitPrice * item.quantity;
    const d = item.discountType === 'percentage' ? (base * item.discount) / 100 : item.discount;
    return acc + (Number(d) || 0);
  }, 0);
  const totalDiscountGiven = itemDiscountSum + (Number(receipt.discount) || 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: '24px 16px',
    }}>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Download Button — Fixed at bottom on mobile */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        background: 'linear-gradient(to top, #0f172a 60%, transparent)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '16px 32px',
            background: downloading
              ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 800,
            cursor: downloading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: downloading ? 'none' : '0 8px 32px rgba(16,185,129,0.3)',
            transition: 'all 0.3s ease',
            letterSpacing: '0.02em',
          }}
        >
          {downloading ? (
            <>
              <span style={{
                width: 20, height: 20,
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                display: 'inline-block',
              }} />
              Generating PDF...
            </>
          ) : (
            <>
              📥 Download PDF Receipt
            </>
          )}
        </button>
      </div>

      {/* Receipt Card */}
      <div style={{
        maxWidth: 520,
        margin: '0 auto',
        paddingBottom: 100,
      }}>
        {/* Header Badge */}
        <div style={{
          textAlign: 'center',
          marginBottom: 20,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 100,
            padding: '8px 20px',
          }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <span style={{
              color: '#10b981',
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>Digital Receipt</span>
          </div>
        </div>

        {/* Main Receipt */}
        <div
          ref={receiptRef}
          style={{
            background: '#ffffff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Company Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '28px 24px 24px',
            textAlign: 'center',
          }}>
            <h1 style={{
              color: '#f8fafc',
              fontSize: 17,
              fontWeight: 800,
              margin: '0 0 2px',
              letterSpacing: '-0.01em',
            }}>Ewan Al-Hazm Trading Est.</h1>
            <p style={{
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 700,
              margin: '0 0 6px',
              direction: 'rtl',
            }}>مؤسسة ايوان الحزم التجارية</p>
            <p style={{
              color: '#475569',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 12px',
            }}>Hand Tools • Equipment • Safety • Workshop Supplies</p>

            <div style={{
              display: 'inline-block',
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12,
              padding: '8px 20px',
            }}>
              <p style={{ color: '#10b981', fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>
                TAX INVOICE
              </p>
              <p style={{ color: '#64748b', fontSize: 10, margin: '2px 0 0', fontWeight: 600 }}>
                VAT No: 313147090700003
              </p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: '#e2e8f0',
          }}>
            {[
              { label: 'Invoice No / رقم الفاتورة', value: receipt.invoiceNumber },
              { label: 'Date / التاريخ', value: new Date(receipt.createdAt).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' }) },
              { label: 'Customer / العميل', value: receipt.customer?.name || 'Walk-in Customer' },
              { label: 'Payment / الدفع', value: receipt.paymentMethod === 'cash' ? '💵 Cash' : receipt.paymentMethod === 'card' ? '💳 Card' : '🏦 Bank' },
            ].map((m, i) => (
              <div key={i} style={{
                background: '#fff',
                padding: '12px 16px',
              }}>
                <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                  {m.label}
                </p>
                <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <div style={{ padding: '20px 16px 0' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Price</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 6px', color: '#1e293b', fontWeight: 600, maxWidth: 160 }}>
                      {item.productName}
                      {item.discount > 0 && (
                        <span style={{ display: 'block', color: '#ef4444', fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                          Disc: {item.discountType === 'percentage' ? `${item.discount}%` : formatSAR(item.discount)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                      {item.quantity}
                      {item.selectedUnit && <span style={{ display: 'block', color: '#94a3b8', fontSize: 9 }}>{item.selectedUnit}</span>}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#475569', fontWeight: 500 }}>
                      {formatSAR(item.unitPrice)}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#1e293b', fontWeight: 700 }}>
                      {formatSAR(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Subtotal / المجموع</span>
                <span style={{ color: '#1e293b', fontSize: 12, fontWeight: 600 }}>{formatSAR(receipt.subtotal)}</span>
              </div>

              {receipt.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>Discount / الخصم</span>
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>- {formatSAR(receipt.discount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>VAT ({receipt.taxRate}%) / الضريبة</span>
                <span style={{ color: '#1e293b', fontSize: 12, fontWeight: 600 }}>{formatSAR(receipt.tax)}</span>
              </div>

              {totalDiscountGiven > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>Total Discount / إجمالي الخصم</span>
                  <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>- {formatSAR(totalDiscountGiven)}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '2px solid #e2e8f0',
                marginTop: 4,
              }}>
                <span style={{ color: '#0f172a', fontSize: 15, fontWeight: 800 }}>Grand Total / الإجمالي</span>
                <span style={{ color: '#059669', fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>{formatSAR(receipt.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 16px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 16,
            }}>
              <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, margin: '0 0 2px' }}>
                AB Traders — Powered POS System
              </p>
              <p style={{ color: '#cbd5e1', fontSize: 10, fontWeight: 500, margin: 0 }}>
                Thank you for your business / شكراً لتعاملكم معنا
              </p>
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          padding: '0 16px',
        }}>
          <p style={{ color: '#475569', fontSize: 10, fontWeight: 500, lineHeight: 1.5 }}>
            🔒 This is a verified digital receipt from Ewan Al-Hazm Trading Est.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
