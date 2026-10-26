import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import ClosureBanner from "@/components/closure-banner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || defaultUrl;

export const viewport = { width: "device-width", initialScale: 1 };

export const metadata = {
  metadataBase: new URL(appUrl),
  title: "cal.ad | Closed to new users",
  description: "cal.ad is no longer accepting new sign-ups. Thank you to everyone who tried it.",
  openGraph: {
    title: "cal.ad | Closed to new users",
    description: "cal.ad is no longer accepting new sign-ups. Thank you to everyone who tried it.",
    url: appUrl,
    siteName: "cal.ad",
    images: [
      {
        url: `${appUrl}/opengraph.jpg`,
        width: 1200,
        height: 630,
        alt: "cal.ad - Your Calendar Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cal.ad | Closed to new users",
    description: "cal.ad is no longer accepting new sign-ups. Thank you to everyone who tried it.",
    images: [`${appUrl}/opengraph.jpg`],
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="cal.ad" />

      </head>
      <body className="text-foreground font-inter">
        <ClosureBanner />
        <Providers>
          <main className="min-h-[calc(100dvh-var(--closure-banner-height))]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
