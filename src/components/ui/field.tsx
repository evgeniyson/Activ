import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Label({ children, htmlFor, className, hint }: { children: ReactNode; htmlFor?: string; className?: string; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={cn("label-mono-md flex items-baseline justify-between text-gray", className)}>
      <span>{children}</span>
      {hint ? <span className="normal-case tracking-normal font-sans text-[11px] text-gray-2">{hint}</span> : null}
    </label>
  );
}

export function Field({ label, htmlFor, error, hint, children, className }: { label?: ReactNode; htmlFor?: string; error?: string | null; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <Label htmlFor={htmlFor} hint={hint}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-orange-3" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const control =
  "h-12 w-full border border-hair-strong bg-paper px-3.5 text-[15px] text-ink placeholder:text-gray-2 outline-none transition-colors duration-[160ms] focus:border-ink disabled:opacity-50 rounded-none appearance-none";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...props }, ref) {
  return <input ref={ref} className={cn(control, invalid && "border-orange-3", className)} aria-invalid={invalid || undefined} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "h-auto min-h-24 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "pr-10", className)} {...props}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

/** Prefix-adorned input (currency symbol etc.) */
export function InputWithPrefix({ prefix, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { prefix: ReactNode; invalid?: boolean }) {
  return (
    <div className={cn("flex h-12 border border-hair-strong bg-paper focus-within:border-ink transition-colors duration-[160ms]", props.invalid && "border-orange-3", className)}>
      <span className="flex items-center border-r border-hair px-3.5 font-mono text-sm text-gray">{prefix}</span>
      <input className="h-full w-full bg-transparent px-3.5 text-[15px] tnum outline-none placeholder:text-gray-2 rounded-none" {...props} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, ariaLabel }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string; ariaLabel?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex border border-ink p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn("label-mono-md h-8 px-3 transition-colors duration-[140ms]", active ? "bg-ink text-paper" : "text-gray hover:text-ink")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, name }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; name?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description ? <span className="block text-[13px] text-gray">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 border border-ink bg-paper transition-colors duration-[160ms] peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-orange" />
        <span className="absolute left-1 top-1 h-4 w-4 bg-ink transition-transform duration-[160ms] ease-[var(--ease-out)] peer-checked:translate-x-5 peer-checked:bg-orange" />
      </span>
    </label>
  );
}
