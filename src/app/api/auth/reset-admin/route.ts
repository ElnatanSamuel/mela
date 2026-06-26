import { NextResponse } from "next/server";
import postgres from "postgres";
import { db } from "@/db";
import { hotelUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL!, { prepare: false, ssl: "require" });

    const users = await sql`SELECT id FROM auth.users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: `User ${email} not found in auth.users` }, { status: 404 });
    }

    const userId = users[0].id;

    await sql`
      UPDATE auth.users
      SET encrypted_password = crypt(${password}, gen_salt('bf')),
          updated_at = now()
      WHERE id = ${userId}
    `;

    await sql`
      DELETE FROM auth.sessions WHERE user_id = ${userId}
    `;

    await sql.end();

    const existing = await db
      .select()
      .from(hotelUsers)
      .where(eq(hotelUsers.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db.update(hotelUsers).set({ role: "platform_admin" }).where(eq(hotelUsers.userId, userId));
    } else {
      await db.insert(hotelUsers).values({ userId, role: "platform_admin", hotelId: null });
    }

    return NextResponse.json({ message: `Password reset for ${email}` });
  } catch (err: any) {
    console.error("Reset error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
