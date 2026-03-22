import type { Metadata } from "next";
import ServicesHero from "@/components/sections/services/ServicesHero/ServicesHero";

export const metadata: Metadata = {
  title: "Services",
  description: "Our 3D web development services — design, animation, and immersive experiences.",
};

export default function ServicesPage() {
  return <ServicesHero />;
}
