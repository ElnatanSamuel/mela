import { NextResponse } from "next/server";
import * as net from "net";

export async function POST(req: Request) {
  const { printerIp, printerPort, data } = await req.json();

  if (!printerIp || !printerPort || !data) {
    return NextResponse.json({ error: "Missing printer config" }, { status: 400 });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const client = new net.Socket();
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error("Printer connection timeout"));
      }, 5000);

      client.connect(printerPort, printerIp, () => {
        client.write(new Uint8Array(data), () => {
          clearTimeout(timeout);
          client.destroy();
          resolve();
        });
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Print error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
