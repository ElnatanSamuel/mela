import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, hotels } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { hotelId, tableId, cartItems } = await req.json();

    if (!hotelId || !tableId || !cartItems || Object.keys(cartItems).length === 0) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    // 1. Fetch menu item details to get current prices
    const itemIds = Object.keys(cartItems);
    const dbItems = await db
      .select({
        id: menuItems.id,
        price: menuItems.price,
      })
      .from(menuItems)
      .where(inArray(menuItems.id, itemIds));

    if (dbItems.length === 0) {
       return NextResponse.json({ error: "No valid items found" }, { status: 400 });
    }

    // 2. Calculate totals and rates
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    const settings = (hotel?.settings as any) || { vatRate: 0.15, serviceChargeRate: 0.10 };

    let subtotal = 0;
    const itemsToInsert = dbItems.map((dbItem) => {
      const quantity = cartItems[dbItem.id];
      const itemTotal = parseFloat(dbItem.price) * quantity;
      subtotal += itemTotal;
      return {
        menuItemId: dbItem.id,
        quantity,
        unitPrice: dbItem.price,
      };
    });

    const vatAmount = subtotal * (settings.vatRate || 0);
    const serviceCharge = subtotal * (settings.serviceChargeRate || 0);
    const totalAmount = subtotal + vatAmount + serviceCharge;

    // 3. Create the Order
    const [newOrder] = await db.insert(orders).values({
      hotelId,
      tableId,
      status: "pending",
      paymentStatus: "unpaid",
      totalAmount: totalAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      serviceCharge: serviceCharge.toFixed(2),
    }).returning();

    // 4. Create the Order Items
    await db.insert(orderItems).values(
      itemsToInsert.map(item => ({
        ...item,
        orderId: newOrder.id,
      }))
    );

    return NextResponse.json(newOrder);
  } catch (err: any) {
    console.error("Order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
