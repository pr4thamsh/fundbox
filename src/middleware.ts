import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Add this debug log
  console.log("🚀 Middleware Path:", req.nextUrl.pathname);

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    // Add debug logs
    console.log("🔑 Session Check:", {
      hasSession: !!session,
      sessionError: error?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      if (!session) {
        console.log("⛔ No session, redirecting to login");
        return NextResponse.redirect(new URL("/login", req.url));
      }
      console.log("✅ Session valid, allowing dashboard access");
    }

    if (
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register")
    ) {
      if (session) {
        console.log("🔄 Has session, redirecting to dashboard");
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      console.log("👍 No session, allowing auth page access");
    }

    return res;
  } catch (error) {
    console.error("💥 Middleware error:", error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|api/).*)",
  ],
};
