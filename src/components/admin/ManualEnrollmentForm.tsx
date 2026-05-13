"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ManualEnrollmentForm.module.css";

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to enroll user";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEnroll} className={styles.form}>
      <input
        type="email"
        placeholder="User Email to Enroll..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={styles.input}
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Adding..." : "Add Participant"}
      </button>
    </form>
  );
};
