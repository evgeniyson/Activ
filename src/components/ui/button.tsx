import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "paper";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none transition-[background-color,color,border-color,transform,opacity] duration-[160ms] ease-[var(--ease-out)] active:translate-y-px disabled:pointer-events-none disabled:opacity-40 rounded-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2",
  accent: "bg-orange text-ink hover:bg-orange-2",
  outline: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-ink hover:bg-black/5",
  danger: "bg-orange-3 text-white hover:bg-[#a30600]",
  paper: "bg-paper text-ink border border-hair hover:border-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
  icon: "h-11 w-11 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) {
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({ href, className, variant = "primary", size = "md", children, ...props }: { href: string; className?: string; variant?: ButtonVariant; size?: ButtonSize; children: ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
