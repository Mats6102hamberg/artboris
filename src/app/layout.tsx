import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import GlobalNav from "@/components/GlobalNav";
import "./globals.css";

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
