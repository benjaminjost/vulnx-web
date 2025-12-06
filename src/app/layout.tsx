import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "VulnLens – CVE Search",
  description:
    "Search and explore CVEs, vulnerabilities, security advisories, and exploit databases. CVE lookup tool powered by the ProjectDiscovery API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
