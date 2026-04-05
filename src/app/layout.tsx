import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import LenisProvider from "@/components/providers/LenisProvider";
import SceneProvider from "@/components/providers/SceneProvider";
import HideOnCms from "@/components/providers/HideOnCms/HideOnCms";
import ContentWrapper from "@/components/providers/ContentWrapper/ContentWrapper";
import Navbar from "@/components/layout/Navbar/Navbar";
import ScrollProgress from "@/components/layout/ScrollProgress/ScrollProgress";
import NoiseOverlay from "@/components/layout/NoiseOverlay/NoiseOverlay";
import CustomCursor from "@/components/layout/CustomCursor/CustomCursor";
import Preloader from "@/components/layout/Preloader/Preloader";
import ScrollToTop from "@/components/layout/ScrollToTop/ScrollToTop";
import SoundToggle from "@/components/layout/SoundToggle/SoundToggle";
import SideNav from "@/components/layout/SideNav/SideNav";
import SceneCanvasLoader from "@/components/three/SceneCanvasLoader";
import LeadReceiver from "@/components/layout/LeadReceiver/LeadReceiver";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Sitely",
    default: "Sitely — We Build Websites in Three Dimensions",
  },
  description:
    "3D web development studio. Immersive websites with stunning animations, interactive 3D scenes, and cutting-edge design.",
  keywords: [
    "3D websites",
    "web development",
    "Three.js",
    "interactive design",
    "web studio",
    "Next.js",
  ],
  authors: [{ name: "Sitely" }],
  creator: "Sitely",
  openGraph: {
    type: "website",
    siteName: "Sitely",
    title: "Sitely — We Build Websites in Three Dimensions",
    description:
      "3D web development studio. Immersive websites with stunning animations and cutting-edge design.",
  },
};

export const viewport: Viewport = {
  themeColor: "#06060b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider>
          <LenisProvider>
            <SceneProvider>
              <HideOnCms>
                <SceneCanvasLoader />
                <NoiseOverlay />
                <CustomCursor />
                <ScrollProgress />
                <Navbar />
                <SoundToggle />
                <SideNav />
                <Preloader />
              </HideOnCms>
              <a href="#main" className="skip-to-content">
                Skip to content
              </a>
              <ContentWrapper>
                {children}
              </ContentWrapper>
              <HideOnCms>
                <ScrollToTop />
                <Suspense fallback={null}>
                  <LeadReceiver />
                </Suspense>
              </HideOnCms>
            </SceneProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
