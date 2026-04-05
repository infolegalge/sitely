import PortalProvider from "@/components/sections/portal/PortalProvider/PortalProvider";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalProvider>{children}</PortalProvider>;
}
