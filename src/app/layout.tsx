import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import GlobalNav from "@/components/GlobalNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Artboris — Din kreativa plattform för väggkonst",
    template: "%s | Artboris",
  },
  description:
    "Skapa AI-genererad konst, upptäck lokala konstnärer, prova tavlor på din vägg och hitta undervärderade konstverk. Allt på ett ställe.",
  metadataBase: new URL("https://artboris.se"),
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Artboris",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <GlobalNav />
        </Providers>
      </body>
    </html>
  );
}
