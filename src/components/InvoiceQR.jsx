import ZatcaReceiptQR from './ZatcaReceiptQR';

/**
 * QR Code footer component for invoice templates.
 * Renders the ZATCA Phase 2 E-Invoice QR Code.
 * Public URL receipt QR code has been removed per ZATCA compliance requirements.
 *
 * @param {{ qrCode?: string }} props
 */
export function InvoiceQRFooter({ qrCode }) {
  if (!qrCode) return null;
  return <ZatcaReceiptQR qrCode={qrCode} />;
}

export default InvoiceQRFooter;
