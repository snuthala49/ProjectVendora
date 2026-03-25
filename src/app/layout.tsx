import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OutageIntel — Real-Time IT Outage Intelligence",
  description:
    "Live outage monitoring for AWS, Azure, Google Cloud, Microsoft 365, CrowdStrike, Salesforce, ServiceNow and more.",
  keywords: [
    "outage monitoring",
    "IT status",
    "SaaS status",
    "cloud outage",
    "incident tracker",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "OutageIntel",
    description: "Your intelligence feed for enterprise IT outages.",
    url: "https://outageintel.org",
    siteName: "OutageIntel",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
