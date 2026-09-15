"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Activity, Bell, Home, LayoutGrid, Plus, Search, Settings, Sparkles, User } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { signOut } from "@/features/auth/actions";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const NAV = [
  { href: "/app", label: "Overview", icon: Home, exact: true },
  { href: "/app/assets", label: "Assets", icon: LayoutGrid },
  { href: "/app/insights", label: "Insights", icon: Sparkles },
  { href: "/app/activity", label: "Activity", icon: Activity },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = [
  { href: "/app", label: "Home", icon: Home, exact: true },
  { href: "/app/assets", label: "Assets", icon: LayoutGrid },
  { href: "/app/assets/new", label: "Add", icon: Plus, primary: true },
  { href: "/app/insights", label: "Insights", icon: Sparkles },
  { href: "/app/settings", label: "Profile", icon: User },
];

export function AppShell({ children, user, unreadCount, localMode }: { children: ReactNode; user: { email: string | null; name: string | null; avatarUrl: string | null }; unreadCount: number; localMode: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const initials = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();
  const isAddFlow = pathname.startsWith("/app/assets/new");

  return (
    <div className="flex min-h-dvh w-full bg-paper">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-hair bg-paper lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-hair px-5">
          <Wordmark href="/app" height={18} priority />
          <span className="label-mono text-gray-2">v0.1</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-10 items-center gap-3 px-3 text-sm font-semibold transition-colors duration-[140ms]",
                  active ? "bg-ink text-paper" : "text-gray hover:bg-black/5 hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {href === "/app/notifications" && unreadCount > 0 ? (
                  <span className={cn("label-mono flex h-5 min-w-5 items-center justify-center px-1", active ? "bg-orange text-ink" : "bg-orange text-ink")}>{unreadCount}</span>
                ) : null}
              </Link>
            );
          })}
          <Link href="/app/assets/new" className="mt-3 flex h-11 items-center justify-center gap-2 bg-orange px-3 text-sm font-bold text-ink transition-colors hover:bg-orange-2">
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Add Asset
          </Link>
        </nav>
        <div className="border-t border-hair p-3">
          <InstallPrompt />
          {localMode ? (
            <p className="label-mono mb-3 border border-dashed border-hair-strong px-2 py-2 text-gray">Local demo mode · no Supabase</p>
          ) : null}
          <div className="flex items-center gap-3 px-1">
            <span className="flex h-9 w-9 items-center justify-center bg-ink font-bold text-paper" aria-hidden="true">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name ?? "Your account"}</p>
              <p className="truncate text-[12px] text-gray">{user.email}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className="label-mono text-gray hover:text-ink" title="Sign out">
                Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="safe-top sticky top-0 z-40 border-b border-hair bg-paper/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16">
            <div className="lg:hidden">
              <Wordmark href="/app" height={16} priority />
            </div>
            <div className="hidden flex-1 lg:block" />
            <div className="ml-auto flex items-center gap-1">
              <Link href="/app/search" aria-label="Search assets" className="flex h-10 w-10 items-center justify-center text-ink hover:bg-black/5">
                <Search className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </Link>
              <Link href="/app/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} className="relative flex h-10 w-10 items-center justify-center text-ink hover:bg-black/5">
                <Bell className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                {unreadCount > 0 ? <span className="absolute right-2 top-2 h-2 w-2 bg-orange" /> : null}
              </Link>
              <Link href="/app/assets/new" className="ml-1 hidden h-10 items-center gap-2 bg-ink px-4 text-sm font-bold text-paper hover:bg-ink-2 sm:flex lg:hidden">
                <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                Add
              </Link>
            </div>
          </div>
        </header>

        <main className={cn("flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8", isAddFlow && "pb-8")}>
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!isAddFlow ? (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-paper/95 backdrop-blur-md lg:hidden" aria-label="Main">
          <div className="grid h-16 grid-cols-5">
            {MOBILE_NAV.map(({ href, label, icon: Icon, exact, primary }) => {
              const active = isActive(href, exact) && !primary;
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center justify-center gap-1">
                  {primary ? (
                    <span className="flex h-10 w-10 items-center justify-center bg-orange text-ink">
                      <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  ) : (
                    <>
                      <Icon className={cn("h-5 w-5", active ? "text-ink" : "text-gray-2")} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                      <span className={cn("label-mono", active ? "text-ink" : "text-gray-2")}>{label}</span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
