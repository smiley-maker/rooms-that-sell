"use client";
import Image from "next/image";
import { useState } from "react";

const BRAND = {
  primary: "#567D99",
  accent: "#EAF0F7",
  dark: "#2B2F34",
  light: "#F9FCFF",
  white: "#FFFFFF",
};

function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  return (
    <div className="relative w-full max-w-3xl aspect-[16/9] overflow-hidden rounded-lg shadow" aria-label="Before and after virtual staging slider">
      <Image
        src="/window.svg"
        alt="Empty room"
        fill
        priority
        className="object-cover"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
        aria-hidden
      >
        <Image
          src="/globe.svg"
          alt="Staged room"
          fill
          className="object-cover"
        />
      </div>
      <input
        aria-label="Before after slider"
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute bottom-3 left-3 right-3 appearance-none h-1 rounded bg-white/70"
      />
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [listings, setListings] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, listingsPerMonth: listings || undefined }),
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      setStatus("success");
      setMessage("You're on the list! We'll be in touch soon.");
      setEmail("");
      setListings("");
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main>
      {/* Hero */}
      <section
        className="px-6 py-16 md:py-24"
        style={{ backgroundColor: BRAND.light, color: BRAND.dark }}
      >
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              Virtual Staging That Sells Homes Faster — MLS-Compliant & Affordable.
            </h1>
            <p className="text-lg md:text-xl text-black/70">
              Stop spending $500+ per listing on physical staging. Stage photos in minutes for $0.29 each.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3 bg-white/70 p-4 rounded-md shadow" aria-label="Waitlist signup form">
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="md:col-span-2 w-full rounded border px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded px-4 py-2 font-medium text-white"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  {status === "loading" ? "Joining…" : "Join the Waitlist"}
                </button>
              </div>
              <input
                type="text"
                value={listings}
                onChange={(e) => setListings(e.target.value)}
                placeholder="How many listings do you stage per month? (optional)"
                className="w-full rounded border px-3 py-2"
              />
              {message && (
                <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>{message}</p>
              )}
            </form>
            <p className="text-sm text-black/60">Trusted by real estate agents & brokerages</p>
          </div>
          <div className="flex justify-center">
            <BeforeAfterSlider />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-12" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-6xl text-center text-black/70">
          <p>“Placeholder testimonial — Looks realistic and MLS-safe.”</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.accent }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">Features</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              "MLS compliance baked in",
              "Batch processing for entire listings",
              "Style consistency with palettes",
              "Cost-effective vs competitors",
            ].map((f) => (
              <div key={f} className="bg-white rounded-md p-4 shadow text-black/80">
                <p>{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">How It Works</h2>
          <ol className="grid md:grid-cols-3 gap-6 list-decimal list-inside">
            <li className="bg-[#F5F8FC] p-4 rounded-md">Upload photos</li>
            <li className="bg-[#F5F8FC] p-4 rounded-md">Choose style</li>
            <li className="bg-[#F5F8FC] p-4 rounded-md">Download MLS-ready photos</li>
          </ol>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.light }}>
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Pricing Preview</h2>
          <p className="mb-6 text-black/70">Plans starting at $29/month — Free Trial available at launch.</p>
          <a href="#waitlist" className="inline-block rounded px-6 py-3 font-medium text-white" style={{ backgroundColor: BRAND.primary }}>Join the Waitlist</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">FAQ</h2>
          <div className="space-y-4">
            <details className="bg-[#F5F8FC] p-4 rounded-md">
              <summary className="font-medium">Is this MLS compliant?</summary>
              <p className="mt-2 text-black/70">Yes. Compliance mode ensures furniture-only edits, watermark toggles, and dual export.</p>
            </details>
            <details className="bg-[#F5F8FC] p-4 rounded-md">
              <summary className="font-medium">What styles are available?</summary>
              <p className="mt-2 text-black/70">Minimal, Scandi, Bohemian, and more via style palettes.</p>
            </details>
            <details className="bg-[#F5F8FC] p-4 rounded-md">
              <summary className="font-medium">How does the free trial work?</summary>
              <p className="mt-2 text-black/70">You’ll get free credits at launch to generate staged images.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12" style={{ backgroundColor: BRAND.dark, color: BRAND.white }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} RoomsThatSell</p>
          <a id="waitlist" href="#" className="rounded px-4 py-2" style={{ backgroundColor: BRAND.primary }}>
            Join the Waitlist
          </a>
        </div>
      </footer>
    </main>
  );
}
