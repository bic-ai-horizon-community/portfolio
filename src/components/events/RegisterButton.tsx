"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./RegisterButton.module.css";

interface RegisterButtonProps {
  id: string;
  type: "event" | "workshop";
  isRegistered: boolean;
  isOpen: boolean;
}

export const RegisterButton = ({ id, type, isRegistered, isOpen }: RegisterButtonProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(isRegistered);
  const router = useRouter();

  const handleRegister = async () => {
    if (!session) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/${type}s/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formResponses: {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setRegistered(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className={styles.success}>
        <svg className={styles.checkIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeDasharray="50" strokeDashoffset="0" style={{ animation: "drawCheck 0.5s ease both" }}/>
        </svg>
        You&apos;re Registered
      </div>
    );
  }

  if (!isOpen) {
    return <div className={styles.closed}>Registration Closed</div>;
  }

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      <button className={`btn-primary ${styles.button}`} onClick={handleRegister} disabled={loading}>
        {loading ? "Registering…" : "Register Now"}
      </button>
    </div>
  );
};
