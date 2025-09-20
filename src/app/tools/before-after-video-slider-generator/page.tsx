import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { BeforeAfterVideoTool } from "./BeforeAfterVideoTool";

export const metadata: Metadata = {
  title: "Before After Video Maker | Free Before After Slider Video Generator",
  description:
    "Create eye-catching before and after slider videos for real estate, renovations, or design projects in minutes. Upload two photos, preview the slider, and download an MP4 ready for social media.",
  alternates: {
    canonical: "https://roomsthatsell.com/tools/before-after-video-slider-generator",
  },
  keywords: [
    "before and after video maker",
    "before after slider",
    "before after video generator",
    "real estate marketing video",
    "virtual staging tools",
  ],
  openGraph: {
    title: "Before After Video Maker by Rooms That Sell",
    description:
      "Generate before and after slider videos that showcase your transformations. Free tool with instant preview and MP4 download.",
    url: "https://roomsthatsell.com/tools/before-after-video-slider-generator",
    type: "website",
    images: [
      {
        url: "https://roomsthatsell.com/rts-og-image.jpg",
        alt: "Before and after video maker preview by Rooms That Sell",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Before After Slider Video Generator",
    description: "Turn before and after photos into scroll-stopping slider videos in seconds.",
    images: ["https://roomsthatsell.com/rts-twitter-img.jpg"],
  },
};

export default function BeforeAfterVideoGeneratorPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I create a before and after slider video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Upload your before and after photos, preview the slider, then request the MP4 download. We email the finished video as soon as it renders.'
        },
      },
      {
        '@type': 'Question',
        name: 'Is the before and after video generator free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, the Rooms That Sell before & after video maker is free. We only ask for an email so we can send the finished video and product updates.'
        },
      },
      {
        '@type': 'Question',
        name: 'What file types work best?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support JPEG, PNG, and WebP images up to 15MB. This keeps the render fast while preserving quality.'
        },
      },
      {
        '@type': 'Question',
        name: 'Why do before and after videos work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Before/after visuals highlight the transformation in seconds, holding attention longer and increasing trust with prospective buyers and sellers.'
        },
      },
      {
        '@type': 'Question',
        name: 'Where should I share my before and after video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Instagram Reels, TikTok, YouTube Shorts, listing presentations, and email campaigns see the strongest performance from slider videos.'
        },
      },
      {
        '@type': 'Question',
        name: 'How do real estate agents use before and after video reveals?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Agents add slider videos to listing pages, pitch decks, and social feeds to demonstrate staging expertise and capture more seller leads.'
        },
      },
    ],
  } as const;

  return (
    <main className="min-h-screen bg-[#F3F2F2] text-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 pb-24 pt-20 md:gap-24 md:pb-32 md:pt-28">
        <section className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-8 lg:max-w-2xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Image
                  src="/android-chrome-512x512.png"
                  alt="Rooms That Sell icon"
                  width={64}
                  height={64}
                  className="h-12 w-12 rounded-xl bg-white object-contain p-2 shadow-sm"
                  priority
                />
                <Link
                  href="/"
                  className="text-lg font-semibold text-[#4A6B85] transition hover:text-[#3d5a70]"
                >
                  RoomsThatSell
                </Link>
              </div>
              <span className="text-sm font-medium uppercase tracking-[0.35em] text-neutral-600">
                Free real estate marketing tool
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Before &amp; After Slider Video Generator
              </h1>
              <p className="text-lg text-neutral-700 md:text-xl">
                Turn transformation photos into scroll-stopping videos that perform on Instagram, TikTok, and listing presentations. Upload your before/after images, see the slider instantly, then request the MP4 ready for download.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-neutral-700 md:grid-cols-2">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-[#4A6B85]">Fast renders</p>
                <p className="mt-1">Video files delivered in your inbox within minutes of submission.</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-[#4A6B85]">MLS-friendly output</p>
                <p className="mt-1">1080p MP4 that showcases renovations, staging, and design highlights.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#video-generator"
                className="inline-flex items-center justify-center rounded-full bg-[#4A6B85] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md transition hover:bg-[#3d5a70]"
              >
                Launch the video maker
              </a>
              <Link href="/" className="text-sm font-semibold text-[#4A6B85] underline-offset-4 hover:underline">
                Explore Rooms That Sell →
              </Link>
            </div>
          </div>
          <div className="relative -mx-6 overflow-hidden rounded-3xl border border-black/10 bg-black shadow-2xl lg:mx-0 lg:-mr-24 lg:h-[520px] lg:w-full lg:max-w-2xl">
            <video
              className="h-full w-full object-cover"
              src="/images/example_video.mp4"
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="Before and after slider video preview"
            />
            <div className="pointer-events-none absolute left-8 top-8 flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#4A6B85] shadow-lg">
              <span>Slider video preview</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg md:p-8">
          <h2 className="text-lg font-semibold text-[#4A6B85]">Why agents use this tool</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-700">
            <li>• Showcase before/after transformations without editing software.</li>
            <li>• Align images automatically for a smooth slider reveal.</li>
            <li>• Download polished MP4s made for social media algorithms.</li>
            <li>• Collect more listing leads with professional visuals.</li>
          </ul>
          <p className="mt-6 text-sm text-neutral-500">
            Optimized for virtual staging teams, interior designers, remodelers, and anyone who wants a compelling reveal video in minutes.
          </p>
        </section>

        <section id="video-generator" aria-labelledby="video-generator-heading" className="space-y-14">
          <div className="space-y-3 text-center">
            <h2 id="video-generator-heading" className="text-3xl font-semibold md:text-4xl">Generate your slider video</h2>
            <p className="mx-auto max-w-3xl text-base text-neutral-700">
              Follow the steps to submit your before and after photos, preview the slider, and we&apos;ll send a 1080p render to your inbox. No editing skills needed.
            </p>
          </div>
          <BeforeAfterVideoTool />
        </section>

        <section className="space-y-10">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">Built for standout listing content</h2>
          <Card className="border border-black/5 bg-white shadow-md">
            <CardContent className="grid gap-8 p-8 md:grid-cols-3">
              <div>
                <h3 className="text-lg font-semibold text-[#4A6B85]">Optimized for Realtors</h3>
                <p className="mt-3 text-sm text-neutral-700">
                  Crafted by the Rooms That Sell team to help agents, brokers, and photographers showcase renovations, virtual staging, and listing transformations.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#4A6B85]">FFmpeg-powered render</h3>
                <p className="mt-3 text-sm text-neutral-700">
                  We resize and align both images automatically, then generate a 1080p MP4 slider animation ready for social media, email marketing, and MLS-safe sharing.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#4A6B85]">Grow with Rooms That Sell</h3>
                <p className="mt-3 text-sm text-neutral-700">
                  Prefer full virtual staging instead of just sliders?{' '}
                  <Link href="/" className="font-semibold text-[#4A6B85] underline-offset-4 hover:underline">
                    Join Rooms That Sell
                  </Link>{' '}
                  to access MLS-compliant staging workflows and premium renders.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">Before &amp; After video generator FAQs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                How do I create a before and after slider video?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                Upload your before and after photos, preview the slider inside the builder, then hit “Email me the video.” We send the finished MP4 to your inbox once it renders.
              </p>
            </details>
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                Is the before and after video generator free?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                Yes. The Rooms That Sell before &amp; after video maker is free to use. We only ask for your email so we can send the finished video and share product updates.
              </p>
            </details>
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                What file types work best?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                Use JPEG, PNG, or WebP images up to 15MB each. We keep the quality high while optimizing for fast rendering.
              </p>
            </details>
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                Can I use the video on social media?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                The exported MP4 is 1080p and works great on Instagram Reels, TikTok, YouTube Shorts, listing emails, and presentations.
              </p>
            </details>
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                Why do before &amp; after videos work so well?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                Side-by-side reveals make it easy for buyers to see the transformation instantly, boosting dwell time and engagement on every platform. They also build credibility by showing real results.
              </p>
            </details>
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                Where should I share my finished video?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                Agents see the best reach on Instagram Reels, TikTok, YouTube Shorts, and listing presentations. Use snippets as website hero media or in listing emails for maximum impact.
              </p>
            </details>
            <details className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-[#4A6B85]">
                How do real estate teams use these videos?
                <span className="text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-700">
                Use slider videos to win staging contracts, nurture seller leads, and document renovation progress. Brokerages embed them in listing pages to prove marketing expertise.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
