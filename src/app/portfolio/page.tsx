import type { Metadata } from "next";
import PortfolioHero from "@/components/sections/portfolio/PortfolioHero/PortfolioHero";
import ProjectGrid from "@/components/sections/portfolio/ProjectGrid/ProjectGrid";
import CaseStudySpotlight from "@/components/sections/portfolio/CaseStudySpotlight/CaseStudySpotlight";
import TechMarquee from "@/components/sections/portfolio/TechMarquee/TechMarquee";
import ClientVoices from "@/components/sections/portfolio/ClientVoices/ClientVoices";
import PortfolioCTA from "@/components/sections/portfolio/PortfolioCTA/PortfolioCTA";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Explore our 3D web projects — immersive, animated, and unforgettable.",
};

export default function PortfolioPage() {
  return (
    <>
      <PortfolioHero />
      <ProjectGrid />
      <CaseStudySpotlight />
      <TechMarquee />
      <ClientVoices />
      <PortfolioCTA />
    </>
  );
}
