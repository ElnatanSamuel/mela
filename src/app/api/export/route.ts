import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, transactions, auditLogs, tables, hotels } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const hotelId = searchParams.get("hotelId") || roleInfo.hotelId;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!type || !["orders", "revenue", "audit"].includes(type)) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  if (!hotelId) return NextResponse.json({ error: "hotelId required" }, { status: 400 });

  if (roleInfo.role !== "platform_admin" && hotelId !== roleInfo.hotelId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateFilter = and(
    from ? gte(orders.createdAt, new Date(from)) : undefined,
    to ? lte(orders.createdAt, new Date(to + "T23:59:59.999Z")) : undefined,
  );

  const dateFilterAudit = and(
    from ? gte(auditLogs.createdAt, new Date(from)) : undefined,
    to ? lte(auditLogs.createdAt, new Date(to + "T23:59:59.999Z")) : undefined,
  );

  const dateFilterTransactions = and(
    from ? gte(transactions.createdAt, new Date(from)) : undefined,
    to ? lte(transactions.createdAt, new Date(to + "T23:59:59.999Z")) : undefined,
  );

  let csv = "";
  const dateStr = new Date().toISOString().split("T")[0];

  if (type === "orders") {
    const rows = await db
      .select({
        id: orders.id,
        tableNumber: tables.tableNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        vatAmount: orders.vatAmount,
        serviceCharge: orders.serviceCharge,
        orderType: orders.orderType,
        createdAt: orders.createdAt,
        itemsCount: sql<number>`(SELECT COUNT(*)::int FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`,
      })
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .where(and(eq(orders.hotelId, hotelId), dateFilter))
      .orderBy(orders.createdAt);

    csv = "ID,Table Number,Status,Payment Status,Total Amount,VAT,Service Charge,Items Count,Order Type,Created At\n";
    for (const r of rows) {
      csv += `${r.id},${r.tableNumber || ""},${r.status},${r.paymentStatus},${r.totalAmount},${r.vatAmount},${r.serviceCharge},${r.itemsCount},${r.orderType},${r.createdAt}\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-export-${dateStr}.csv"`,
      },
    });
  }

  if (type === "revenue") {
    const rows = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        orderCount: sql<number>`COUNT(*)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount})::text, '0')`,
      })
      .from(orders)
      .where(and(eq(orders.hotelId, hotelId), dateFilter, eq(orders.paymentStatus, "paid")))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    csv = "Date,Total Orders,Total Revenue,Cash Revenue,Digital Revenue,Avg Order Value\n";

    for (const r of rows) {
      const cashTxns = await db
        .select({
          total: sql<string>`COALESCE(SUM(${transactions.amount})::text, '0')`,
        })
        .from(transactions)
        .where(and(
          eq(transactions.hotelId, hotelId),
          eq(transactions.paymentMethod, "cash"),
          sql`DATE(${transactions.createdAt}) = ${r.date}`,
          dateFilterTransactions,
        ));

      const digitalTxns = await db
        .select({
          total: sql<string>`COALESCE(SUM(${transactions.amount})::text, '0')`,
        })
        .from(transactions)
        .where(and(
          eq(transactions.hotelId, hotelId),
          sql`${transactions.paymentMethod} != 'cash'`,
          sql`DATE(${transactions.createdAt}) = ${r.date}`,
          dateFilterTransactions,
        ));

      const cashRevenue = cashTxns[0]?.total || "0";
      const digitalRevenue = digitalTxns[0]?.total || "0";
      const totalRev = parseFloat(r.totalRevenue);
      const avgOrder = r.orderCount > 0 ? (totalRev / r.orderCount).toFixed(2) : "0.00";

      csv += `${r.date},${r.orderCount},${r.totalRevenue},${cashRevenue},${digitalRevenue},${avgOrder}\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue-export-${dateStr}.csv"`,
      },
    });
  }

  if (type === "audit") {
    const rows = await db
      .select({
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        hotelName: hotels.name,
      })
      .from(auditLogs)
      .leftJoin(hotels, eq(auditLogs.hotelId, hotels.id))
      .where(and(eq(auditLogs.hotelId, hotelId), dateFilterAudit))
      .orderBy(auditLogs.createdAt);

    csv = "Timestamp,User,Action,Entity Type,Entity ID,Hotel Name\n";
    for (const r of rows) {
      csv += `${r.createdAt},${r.userId || ""},${r.action},${r.entityType},${r.entityId},${r.hotelName || ""}\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-export-${dateStr}.csv"`,
      },
    });
  }
}
