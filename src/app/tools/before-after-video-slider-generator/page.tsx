import type { Metadata } from "next";
import Link from "next/link";
import { BeforeAfterVideoTool } from "./BeforeAfterVideoTool";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Before After Video Maker | Free Before After Slider Video Generator",
  description:
    "Create eye-catching before and after slider videos for real estate, renovations, or design projects in minutes. Upload two photos, preview the slider, and download an MP4 ready for social media.",
  alternates: {
    canonical: "https://roomsthatsell.com/tools/before-after-video-slider-generator",
  },
  openGraph: {
    title: "Before After Video Maker by Rooms That Sell",
    description:
      "Generate before and after slider videos that showcase your transformations. Free tool with instant preview and MP4 download.",
    url: "https://roomsthatsell.com/tools/before-after-video-slider-generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Before After Slider Video Generator",
    description: "Turn before and after photos into scroll-stopping slider videos in seconds.",
  },
};

export default function BeforeAfterVideoGeneratorPage() {
  return (
    <main className="min-h-screen bg-neutral-950 py-20 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6">
        <section className="space-y-6 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-primary/70">Free real estate marketing tool</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Before & After Slider Video Maker
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-white/70">
            Turn your before/after photos into a smooth slider reveal video that performs on Instagram, TikTok, and listing presentations. Upload two images, preview the interactive slider, then export an MP4 you can download instantly.
          </p>
        </section>

        <BeforeAfterVideoTool />

        <Card className="border-white/10 bg-neutral-900/50">
          <CardContent className="grid gap-8 p-8 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-semibold">Optimized for Realtors</h2>
              <p className="mt-3 text-sm text-white/70">
                Crafted by the Rooms That Sell team to help agents, brokers, and photographers showcase renovations, virtual staging, and listing transformations.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">FFmpeg-powered render</h2>
              <p className="mt-3 text-sm text-white/70">
                We resize and align both images automatically, then generate a 1080p MP4 slider animation ready for social media and email marketing.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Save your spot</h2>
              <p className="mt-3 text-sm text-white/70">
                Prefer full virtual staging instead of just sliders? <Link href="/" className="text-primary underline">Join Rooms That Sell</Link> to access MLS-compliant staging workflows.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
