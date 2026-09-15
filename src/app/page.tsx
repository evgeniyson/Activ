import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Reveal } from "@/components/marketing/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Camera, Lock, ShieldCheck, TrendingDown, Wallet } from "@/components/ui/icons";
import { getCurrentUser } from "@/services/auth/session";

export const metadata: Metadata = {
  title: "АКТИВ — Know what your stuff is really worth",
  description: "Track market value, depreciation and the true cost of everything you own. A financial portfolio for your physical things.",
  alternates: { canonical: "/" },
};

const DEMO_ROWS = [
  { name: "iPhone 17 Pro", paid: "€1,299", now: "€930", pct: "−28.4%" },
  { name: "MacBook Air M4", paid: "€1,499", now: "€1,140", pct: "−23.9%" },
  { name: "Sony α7 IV", paid: "€2,599", now: "€1,350", pct: "−48.1%" },
  { name: "PlayStation 5", paid: "€499", now: "€245", pct: "−50.9%" },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const appHref = user ? "/app" : "/signup";

  return (
    <div className="bg-paper text-ink">
      {/* Nav */}
      <header className="safe-top sticky top-0 z-40 border-b border-hair bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Wordmark href="/" height={18} priority />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Site">
            <a href="#how" className="label-mono-md text-gray hover:text-ink">
              How it works
            </a>
            <a href="#depreciation" className="label-mono-md text-gray hover:text-ink">
              Depreciation
            </a>
            <a href="#privacy" className="label-mono-md text-gray hover:text-ink">
              Privacy
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <ButtonLink href="/app" size="sm">
                Open app
              </ButtonLink>
            ) : (
              <>
                <Link href="/login" className="label-mono-md hidden px-3 text-ink sm:block">
                  Sign in
                </Link>
                <ButtonLink href="/signup" size="sm" variant="accent">
                  Start Tracking
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:gap-6 lg:pb-24 lg:pt-28">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="label-mono text-orange">001 / Personal Asset OS</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                Know what your stuff is <span className="text-orange">really</span> worth.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray sm:text-xl">Track market value, depreciation and the true cost of everything you own. An investment portfolio — for your phone, laptop, camera and console.</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={appHref} size="lg" variant="accent">
                  Start Tracking <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#how" size="lg" variant="outline">
                  See How It Works <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="label-mono mt-6 text-gray-2">Free during beta · Installable PWA · Privacy-first</p>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="crop-marks relative border border-ink bg-paper">
              <div className="absolute -right-3 -top-3 h-24 w-24 bg-orange sm:-right-6 sm:-top-6 sm:h-36 sm:w-36" aria-hidden="true" />
              <div className="relative border-b border-hair px-5 py-4">
                <span className="label-mono text-gray">Your assets</span>
                <div className="mt-2 flex items-end gap-3">
                  <span className="tnum text-4xl font-extrabold display-tight">€8,420</span>
                  <span className="tnum mb-1 text-sm font-semibold text-orange-3">−€3,360 · −28.5%</span>
                </div>
                <span className="label-mono text-gray-2">Purchased for €11,780</span>
              </div>
              <svg viewBox="0 0 400 110" className="h-28 w-full" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#E85002" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#E85002" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 22 C 50 26, 80 40, 130 44 S 220 58, 280 70 S 360 86, 400 84 L400 110 L0 110 Z" fill="url(#lg)" />
                <path d="M0 22 C 50 26, 80 40, 130 44 S 220 58, 280 70 S 360 86, 400 84" fill="none" stroke="#E85002" strokeWidth="2" />
              </svg>
              <ul>
                {DEMO_ROWS.map((r, i) => (
                  <li key={r.name} className="flex items-center gap-3 border-t border-hair px-5 py-3">
                    <span className="label-mono w-7 text-gray-2">{String(i + 1).padStart(3, "0")}</span>
                    <span className="flex-1 text-sm font-bold">{r.name}</span>
                    <span className="tnum hidden text-[12px] text-gray sm:block">{r.paid}</span>
                    <span className="tnum text-sm font-bold">{r.now}</span>
                    <span className="tnum w-14 text-right text-[12px] font-semibold text-orange-3">{r.pct}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        {/* marquee */}
        <div className="overflow-hidden border-y border-hair bg-ink py-3 text-paper">
          <div className="marquee flex w-max gap-12 whitespace-nowrap label-mono-md">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} className="flex gap-12">
                {["Market value", "Depreciation", "Cost of ownership", "Resale estimate", "Should I sell?", "Upgrade cost", "Price history", "Warranty alerts", "Monthly report"].map((t) => (
                  <span key={t} className="flex items-center gap-12">
                    {t} <span className="text-orange">■</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <span className="label-mono text-gray">002 / How it works</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold display-tight sm:text-5xl">Photo → confirm → price. Done.</h2>
        </Reveal>
        <div className="mt-10 grid gap-px border border-ink bg-ink md:grid-cols-4">
          {[
            { n: "01", t: "Scan it", d: "Point your camera at the item. AI identifies the manufacturer, model and visible specs." },
            { n: "02", t: "Confirm", d: "Answer one or two questions the photo can't — storage, edition — and correct anything." },
            { n: "03", t: "Add what you paid", d: "Purchase price, date and condition. Receipts, serial numbers and warranty are optional." },
            { n: "04", t: "See the truth", d: "Market value, range, depreciation and what owning it costs you per day. Instantly." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className={`flex h-full flex-col gap-6 p-6 ${i === 3 ? "bg-orange" : "bg-paper"}`}>
                <span className="label-mono text-gray">{s.n}</span>
                <h3 className="text-xl font-bold display-tight">{s.t}</h3>
                <p className="text-[14px] leading-relaxed text-gray">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Depreciation */}
      <section id="depreciation" className="scroll-mt-20 border-y border-hair bg-paper-2">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <Reveal>
            <span className="label-mono text-gray">003 / Track depreciation</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-5xl">Every device is losing money. See how fast.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray">A new phone loses a quarter of its value in the first year. A camera body holds better. A GPU depends on the next launch. АКТИВ keeps a price history for every item so you see the curve, not just today&apos;s number.</p>
            <ul className="mt-8 space-y-3 text-[15px]">
              {["Estimated value with a realistic range — never a fake decimal", "Separate confidence for identification and for valuation", "Deterministic model today, marketplace data tomorrow — same interface"].map((t) => (
                <li key={t} className="flex gap-3">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-orange" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border border-ink bg-paper">
              <div className="flex items-center justify-between border-b border-hair px-5 py-3">
                <span className="text-sm font-bold">iPhone 17 Pro</span>
                <span className="label-mono text-gray-2">256 GB · Excellent</span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-hair">
                <div className="bg-paper p-4">
                  <span className="label-mono text-gray">Paid</span>
                  <p className="tnum mt-1 text-xl font-extrabold">€1,299</p>
                </div>
                <div className="bg-ink p-4 text-paper">
                  <span className="label-mono text-paper/60">Now</span>
                  <p className="tnum mt-1 text-xl font-extrabold">€930</p>
                </div>
                <div className="bg-orange p-4">
                  <span className="label-mono text-ink/70">Lost</span>
                  <p className="tnum mt-1 text-xl font-extrabold">−28%</p>
                </div>
              </div>
              <svg viewBox="0 0 400 140" className="h-40 w-full" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="24" x2="400" y2="24" stroke="#A7A7A7" strokeDasharray="3 3" />
                <path d="M0 24 C 40 40, 70 62, 120 70 S 220 90, 290 98 S 370 106, 400 108" fill="none" stroke="#E85002" strokeWidth="2.5" />
                <path d="M0 30 C 40 48, 70 72, 120 82 S 220 104, 290 112 S 370 120, 400 122 L400 96 C 370 94, 290 86, 220 78 S 120 58, 70 50 S 30 30, 0 18 Z" fill="#000" fillOpacity="0.06" />
              </svg>
              <div className="flex justify-between border-t border-hair px-5 py-2">
                <span className="label-mono text-gray-2">Oct 2025</span>
                <span className="label-mono text-gray-2">Range €890 — €970</span>
                <span className="label-mono text-gray-2">Sep 2026</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cost of ownership */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="grid gap-px border border-ink bg-ink sm:grid-cols-2">
              <div className="bg-paper p-6">
                <span className="label-mono text-gray">Purchase</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">€1,299</p>
              </div>
              <div className="bg-paper p-6">
                <span className="label-mono text-gray">Current value</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">€930</p>
              </div>
              <div className="bg-paper p-6">
                <span className="label-mono text-gray">Owned</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">329 days</p>
              </div>
              <div className="bg-orange p-6">
                <span className="label-mono text-ink/70">Daily cost</span>
                <p className="tnum mt-1 text-3xl font-extrabold display-tight">€1.12/day</p>
              </div>
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2" delay={0.05}>
            <span className="label-mono text-gray">004 / Cost of ownership</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-5xl">Understand what owning your stuff actually costs you.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray">
              Purchase price, plus repairs, accessories and maintenance, minus what it&apos;s worth today — divided by the days you&apos;ve had it. One number that makes &ldquo;is this worth keeping?&rdquo; an easy question.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-orange" aria-hidden="true" />
              <span className="text-sm font-semibold">Add a €149 battery replacement and the daily cost updates instantly.</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* AI scan */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <Reveal>
            <span className="label-mono text-orange">005 / AI scan</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-5xl">It sees the model. It asks about what it can&apos;t see.</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-paper/70">A vision model reads logos, ports and camera layouts to identify the product. When storage or generation can&apos;t be told from a photo, it asks you instead of guessing. You can always correct the result.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border border-paper/30">
              <div className="flex items-center gap-3 border-b border-paper/20 px-5 py-3">
                <Camera className="h-4 w-4 text-orange" aria-hidden="true" />
                <span className="label-mono text-paper/60">Photo → AI result</span>
                <span className="label-mono ml-auto text-orange">94% confidence</span>
              </div>
              <div className="px-5 py-5">
                <p className="text-[13px] text-paper/60">Apple</p>
                <p className="text-3xl font-extrabold display-tight">iPhone 17 Pro</p>
                <p className="mt-1 text-[13px] text-paper/60">Black · Titanium frame</p>
                <p className="label-mono mt-6 text-paper/60">Storage?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["256 GB", "512 GB", "1 TB", "Not sure"].map((o, i) => (
                    <span key={o} className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${i === 0 ? "border-orange bg-orange text-ink" : "border-paper/30 text-paper/80"}`}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sell / Hold */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <span className="label-mono text-gray">006 / Sell or hold</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold display-tight sm:text-5xl">A straight answer to &ldquo;should I sell?&rdquo;</h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-gray">Depreciation speed, trend, product age, the next launch, liquidity and demand — combined into one read: Hold, Consider Selling, or Strong Sell Opportunity. Probabilistic, explained, never a guarantee.</p>
        </Reveal>
        <div className="mt-10 grid gap-px border border-ink bg-ink md:grid-cols-3">
          {[
            { v: "Hold", d: "Sony α7 IV — value stable, demand strong, no successor pressure.", tone: "bg-paper" },
            { v: "Consider Selling", d: "iPhone 17 Pro — lost ~11% in 90 days; a refresh is weeks away.", tone: "bg-ink text-paper" },
            { v: "Upgrade cost €469", d: "iPhone 18 Pro at €1,399 minus today's €930 sale value.", tone: "bg-orange" },
          ].map((c, i) => (
            <Reveal key={c.v} delay={i * 0.06}>
              <div className={`flex h-full flex-col gap-4 p-6 ${c.tone}`}>
                <span className="label-mono opacity-60">0{i + 1}</span>
                <h3 className="text-2xl font-extrabold display-tight">{c.v}</h3>
                <p className="text-[14px] leading-relaxed opacity-75">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 border-y border-hair bg-paper-2">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-3 lg:py-24">
          <Reveal className="lg:col-span-1">
            <span className="label-mono text-gray">007 / Privacy</span>
            <h2 className="mt-3 text-3xl font-extrabold display-tight sm:text-4xl">Your inventory is nobody&apos;s business.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              { icon: Lock, t: "Private by default", d: "Nothing is public. No shared feeds, no social layer, no public collections unless you ever opt in." },
              { icon: ShieldCheck, t: "Row-level security", d: "Every asset, photo, receipt and price row is bound to your account at the database level." },
              { icon: Camera, t: "Photos stay private", d: "Images and documents are stored in private buckets and served only to you." },
              { icon: TrendingDown, t: "No invasive tracking", d: "Product analytics are event-level and anonymous. Serial numbers never leave your account." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.05}>
                <div className="flex h-full gap-4 border border-hair bg-paper p-5">
                  <f.icon className="h-5 w-5 shrink-0 text-orange" aria-hidden="true" />
                  <div>
                    <h3 className="text-[15px] font-bold">{f.t}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-gray">{f.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <div className="crop-marks relative overflow-hidden border border-ink bg-paper px-6 py-14 sm:px-12 sm:py-20">
            <div className="grid-dots absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 bg-orange sm:h-64 sm:w-64" aria-hidden="true" />
            <div className="relative max-w-2xl">
              <span className="label-mono text-gray">008 / Start</span>
              <h2 className="mt-3 text-4xl font-extrabold display-tight sm:text-6xl">You paid €1,299. It&apos;s worth about €930. Now you know.</h2>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={appHref} size="lg" variant="accent">
                  Start Tracking <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/login" size="lg" variant="outline">
                  Sign in
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-hair">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <Image src="/brand/mark-black.png" alt="" width={22} height={22} style={{ width: 22, height: "auto" }} />
            <Wordmark height={14} />
            <span className="label-mono text-gray-2">Personal Asset OS</span>
          </div>
          <div className="flex flex-wrap gap-6 label-mono-md text-gray">
            <a href="#how" className="hover:text-ink">
              How it works
            </a>
            <a href="#privacy" className="hover:text-ink">
              Privacy
            </a>
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
          </div>
          <p className="label-mono text-gray-2">© {new Date().getFullYear()} АКТИВ · Estimates, not appraisals.</p>
        </div>
      </footer>
    </div>
  );
}
