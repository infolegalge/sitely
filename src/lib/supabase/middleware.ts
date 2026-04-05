import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Use getUser() instead of getSession() — getSession() trusts the JWT
  // which may be expired or tampered. getUser() validates against Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isSecureRoute = pathname.startsWith("/secure-access");
  const isLoginPage = pathname === "/secure-access/login";

  // Not authenticated — block all secure routes except login
  if (!user && isSecureRoute && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/secure-access/login";
    return NextResponse.redirect(url);
  }

  // Authenticated but NOT super_admin via app_metadata — sign out and block
  // app_metadata cannot be modified by the user (unlike user_metadata)
  if (user && isSecureRoute && !isLoginPage) {
    const role = user.app_metadata?.role;
    if (role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/secure-access/login";
      return NextResponse.redirect(url);
    }
  }

  // Already authenticated admin on login page — redirect to dashboard
  if (user && isLoginPage) {
    const role = user.app_metadata?.role;
    if (role === "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/secure-access/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
