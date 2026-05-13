"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QrVisibility } from "@/lib/qr-access";
import styles from "./QrToggle.module.css";

interface QrToggleProps {
  id: string;
  type: "event" | "workshop";
  initialShowQr: boolean;
  initialQrVisibility?: QrVisibility | null;
}

export const QrToggle = ({
  id,
  type,
  initialShowQr,
  initialQrVisibility,
}: QrToggleProps) => {
  const [showQr, setShowQr] = useState(initialShowQr);
  const [qrVisibility, setQrVisibility] = useState<QrVisibility>(
    initialQrVisibility === "PRIVATE" ? "PRIVATE" : "PUBLIC"
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const saveSettings = async (nextShowQr: boolean, nextVisibility: QrVisibility) => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/toggle-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type,
          showQr: nextShowQr,
          qrVisibility: nextVisibility,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save QR settings");
      }

      setShowQr(nextShowQr);
      setQrVisibility(nextVisibility);
      router.refresh();
    } catch (error) {
      console.error("Failed to update QR settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusText = !showQr
    ? "Users cannot use the QR."
    : qrVisibility === "PRIVATE"
      ? "Users can use it, but only admins see it."
      : "Visible and usable for everyone.";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>QR Access</p>
          <p className={styles.status}>{statusText}</p>
        </div>

        <button
          type="button"
          onClick={() => saveSettings(!showQr, qrVisibility)}
          disabled={loading}
          aria-pressed={showQr}
          className={`${styles.switch} ${showQr ? styles.switchOn : styles.switchOff}`}
        >
          <span className={styles.switchThumb} />
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>QR</span>
        <strong className={showQr ? styles.onText : styles.offText}>{showQr ? "ON" : "OFF"}</strong>
      </div>

      <div className={styles.visibilityBlock}>
        <span className={styles.label}>Visibility</span>
        <div className={styles.pills}>
          <button
            type="button"
            disabled={loading || qrVisibility === "PUBLIC"}
            onClick={() => saveSettings(showQr, "PUBLIC")}
            className={`${styles.pill} ${qrVisibility === "PUBLIC" ? styles.pillActive : ""}`}
          >
            Public
          </button>
          <button
            type="button"
            disabled={loading || qrVisibility === "PRIVATE"}
            onClick={() => saveSettings(showQr, "PRIVATE")}
            className={`${styles.pill} ${qrVisibility === "PRIVATE" ? styles.pillActive : ""}`}
          >
            Private
          </button>
        </div>
      </div>
    </div>
  );
};
