import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("🎯 Auth callback triggered", { hasCode: !!code });

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("🔄 Session exchange:", {
        success: !!data.session,
        error: error?.message,
      });

      if (error) throw error;
    } catch (error) {
      console.error("❌ Callback error:", error);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
