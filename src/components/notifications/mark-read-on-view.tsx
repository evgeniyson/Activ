"use client";

import { useEffect } from "react";
import { markNotificationsReadAction } from "@/features/notifications/actions";

/** Marks the listed notifications read a moment after the page is viewed. */
export function MarkReadOnView({ ids }: { ids: string[] }) {
  useEffect(() => {
    const t = setTimeout(() => {
      void markNotificationsReadAction(ids);
    }, 1500);
    return () => clearTimeout(t);
  }, [ids]);
  return null;
}
