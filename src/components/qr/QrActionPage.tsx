"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import QrScanner from "@/components/dashboard/QrScanner";

type Mode = "register" | "attendance";

interface QrActionPageProps {
  params: Promise<{ type: string; id: string }>;
  mode: Mode;
}

export default function QrActionPage({ params, mode }: QrActionPageProps) {
  const { type, id } = use(params);
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const redirectUrl =
    mode === "attendance"
      ? `/attendance/${type}/${id}`
      : `/register/${type}/${id}`;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [router, sessionStatus]);

  if (sessionStatus !== "authenticated") {
    return null;
  }

  return <QrScanner redirectUrl={redirectUrl} redirectMode={mode} hideFab />;
}
