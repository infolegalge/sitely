import type { NavItem, SceneConfig } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const SCENE_CONFIGS: Record<string, SceneConfig> = {
  "/": {
    blobColor: "#4f6ef7",
    blobScale: 1.0,
    blobOpacity: 0.1,
    cameraZ: 32,
    showTorusKnot: true,
    showSphere: true,
    floaterCount: 12,
    bloomIntensity: 0.4,
    scrollCameraEnabled: true,
  },
  "/services": {
    blobColor: "#8b5cf6",
    blobScale: 0.7,
    blobOpacity: 0.08,
    cameraZ: 38,
    showTorusKnot: true,
    showSphere: false,
    floaterCount: 8,
    bloomIntensity: 0.3,
    scrollCameraEnabled: true,
  },
  "/portfolio": {
    blobColor: "#06d6a0",
    blobScale: 0.5,
    blobOpacity: 0.06,
    cameraZ: 42,
    showTorusKnot: false,
    showSphere: true,
    floaterCount: 6,
    bloomIntensity: 0.2,
    scrollCameraEnabled: false,
  },
  "/about": {
    blobColor: "#4f6ef7",
    blobScale: 0.8,
    blobOpacity: 0.08,
    cameraZ: 36,
    showTorusKnot: false,
    showSphere: true,
    floaterCount: 8,
    bloomIntensity: 0.3,
    scrollCameraEnabled: true,
  },
  "/contact": {
    blobColor: "#8b5cf6",
    blobScale: 0.5,
    blobOpacity: 0.05,
    cameraZ: 40,
    showTorusKnot: false,
    showSphere: false,
    floaterCount: 4,
    bloomIntensity: 0.15,
    scrollCameraEnabled: false,
  },
};

export const DEFAULT_SCENE_CONFIG: SceneConfig = SCENE_CONFIGS["/"];
