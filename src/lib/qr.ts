import QRCode from 'qrcode';

export async function generateTableQR(hotelSlug: string, tableId: string) {
  // The URL the customer scans
  // In production, this would be your real domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/guest/${hotelSlug}/${tableId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR Generation Error:', err);
    return null;
  }
}
