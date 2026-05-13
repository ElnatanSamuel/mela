import { NextResponse } from "next/server";
import { getSession, getUserRole } from "@/lib/auth-utils";

export async function GET() {
  try {
    const { data: { user }, error: authError } = await getSession();

    if (authError) {
      return NextResponse.json({ auth: "error", error: authError.message });
    }

    if (!user) {
      return NextResponse.json({ auth: "no_session" });
    }

    const roleInfo = await getUserRole();

    return NextResponse.json({
      auth: "ok",
      user: { id: user.id, email: user.email },
      role: roleInfo,
    });
  } catch (err: any) {
    return NextResponse.json({ auth: "crash", error: err.message, stack: err.stack?.split("\n").slice(0, 5) });
  }
}
