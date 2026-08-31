import type { Metadata } from "next";
import { Fraunces, Noto_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";

import { SiteHeaderHost } from "@/components/site-header-host";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dental Care",
  description: "Premium dental care.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${fraunces.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <SiteHeaderHost />
        {children}
      </body>
    </html>
  );
}
