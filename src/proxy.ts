import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { updatePortalSession } from "@/lib/supabase/portal-middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cross-platform session: if ?ref= is present, set a first-party cookie
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    // Only proceed with auth for secure-access routes
    if (pathname.startsWith("/secure-access")) {
      const response = await updateSession(request);
      response.cookies.set("sitely_ref", ref, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      return response;
    }

    // Public route with ref — set cookie and strip ref from URL
    const cleanUrl = new URL(request.nextUrl.toString());
    cleanUrl.searchParams.delete("ref");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("sitely_ref", ref, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  // Auth check for secure-access routes (super_admin only)
  if (pathname.startsWith("/secure-access")) {
    return await updateSession(request);
  }

  // Auth check for portal routes (client role)
  if (pathname.startsWith("/portal")) {
    return await updatePortalSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/secure-access/:path*", "/portal/:path*", "/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
