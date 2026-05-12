"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface QrToggleProps {
  id: string;
  type: "event" | "workshop";
  initialShowQr: boolean;
}

export const QrToggle = ({ id, type, initialShowQr }: QrToggleProps) => {
  const [showQr, setShowQr] = useState(initialShowQr);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/toggle-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, showQr: !showQr }),
      });

      if (res.ok) {
        setShowQr(!showQr);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to toggle QR:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Show QR
      </span>
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          width: '40px',
          height: '20px',
          borderRadius: '10px',
          background: showQr ? 'var(--primary)' : 'var(--bg-card-2)',
          border: '1px solid var(--border)',
          position: 'relative',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            left: showQr ? '22px' : '2px',
            transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      </button>
    </div>
  );
};
