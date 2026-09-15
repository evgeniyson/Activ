import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ensureProfile } from "@/features/profile/service";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { isLocalMode } from "@/lib/env";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  if (!profile.onboardingCompleted) redirect("/onboarding");
  const unread = await store.countUnreadNotifications(user.id);

  return (
    <AppShell
      user={{ email: user.email, name: profile.displayName ?? user.name, avatarUrl: profile.avatarUrl ?? user.avatarUrl }}
      unreadCount={unread}
      localMode={isLocalMode()}
    >
      {children}
    </AppShell>
  );
}
