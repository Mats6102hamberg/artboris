import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import Providers from "@/components/Providers";
import GlobalNav from "@/components/GlobalNav";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const geistSans = localFont({
  src: "../../public/fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Artboris — Handpicked prints for your walls",
    template: "%s | Artboris",
  },
  description:
    "Discover handpicked prints from artists and photographers. Museum-quality printing, try art on your wall, and order — all in one place.",
  metadataBase: new URL("https://artboris.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <Providers>
          {children}
          <GlobalNav />
        </Providers>
      </body>
    </html>
  );
}
