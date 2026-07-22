"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RealtimeRefresherProps {
  intervalMs?: number;
}

export const RealtimeRefresher = ({ intervalMs = 3000 }: RealtimeRefresherProps) => {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [router, intervalMs]);

  return null;
};
