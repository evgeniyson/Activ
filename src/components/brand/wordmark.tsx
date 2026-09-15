import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * АКТИВ wordmark (supplied logo, transparent PNG). `tone` picks the
 * pre-tinted variant so it renders crisply on paper, ink or orange.
 */
export function Wordmark({ tone = "black", height = 22, className, href, priority }: { tone?: "black" | "white" | "orange"; height?: number; className?: string; href?: string; priority?: boolean }) {
  const ratio = 1284 / 282; // trimmed logo aspect
  const img = (
    <Image
      src={`/brand/wordmark-${tone}.png`}
      alt="АКТИВ"
      width={Math.round(height * ratio)}
      height={height}
      priority={priority}
      className={cn("h-auto select-none", className)}
      style={{ height, width: "auto" }}
    />
  );
  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="АКТИВ home">
        {img}
      </Link>
    );
  }
  return img;
}

export function Mark({ tone = "black", size = 28, className }: { tone?: "black" | "white"; size?: number; className?: string }) {
  return <Image src={`/brand/mark-${tone}.png`} alt="" width={size} height={size} className={cn("select-none", className)} style={{ width: size, height: "auto" }} />;
}
