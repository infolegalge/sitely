/**
 * Hero "Shattered Glass Big Bang" — cinematic sound effects
 *
 * Architecture:
 * - All sounds route through a master GainNode for instant mute/unmute
 * - Animation wall-clock time is stored so sounds can be scheduled late
 *   (e.g., when user enables sound mid-animation)
 * - If AudioContext is locked (no user gesture yet), scheduling is
 *   deferred until unlock or toggle-ON
 */

let _ctx: AudioContext | null = null;
let _unlocked = false;
let _muted = true;
let _master: GainNode | null = null;

// Animation timing
let _animStartWall: number | null = null;
let _scheduled = false;

const STORAGE_KEY = "sitely-sound";

/* ── Persistence ── */

export function loadSoundPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSoundPreference(on: boolean) {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/* ── Audio context management ── */

export function initAudio() {
  if (_unlocked) return;
  const events = ["click", "touchstart", "keydown"] as const;
  const handler = () => {
    _doUnlock();
    events.forEach((e) => document.removeEventListener(e, handler));
  };
  events.forEach((e) =>
    document.addEventListener(e, handler, { once: false, passive: true }),
  );
}

function _doUnlock() {
  if (_unlocked) return;
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  _unlocked = true;
  // Sounds may have been waiting for AC to unlock
  _attemptSchedule();
}

export function isAudioUnlocked() {
  return _unlocked;
}

export function setMuted(muted: boolean) {
  _muted = muted;

  if (!muted) {
    // Ensure AudioContext exists and try to resume
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === "suspended") {
      _ctx.resume().then(() => {
        _unlocked = true;
        _updateMasterGain();
        _attemptSchedule();
      });
    }
    _attemptSchedule();
  }

  _updateMasterGain();
}

function _updateMasterGain() {
  if (_master && _ctx?.state === "running") {
    _master.gain.setValueAtTime(_muted ? 0 : 1, _ctx.currentTime);
  }
}

function _ensureMaster(ac: AudioContext): GainNode {
  if (!_master) {
    _master = ac.createGain();
    _master.connect(ac.destination);
  }
  return _master;
}

/* ── Helpers ── */

