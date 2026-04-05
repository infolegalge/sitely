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
    .select("id, hash, company_id, template_id, status, html_snapshot, snapshot_url, expires_at, view_count, companies(secure_link_id)")
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
/* ── Floating CTA button ── */
.sitely-float{position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;align-items:center;gap:10px;padding:14px 28px;background:#4f6ef7;color:#fff;border:none;border-radius:100px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 24px rgba(79,110,247,.35);transition:.35s cubic-bezier(.16,1,.3,1);font-family:'Space Grotesk',system-ui,sans-serif;text-decoration:none;animation:sitelyFloat 3s ease-in-out infinite}
.sitely-float:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 8px 36px rgba(79,110,247,.5)}
.sitely-float svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2}
@keyframes sitelyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@media(max-width:480px){.sitely-float{padding:12px 20px;font-size:13px;bottom:16px;right:16px}}
</style>
<!-- Sitely CTA Banner -->
<div class="sitely-cta-sec" data-section="sitely_cta">
  <div class="sitely-cta-inner">
    <div class="sitely-cta-tag">DEMO</div>
    <h2>გსურთ <em>ასეთი</em><br>ვებგვერდი?</h2>
    <p>ეს არის სადემონსტრაციო ვერსია. შეავსეთ მოკლე ფორმა და შევქმნით თქვენთვის.</p>
    <div class="sitely-cta-acts">
      <a href="${ctaLink}" class="sitely-btn-primary">შეუკვეთეთ ახლავე →</a>
      <a href="tel:+995597060784" class="sitely-btn-ghost">
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

  // Inject tracking script (batched — collects events, sends every 15s or on page leave)
  // Enhanced: Section Observer, 3D interaction, idle detection, cross-domain handoff
  const secureLinkId = (demo.companies as { secure_link_id?: string } | null)?.secure_link_id || "";
  const trackingScript = `<script>
(function(){
  var D="${demo.id}",H="${demo.hash}",REF="${secureLinkId}";
  var sid=sessionStorage.getItem("dt_sid");
  if(!sid){sid=crypto.randomUUID();sessionStorage.setItem("dt_sid",sid)}
  var Q=[];
  var sentOnce={};

  // ── Parse UTM parameters ──
  var params=new URLSearchParams(location.search);
  var utm={};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){
    var v=params.get(k);if(v)utm[k]=v;
  });

  // ── Device & browser info ──
  var ua=navigator.userAgent;
  var deviceInfo={
    screen_w:screen.width,screen_h:screen.height,
    viewport_w:window.innerWidth,viewport_h:window.innerHeight,
    pixel_ratio:window.devicePixelRatio||1,
    language:navigator.language||"",
    timezone:Intl.DateTimeFormat?Intl.DateTimeFormat().resolvedOptions().timeZone:"",
    touch:"ontouchstart" in window||navigator.maxTouchPoints>0,
    connection:(navigator.connection||{}).effectiveType||""
  };
  // Simple device type detection
  var isMobile=/Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  var isTablet=/iPad|Android(?!.*Mobi)/i.test(ua);
  deviceInfo.device_type=isTablet?"tablet":isMobile?"mobile":"desktop";

  // ── Core: queue event ──
  function E(ev,extra,allowRepeat){
    if(!allowRepeat&&sentOnce[ev])return;
    if(!allowRepeat)sentOnce[ev]=true;
    // Generate idempotency key: session_id + event_type + timestamp (prevents duplicate inserts on retry)
    var idk=sid+"_"+ev+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
    var ex=Object.assign({},extra||{});
    // Promote DB-column fields from extra to top-level payload
    var dur=ex.duration_ms;delete ex.duration_ms;
    var sd=ex.scroll_depth;delete ex.scroll_depth;
    var payload={
      demo_id:D,hash:H,event_type:ev,session_id:sid,
      idempotency_key:idk,
      page_url:location.href,referrer:document.referrer,
      user_agent:ua,
      section_name:(extra&&extra.section)||null,
      interaction_type:(extra&&extra.interaction_type)||null,
      duration_ms:typeof dur==="number"?dur:null,
      scroll_depth:typeof sd==="number"?sd:null,
      extra:ex
    };
    // Attach UTM + device on page_open
    if(ev==="page_open"){
      if(Object.keys(utm).length)payload.extra.utm=utm;
      payload.extra.device=deviceInfo;
      // Parse referrer domain
      if(document.referrer){try{payload.extra.referrer_domain=new URL(document.referrer).hostname}catch(e){}}
    }
    Q.push(payload);
  }

  // ── Core: flush batch via Beacon API ──
  function flush(){
    if(!Q.length)return;
    var batch=Q.splice(0,50);
    var b=new Blob([JSON.stringify({events:batch})],{type:"application/json"});
    if(navigator.sendBeacon){navigator.sendBeacon("/api/tracking",b)}
    else{fetch("/api/tracking",{method:"POST",body:b,keepalive:true})}
  }

  // ── Cross-domain: tag sitely links with lead ref ──
  if(REF){
    document.querySelectorAll('a[href*="sitely"]').forEach(function(a){
      var u=new URL(a.href,location.href);
      if(!u.searchParams.has("ref")){u.searchParams.set("ref",REF);a.href=u.toString()}
    });
  }

  // ── Active time tracking with idle detection ──
  var start=Date.now();
  var activeMs=0,lastTick=Date.now();
  var paused=document.hidden;
  var idleTimer,IDLE_THRESHOLD=30000; // 30s no interaction = idle
  var idle=false;

  function tick(){
    if(!paused&&!idle){var now=Date.now();activeMs+=now-lastTick;lastTick=now}
    else{lastTick=Date.now()}
  }
  function resetIdle(){
    if(idle){idle=false;lastTick=Date.now()}
    clearTimeout(idleTimer);
    idleTimer=setTimeout(function(){idle=true;tick()},IDLE_THRESHOLD);
  }
  // User activity resets idle
  ["mousemove","keydown","scroll","touchstart","click"].forEach(function(evt){
    document.addEventListener(evt,resetIdle,{passive:true})
  });
  resetIdle();
  setInterval(tick,1000);

  document.addEventListener("visibilitychange",function(){
    if(document.hidden){tick();paused=true}
    else{lastTick=Date.now();paused=false;resetIdle()}
    if(document.visibilityState==="hidden")flush();
  });

  // ── page_open ──
  E("page_open");
  flush(); // Send page_open immediately — don't wait 15s

  // ── Scroll depth tracking ──
  var maxScroll=0;
  window.addEventListener("scroll",function(){
    var h=document.documentElement;
    var pct=Math.round(h.scrollTop/(h.scrollHeight-h.clientHeight)*100);
    if(pct>maxScroll)maxScroll=pct;
    [25,50,75,100].forEach(function(m){
      if(pct>=m&&!sentOnce["scroll_"+m]){sentOnce["scroll_"+m]=true;E("scroll_"+m,{depth:m})}
    });
  },{passive:true});

  // ── Active time milestones ──
  [10,30,60,180,300].forEach(function(s){
    var ms=s*1000;
    (function check(){tick();if(activeMs>=ms)E("active_time_"+s+"s",{active_seconds:s});else setTimeout(check,1000)})();
  });

  // ── Click tracking (phone, email, CTA, sitely) ──
  document.addEventListener("click",function(e){
    var a=e.target.closest("a[href],button");
    if(!a)return;
    var href=a.getAttribute("href")||"";
    if(href.startsWith("tel:"))E("click_phone",{href:href});
    else if(href.startsWith("mailto:"))E("click_email",{href:href});
    else if(a.classList.contains("sitely-cta-btn")||a.classList.contains("float-btn")||a.classList.contains("btn-red")||a.classList.contains("sitely-btn-primary")||a.classList.contains("sitely-float"))E("click_cta",{href:href});
    else if(href.includes("sitely"))E("click_sitely",{href:href});
  });

  // ── Section Observer: track time spent per visible section ──
  var sectionTimers={};
  var sectionStart={};
  function startSection(name){
    if(sectionStart[name])return;
    sectionStart[name]=Date.now();
  }
  function stopSection(name){
    if(!sectionStart[name])return;
    var elapsed=Date.now()-sectionStart[name];
    sectionTimers[name]=(sectionTimers[name]||0)+elapsed;
    delete sectionStart[name];
  }
  function flushSections(){
    // Stop any running timers
    for(var n in sectionStart)stopSection(n);
    // Send accumulated time for each section
    for(var name in sectionTimers){
      if(sectionTimers[name]>=2000){ // only report >=2s viewing
        E("section_view",{section:name,duration_s:Math.round(sectionTimers[name]/1000)},true);
      }
    }
    sectionTimers={};
  }
  // Detect sections — any element with id or data-section attribute
  setTimeout(function(){
    var sections=document.querySelectorAll("section[id],div[id],[data-section]");
    if(!sections.length)return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var name=entry.target.getAttribute("data-section")||entry.target.id||"unknown";
        if(entry.isIntersecting&&entry.intersectionRatio>=0.5&&!document.hidden&&!idle){
          startSection(name);
        } else {
          stopSection(name);
        }
      });
    },{threshold:[0,0.5],rootMargin:"0px"});
    sections.forEach(function(el){io.observe(el)});
  },1500); // wait for DOM paint

  // ── 3D / Canvas interaction tracking ──
  setTimeout(function(){
    var canvases=document.querySelectorAll("canvas");
    canvases.forEach(function(c){
      var dragging=false;
      c.addEventListener("pointerdown",function(){dragging=true},{passive:true});
      c.addEventListener("pointerup",function(){
        if(dragging){E("interaction_3d",{interaction_type:"3d_rotate",target:"canvas"},true);dragging=false}
      },{passive:true});
      c.addEventListener("wheel",function(){
        E("interaction_3d",{interaction_type:"3d_zoom",target:"canvas"},true);
      },{passive:true});
    });
  },2000);

  // ── Flush every 15s ──
  setInterval(flush,15000);

  // ── page_leave helper ──
  function doPageLeave(){
    sentOnce["page_leave"]=false;
    tick();
    flushSections();
    E("page_leave",{
      duration_ms:Date.now()-start,
      total_active_seconds:Math.round(activeMs/1000),
      scroll_depth:maxScroll,
      device_type:deviceInfo.device_type,
      viewport_w:window.innerWidth,
      viewport_h:window.innerHeight
    });
    flush();
  }

  // ── page_leave: final flush with totals ──
  window.addEventListener("beforeunload",doPageLeave);
  // pagehide is more reliable on iOS/mobile
  window.addEventListener("pagehide",doPageLeave);

  // ── Form interaction tracking (abandonment detection) ──
  var formInteracted=false;
  document.addEventListener("focusin",function(e){
    var el=e.target;
    if(el&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA"||el.tagName==="SELECT")){
      if(el.closest("form")&&!formInteracted){
        formInteracted=true;
        E("form_start",{field:el.name||el.type||"unknown"},false);
      }
    }
  });
  // Detect form_submit to mark completed (already tracked by click handler above)
  document.addEventListener("submit",function(e){
    formInteracted=false; // reset — submitted successfully
  });
  // On beforeunload, if formInteracted is still true → form_abandon
  window.addEventListener("beforeunload",function(){
    if(formInteracted){
      E("form_abandon",{},false);
    }
  });

  // ── Rage click detection (3+ clicks within 1s on same area) ──
  var clickLog=[];
  document.addEventListener("click",function(e){
    var now=Date.now();
    clickLog.push({t:now,x:e.clientX,y:e.clientY});
    // Keep only last 1s of clicks
    clickLog=clickLog.filter(function(c){return now-c.t<1000});
    if(clickLog.length>=3){
      // Check if clicks are in similar position (within 30px)
      var last=clickLog[clickLog.length-1];
      var nearby=clickLog.filter(function(c){
        return Math.abs(c.x-last.x)<30&&Math.abs(c.y-last.y)<30;
      });
      if(nearby.length>=3){
        var target=e.target;
        var tag=target?target.tagName:"unknown";
        var cls=target&&target.className?String(target.className).slice(0,50):"";
        E("rage_click",{x:last.x,y:last.y,tag:tag,cls:cls},true);
        clickLog=[];
      }
    }
  });

  // Also flush sections periodically (every 30s) in case of long visits
  setInterval(function(){
    flushSections();
    // Re-snapshot running timers (don't clear sectionStart here)
  },30000);

  // ── Web Vitals tracking (LCP, CLS, FID, TTFB) ──
  try{
    // Largest Contentful Paint
    new PerformanceObserver(function(list){
      var entries=list.getEntries();
      var last=entries[entries.length-1];
      if(last){
        E("web_vital",{metric:"LCP",value:Math.round(last.startTime),unit:"ms"},false);
      }
    }).observe({type:"largest-contentful-paint",buffered:true});
  }catch(e){}

  try{
    // First Input Delay
    new PerformanceObserver(function(list){
      var entries=list.getEntries();
      if(entries.length){
        E("web_vital",{metric:"FID",value:Math.round(entries[0].processingStart-entries[0].startTime),unit:"ms"},false);
      }
    }).observe({type:"first-input",buffered:true});
  }catch(e){}

  try{
    // Cumulative Layout Shift
    var clsScore=0;
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(entry){
        if(!entry.hadRecentInput)clsScore+=entry.value;
      });
    }).observe({type:"layout-shift",buffered:true});
    // Report CLS on page leave (captured via beforeunload above, but also on visibility hidden)
    document.addEventListener("visibilitychange",function(){
      if(document.visibilityState==="hidden"&&clsScore>0){
        E("web_vital",{metric:"CLS",value:Math.round(clsScore*1000)/1000,unit:"score"},false);
      }
    });
  }catch(e){}

  // TTFB (Time to First Byte)
  try{
    var navEntry=performance.getEntriesByType("navigation")[0];
    if(navEntry&&navEntry.responseStart>0){
      E("web_vital",{metric:"TTFB",value:Math.round(navEntry.responseStart),unit:"ms"},false);
    }
  }catch(e){}

  // ── JS Error tracking ──
  var errCount=0;
  window.addEventListener("error",function(ev){
    if(errCount>=5)return;
    errCount++;
    E("js_error",{
      message:String(ev.message||"").slice(0,200),
      source:String(ev.filename||"").slice(0,150),
      line:ev.lineno||0,
      col:ev.colno||0,
      type:"runtime"
    },true);
  });
  window.addEventListener("unhandledrejection",function(ev){
    if(errCount>=5)return;
    errCount++;
    var msg="";
    try{msg=ev.reason?String(ev.reason.message||ev.reason).slice(0,200):"Unknown"}catch(e2){msg="Unknown"}
    E("js_error",{message:msg,type:"promise"},true);
  });
})();
</script>`;

  const finalHtml = injectBeforeBodyClose(html, ctaHtml, trackingScript);

  return htmlResponse(finalHtml);
}
