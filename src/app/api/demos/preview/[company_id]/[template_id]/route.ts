import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { buildCompanyData, compileTemplate } from "@/lib/template-engine";

type Props = { params: Promise<{ company_id: string; template_id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const admin = await verifyAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { company_id, template_id } = await params;
  const supabase = createServiceRoleClient();

  const [templateRes, companyRes] = await Promise.all([
    supabase.from("templates").select("html_content, fallback_images").eq("id", template_id).single(),
    supabase.from("companies").select("*").eq("id", company_id).single(),
  ]);

  if (!templateRes.data || !companyRes.data) {
    return new Response("Not found", { status: 404 });
  }

  const companyData = buildCompanyData(companyRes.data, templateRes.data.fallback_images || []);
  const html = compileTemplate(templateRes.data.html_content, companyData);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
