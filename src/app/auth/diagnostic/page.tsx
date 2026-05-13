import { getSession, getUserRole } from "@/lib/auth-utils";
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Key,
  Server,
  LogOut,
  Wand2,
} from "lucide-react";
import { signOut, fixMyAdmin } from "@/lib/actions";

export default async function DiagnosticPage() {
  const {
    data: { user },
    error,
  } = await getSession();
  const roleInfo = await getUserRole();

  const envCheck = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    dbUrl: !!process.env.DATABASE_URL,
  };

  return (
    <div className="min-h-screen bg-white text-black p-12 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex items-center justify-between border-b border-black/5 pb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter">
                System Diagnostic
              </h1>
              <p className="text-neutral-500 text-sm italic">
                Status: {user ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* THE FIX MY ADMIN BUTTON */}
            {user && !roleInfo && (
              <form action={fixMyAdmin}>
                <button className="bg-neutral-900 text-white px-6 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl">
                  <Wand2 className="w-4 h-4" />
                  Fix My Admin Role
                </button>
              </form>
            )}

            {/* THE NUCLEAR RESET BUTTON */}
            <form action={signOut}>
              <button className="border border-neutral-200 text-neutral-400 px-6 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Nuclear Logout
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#fefefe] border border-neutral-300 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">
              1. Auth Session (Supabase)
            </h3>
            {user ? (
              <div className="flex items-center gap-3 text-green-600 font-bold">
                <span>Session Active: {user.email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-red-500 font-bold">
                <span>No Session Found</span>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-400 mt-2">
                Error: {error.message}
              </p>
            )}
          </div>

          <div className="bg-[#fefefe] border border-neutral-300 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">
              2. Database Role (PostgreSQL)
            </h3>
            {roleInfo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-neutral-900 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Role: {roleInfo.role}</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Hotel ID: {roleInfo.hotelId || "Platform Level"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-orange-500 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Role Missing in Database</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your Supabase account exists, but it hasn't been linked to a
                  role (Manager/Staff) in the PostgreSQL database. This is why
                  you are stuck at the login screen.
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#fefefe] border border-neutral-300 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">
              3. Environment Variables
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">SUPABASE_URL</span>
                {envCheck.supabaseUrl ? (
                  <Key className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SUPABASE_ANON_KEY</span>
                {envCheck.supabaseKey ? (
                  <Key className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className="text-sm">DATABASE_URL</span>
                {envCheck.dbUrl ? (
                  <Key className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fefefe] border border-neutral-300 p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 ">
            Developer Notes:
          </h3>
          <p className="text-[10px] text-neutral-400 leading-relaxed italic">
            Use the "Fix My Admin Role" button above to manually link your
            current session user as a platform administrator. This should break
            the redirect loop and give you full access to the system.
          </p>
        </div>
      </div>
    </div>
  );
}
