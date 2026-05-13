"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./RegisterPage.module.css";

export default function RegisterPage({ params }: { params: Promise<{ type: string, id: string }> }) {
  const { type, id } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (sessionStatus === "authenticated") {
      handleRegister();
    }
  }, [sessionStatus]);

  const handleRegister = async () => {
    try {
      const res = await fetch(`/api/events/${id}/qr-register?type=${type}`, { method: "POST" });
      const data = await res.json();

      if (res.status === 201) {
        setStatus("success");
        setMessage(`You have successfully registered for "${data.eventTitle}"!`);
      } else if (res.status === 200 && data.alreadyRegistered) {
        setStatus("already");
        setMessage("You are already registered for this item.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to register.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && status === "loading")) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
        <p>Processing your registration...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-card`}>
        {status === "success" && (
          <div className={styles.statusContent}>
            <div className={`${styles.icon} ${styles.successIcon}`}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1>Registered!</h1>
            <p>{message}</p>
          </div>
        )}

        {status === "already" && (
          <div className={styles.statusContent}>
            <div className={`${styles.icon} ${styles.alreadyIcon}`}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1>Already Signed Up</h1>
            <p>{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className={styles.statusContent}>
            <div className={`${styles.icon} ${styles.errorIcon}`}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1>Registration Failed</h1>
            <p>{message}</p>
          </div>
        )}

        <div className={styles.actions}>
          <button className="btn-primary" onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
          <button className="btn-secondary" onClick={() => router.push("/")}>Home</button>
        </div>
      </div>
    </div>
  );
}
