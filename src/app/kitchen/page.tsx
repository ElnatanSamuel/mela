import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import { db } from "@/db";
import { orders, orderItems, menuItems, tables } from "@/db/schema";
import { eq, and, ne, desc, inArray } from "drizzle-orm";
import KitchenOrderBoard from "@/components/kitchen/KitchenOrderBoard";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const roleInfo = await getUserRole();

  if (!roleInfo || !roleInfo.hotelId) {
    redirect("/auth/login");
  }

  if (!["chef", "waiter", "manager", "owner"].includes(roleInfo.role)) {
    redirect("/dashboard");
  }

  const activeOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      createdAt: orders.createdAt,
      tableNumber: tables.tableNumber,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.hotelId, roleInfo.hotelId),
        ne(orders.status, "completed"),
        ne(orders.status, "cancelled")
      )
    )
    .orderBy(desc(orders.createdAt));

  if (activeOrders.length === 0) {
    return (
      <KitchenOrderBoard hotelId={roleInfo.hotelId} initialOrders={[]} initialMenuItems={[]} />
    );
  }

  const orderIds = activeOrders.map((o) => o.id);

  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      menuItemId: orderItems.menuItemId,
      menuItemName: menuItems.name,
      quantity: orderItems.quantity,
      status: orderItems.status,
      notes: orderItems.notes,
      startTime: orderItems.startTime,
      completedAt: orderItems.completedAt,
    })
    .from(orderItems)
    .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds));

  const ordersWithItems = activeOrders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    items: items
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        ...item,
        menuItemName: item.menuItemName || "Unknown Item",
        startTime: item.startTime?.toISOString() ?? null,
        completedAt: item.completedAt?.toISOString() ?? null,
      })),
  }));

  const menuItemMap = items.reduce(
    (acc, item) => {
      if (item.menuItemId && item.menuItemName) {
        acc[item.menuItemId] = item.menuItemName;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <KitchenOrderBoard
      hotelId={roleInfo.hotelId}
      initialOrders={ordersWithItems}
      initialMenuItems={Object.entries(menuItemMap).map(([id, name]) => ({
        id,
        name,
      }))}
    />
  );
}
