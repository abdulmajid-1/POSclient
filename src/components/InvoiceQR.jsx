import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * Generates a QR code image for a given sale ID.
 * The QR encodes a URL to the public receipt page.
 * 
 * SECURITY NOTES:
 * - Only the sale._id is embedded in the QR URL — no tokens, no auth data
 * - The receipt page uses a separate public endpoint with sanitized data
 * - QR is generated client-side (no server round-trip needed)
 * 
 * @param {string|null} saleId - The MongoDB _id of the sale. If null, no QR is generated.
 * @returns {{ qrDataUrl: string|null, loading: boolean }}
 */
export function useReceiptQR(saleId) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!saleId) {
      setQrDataUrl(null);
      return;
    }

    setLoading(true);
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const receiptUrl = `${baseUrl}/receipt/${saleId}`;

    QRCode.toDataURL(receiptUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation failed:', err))
      .finally(() => setLoading(false));
  }, [saleId]);

  return { qrDataUrl, loading };
}

/**
 * QR Code footer component for invoice templates.
 * Only renders when a valid saleId (from DB) is provided.
 * 
 * @param {{ saleId: string|null }} props
 */
export function InvoiceQRFooter({ saleId }) {
  const { qrDataUrl } = useReceiptQR(saleId);

  if (!saleId || !qrDataUrl) return null;

  return (
    <div className="flex items-center justify-between border-t mt-6 pt-4">
      <div className="flex-1">
        <p className="text-[10px] text-slate-400">AB Traders — Powered POS System</p>
        <p className="text-[10px] text-slate-400">Thank you for your business / شكراً لتعاملكم معنا</p>
        <p className="text-[9px] text-slate-300 mt-1">Scan QR code for digital receipt / امسح رمز QR للفاتورة الرقمية</p>
      </div>
      <div className="flex flex-col items-center">
        <img
          src={qrDataUrl}
          alt="Receipt QR Code"
          style={{ width: 90, height: 90 }}
          className="rounded"
        />
        <p className="text-[8px] text-slate-300 mt-1">Digital Receipt</p>
      </div>
    </div>
  );
}
