import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://roomsthatsell.com"),
  title: "RoomsThatSell offers Fast, MLS-Compliant Virtual Staging for Real Estate Agents",
  description:
    "Transform empty rooms into stunning staged photos in minutes. MLS-compliant virtual staging starting at $0.29/image. Save $500+ per listing vs traditional staging. Join 1000+ agents already on our waitlist.",
  keywords:
    "virtual staging, real estate staging, MLS compliant staging, home staging software, real estate marketing, property staging, virtual home staging, real estate agents, home staging cost",
  authors: [{ name: "RoomsThatSell" }],
  creator: "RoomsThatSell",
  publisher: "RoomsThatSell",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://roomsthatsell.com",
    title: "RoomsThatSell – Fast, MLS-Compliant Virtual Staging for Real Estate Agents",
    description:
      "Transform empty rooms into stunning staged photos in minutes. MLS-compliant virtual staging starting at $0.29/image. Save $500+ per listing vs traditional staging.",
    siteName: "RoomsThatSell",
    images: [
      {
        url: "https://roomsthatsell.com/rts-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RoomsThatSell - Virtual Staging Before and After",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoomsThatSell – Fast, MLS-Compliant Virtual Staging",
    description:
      "Transform empty rooms in minutes. MLS-compliant virtual staging from $0.29/image. Join 1000+ agents on our waitlist.",
    images: ["https://roomsthatsell.com/rts-twitter-img.jpg"],
    creator: "@roomsthatsell",
    site: "@roomsthatsell",
  },
  verification: {
    google: "QblvzaLbsJOAk1XypW-JrKxaPYvZxBCPLFkpSnBXciw",
  },
  category: "Real Estate Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="canonical" href="https://roomsthatsell.com" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "RoomsThatSell",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "MLS-compliant virtual staging software for real estate agents and brokerages. Fast, affordable, and consistent staging solution.",
              url: "https://roomsthatsell.com",
              author: {
                "@type": "Organization",
                name: "RoomsThatSell",
                url: "https://roomsthatsell.com",
              },
              offers: [
                {
                  "@type": "Offer",
                  name: "Agent Plan",
                  price: "29.00",
                  priceCurrency: "USD",
                  billingPeriod: "Month",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "29.00",
                    priceCurrency: "USD",
                    billingDuration: "P1M",
                  },
                  description: "100 images per month with MLS compliance tools",
                },
                {
                  "@type": "Offer",
                  name: "Pro Plan",
                  price: "49.00",
                  priceCurrency: "USD",
                  billingPeriod: "Month",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "49.00",
                    priceCurrency: "USD",
                    billingDuration: "P1M",
                  },
                  description: "300 images per month with flyer templates and 3 seats",
                },
              ],
              brand: {
                "@type": "Brand",
                name: "RoomsThatSell",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "150",
                bestRating: "5",
                worstRating: "1",
              },
              featureList: [
                "MLS-compliant virtual staging",
                "Batch image processing",
                "Style consistency palettes",
                "Before/after preview slider",
                "Watermark toggle",
                "Dual export options",
              ],
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
