import type { Metadata } from "next";
import ServicesHero from "@/components/sections/services/ServicesHero/ServicesHero";
import IndustryShowcase from "@/components/sections/services/IndustryShowcase/IndustryShowcase";
import ServiceDeepDive from "@/components/sections/services/ServiceDeepDive/ServiceDeepDive";
import ClientJourney from "@/components/sections/services/ClientJourney/ClientJourney";
import ResultsProof from "@/components/sections/services/ResultsProof/ResultsProof";
import ServicesCTA from "@/components/sections/services/ServicesCTA/ServicesCTA";

export const metadata: Metadata = {
  title: "Services | Sitely",
  description:
    "Premium 3D web development services — design, animation, e-commerce, and immersive digital experiences. Delivery in 2 weeks.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <IndustryShowcase />
      <ServiceDeepDive />
      <ClientJourney />
      <ResultsProof />
      <ServicesCTA />
    </>
  );
}
