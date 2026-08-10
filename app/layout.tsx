import type { Metadata } from "next";
import { IBM_Plex_Mono, Teko } from "next/font/google";

import "./globals.css";

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "F1 Apex",
  description:
    "Formula 1 race replay and lap telemetry comparison. Watch drivers on track or compare speed, throttle, brake and gear traces.",
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : undefined,
  openGraph: {
    title: "F1 Apex",
    description:
      "Formula 1 race replay and lap telemetry comparison. Watch drivers on track or compare synchronized telemetry traces.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${teko.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
