import { createServiceRoleClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return Response.json({ error: "არასწორი ტოკენი." }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();

  // Look up the token (reusable — only revoked when a new link is requested)
  const { data: tokenRecord, error: tokenError } = await adminClient
    .from("onboard_tokens")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .single();

  if (tokenError || !tokenRecord) {
    return Response.json({ error: "ტოკენი არ მოიძებნა ან გაუქმებულია. მოითხოვეთ ახალი ლინკი." }, { status: 404 });
  }

  // Generate a Supabase magic link for this email to create a session
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: tokenRecord.email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("Generate link error:", linkError?.message);
    return Response.json({ error: "სესიის შექმნა ვერ მოხერხდა." }, { status: 500 });
  }

  // Collect cookies from the Supabase SSR client so we can attach them
  // explicitly to the response (cookieStore.set alone is unreliable here).
  const cookieStore = await cookies();
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const c of cookiesToSet) {
            pendingCookies.push(c);
          }
        },
      },
    },
  );

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    console.error("Verify OTP error:", verifyError.message);
    return Response.json({ error: "სესიის შექმნა ვერ მოხერხდა." }, { status: 500 });
  }

  // Ensure app_metadata has client role + company_id (+ project_id if present)
  // Use the user ID from generateLink (avoids paginated listUsers pitfall)
  const userId = linkData.user?.id;
  let hasPassword = false;

  if (userId) {
    // Check if user already has a password set
    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    hasPassword = userData?.user?.user_metadata?.has_set_password === true;

    const meta: Record<string, unknown> = {
      role: "client",
      company_id: tokenRecord.company_id,
    };
    if (tokenRecord.project_id) {
      meta.project_id = tokenRecord.project_id;
    }
    await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: meta,
    });
  }

  // Build response with explicit Set-Cookie headers
  const response = NextResponse.json({ success: true, redirect: "/portal", hasPassword });
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  }
  return response;
}
