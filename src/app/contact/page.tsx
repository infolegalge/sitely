import type { Metadata } from "next";
import ContactHero from "@/components/sections/contact/ContactHero/ContactHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start your 3D web project with Sitely — get in touch today.",
};

export default function ContactPage() {
  return <ContactHero />;
}
