import QRCode from 'qrcode';

export async function generateTableQR(hotelSlug: string, tableId: string, baseUrl?: string) {
  const url = `${baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/guest/${hotelSlug}/${tableId}`;

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
