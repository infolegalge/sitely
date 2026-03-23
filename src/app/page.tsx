import HeroSection from "@/components/sections/home/HeroSection/HeroSection";
import FeaturedWork from "@/components/sections/home/FeaturedWork/FeaturedWork";
import ServicesPreview from "@/components/sections/home/ServicesPreview/ServicesPreview";
import ProcessSection from "@/components/sections/home/ProcessSection/ProcessSection";
import Testimonials from "@/components/sections/home/Testimonials/Testimonials";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedWork />
      <ServicesPreview />
      <ProcessSection />
      <Testimonials />
    </>
  );
}
