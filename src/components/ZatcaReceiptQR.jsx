import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * Renders the ZATCA Phase 2 E-Invoice QR Code from base64 TLV payload.
 *
 * @param {{ qrCode: string }} props
 */
export default function ZatcaReceiptQR({ qrCode }) {
  const [qrImageUrl, setQrImageUrl] = useState(null);

  useEffect(() => {
    if (!qrCode) {
      setQrImageUrl(null);
      return;
    }

    // Convert ZATCA base64 payload to high-res QR code image (300px for sharp scanning)
    QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrImageUrl(url))
      .catch((err) => console.error('ZATCA QR Generation error:', err));
  }, [qrCode]);

  if (!qrCode || !qrImageUrl) return null;

  return (
    <div className="flex flex-col items-center justify-center border-t border-slate-200 mt-6 pt-4 text-center">
      <img
        src={qrImageUrl}
        alt="ZATCA Phase 2 QR Code"
        className="w-36 h-36 object-contain rounded border border-slate-100 p-1 shadow-sm"
      />
      <p className="text-[10px] font-black text-slate-700 mt-1 uppercase tracking-wider">
        ZATCA Phase 2 E-Invoice
      </p>
      <p className="text-[9px] font-medium text-slate-500">
        فاتورة إلكترونية مفلترة — هيئة الزكاة والضريبة والجمارك
      </p>
    </div>
  );
}
