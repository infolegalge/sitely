export type Theme = "dark" | "light";

export type SceneConfig = {
  blobColor: string;
  blobScale: number;
  blobOpacity: number;
  cameraZ: number;
  showTorusKnot: boolean;
  showSphere: boolean;
  floaterCount: number;
  bloomIntensity: number;
  scrollCameraEnabled: boolean;
};

export type NavItem = {
  label: string;
  href: string;
};

export type Service = {
  id: string;
  number: string;
  icon: string;
  title: string;
  description: string;
  tags: string[];
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  client: string;
  year: number;
  category: string;
  thumbnail: string;
  tags: string[];
  featured: boolean;
};

export type Testimonial = {
  id: string;
  name: string;
  company: string;
  initials: string;
  quote: string;
  rating: number;
};
