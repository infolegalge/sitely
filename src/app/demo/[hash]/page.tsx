import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildCompanyData, compileTemplate } from "@/lib/template-engine";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ hash: string }> };

export default async function DemoPage({ params }: Props) {
  const { hash } = await params;
  const supabase = createServiceRoleClient();

  // Fetch demo by hash
  const { data: demo, error } = await supabase
    .from("demos")
    .select("id, hash, company_id, template_id, status, html_snapshot, expires_at, view_count")
    .eq("hash", hash)
    .single();

  if (error || !demo) {
    return <ExpiredPage />;
  }

  // Check expiry
  if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
    return <ExpiredPage />;
  }

  // Update view stats (fire-and-forget)
  const isFirstView = demo.view_count === 0;
  supabase
    .from("demos")
    .update({
      view_count: demo.view_count + 1,
      last_viewed_at: new Date().toISOString(),
      ...(isFirstView ? { first_viewed_at: new Date().toISOString(), status: "viewed" } : {}),
    })
    .eq("id", demo.id)
    .then();

  let html = demo.html_snapshot;

  // If no snapshot, compile from template + company data
  if (!html && demo.template_id) {
    const [templateRes, companyRes] = await Promise.all([
      supabase.from("templates").select("html_content, fallback_images").eq("id", demo.template_id).single(),
      supabase.from("companies").select("*").eq("id", demo.company_id).single(),
    ]);

    if (templateRes.data && companyRes.data) {
      const companyData = buildCompanyData(companyRes.data, templateRes.data.fallback_images || []);
      html = compileTemplate(templateRes.data.html_content, companyData);

      // Save snapshot for next time
      supabase
        .from("demos")
        .update({ html_snapshot: html })
        .eq("id", demo.id)
        .then();
    }
  }

  if (!html) {
    return <ExpiredPage />;
  }

  // CTA floating button + form
  const ctaHtml = `<style>
.sitely-cta-btn{position:fixed;bottom:24px;right:24px;z-index:99999;padding:14px 28px;background:#4f6ef7;color:#fff;border:none;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 24px rgba(79,110,247,.35);transition:.3s;font-family:'Space Grotesk',system-ui,sans-serif}
.sitely-cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(79,110,247,.45)}
.sitely-cta-overlay{display:none;position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);align-items:center;justify-content:center}
.sitely-cta-overlay.open{display:flex}
.sitely-cta-form{background:#1a1a2e;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;width:90%;max-width:400px;position:relative;font-family:'Space Grotesk',system-ui,sans-serif}
.sitely-cta-form h3{margin:0 0 6px;font-size:20px;font-weight:700;color:#fff}
.sitely-cta-form p{margin:0 0 20px;font-size:13px;color:rgba(255,255,255,.45)}
.sitely-cta-form input,.sitely-cta-form textarea{width:100%;padding:10px 14px;margin-bottom:10px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);color:#fff;font-size:14px;font-family:inherit;outline:none}
.sitely-cta-form input:focus,.sitely-cta-form textarea:focus{border-color:rgba(79,110,247,.5)}
.sitely-cta-form textarea{min-height:70px;resize:vertical}
.sitely-cta-form button[type=submit]{width:100%;padding:12px;background:#4f6ef7;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;font-family:inherit}
.sitely-cta-close{position:absolute;top:12px;right:16px;background:none;border:none;color:rgba(255,255,255,.4);font-size:22px;cursor:pointer}
.sitely-cta-success{text-align:center;padding:24px 0}
.sitely-cta-success h3{font-size:20px;color:#10b981;margin-bottom:8px}
.sitely-cta-success p{color:rgba(255,255,255,.5);font-size:13px}
</style>
<button class="sitely-cta-btn" onclick="document.querySelector('.sitely-cta-overlay').classList.add('open')">მინდა ეს საიტი!</button>
<div class="sitely-cta-overlay" onclick="if(event.target===this)this.classList.remove('open')">
<div class="sitely-cta-form" id="sitely-cta-form-wrap">
<button class="sitely-cta-close" onclick="this.closest('.sitely-cta-overlay').classList.remove('open')">&times;</button>
<h3>დაგვიკავშირდით</h3>
<p>შეავსეთ ფორმა და ჩვენ დაგიკავშირდებით</p>
<form id="sitely-cta-form" onsubmit="return false">
<input type="text" name="name" placeholder="სახელი *" required maxlength="200">
<input type="tel" name="phone" placeholder="ტელეფონი *" required maxlength="50">
<textarea name="message" placeholder="შეტყობინება (არასავალდებულო)" maxlength="1000"></textarea>
<button type="submit">გაგზავნა</button>
</form>
</div>
</div>`;

  // Inject tracking script
  const trackingScript = `<script>
(function(){
  var D="${demo.id}",H="${demo.hash}";
  var sid=sessionStorage.getItem("dt_sid");
  if(!sid){sid=crypto.randomUUID();sessionStorage.setItem("dt_sid",sid)}
  var sent={};
  function T(ev,extra){
    if(sent[ev])return;
    var b=JSON.stringify({demo_id:D,hash:H,event_type:ev,session_id:sid,page_url:location.href,referrer:document.referrer,user_agent:navigator.userAgent,extra:extra||{}});
    if(navigator.sendBeacon){navigator.sendBeacon("/api/tracking",b)}
    else{fetch("/api/tracking",{method:"POST",body:b,keepalive:true})}
  }
  T("page_open");
  var maxScroll=0;
  var scrollMilestones=[25,50,75,100];
  window.addEventListener("scroll",function(){
    var h=document.documentElement;
    var pct=Math.round(h.scrollTop/(h.scrollHeight-h.clientHeight)*100);
    if(pct>maxScroll)maxScroll=pct;
    scrollMilestones.forEach(function(m){if(pct>=m&&!sent["scroll_"+m]){sent["scroll_"+m]=true;T("scroll_"+m,{depth:m})}});
  });
  var start=Date.now();
  [10,30,60,180,300].forEach(function(s){
    setTimeout(function(){T("time_"+s+"s")},s*1000);
  });
  document.addEventListener("click",function(e){
    var a=e.target.closest("a[href],button");
    if(!a)return;
    var href=a.getAttribute("href")||"";
    if(href.startsWith("tel:"))T("click_phone",{href:href});
    else if(href.startsWith("mailto:"))T("click_email",{href:href});
    else if(a.classList.contains("sitely-cta-btn")||a.classList.contains("float-btn")||a.classList.contains("btn-red"))T("click_cta",{href:href});
    else if(href.includes("sitely"))T("click_sitely",{href:href});
  });
  window.addEventListener("beforeunload",function(){
    sent={};
    T("page_leave",{duration_ms:Date.now()-start,scroll_depth:maxScroll});
  });
  // CTA form submission
  var ctaForm=document.getElementById("sitely-cta-form");
  if(ctaForm){
    ctaForm.addEventListener("submit",function(e){
      e.preventDefault();
      var fd=new FormData(ctaForm);
      var name=fd.get("name"),phone=fd.get("phone"),message=fd.get("message")||"";
      fetch("/api/cta",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({demo_id:D,name:name,phone:phone,message:message,page_url:location.href,referrer:document.referrer,user_agent:navigator.userAgent})})
      .then(function(){
        document.getElementById("sitely-cta-form-wrap").innerHTML='<div class="sitely-cta-success"><h3>გაიგზავნა!</h3><p>მადლობა, მალე დაგიკავშირდებით</p></div>';
      })
      .catch(function(){alert("შეცდომა. სცადეთ თავიდან.")});
    });
  }
})();
</script>`;

  const finalHtml = html.replace("</body>", ctaHtml + "\n" + trackingScript + "\n</body>");

  return (
    <html>
      <body>
        <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
      </body>
    </html>
  );
}

function ExpiredPage() {
  return (
    <html lang="ka">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Demo — ვადაგასულია</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *{margin:0;padding:0;box-sizing:border-box}
              body{font-family:'Space Grotesk',system-ui,sans-serif;background:#0D0D0D;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem}
              h1{font-size:clamp(2rem,6vw,4rem);font-weight:800;letter-spacing:-.04em;margin-bottom:1rem}
              p{color:rgba(255,255,255,.5);font-size:1rem;margin-bottom:2rem;max-width:400px}
              a{display:inline-block;padding:.8rem 2rem;background:#4f6ef7;color:#fff;border-radius:100px;text-decoration:none;font-weight:700;font-size:.85rem;transition:.3s}
              a:hover{opacity:.85;transform:translateY(-2px)}
            `,
          }}
        />
      </head>
      <body>
        <div>
          <h1>ვადაგასულია</h1>
          <p>ეს დემო ვერსია აღარ არის ხელმისაწვდომი. დაგვიკავშირდით ახალი ვარიანტისთვის.</p>
          <a href="https://sitely.ge/contact">დაგვიკავშირდით</a>
        </div>
      </body>
    </html>
  );
}
