"use client";

import { use } from "react";
import QrScanner from "@/components/dashboard/QrScanner";

type Mode = "register" | "attendance";

interface QrActionPageProps {
  params: Promise<{ type: string; id: string }>;
  mode: Mode;
}

export default function QrActionPage({ params, mode }: QrActionPageProps) {
  const { type, id } = use(params);
  const redirectUrl =
    mode === "attendance"
      ? `/attendance/${type}/${id}`
      : `/register/${type}/${id}`;

  return <QrScanner redirectUrl={redirectUrl} redirectMode={mode} hideFab />;
}
