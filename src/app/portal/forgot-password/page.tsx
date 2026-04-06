import type { Metadata } from "next";
import ForgotPassword from "@/components/sections/portal/ForgotPassword/ForgotPassword";

export const metadata: Metadata = {
  title: "პაროლის აღდგენა — Sitely",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForgotPassword />;
}