function noise(ac: AudioContext, dur: number): AudioBufferSourceNode {
  const len = Math.max(1, Math.round(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

/* ═══════════════════════════════════════════════════════════
   SOUND SCHEDULING

   Timeline (animation seconds):
     3.0–3.85s  Glass cracking
     4.0–5.8s   Wind carrying ash away

   playFullSequence() stores the wall-clock start time.
   _attemptSchedule() tries to schedule sounds on AudioContext.
   If AC is not ready (suspended), it retries automatically
   when AC unlocks (user gesture) or when toggle is turned ON.
   ═══════════════════════════════════════════════════════════ */

/** Called by GSAP at animation start (timeline position 0) */
export function playFullSequence() {
  _animStartWall = Date.now();
  _scheduled = false;
  _attemptSchedule();
}

/** Try to schedule sounds. Safe to call multiple times — only runs once per animation. */
function _attemptSchedule() {
  if (_scheduled || _animStartWall === null) return;

  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  if (_ctx.state !== "running") return; // Still locked — will retry on unlock or toggle

  const elapsed = (Date.now() - _animStartWall) / 1000;
  if (elapsed > 6) return; // Animation is over, nothing to play

  _scheduled = true;
  const ac = _ctx;
  const now = ac.currentTime;
  const out = _ensureMaster(ac);
  out.gain.setValueAtTime(_muted ? 0 : 1, now);

  // at(animSec) → AudioContext scheduled time for that animation moment
  const at = (animSec: number) => now + (animSec - elapsed);

  _scheduleCracking(ac, out, now, at, elapsed);
  _scheduleWindPhase(ac, out, now, at, elapsed);
}

/* ─── GLASS CRACKING (anim 3.0–3.85s) ─── */

function _scheduleCracking(
  ac: AudioContext,
  out: GainNode,
  now: number,
  at: (s: number) => number,
  elapsed: number,
) {
  if (elapsed >= 3.9) return;

  // Initial sharp crack
  if (elapsed < 3.05) {
    const s = Math.max(at(3.0), now);
    const crack0 = noise(ac, 0.05);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.28, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + 0.05);
    crack0.connect(g).connect(out);
    crack0.start(s);
    crack0.stop(s + 0.05);
  }

  // Spreading micro-cracks
  const offsets = [0.07, 0.13, 0.2, 0.28, 0.38, 0.5, 0.6, 0.72, 0.85];
  offsets.forEach((off) => {
    const animT = 3.0 + off;
    const dur = 0.025 + Math.random() * 0.03;
    if (elapsed >= animT + dur) return;

    const s = Math.max(at(animT), now);
    const n = noise(ac, dur);
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2500 + Math.random() * 3500;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.06 + Math.random() * 0.1, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + dur);
    n.connect(hp).connect(g).connect(out);
    n.start(s);
    n.stop(s + dur);
  });
}

/* ─── WIND + ASH + BREATH (anim 4.0–5.8s) ─── */

function _scheduleWindPhase(
  ac: AudioContext,
  out: GainNode,
  now: number,
  at: (s: number) => number,
  elapsed: number,
) {
  if (elapsed >= 5.8) return;

  // --- Wind gust (4.0–5.8s) ---
  const joining = elapsed > 4.0;
  const ws = joining ? now : at(4.0);
  const we = at(5.8);
  const wDur = we - ws;

  if (wDur > 0.1) {
    const wind = noise(ac, wDur);
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    const wg = ac.createGain();

    if (joining) {
      const p = (elapsed - 4.0) / 1.8;
      const freq =
        p < 0.33
          ? 200 + p * 3 * 300
          : Math.max(250, 500 - (p - 0.33) * 1.5 * 250);
      bp.frequency.setValueAtTime(freq, ws);
      bp.frequency.exponentialRampToValueAtTime(250, we);
      bp.Q.value = 0.3;
      const vol =
        p < 0.67 ? 0.06 : Math.max(0.005, 0.06 - (p - 0.67) * 3 * 0.03);
      wg.gain.setValueAtTime(vol, ws);
      wg.gain.exponentialRampToValueAtTime(0.001, we);
    } else {
      bp.frequency.setValueAtTime(200, ws);
      bp.frequency.exponentialRampToValueAtTime(500, at(4.6));
      bp.frequency.exponentialRampToValueAtTime(250, at(5.5));
      bp.Q.setValueAtTime(0.4, ws);
      bp.Q.linearRampToValueAtTime(0.2, at(5.5));
      wg.gain.setValueAtTime(0, ws);
      wg.gain.linearRampToValueAtTime(0.06, at(4.3));
      wg.gain.setValueAtTime(0.06, at(4.6));
      wg.gain.linearRampToValueAtTime(0.03, at(5.2));
      wg.gain.exponentialRampToValueAtTime(0.001, we);
    }

    wind.connect(bp).connect(wg).connect(out);
    wind.start(ws);
    wind.stop(we);
  }

  // --- Ash particles ---
  for (let i = 0; i < 6; i++) {
    const off = 4.1 + i * 0.25 + Math.random() * 0.1;
    if (off > 5.4 || elapsed >= off + 0.04) continue;

    const s = Math.max(at(off), now);
    const grain = noise(ac, 0.04);
    const gbp = ac.createBiquadFilter();
    gbp.type = "bandpass";
    gbp.frequency.value = 1500 + Math.random() * 1500;
    gbp.Q.value = 2;
    const gg = ac.createGain();
    gg.gain.setValueAtTime(0.02 + Math.random() * 0.015, s);
    gg.gain.exponentialRampToValueAtTime(0.001, s + 0.04);
    grain.connect(gbp).connect(gg).connect(out);
    grain.start(s);
    grain.stop(s + 0.04);
  }

  // --- Breath (4.2–5.7s) ---
  if (elapsed < 5.7) {
    const bJoin = elapsed > 4.2;
    const bs = bJoin ? now : at(4.2);
    const be = at(5.7);
    const bDur = be - bs;

    if (bDur > 0.1) {
      const breath = noise(ac, bDur);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      const bg = ac.createGain();

      if (bJoin) {
        const p = (elapsed - 4.2) / 1.5;
        const freq = Math.max(150, 400 - p * 250);
        lp.frequency.setValueAtTime(freq, bs);
        lp.frequency.exponentialRampToValueAtTime(150, be);
        const vol =
          p < 0.2
            ? 0.035 * p * 5
            : Math.max(0.005, 0.035 - (p - 0.2) * 0.02);
        bg.gain.setValueAtTime(vol, bs);
        bg.gain.exponentialRampToValueAtTime(0.001, be);
      } else {
        lp.frequency.setValueAtTime(400, bs);
        lp.frequency.exponentialRampToValueAtTime(150, at(5.6));
        bg.gain.setValueAtTime(0, bs);
        bg.gain.linearRampToValueAtTime(0.035, at(4.5));
        bg.gain.linearRampToValueAtTime(0.02, at(5.2));
        bg.gain.exponentialRampToValueAtTime(0.001, be);
      }

      breath.connect(lp).connect(bg).connect(out);
      breath.start(bs);
      breath.stop(at(5.8));
    }
  }
}
