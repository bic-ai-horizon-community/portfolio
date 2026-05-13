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
    badge: "QR Registration",
    intro: "We are confirming your seat from the QR you just opened.",
    loadingTitle: "Registering you…",
    loadingCopy: "Please wait while we secure your spot.",
    successTitle: "Registered!",
    successMessage: (title: string) => `You have successfully registered for "${title}"!`,
    alreadyTitle: "Already Registered",
    alreadyMessage: "You are already registered for this item.",
    errorTitle: "Registration Failed",
    unauthenticatedMessage: "Please sign in to complete QR registration.",
    apiPath: (id: string, type: string) => `/api/events/${id}/qr-register?type=${type}`,
    successFlag: 201,
    alreadyFlag: "alreadyRegistered",
  },
  attendance: {
    badge: "QR Attendance",
    intro: "We are verifying your attendance from the QR you just opened.",
    loadingTitle: "Marking attendance…",
    loadingCopy: "Please wait while we record your presence.",
    successTitle: "Attendance Marked!",
    successMessage: (title: string) => `Attendance marked successfully for "${title}"!`,
    alreadyTitle: "Already Recorded",
    alreadyMessage: "Your attendance is already marked.",
    errorTitle: "Attendance Failed",
    unauthenticatedMessage: "Please sign in to mark attendance from this QR.",
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

  const title =
    status === "loading"
      ? content.loadingTitle
      : status === "success"
        ? content.successTitle
        : status === "already"
          ? content.alreadyTitle
          : content.errorTitle;

  const subText =
    status === "loading"
      ? content.loadingCopy
      : message;

  return (
    <div className={styles.page}>
      <div className={styles.backdropGlow} />
      <div className={styles.shell}>
        <div className={styles.header}>
          <span className={styles.badge}>{content.badge}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{status === "loading" ? content.intro : subText}</p>
        </div>

        <div className={`${styles.panel} glass-card`}>
          {status === "loading" && (
            <div className={styles.statusBody}>
              <div className={styles.viewfinderFrame}>
                <div className={styles.spinner} />
                <div className={styles.corner} data-pos="tl" />
                <div className={styles.corner} data-pos="tr" />
                <div className={styles.corner} data-pos="bl" />
                <div className={styles.corner} data-pos="br" />
              </div>
              <p className={styles.statusTitle}>{content.loadingTitle}</p>
              <p className={styles.statusSub}>{content.loadingCopy}</p>
            </div>
          )}

          {status === "success" && (
            <div className={styles.statusBody}>
              <div className={`${styles.statusIcon} ${styles.successIcon}`}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className={styles.statusTitle}>{content.successTitle}</p>
              <p className={styles.statusSub}>{message}</p>
            </div>
          )}

          {status === "already" && (
            <div className={styles.statusBody}>
              <div className={`${styles.statusIcon} ${styles.alreadyIcon}`}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className={styles.statusTitle}>{content.alreadyTitle}</p>
              <p className={styles.statusSub}>{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className={styles.statusBody}>
              <div className={`${styles.statusIcon} ${styles.errorIcon}`}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className={styles.statusTitle}>{content.errorTitle}</p>
              <p className={styles.statusSub}>{message}</p>
            </div>
          )}

          <div className={styles.actions}>
            <button className="btn-primary" onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
            <button className="btn-secondary" onClick={() => router.push("/")}>Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}
