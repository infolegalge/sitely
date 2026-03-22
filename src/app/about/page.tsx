import type { Metadata } from "next";
import AboutHero from "@/components/sections/about/AboutHero/AboutHero";

export const metadata: Metadata = {
  title: "About",
  description: "Meet the team behind Sitely — crafting immersive 3D web experiences.",
};

export default function AboutPage() {
  return <AboutHero />;
}
