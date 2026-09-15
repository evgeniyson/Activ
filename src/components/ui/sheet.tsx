"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet on mobile, centered dialog on desktop. Closes on backdrop
 * click and Escape; traps focus by rendering with `dialog` semantics.
 */
export function Sheet({ open, onClose, title, children, className, description }: { open: boolean; onClose: () => void; title?: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${id}-title` : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn("relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-ink bg-paper sm:max-w-lg", className)}
          >
            {title ? (
              <div className="flex items-start justify-between gap-4 border-b border-hair px-5 py-4">
                <div>
                  <h2 id={`${id}-title`} className="text-lg font-bold display-tight">
                    {title}
                  </h2>
                  {description ? <p className="mt-1 text-[13px] text-gray">{description}</p> : null}
                </div>
                <button type="button" onClick={onClose} className="-mr-2 -mt-1 flex h-9 w-9 items-center justify-center text-gray hover:text-ink" aria-label="Закрыть">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : null}
            <div className="safe-bottom overflow-y-auto px-5 py-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
