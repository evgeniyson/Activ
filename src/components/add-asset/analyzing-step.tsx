"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const STAGES = ["Analyzing image", "Identifying product", "Matching specifications", "Estimating market value"];

/**
 * Staged progress. Stages advance on a short timer so the user sees
 * movement; the final stage completes only when the server answers, and we
 * auto-continue as soon as both are true. No artificial waiting.
 */
export function AnalyzingStep({ preview, done, error, recognized, onContinue, onRetry, onManual }: { preview: string | null; done: boolean; error: string | null; recognized: boolean; onContinue: () => void; onRetry: () => void; onManual: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (done) return;
    if (stage >= STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), 650);
    return () => clearTimeout(t);
  }, [stage, done]);

  const complete = done && !error && recognized;
  useEffect(() => {
    if (!complete) return;
    const t = setTimeout(onContinue, 350);
    return () => clearTimeout(t);
  }, [complete, onContinue]);

  const failed = done && (error || !recognized);
  const shownStage = complete ? STAGES.length : stage;

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
      <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink bg-ink sm:aspect-square">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <div className="grid-dots h-full w-full opacity-30" />
        )}
        {!failed ? (
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 h-px bg-orange shadow-[0_0_24px_4px_rgba(232,80,2,0.6)]"
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        ) : null}
      </div>
      <div>
        <span className="label-mono text-gray">{failed ? "Hmm" : "Working"}</span>
        <h1 className="mt-2 text-3xl font-extrabold display-tight">{failed ? "We couldn't identify it." : "Identifying…"}</h1>
        <ol className="mt-6 flex flex-col gap-3" aria-live="polite">
          {STAGES.map((label, i) => {
            const state = failed && i >= shownStage ? "failed" : i < shownStage ? "done" : i === shownStage ? "active" : "pending";
            return (
              <li key={label} className={cn("flex items-center gap-3 text-[15px] transition-colors duration-200", state === "pending" && "text-gray-2", state === "active" && "text-ink font-semibold", state === "done" && "text-gray", state === "failed" && "text-gray-2 line-through")}>
                <span className={cn("flex h-5 w-5 items-center justify-center border", state === "done" ? "border-ink bg-ink text-paper" : state === "active" ? "border-orange" : "border-hair")}>
                  {state === "done" ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : state === "active" ? <motion.span className="h-2 w-2 bg-orange" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} /> : null}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
        {failed ? (
          <div className="mt-6 border border-hair bg-paper p-4">
            <p className="text-sm text-gray">{error ?? "The photo doesn't seem to contain a product we can recognise. Try a clearer shot with the whole item in frame, or add it manually."}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" onClick={onRetry} className="flex-1">
                Try another photo
              </Button>
              <Button variant="outline" onClick={onManual} className="flex-1">
                Add manually
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
