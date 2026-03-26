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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isSecureRoute = pathname.startsWith("/secure-access");
  const isLoginPage = pathname === "/secure-access/login";

  // Not authenticated and trying to access protected CMS routes
  if (!user && isSecureRoute && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/secure-access/login";
    return NextResponse.redirect(url);
  }

  // Already authenticated and on login page — redirect to dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/secure-access/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
