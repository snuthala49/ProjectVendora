import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vendora — IT Outage Intelligence",
  description:
    "Real-time outage monitoring for AWS, Azure, Microsoft 365, Google Cloud, Salesforce, ServiceNow, CrowdStrike, Okta, Cloudflare, GitHub, Zoom, Slack, Broadcom and more.",
  keywords: [
    "outage monitoring",
    "IT status",
    "SaaS status",
    "cloud outage",
    "incident tracker",
  ],
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
