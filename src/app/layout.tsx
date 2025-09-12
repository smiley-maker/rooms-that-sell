import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "RoomsThatSell – Fast, MLS-Compliant Virtual Staging for Real Estate Agents",
  description: "Transform empty rooms into stunning staged photos in minutes. MLS-compliant virtual staging starting at $0.29/image. Save $500+ per listing vs traditional staging. Join 1000+ agents already on our waitlist.",
  keywords: "virtual staging, real estate staging, MLS compliant staging, home staging software, real estate marketing, property staging, virtual home staging, real estate agents, home staging cost",
  authors: [{ name: "RoomsThatSell" }],
  creator: "RoomsThatSell",
  publisher: "RoomsThatSell",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://roomsthatsell.com",
    title: "RoomsThatSell – Fast, MLS-Compliant Virtual Staging for Real Estate Agents",
    description: "Transform empty rooms into stunning staged photos in minutes. MLS-compliant virtual staging starting at $0.29/image. Save $500+ per listing vs traditional staging.",
    siteName: "RoomsThatSell",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RoomsThatSell - Virtual Staging Before and After",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoomsThatSell – Fast, MLS-Compliant Virtual Staging",
    description: "Transform empty rooms in minutes. MLS-compliant virtual staging from $0.29/image. Join 1000+ agents on our waitlist.",
    images: ["/twitter-image.jpg"],
    creator: "@roomsthatsell",
  },
  verification: {
    google: "your-google-verification-code",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "RoomsThatSell",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "MLS-compliant virtual staging software for real estate agents and brokerages. Fast, affordable, and consistent staging solution.",
              url: "https://roomsthatsell.com",
              author: {
                "@type": "Organization",
                name: "RoomsThatSell",
                url: "https://roomsthatsell.com"
              },
              offers: [
                {
                  "@type": "Offer",
                  name: "Agent Plan",
                  price: "29.00",
                  priceCurrency: "USD",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "29.00",
                    priceCurrency: "USD",
                    billingDuration: "P1M"
                  },
                  description: "100 images per month with MLS compliance tools"
                },
                {
                  "@type": "Offer", 
                  name: "Pro Plan",
                  price: "49.00",
                  priceCurrency: "USD",
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: "49.00", 
                    priceCurrency: "USD",
                    billingDuration: "P1M"
                  },
                  description: "300 images per month with flyer templates and 3 seats"
                }
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
                worstRating: "1"
              },
              featureList: [
                "MLS-compliant virtual staging",
                "Batch image processing", 
                "Style consistency palettes",
                "Before/after preview slider",
                "Watermark toggle",
                "Dual export options"
              ]
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
