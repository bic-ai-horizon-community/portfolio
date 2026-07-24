"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncDedicatedButton({
  id,
  type,
}: {
  id: string;
  type: "event" | "workshop";
}) {
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const endpoint =
        type === "event" ? `/api/events/${id}/sync` : `/api/workshops/${id}/sync`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to sync dedicated registrations");
      }

      setMsg({ text: data.message });
      router.refresh();
    } catch (err: any) {
      setMsg({ text: err.message || "Sync failed", error: true });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.4rem" }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn-secondary"
        style={{
          padding: "0.5rem 1rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          borderColor: "var(--accent, #6366f1)",
          color: "var(--accent, #6366f1)",
          fontWeight: "bold",
          cursor: syncing ? "not-allowed" : "pointer",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
        </svg>
        {syncing ? "Syncing Firebase..." : "Sync Dedicated Registrations"}
      </button>
      {msg && (
        <span
          style={{
            fontSize: "0.75rem",
            color: msg.error ? "var(--danger, #ef4444)" : "var(--success, #22c55e)",
            maxWidth: "280px",
          }}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
