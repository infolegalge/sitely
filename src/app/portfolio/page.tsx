import type { Metadata } from "next";
import PortfolioHero from "@/components/sections/portfolio/PortfolioHero/PortfolioHero";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Explore our 3D web projects — immersive, animated, and unforgettable.",
};

export default function PortfolioPage() {
  return <PortfolioHero />;
}
