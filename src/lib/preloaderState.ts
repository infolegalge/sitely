/**
 * Module-level flag for preloader state.
 * Resets on hard reload (JS re-executes), persists across client-side navigation.
 * This replaces sessionStorage so the preloader + Big Bang animation
 * always runs on every page refresh.
 */

let _loaded = false;

export function isAlreadyLoaded() {
  return _loaded;
}

export function markLoaded() {
  _loaded = true;
}
