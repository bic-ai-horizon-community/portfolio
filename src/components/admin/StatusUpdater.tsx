"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./StatusUpdater.module.css";

const STATUS_LABELS: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Open for registration",
  ONGOING: "Live now",
  COMPLETED: "Completed",
};

const STATUS_HINTS: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Registration is open.",
  ONGOING: "Attendance is live.",
  COMPLETED: "This item is locked.",
};

const STATUS_OPTIONS = [
  { value: "OPEN_FOR_REGISTRATION", label: "Open" },
  { value: "ONGOING", label: "Live" },
  { value: "COMPLETED", label: "Done" },
] as const;

export const StatusUpdater = ({
  id,
  type,
  currentStatus,
}: {
  id: string;
  type: "event" | "workshop";
  currentStatus: string;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/${type}s/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Status</p>
        <span className={styles.livePill}>{STATUS_LABELS[currentStatus] ?? currentStatus}</span>
      </div>

      <p className={styles.hint}>{STATUS_HINTS[currentStatus] ?? "Choose the current lifecycle state."}</p>

      <div className={styles.options}>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading || currentStatus === option.value}
            onClick={() => handleStatusChange(option.value)}
            className={`${styles.optionBtn} ${currentStatus === option.value ? styles.optionActive : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
