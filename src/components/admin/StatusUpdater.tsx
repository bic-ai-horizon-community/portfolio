"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const StatusUpdater = ({ id, type, currentStatus }: { id: string, type: "event" | "workshop", currentStatus: string }) => {
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

      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      alert("Error: Command execution failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select 
      value={currentStatus} 
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      style={{
        background: "var(--primary)",
        color: "white",
        border: "none",
        padding: "0.6rem 1.25rem",
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "0.8rem",
        cursor: "pointer",
        boxShadow: "0 4px 12px var(--primary-glow)",
        outline: "none"
      }}
    >
      <option value="OPEN_FOR_REGISTRATION">OPEN FOR REGISTRATION</option>
      <option value="ONGOING">LIVE (ONGOING)</option>
      <option value="COMPLETED">COMPLETED</option>
    </select>
  );
};
