"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RemoveRegistrationButtonProps {
  userId: string;
  eventId?: string;
  workshopId?: string;
}

export const RemoveRegistrationButton = ({ userId, eventId, workshopId }: RemoveRegistrationButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    if (!window.confirm("Are you sure you want to remove this user from the enrollment list?")) {
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("userId", userId);
      if (eventId) query.append("eventId", eventId);
      if (workshopId) query.append("workshopId", workshopId);

      const res = await fetch(`/api/admin/registrations?${query.toString()}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove user");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Remove Participant"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '0.25rem',
        opacity: loading ? 0.5 : 1,
        transition: 'color 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
      </svg>
    </button>
  );
};
