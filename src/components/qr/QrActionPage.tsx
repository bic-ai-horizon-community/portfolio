"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./QrActionPage.module.css";

type Mode = "register" | "attendance";
type Status = "loading" | "success" | "error" | "already";

interface QrActionPageProps {
  params: Promise<{ type: string; id: string }>;
  mode: Mode;
}

const CONTENT = {
  register: {
    sheetSub: "Point at an event QR to register",
    loadingTitle: "Registering you…",
    loadingCopy: "Please wait a moment",
    successTitle: "Registered!",
    successMessage: (title: string) => `You're registered for "${title}"!`,
    alreadyTitle: "Already Registered",
    alreadyMessage: "You're already registered for this item.",
    errorTitle: "Oops!",
    unauthenticatedMessage: "Please sign in first to register.",
    apiPath: (id: string, type: string) => `/api/events/${id}/qr-register?type=${type}`,
    successFlag: 201,
    alreadyFlag: "alreadyRegistered",
  },
  attendance: {
    sheetSub: "Point at an event QR to register",
    loadingTitle: "Marking attendance…",
    loadingCopy: "Please wait a moment",
    successTitle: "Marked!",
    successMessage: (title: string) => `Attendance marked for "${title}"!`,
    alreadyTitle: "Already Marked",
    alreadyMessage: "Your attendance is already marked.",
    errorTitle: "Oops!",
    unauthenticatedMessage: "Please sign in first to mark attendance.",
    apiPath: (id: string, type: string) => `/api/events/${id}/qr-attendance?type=${type}`,
    successFlag: 201,
    alreadyFlag: "alreadyMarked",
  },
} as const;

export default function QrActionPage({ params, mode }: QrActionPageProps) {
  const { type, id } = use(params);
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const content = CONTENT[mode];

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (sessionStatus !== "authenticated") {
      return;
    }

    const runAction = async () => {
      try {
        const res = await fetch(content.apiPath(id, type), { method: "POST" });
        const data = await res.json();

        if (res.status === content.successFlag) {
          setStatus("success");
          setMessage(content.successMessage(data.eventTitle));
          return;
        }

        if (res.status === 200 && data[content.alreadyFlag]) {
          setStatus("already");
          setMessage(content.alreadyMessage);
          return;
        }

        setStatus("error");
        setMessage(data.message || content.unauthenticatedMessage);
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    runAction();
  }, [content, id, router, sessionStatus, type]);

  const handleClose = () => {
    router.push("/dashboard");
  };

  const handleScanAnother = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.sheetHeader}>
          <div>
            <h1 className={styles.sheetTitle}>Scan QR Code</h1>
            <p className={styles.sheetSub}>{content.sheetSub}</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close QR status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {status === "loading" && (
          <div className={styles.statusBody}>
            <div className={styles.spinner} />
            <p className={styles.statusTitle}>{content.loadingTitle}</p>
            <p className={styles.statusSub}>{content.loadingCopy}</p>
          </div>
        )}

        {status === "success" && (
          <div className={styles.statusBody}>
            <div className={`${styles.statusIcon} ${styles.successIcon}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className={styles.statusTitle}>{content.successTitle}</p>
            <p className={styles.statusSub}>{message}</p>
            <div className={styles.sheetActions}>
              <button className="btn-primary" onClick={handleScanAnother}>Scan Another</button>
              <button className="btn-secondary" onClick={handleClose}>Done</button>
            </div>
          </div>
        )}

        {status === "already" && (
          <div className={styles.statusBody}>
            <div className={`${styles.statusIcon} ${styles.alreadyIcon}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className={styles.statusTitle}>{content.alreadyTitle}</p>
            <p className={styles.statusSub}>{message}</p>
            <div className={styles.sheetActions}>
              <button className="btn-secondary" onClick={handleScanAnother}>Scan Another</button>
              <button className="btn-secondary" onClick={handleClose}>Close</button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className={styles.statusBody}>
            <div className={`${styles.statusIcon} ${styles.errorIcon}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className={styles.statusTitle}>{content.errorTitle}</p>
            <p className={styles.statusSub}>{message}</p>
            <div className={styles.sheetActions}>
              <button className="btn-primary" onClick={() => window.location.reload()}>Try Again</button>
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
