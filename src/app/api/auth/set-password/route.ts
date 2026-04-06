import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  token: z.string().uuid(),
  password: z.string().min(6).max(128),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  // The user should already be authenticated via the activate flow (session cookies set)
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "სესია არ მოიძებნა. სცადეთ ლინკი თავიდან." }, { status: 401 });
  }

  // Use admin client to set the password and mark has_set_password
  const adminClient = createServiceRoleClient();

  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
    user_metadata: {
      ...user.user_metadata,
      has_set_password: true,
    },
  });

  if (updateError) {
    console.error("[set-password] update error:", updateError.message);
    return Response.json({ error: "პაროლის დაყენება ვერ მოხერხდა." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
