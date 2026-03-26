import type { Metadata } from "next";
import HiddenLogin from "@/components/sections/auth/HiddenLogin/HiddenLogin";

export const metadata: Metadata = {
  title: "Private Login",
  description: "Private login route for internal access.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HiddenLoginPage() {
  return <HiddenLogin />;
}
