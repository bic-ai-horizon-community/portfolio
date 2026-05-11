"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ManualEnrollmentFormProps {
  eventId?: string;
  workshopId?: string;
}

export const ManualEnrollmentForm = ({ eventId, workshopId }: ManualEnrollmentFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId, workshopId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to enroll user");
      }

      setEmail("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEnroll} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
      <input
        type="email"
        placeholder="User Email to Enroll..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.875rem',
          minWidth: '250px'
        }}
      />
      <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
        {loading ? "Adding..." : "Add Participant"}
      </button>
    </form>
  );
};
