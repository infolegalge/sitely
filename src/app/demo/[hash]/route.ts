import { createAnonClient, createServiceRoleClient } from "@/lib/supabase/server";
import { buildCompanyData, compileTemplate, injectBeforeBodyClose } from "@/lib/template-engine";
import { after } from "next/server";
import { NextRequest } from "next/server";

const EXPIRED_HTML = `<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Demo — ვადაგასულია</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Space Grotesk',system-ui,sans-serif;background:#0D0D0D;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem}
h1{font-size:clamp(2rem,6vw,4rem);font-weight:800;letter-spacing:-.04em;margin-bottom:1rem}
p{color:rgba(255,255,255,.5);font-size:1rem;margin-bottom:2rem;max-width:400px}
a{display:inline-block;padding:.8rem 2rem;background:#4f6ef7;color:#fff;border-radius:100px;text-decoration:none;font-weight:700;font-size:.85rem;transition:.3s}
a:hover{opacity:.85;transform:translateY(-2px)}
</style>
</head>
<body>
<div>
<h1>ვადაგასულია</h1>
<p>ეს დემო ვერსია აღარ არის ხელმისაწვდომი. დაგვიკავშირდით ახალი ვარიანტისთვის.</p>
<a href="https://sitely.ge/contact">დაგვიკავშირდით</a>
</div>
</body>
</html>`;

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const supabase = createAnonClient();

  // Fetch demo by hash (anon client — RLS enforced, read-only)
  const { data: demo, error } = await supabase
    .from("demos")
    .select("id, hash, company_id, template_id, status, html_snapshot, snapshot_url, expires_at, view_count")
    .eq("hash", hash)
    .single();

  if (error || !demo) {
    return htmlResponse(EXPIRED_HTML, 404);
  }

  // Check expiry
  if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
    return htmlResponse(EXPIRED_HTML, 410);
  }

  // Update view stats in background (after response is sent)
  // Uses Service Role for write operations — runs server-side only, not exposed to client
  const isFirstView = demo.view_count === 0;
  const demoId = demo.id;
  const viewCount = demo.view_count;
  after(async () => {
    const adminClient = createServiceRoleClient();
    await adminClient
      .from("demos")
      .update({
        view_count: viewCount + 1,
        last_viewed_at: new Date().toISOString(),
        ...(isFirstView ? { first_viewed_at: new Date().toISOString(), status: "viewed" } : {}),
      })
      .eq("id", demoId);
  });

  // Try snapshot_url (Storage) first, then html_snapshot (DB), then compile from template
  let html: string | null = null;

  if (demo.snapshot_url) {
    try {
      const res = await fetch(demo.snapshot_url);
      if (res.ok) html = await res.text();
    } catch {
      // Storage fetch failed, fall through to html_snapshot
    }
  }

  if (!html) html = demo.html_snapshot;

  // If no snapshot at all, compile from template + company data
  if (!html && demo.template_id) {
    const [templateRes, companyRes] = await Promise.all([
      supabase.from("templates").select("html_content, fallback_images").eq("id", demo.template_id).single(),
      supabase.from("companies").select("*").eq("id", demo.company_id).single(),
    ]);

    if (templateRes.data && companyRes.data) {
      const companyData = buildCompanyData(companyRes.data, templateRes.data.fallback_images || []);
      html = compileTemplate(templateRes.data.html_content, companyData);

      // Save snapshot in background for next time
      const snapshotHtml = html;
      after(async () => {
        const adminClient = createServiceRoleClient();
        await adminClient
          .from("demos")
          .update({ html_snapshot: snapshotHtml })
          .eq("id", demoId);
      });
    }
  }

  if (!html) {
    return htmlResponse(EXPIRED_HTML, 404);
  }

  // Sitely CTA — banner + floating button + footer attribution
  // Injected into ALL templates via injectBeforeBodyClose
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge";
  const ctaLink = `${siteUrl}/contact?demo_id=${encodeURIComponent(demo.id)}`;
  const ctaHtml = `<style>
/* ── Sitely CTA Banner ── */
.sitely-cta-sec{background:#0a0a0a;color:#fff;padding:clamp(60px,12vw,140px) 24px;text-align:center;position:relative;overflow:hidden;font-family:'Space Grotesk','Inter',system-ui,sans-serif;z-index:50}
.sitely-cta-sec::before{content:'SITELY';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:800;font-size:clamp(80px,20vw,280px);letter-spacing:-.06em;text-transform:uppercase;color:rgba(255,255,255,.02);pointer-events:none;white-space:nowrap}
.sitely-cta-inner{position:relative;z-index:2;max-width:600px;margin:0 auto}
.sitely-cta-tag{display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:24px}
.sitely-cta-tag::before{content:'';width:8px;height:8px;border-radius:50%;background:#4f6ef7;animation:sitelyPulse 2s ease infinite}
@keyframes sitelyPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.sitely-cta-sec h2{font-weight:800;font-size:clamp(28px,6vw,56px);line-height:.95;letter-spacing:-.04em;margin-bottom:16px}
.sitely-cta-sec h2 em{font-style:normal;color:#4f6ef7}
.sitely-cta-sec p{font-size:15px;color:rgba(255,255,255,.45);line-height:1.8;margin-bottom:40px;max-width:400px;margin-left:auto;margin-right:auto;font-family:'Inter',system-ui,sans-serif}
.sitely-cta-acts{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.sitely-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 36px;background:#4f6ef7;color:#fff;border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;transition:.35s cubic-bezier(.16,1,.3,1);letter-spacing:.02em}
.sitely-btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(79,110,247,.4);background:#3d5ce5}
.sitely-btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:13px 34px;background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.15);border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;transition:.35s}
.sitely-btn-ghost:hover{border-color:rgba(255,255,255,.4);transform:translateY(-2px)}
/* ── Sitely footer attribution ── */
.sitely-footer-attr{text-align:center;padding:16px 24px;font-size:12px;color:rgba(128,128,128,.6);font-family:'Inter',system-ui,sans-serif;z-index:50;position:relative}
.sitely-footer-attr a{color:rgba(128,128,128,.8);text-decoration:none;border-bottom:1px solid rgba(128,128,128,.2);transition:.2s}
.sitely-footer-attr a:hover{color:#4f6ef7;border-color:#4f6ef7}
/* ── Hide injected CTA banner if template already has its own Sitely CTA ── */
body:has(.cta-final) .sitely-cta-sec{display:none}
/* ── Floating CTA button ── */
.sitely-float{position:fixed;bottom:24px;left:24px;z-index:99999;display:flex;align-items:center;gap:10px;padding:14px 28px;background:#4f6ef7;color:#fff;border:none;border-radius:100px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 24px rgba(79,110,247,.35);transition:.35s cubic-bezier(.16,1,.3,1);font-family:'Space Grotesk',system-ui,sans-serif;text-decoration:none;animation:sitelyFloat 3s ease-in-out infinite}
.sitely-float:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 8px 36px rgba(79,110,247,.5)}
.sitely-float svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2}
@keyframes sitelyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@media(max-width:480px){.sitely-float{padding:12px 20px;font-size:13px;bottom:16px;left:16px}}
</style>
<!-- Sitely CTA Banner -->
<div class="sitely-cta-sec" data-section="sitely_cta">
  <div class="sitely-cta-inner">
    <div class="sitely-cta-tag">DEMO</div>
    <h2>გსურთ <em>ასეთი</em><br>ვებგვერდი?</h2>
    <p>ეს არის სადემონსტრაციო ვერსია. შეავსეთ მოკლე ფორმა და შევქმნით თქვენთვის.</p>
    <div class="sitely-cta-acts">
      <a href="${ctaLink}" class="sitely-btn-primary">შეუკვეთეთ ახლავე →</a>
      <a href="tel:+995551911961" class="sitely-btn-ghost">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        დაგვირეკეთ
      </a>
    </div>
  </div>
</div>
<!-- Sitely Footer Attribution -->
<div class="sitely-footer-attr">შექმნილია <a href="${siteUrl}" target="_blank" rel="noopener">Sitely</a>-ს მიერ</div>
<!-- Floating CTA -->
<a class="sitely-float" href="${ctaLink}">
  <svg viewBox="0 0 24 24"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6m1.1 5L10 14"/></svg>
  მინდა ეს საიტი!
</a>`;

  // ── PostHog: full-featured analytics, session replay, heatmaps ──
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  const trackingScript = `<script>
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init("${posthogKey}",{
  api_host:"${posthogHost}",
  person_profiles:"identified_only",
  capture_pageview:true,
  capture_pageleave:false,
  autocapture:true,
  enable_recording_console_log:true,
  enable_heatmaps:true,
  capture_dead_clicks:true,
  capture_performance:true,
  session_recording:{recordCrossOriginIframes:true}
});

// ── Register demo metadata on every event ──
posthog.register({
  demo_id:"${demo.id}",
  demo_hash:"${demo.hash}",
  source:"demo_page"
});

// ── Identify lead group for this demo ──
posthog.group("demo","${demo.id}",{
  hash:"${demo.hash}",
  company_id:"${demo.company_id || ""}",
  template_id:"${demo.template_id || ""}"
});

// ── UTM capture (PostHog does this automatically, but we also register for grouping) ──
(function(){
  var p=new URLSearchParams(location.search);
  var utm={};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){
    var v=p.get(k);if(v)utm[k]=v;
  });
  if(Object.keys(utm).length){
    posthog.register(utm);
    posthog.capture("demo_opened_from_campaign",utm);
  }
})();

// ── Scroll depth milestones ──
(function(){
  var fired={};
  window.addEventListener("scroll",function(){
    var h=document.documentElement;
    var pct=Math.round(h.scrollTop/(h.scrollHeight-h.clientHeight)*100);
    [25,50,75,100].forEach(function(m){
      if(pct>=m&&!fired[m]){
        fired[m]=true;
        posthog.capture("scroll_depth",{depth_percent:m,page_url:location.href});
      }
    });
  },{passive:true});
})();

// ── Section visibility tracking ──
(function(){
  var timers={},starts={};
  function startS(n){if(!starts[n])starts[n]=Date.now()}
  function stopS(n){if(starts[n]){timers[n]=(timers[n]||0)+(Date.now()-starts[n]);delete starts[n]}}
  function flushS(){
    for(var n in starts)stopS(n);
    for(var name in timers){
      if(timers[name]>=2000){
        posthog.capture("section_viewed",{section_name:name,time_spent_seconds:Math.round(timers[name]/1000)});
      }
    }
    timers={};
  }
  setTimeout(function(){
    var secs=document.querySelectorAll("section[id],div[id],[data-section]");
    if(!secs.length)return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var name=e.target.getAttribute("data-section")||e.target.id||"unknown";
        if(e.isIntersecting&&e.intersectionRatio>=0.5)startS(name);
        else stopS(name);
      });
    },{threshold:[0,0.5]});
    secs.forEach(function(el){io.observe(el)});
  },1500);
  window.addEventListener("pagehide",flushS);
  window.addEventListener("beforeunload",flushS);
})();

// ── 3D Canvas interaction tracking ──
setTimeout(function(){
  var canvases=document.querySelectorAll("canvas");
  var lastWheel=0;
  canvases.forEach(function(c){
    var dragging=false;
    c.addEventListener("pointerdown",function(){dragging=true},{passive:true});
    c.addEventListener("pointerup",function(){
      if(dragging){posthog.capture("3d_interaction",{type:"rotate"});dragging=false}
    },{passive:true});
    c.addEventListener("wheel",function(){
      var now=Date.now();if(now-lastWheel<10000)return;lastWheel=now;
      posthog.capture("3d_interaction",{type:"zoom"});
    },{passive:true});
  });
},2000);

// ── CTA click tracking (specific to demo templates) ──
document.addEventListener("click",function(ev){
  var a=ev.target.closest("a[href],button");
  if(!a)return;
  var href=a.getAttribute("href")||"";
  if(href.startsWith("tel:"))posthog.capture("click_phone",{href:href});
  else if(href.startsWith("mailto:"))posthog.capture("click_email",{href:href});
  else if(a.classList.contains("sitely-btn-primary")||a.classList.contains("sitely-float"))posthog.capture("click_cta",{href:href,text:a.innerText.trim().slice(0,50)});
  else if(href.includes("sitely"))posthog.capture("click_sitely_link",{href:href});
});

// ── Form tracking (start + abandon) ──
(function(){
  var started=false;
  document.addEventListener("focusin",function(ev){
    var el=ev.target;
    if(el&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"||el.tagName==="SELECT")){
      if(el.closest("form")&&!started){
        started=true;
        posthog.capture("form_interaction_started",{field:el.name||el.type||"unknown"});
      }
    }
  });
  document.addEventListener("submit",function(ev){started=false;posthog.capture("form_submit",{form_id:ev.target.id||"unknown"})});
  window.addEventListener("beforeunload",function(){
    if(started)posthog.capture("form_abandoned");
  });
})();

// ── Active time tracking with idle detection ──
(function(){
  var start=Date.now(),activeMs=0,lastTick=Date.now(),idle=false,paused=document.hidden;
  var idleTimer,IDLE=30000;
  function tick(){if(!paused&&!idle){var n=Date.now();activeMs+=n-lastTick;lastTick=n}else{lastTick=Date.now()}}
  function resetIdle(){if(idle){idle=false;lastTick=Date.now()}clearTimeout(idleTimer);idleTimer=setTimeout(function(){idle=true;tick()},IDLE)}
  ["mousemove","keydown","scroll","touchstart","click"].forEach(function(e){document.addEventListener(e,resetIdle,{passive:true})});
  resetIdle();
  setInterval(tick,1000);
  document.addEventListener("visibilitychange",function(){if(document.hidden){tick();paused=true}else{lastTick=Date.now();paused=false;resetIdle()}});
  var milestones={};
  [10,30,60,180,300].forEach(function(s){
    var ms=s*1000;
    (function check(){tick();if(activeMs>=ms&&!milestones[s]){milestones[s]=true;posthog.capture("active_time_milestone",{seconds:s})}else if(!milestones[s])setTimeout(check,1000)})();
  });
  function sendPageLeave(){
    tick();
    posthog.capture("demo_session_summary",{
      total_duration_ms:Date.now()-start,
      active_seconds:Math.round(activeMs/1000),
      max_scroll:Math.round((document.documentElement.scrollTop/(document.documentElement.scrollHeight-document.documentElement.clientHeight))*100)||0
    });
  }
  window.addEventListener("pagehide",sendPageLeave);
  window.addEventListener("beforeunload",sendPageLeave);
})();
</script>`;

  const finalHtml = injectBeforeBodyClose(html, ctaHtml, trackingScript);

  return htmlResponse(finalHtml);
}
