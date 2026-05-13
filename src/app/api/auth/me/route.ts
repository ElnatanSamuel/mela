import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  try {
    const roleInfo = await getUserRole();
    console.log("🔍 [API/AUTH/ME] Role Info:", roleInfo);
    
    if (!roleInfo) {
      return NextResponse.json({ error: "No role found" }, { status: 404 });
    }
    return NextResponse.json(roleInfo);
  } catch (err) {
    console.error("❌ [API/AUTH/ME] Error:", err);
    return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 });
  }
}
