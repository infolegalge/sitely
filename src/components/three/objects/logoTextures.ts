import * as THREE from "three";

/* ═══════════════════════════════════════════════════
   Web Development Logo Textures
   Canvas-rendered brand logos for the galactic orbit system
   ═══════════════════════════════════════════════════ */

// ─── Helpers ────────────────────────────────────────

function makeCtx(size = 512) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  return { c, ctx, cx: size / 2 };
}

function toTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function shieldPath(
  ctx: CanvasRenderingContext2D,
  cx: number, hw: number, ty: number, by: number, my: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx - hw, ty);
  ctx.lineTo(cx + hw, ty);
  ctx.lineTo(cx + hw * 0.78, my);
  ctx.lineTo(cx, by);
  ctx.lineTo(cx - hw * 0.78, my);
  ctx.closePath();
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function rrectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Shield-style logo factory ──────────────────────

function makeShieldLogo(
  colors: [string, string, string],  // gradient top, mid, bottom
  innerColors: [string, string],     // inner shield gradient
  glowColor: string,
  label: string,                     // top text e.g. "HTML"
  drawGlyph: (ctx: CanvasRenderingContext2D, cx: number) => void,
) {
  const { c, ctx, cx } = makeCtx();
  const hw = 150, ty = 55, by = 435, my = 400;

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;

  shieldPath(ctx, cx, hw, ty, by, my);
  const g = ctx.createLinearGradient(0, ty, 0, by);
  g.addColorStop(0, colors[0]);
  g.addColorStop(0.6, colors[1]);
  g.addColorStop(1, colors[2]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  const ins = 22;
  shieldPath(ctx, cx, hw - ins, ty + ins, by - 22, my - 12);
  const g2 = ctx.createLinearGradient(0, ty + ins, 0, by - 22);
  g2.addColorStop(0, innerColors[0]);
  g2.addColorStop(1, innerColors[1]);
  ctx.fillStyle = g2;
  ctx.fill();

  drawGlyph(ctx, cx);

  shieldPath(ctx, cx, hw, ty, by, my);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "bold 42px 'Arial Black', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.shadowBlur = 0;
  ctx.fillText(label, cx, ty + 52);

  return toTex(c);
}

// ─── Circle-style logo factory ──────────────────────

function makeCircleLogo(
  bg1: string, bg2: string,
  glowColor: string,
  text: string,
  textSize = 120,
  textColor = "#FFFFFF",
) {
  const { c, ctx, cx } = makeCtx();
  const r = 175;

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, bg1);
  g.addColorStop(1, bg2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cx, r - 16, 0, Math.PI * 2);
  const g2 = ctx.createLinearGradient(0, cx - r + 16, 0, cx + r - 16);
  g2.addColorStop(0, bg2);
  g2.addColorStop(1, bg1);
  ctx.fillStyle = g2;
  ctx.globalAlpha = 0.25;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Text
  ctx.font = `bold ${textSize}px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.fillText(text, cx, cx + 5);
  ctx.shadowBlur = 0;

  // Highlight outline
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// ─── Hexagon-style logo factory ─────────────────────

function makeHexLogo(
  bg1: string, bg2: string,
  glowColor: string,
  text: string,
  textSize = 120,
  textColor = "#FFFFFF",
) {
  const { c, ctx, cx } = makeCtx();
  const r = 185;

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;

  hexPath(ctx, cx, cx, r);
  const g = ctx.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, bg1);
  g.addColorStop(1, bg2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner hex
  hexPath(ctx, cx, cx, r - 18);
  const g2 = ctx.createLinearGradient(0, cx - r + 18, 0, cx + r - 18);
  g2.addColorStop(0, bg2);
  g2.addColorStop(1, bg1);
  ctx.fillStyle = g2;
  ctx.globalAlpha = 0.25;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `bold ${textSize}px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.fillText(text, cx, cx + 5);
  ctx.shadowBlur = 0;

  hexPath(ctx, cx, cx, r);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// ─── Rounded-rect logo factory ──────────────────────

function makeRRectLogo(
  bg1: string, bg2: string,
  glowColor: string,
  text: string,
  textSize = 120,
  textColor = "#FFFFFF",
) {
  const { c, ctx, cx } = makeCtx();
  const pad = 80, s = 512 - pad * 2, cr = 30;

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;

  rrectPath(ctx, pad, pad, s, s, cr);
  const g = ctx.createLinearGradient(0, pad, 0, pad + s);
  g.addColorStop(0, bg1);
  g.addColorStop(1, bg2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  const ins = 18;
  rrectPath(ctx, pad + ins, pad + ins, s - ins * 2, s - ins * 2, cr - 8);
  const g2 = ctx.createLinearGradient(0, pad + ins, 0, pad + s - ins);
  g2.addColorStop(0, bg2);
  g2.addColorStop(1, bg1);
  ctx.fillStyle = g2;
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `bold ${textSize}px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.fillText(text, cx, cx + 5);
  ctx.shadowBlur = 0;

  rrectPath(ctx, pad, pad, s, s, cr);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

/* ═══════════════════════════════════════════════════
   Individual Logo Textures
   ═══════════════════════════════════════════════════ */

// 1. HTML5 — orange shield + "5" glyph
function html5Tex() {
  return makeShieldLogo(
    ["#E44D26", "#F16529", "#E34F26"],
    ["#B73A18", "#C44522"],
    "rgba(255, 90, 20, 0.7)",
    "HTML",
    (ctx, cx) => {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#FFF";
      ctx.translate(cx, cx + 10);
      ctx.beginPath();
      ctx.moveTo(-62, -90); ctx.lineTo(58, -90); ctx.lineTo(52, -62); ctx.lineTo(-30, -62);
      ctx.lineTo(-36, -20); ctx.lineTo(-8, -28);
      ctx.quadraticCurveTo(60, -28, 64, 18);
      ctx.quadraticCurveTo(68, 68, 12, 92);
      ctx.quadraticCurveTo(-30, 108, -60, 82);
      ctx.lineTo(-40, 56);
      ctx.quadraticCurveTo(-14, 76, 12, 66);
      ctx.quadraticCurveTo(36, 56, 34, 24);
      ctx.quadraticCurveTo(32, -4, -4, -2);
      ctx.lineTo(-42, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  );
}

// 2. CSS3 — blue shield + "3" glyph
function css3Tex() {
  return makeShieldLogo(
    ["#264DE4", "#2965F1", "#2251CC"],
    ["#1B3BA0", "#1E44B8"],
    "rgba(30, 100, 255, 0.7)",
    "CSS",
    (ctx, cx) => {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#FFF";
      ctx.translate(cx, cx + 10);
      ctx.beginPath();
      ctx.moveTo(-48, -74);
      ctx.quadraticCurveTo(-10, -96, 24, -84);
      ctx.quadraticCurveTo(62, -70, 58, -34);
      ctx.quadraticCurveTo(56, -6, 18, -2);
      ctx.lineTo(24, 2);
      ctx.quadraticCurveTo(66, 8, 64, 42);
      ctx.quadraticCurveTo(62, 76, 16, 92);
      ctx.quadraticCurveTo(-22, 106, -56, 82);
      ctx.lineTo(-38, 56);
      ctx.quadraticCurveTo(-12, 78, 16, 66);
      ctx.quadraticCurveTo(36, 56, 34, 38);
      ctx.quadraticCurveTo(32, 20, 6, 22);
      ctx.lineTo(-16, 22);
      ctx.lineTo(-12, -2);
      ctx.lineTo(6, -6);
      ctx.quadraticCurveTo(30, -12, 28, -32);
      ctx.quadraticCurveTo(26, -52, 4, -60);
      ctx.quadraticCurveTo(-16, -70, -36, -52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  );
}

// 3. JavaScript — yellow shield + "JS" glyphs
function jsTex() {
  return makeShieldLogo(
    ["#F7DF1E", "#E8D218", "#D4BF16"],
    ["#C9B415", "#B8A410"],
    "rgba(247, 223, 30, 0.7)",
    "JS",
    (ctx, cx) => {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#FFF";
      ctx.translate(cx, cx + 10);
      // "J"
      ctx.beginPath();
      ctx.moveTo(-52, -80); ctx.lineTo(-20, -80); ctx.lineTo(-20, 26);
      ctx.quadraticCurveTo(-20, 62, -42, 72);
      ctx.quadraticCurveTo(-62, 82, -80, 66);
      ctx.lineTo(-66, 40);
      ctx.quadraticCurveTo(-52, 54, -40, 50);
      ctx.quadraticCurveTo(-28, 46, -28, 24);
      ctx.lineTo(-52, -80);
      ctx.closePath();
      ctx.fill();
      // "S"
      ctx.beginPath();
      ctx.moveTo(62, -54);
      ctx.quadraticCurveTo(36, -84, 6, -80);
      ctx.quadraticCurveTo(-24, -76, -24, -50);
      ctx.quadraticCurveTo(-24, -24, 10, -16);
      ctx.quadraticCurveTo(42, -8, 42, 14);
      ctx.quadraticCurveTo(42, 42, 14, 48);
      ctx.quadraticCurveTo(-14, 54, -30, 38);
      ctx.lineTo(-16, 64);
      ctx.quadraticCurveTo(14, 82, 44, 70);
      ctx.quadraticCurveTo(74, 56, 74, 18);
      ctx.quadraticCurveTo(74, -14, 34, -24);
      ctx.quadraticCurveTo(8, -32, 8, -48);
      ctx.quadraticCurveTo(8, -62, 30, -62);
      ctx.quadraticCurveTo(46, -62, 62, -54);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  );
}

// 4. TypeScript — blue rounded rect + "TS"
function tsTex() {
  return makeRRectLogo("#3178C6", "#235A9E", "rgba(49, 120, 198, 0.7)", "TS");
}

// 5. React — atom symbol (3 electron orbits + nucleus)
function reactTex() {
  const { c, ctx, cx } = makeCtx();
  const cy = cx;

  ctx.shadowColor = "rgba(97, 218, 251, 0.6)";
  ctx.shadowBlur = 40;

  const orbitRx = 155, orbitRy = 55;
  [0, Math.PI / 3, -Math.PI / 3].forEach((rot) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#61DAFB";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.restore();
  });
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = "#61DAFB";
  ctx.fill();

  const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
  ng.addColorStop(0, "rgba(255,255,255,0.5)");
  ng.addColorStop(0.5, "rgba(97,218,251,0.3)");
  ng.addColorStop(1, "rgba(97,218,251,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = ng;
  ctx.fill();

  return toTex(c);
}

// 6. Vue.js — nested chevrons
function vueTex() {
  const { c, ctx, cx } = makeCtx();

  ctx.shadowColor = "rgba(66, 184, 131, 0.7)";
  ctx.shadowBlur = 40;

  // Outer dark chevron
  ctx.beginPath();
  ctx.moveTo(cx, 400);
  ctx.lineTo(cx - 180, 80);
  ctx.lineTo(cx - 110, 80);
  ctx.lineTo(cx, 320);
  ctx.lineTo(cx + 110, 80);
  ctx.lineTo(cx + 180, 80);
  ctx.closePath();
  ctx.fillStyle = "#35495E";
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner green chevron
  ctx.beginPath();
  ctx.moveTo(cx, 320);
  ctx.lineTo(cx - 110, 80);
  ctx.lineTo(cx - 65, 80);
  ctx.lineTo(cx, 232);
  ctx.lineTo(cx + 65, 80);
  ctx.lineTo(cx + 110, 80);
  ctx.closePath();
  ctx.fillStyle = "#42B883";
  ctx.fill();

  // Subtle highlight on outer
  ctx.beginPath();
  ctx.moveTo(cx, 400);
  ctx.lineTo(cx - 180, 80);
  ctx.lineTo(cx + 180, 80);
  ctx.closePath();
  ctx.strokeStyle = "rgba(66,184,131,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// 7. Angular — red shield + "A"
function angularTex() {
  return makeShieldLogo(
    ["#DD0031", "#C3002F", "#B0002A"],
    ["#9A0025", "#850020"],
    "rgba(221, 0, 49, 0.7)",
    "NG",
    (ctx, cx) => {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#FFF";
      ctx.translate(cx, cx + 5);
      // "A" shape
      ctx.beginPath();
      ctx.moveTo(0, -85);
      ctx.lineTo(-55, 80);
      ctx.lineTo(-30, 80);
      ctx.lineTo(-18, 40);
      ctx.lineTo(18, 40);
      ctx.lineTo(30, 80);
      ctx.lineTo(55, 80);
      ctx.closePath();
      ctx.fill();
      // Cut out inside A
      ctx.fillStyle = "#C3002F";
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(-12, 20);
      ctx.lineTo(12, 20);
      ctx.closePath();
      ctx.fill();
      // Horizontal bar
      ctx.fillStyle = "#FFF";
      ctx.fillRect(-22, 24, 44, 10);
      ctx.restore();
    },
  );
}

// 8. Svelte — orange circle + "S"
function svelteTex() {
  return makeCircleLogo("#FF3E00", "#CC3200", "rgba(255, 62, 0, 0.7)", "S");
}

// 9. Node.js — green hexagon + "N"
function nodejsTex() {
  return makeHexLogo("#339933", "#2D7D2D", "rgba(51, 153, 51, 0.7)", "N");
}

// 10. Next.js — black circle + "N"
function nextjsTex() {
  const { c, ctx, cx } = makeCtx();
  const r = 175;

  ctx.shadowColor = "rgba(200, 200, 200, 0.5)";
  ctx.shadowBlur = 40;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, "#111111");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // "N" with gradient fade
  ctx.save();
  ctx.font = "bold 160px 'Arial Black', Arial, sans-serif";
  const tg = ctx.createLinearGradient(cx - 50, cx - 60, cx + 50, cx + 80);
  tg.addColorStop(0, "#FFFFFF");
  tg.addColorStop(0.7, "#FFFFFF");
  tg.addColorStop(1, "rgba(255,255,255,0.1)");
  ctx.fillStyle = tg;
  ctx.fillText("N", cx, cx + 8);
  ctx.restore();

  // White outline ring
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  return toTex(c);
}

// 11. Python — blue/yellow split circle
function pythonTex() {
  const { c, ctx, cx } = makeCtx();
  const r = 175;

  ctx.shadowColor = "rgba(55, 118, 171, 0.7)";
  ctx.shadowBlur = 40;

  // Top half — blue
  ctx.beginPath();
  ctx.arc(cx, cx, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = "#306998";
  ctx.fill();

  // Bottom half — yellow
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#FFD43B";
  ctx.fill();
  ctx.shadowBlur = 0;

  // Two intertwined snake heads (simplified)
  ctx.save();
  ctx.translate(cx, cx);
  // Blue snake (top-right)
  ctx.beginPath();
  ctx.arc(18, -30, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#306998";
  ctx.fill();
  // Yellow snake (bottom-left)
  ctx.beginPath();
  ctx.arc(-18, 30, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#FFD43B";
  ctx.fill();
  // Eyes
  ctx.beginPath();
  ctx.arc(24, -36, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-12, 24, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF";
  ctx.fill();
  ctx.restore();

  // "Py" text
  ctx.font = "bold 100px 'Arial Black', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 5;
  ctx.fillText("Py", cx, cx + 8);
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// 12. Tailwind CSS — cyan circle + wind wave
function tailwindTex() {
  const { c, ctx, cx } = makeCtx();
  const r = 175;

  ctx.shadowColor = "rgba(6, 182, 212, 0.7)";
  ctx.shadowBlur = 40;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, "#06B6D4");
  g.addColorStop(1, "#0891B2");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Simplified wind/wave icon
  ctx.save();
  ctx.translate(cx, cx);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";

  // Top wave
  ctx.beginPath();
  ctx.moveTo(-80, -25);
  ctx.quadraticCurveTo(-40, -65, 0, -25);
  ctx.quadraticCurveTo(40, 15, 80, -25);
  ctx.stroke();

  // Bottom wave
  ctx.beginPath();
  ctx.moveTo(-80, 25);
  ctx.quadraticCurveTo(-40, -15, 0, 25);
  ctx.quadraticCurveTo(40, 65, 80, 25);
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// 13. Sass — pink circle + "S"
function sassTex() {
  return makeCircleLogo("#CC6699", "#BF4080", "rgba(204, 102, 153, 0.7)", "S");
}

// 14. PHP — purple/blue circle + "php"
function phpTex() {
  return makeCircleLogo("#777BB4", "#5D5F99", "rgba(119, 123, 180, 0.7)", "php", 100);
}

// 15. MongoDB — green circle + leaf
function mongoTex() {
  const { c, ctx, cx } = makeCtx();
  const r = 175;

  ctx.shadowColor = "rgba(0, 104, 74, 0.7)";
  ctx.shadowBlur = 40;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, "#00684A");
  g.addColorStop(1, "#004D36");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Leaf shape
  ctx.save();
  ctx.translate(cx, cx);
  ctx.fillStyle = "#4FAA41";
  ctx.beginPath();
  ctx.moveTo(0, -100);
  ctx.quadraticCurveTo(50, -60, 45, 10);
  ctx.quadraticCurveTo(40, 60, 6, 90);
  ctx.lineTo(6, 100);
  ctx.lineTo(-6, 100);
  ctx.lineTo(-6, 90);
  ctx.quadraticCurveTo(-40, 60, -45, 10);
  ctx.quadraticCurveTo(-50, -60, 0, -100);
  ctx.closePath();
  ctx.fill();

  // Center vein
  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.lineTo(0, 85);
  ctx.strokeStyle = "#3B8C35";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// 16. Docker — blue circle + whale
function dockerTex() {
  const { c, ctx, cx } = makeCtx();
  const r = 175;

  ctx.shadowColor = "rgba(36, 150, 237, 0.7)";
  ctx.shadowBlur = 40;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, "#2496ED");
  g.addColorStop(1, "#1A7BC8");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Whale body (simplified)
  ctx.save();
  ctx.translate(cx, cx + 10);
  ctx.fillStyle = "#FFFFFF";

  // Whale body arc
  ctx.beginPath();
  ctx.ellipse(0, 10, 80, 40, 0, 0, Math.PI);
  ctx.fill();

  // Containers on top (3x2 grid of small squares)
  const bw = 22, bh = 18, gap = 4;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const bx = -38 + col * (bw + gap);
      const by = -30 + row * (bh + gap);
      ctx.fillRect(bx, by, bw, bh);
    }
  }
  // Extra container on top-right
  ctx.fillRect(-38 + 3 * (bw + gap), -30 + (bh + gap), bw, bh);

  // Whale tail
  ctx.beginPath();
  ctx.moveTo(-80, 10);
  ctx.quadraticCurveTo(-100, -20, -85, -40);
  ctx.quadraticCurveTo(-75, -20, -70, 0);
  ctx.closePath();
  ctx.fill();

  // Water spray
  ctx.beginPath();
  ctx.arc(55, -40, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(65, -52, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(50, -55, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return toTex(c);
}

// 17. Git — orange-red diamond + branch
function gitTex() {
  const { c, ctx, cx } = makeCtx();

  ctx.shadowColor = "rgba(240, 80, 50, 0.7)";
  ctx.shadowBlur = 40;

  // Diamond (rotated square)
  ctx.save();
  ctx.translate(cx, cx);
  ctx.rotate(Math.PI / 4);
  rrectPath(ctx, -120, -120, 240, 240, 20);
  const g = ctx.createLinearGradient(-120, -120, 120, 120);
  g.addColorStop(0, "#F05032");
  g.addColorStop(1, "#DE3C1E");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner diamond
  rrectPath(ctx, -102, -102, 204, 204, 14);
  ctx.fillStyle = "rgba(180, 40, 20, 0.25)";
  ctx.fill();
  ctx.restore();

  // Branch icon (simplified)
  ctx.save();
  ctx.translate(cx, cx);
  ctx.strokeStyle = "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  // Main vertical line
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(0, 60);
  ctx.stroke();

  // Branch line
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.quadraticCurveTo(35, -20, 40, -50);
  ctx.stroke();

  // Dots
  ctx.beginPath(); ctx.arc(0, -60, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 60, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, -50, 12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  return toTex(c);
}

/* ═══════════════════════════════════════════════════
   Main export — creates all textures at once
   ═══════════════════════════════════════════════════ */

export function createLogoTextures(): Record<string, THREE.CanvasTexture> {
  return {
    html5: html5Tex(),
    css3: css3Tex(),
    js: jsTex(),
    ts: tsTex(),
    react: reactTex(),
    vue: vueTex(),
    angular: angularTex(),
    svelte: svelteTex(),
    nodejs: nodejsTex(),
    nextjs: nextjsTex(),
    python: pythonTex(),
    tailwind: tailwindTex(),
    sass: sassTex(),
    php: phpTex(),
    mongodb: mongoTex(),
    docker: dockerTex(),
    git: gitTex(),
  };
}
