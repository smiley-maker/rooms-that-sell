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
  description: "Stage empty rooms in minutes. MLS-compliant, affordable, and agent-friendly. Join the waitlist today.",
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
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "RoomsThatSell",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "MLS-compliant virtual staging software for real estate agents and brokerages. Fast, affordable, and consistent.",
              offers: {
                "@type": "Offer",
                price: "29.00",
                priceCurrency: "USD",
              },
              brand: {
                "@type": "Brand",
                name: "RoomsThatSell",
              },
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
