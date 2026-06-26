/**
 * ESC/POS Thermal Printer Integration.
 * Sends formatted receipts to network-connected thermal printers.
 */

type LineItem = {
  name: string;
  quantity: number;
  unitPrice: string;
  modifiers?: string[];
};

type ReceiptData = {
  hotelName: string;
  tableNumber: string;
  orderNumber: string;
  items: LineItem[];
  totalAmount: string;
  vatAmount: string;
  serviceCharge: string;
  timestamp: Date;
};

function encodeText(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i));
  }
  return bytes;
}

export function buildReceipt(data: ReceiptData, settings?: {
  headerText?: string;
  footerText?: string;
  showLogo?: boolean;
  showVat?: boolean;
  showServiceCharge?: boolean;
  showItemStatus?: boolean;
}): Uint8Array {
  const ESC = 0x1B;
  const GS = 0x1D;
  const LF = 0x0A;

  const bytes: number[] = [];

  bytes.push(ESC, 0x40);

  bytes.push(ESC, 0x61, 0x01);
  bytes.push(ESC, 0x45, 0x01);

  if (settings?.headerText) {
    bytes.push(...encodeText(settings.headerText));
    bytes.push(LF);
  }

  bytes.push(...encodeText(data.hotelName));
  bytes.push(LF);

  bytes.push(...encodeText("=".repeat(32)));
  bytes.push(LF);
  bytes.push(ESC, 0x45, 0x00);

  bytes.push(ESC, 0x61, 0x00);

  bytes.push(...encodeText(`Table: ${data.tableNumber}`));
  bytes.push(LF);
  bytes.push(...encodeText(`Order: #${data.orderNumber}`));
  bytes.push(LF);
  bytes.push(...encodeText(`Date: ${data.timestamp.toLocaleDateString()}`));
  bytes.push(LF);
  bytes.push(...encodeText(`Time: ${data.timestamp.toLocaleTimeString()}`));
  bytes.push(LF);

  bytes.push(...encodeText("-".repeat(32)));
  bytes.push(LF);

  bytes.push(ESC, 0x45, 0x01);
  bytes.push(...encodeText("ITEM".padEnd(20) + "QTY".padEnd(6) + "TOTAL"));
  bytes.push(LF);
  bytes.push(ESC, 0x45, 0x00);

  for (const item of data.items) {
    const line = `${item.name.slice(0, 18)}`.padEnd(20) +
      `${item.quantity}`.padEnd(6) +
      `${parseFloat(item.unitPrice) * item.quantity}`;
    bytes.push(...encodeText(line));
    bytes.push(LF);

    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        bytes.push(...encodeText(`  + ${mod}`));
        bytes.push(LF);
      }
    }
  }

  bytes.push(...encodeText("-".repeat(32)));
  bytes.push(LF);

  bytes.push(ESC, 0x61, 0x01);
  bytes.push(...encodeText(`TOTAL: ${data.totalAmount}`));
  bytes.push(LF);
  bytes.push(ESC, 0x61, 0x00);

  if (settings?.showVat !== false) {
    bytes.push(...encodeText(`VAT: ${data.vatAmount}`));
    bytes.push(LF);
  }

  if (settings?.showServiceCharge !== false) {
    bytes.push(...encodeText(`Service: ${data.serviceCharge}`));
    bytes.push(LF);
  }

  if (settings?.footerText) {
    bytes.push(LF);
    bytes.push(ESC, 0x61, 0x01);
    bytes.push(...encodeText(settings.footerText));
    bytes.push(LF);
  }

  bytes.push(LF);

  bytes.push(GS, 0x56, 0x00);

  return new Uint8Array(bytes);
}

export async function printReceipt(
  printerIp: string,
  printerPort: number,
  data: ReceiptData,
): Promise<boolean> {
  const receipt = buildReceipt(data);

  try {
    // Use WebSocket proxy or direct TCP connection
    // Note: Browser environments require a server-side proxy for raw TCP
    const response = await fetch("/api/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        printerIp,
        printerPort,
        data: Array.from(receipt),
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Print error:", error);
    return false;
  }
}
