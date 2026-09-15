"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "@/features/profile/actions";
import { cn } from "@/lib/cn";

const SCREENS = [
  {
    eyebrow: "01 / 03",
    title: "Know what your stuff is really worth.",
    body: "Phones, laptops, cameras, consoles — anything with a price tag has a market value that changes every week. АКТИВ tracks it for you.",
  },
  {
    eyebrow: "02 / 03",
    title: "Track the four numbers that matter.",
    body: "For every item: market value today, total depreciation, what owning it costs you per day, and what you could sell it for.",
    list: ["Market Value", "Depreciation", "Ownership Cost", "Resale Value"],
  },
  {
    eyebrow: "03 / 03",
    title: "Add your first asset.",
    body: "Point the camera at something you own. In a few seconds you'll see what you paid, what it's worth now, and what it has cost you.",
  },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const [pending, start] = useTransition();
  const reduce = useReducedMotion();
  const last = i === SCREENS.length - 1;
  const s = SCREENS[i];

  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col bg-paper">
      <div className="flex items-center justify-between px-5 py-6 sm:px-10">
        <Wordmark height={18} priority />
        <button type="button" className="label-mono-md text-gray hover:text-ink" onClick={() => start(() => completeOnboardingAction("dashboard"))}>
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 sm:px-10">
        <div className="mx-auto w-full max-w-2xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="label-mono text-orange">{s.eyebrow}</span>
              <h1 className="mt-4 text-4xl font-extrabold display-tight sm:text-6xl">{s.title}</h1>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray">{s.body}</p>
              {s.list ? (
                <ul className="mt-8 grid grid-cols-2 gap-px border border-ink bg-ink sm:grid-cols-4">
                  {s.list.map((item, k) => (
                    <li key={item} className={cn("flex flex-col gap-3 p-4", k === 0 ? "bg-orange" : "bg-paper")}>
                      <span className="label-mono text-gray">{String(k + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-bold">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {last ? (
                <div className="mt-8 grid gap-px border border-ink bg-ink sm:grid-cols-2">
                  <div className="bg-paper p-5">
                    <span className="label-mono text-gray">You paid</span>
                    <p className="tnum mt-1 text-3xl font-extrabold display-tight">€1,299</p>
                  </div>
                  <div className="bg-ink p-5 text-paper">
                    <span className="label-mono text-paper/60">Today it&apos;s worth</span>
                    <p className="tnum mt-1 text-3xl font-extrabold display-tight">≈ €930</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-8 sm:px-10">
        <div className="flex gap-1.5" aria-label={`Step ${i + 1} of ${SCREENS.length}`}>
          {SCREENS.map((_, k) => (
            <span key={k} className={cn("h-1.5 w-8 transition-colors duration-300", k <= i ? "bg-ink" : "bg-hair")} />
          ))}
        </div>
        <div className="flex gap-2">
          {i > 0 ? (
            <Button variant="ghost" onClick={() => setI(i - 1)}>
              Back
            </Button>
          ) : null}
          {last ? (
            <>
              <Button variant="outline" loading={pending} onClick={() => start(() => completeOnboardingAction("dashboard"))}>
                Later
              </Button>
              <Button variant="accent" size="lg" loading={pending} onClick={() => start(() => completeOnboardingAction("scan"))}>
                Scan an Item →
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => setI(i + 1)}>
              Continue →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
