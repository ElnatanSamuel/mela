import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { db } from "@/db";
import { hotelUsers } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return NextResponse.json({ error: `Email ${email} already exists. Try a different email or reset the password.` }, { status: 409 });
      }
      throw error;
    }

    if (!data.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    await db.insert(hotelUsers).values({
      userId: data.user.id,
      role: "platform_admin",
      hotelId: null,
    });

    return NextResponse.json({
      message: "Admin created",
      email,
      password,
      role: "platform_admin",
    });
  } catch (err: any) {
    console.error("Create admin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
