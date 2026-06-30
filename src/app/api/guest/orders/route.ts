import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, hotels, menuModifiers, transactions, promoCodes, tips, customerProfiles, loyaltyTransactions } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { hotelId, tableId, cartItems, orderType, promoCodeId, discountAmount, tipAmount, customerPhone } = await req.json();

    if (!hotelId || !tableId || !cartItems || Object.keys(cartItems).length === 0) {
      console.error("Guest order: invalid data", { hotelId, tableId, cartItemsKeys: cartItems ? Object.keys(cartItems) : null });
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const itemIds = Object.keys(cartItems);
    const dbItems = await db
      .select({ id: menuItems.id, price: menuItems.price })
      .from(menuItems)
      .where(inArray(menuItems.id, itemIds));

    if (dbItems.length === 0) {
       return NextResponse.json({ error: "No valid items found" }, { status: 400 });
    }

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    const settings = (hotel?.settings as any) || { vatRate: 0.15, serviceChargeRate: 0.10 };

    // Collect all modifier IDs to fetch prices
    const allModifierIds = new Set<string>();
    for (const entry of Object.values(cartItems)) {
      const e = entry as any;
      if (e.modifiers) {
        for (const m of e.modifiers) allModifierIds.add(m.id);
      }
    }

    let modifierPrices: Record<string, string> = {};
    if (allModifierIds.size > 0) {
      const modResults = await db
        .select({ id: menuModifiers.id, priceModifier: menuModifiers.priceModifier })
        .from(menuModifiers)
        .where(inArray(menuModifiers.id, [...allModifierIds]));
      for (const m of modResults) {
        modifierPrices[m.id] = m.priceModifier;
      }
    }

    let subtotal = 0;
    const itemsToInsert = dbItems.map((dbItem) => {
      const entry = cartItems[dbItem.id] as any;
      const quantity = entry.qty || 1;
      const modifiers = entry.modifiers || [];
      const baseTotal = parseFloat(dbItem.price) * quantity;
      const modifierTotal = modifiers.reduce(
        (sum: number, m: any) => sum + parseFloat(modifierPrices[m.id] || "0") * quantity,
        0,
      );
      const itemTotal = baseTotal + modifierTotal;
      subtotal += itemTotal;
      return {
        menuItemId: dbItem.id,
        quantity,
        unitPrice: dbItem.price,
        modifiers: modifiers.map((m: any) => ({
          id: m.id,
          name: m.name,
          priceDelta: parseFloat(modifierPrices[m.id] || "0"),
        })),
      };
    });

    const vatAmount = subtotal * (settings.vatRate || 0);
    const serviceCharge = subtotal * (settings.serviceChargeRate || 0);
    const totalAmount = subtotal + vatAmount + serviceCharge;
    const discount = parseFloat(discountAmount || "0");
    const tip = parseFloat(tipAmount || "0");
    const finalAmount = Math.max(0, totalAmount - discount + tip);

    const [newOrder] = await db.insert(orders).values({
      hotelId,
      tableId,
      status: "pending",
      paymentStatus: "unpaid",
      orderType: orderType || "cash",
      totalAmount: finalAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      serviceCharge: serviceCharge.toFixed(2),
      promoCodeId: promoCodeId || null,
      discountAmount: discount.toFixed(2),
      tipAmount: tip.toFixed(2),
      customerPhone: customerPhone || null,
    }).returning();

    if (promoCodeId) {
      await db
        .update(promoCodes)
        .set({
          usedCount: sql`${promoCodes.usedCount} + 1`,
        })
        .where(eq(promoCodes.id, promoCodeId));
    }

    if (tip > 0) {
      await db.insert(tips).values({
        orderId: newOrder.id,
        hotelId,
        amount: tip.toFixed(2),
        method: orderType === "digital" ? "digital" : "cash",
      });
    }

    await db.insert(orderItems).values(
      itemsToInsert.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        modifiers: JSON.stringify(item.modifiers),
        orderId: newOrder.id,
      }))
    );

    if (customerPhone) {
      const [existingCustomer] = await db
        .select()
        .from(customerProfiles)
        .where(and(eq(customerProfiles.hotelId, hotelId), eq(customerProfiles.phone, customerPhone)))
        .limit(1);

      const loyaltyPointsEarned = Math.floor(finalAmount / 10);

      if (existingCustomer) {
        await db
          .update(customerProfiles)
          .set({
            visitCount: sql`${customerProfiles.visitCount} + 1`,
            totalSpent: sql`${customerProfiles.totalSpent} + ${finalAmount.toFixed(2)}`,
            lastVisit: new Date(),
            loyaltyPoints: sql`${customerProfiles.loyaltyPoints} + ${loyaltyPointsEarned}`,
          })
          .where(eq(customerProfiles.id, existingCustomer.id));
      } else {
        await db.insert(customerProfiles).values({
          hotelId,
          phone: customerPhone,
          visitCount: 1,
          totalSpent: finalAmount.toFixed(2),
          lastVisit: new Date(),
          loyaltyPoints: loyaltyPointsEarned,
        });
      }

      if (loyaltyPointsEarned > 0) {
        const customerId = existingCustomer?.id || (
          await db
            .select({ id: customerProfiles.id })
            .from(customerProfiles)
            .where(and(eq(customerProfiles.hotelId, hotelId), eq(customerProfiles.phone, customerPhone)))
            .limit(1)
        )[0]?.id;

        if (customerId) {
          await db.insert(loyaltyTransactions).values({
            customerId,
            points: loyaltyPointsEarned,
            type: "earn",
            reference: `Order ${newOrder.id.slice(0, 8)}`,
          });
        }
      }
    }

    return NextResponse.json(newOrder);
  } catch (err: any) {
    console.error("Order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
