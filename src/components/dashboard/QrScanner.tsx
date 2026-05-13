"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./QrScanner.module.css";

type ScanStatus = "idle" | "scanning" | "processing" | "success" | "error" | "already";

interface QrScannerProps {
  redirectUrl?: string;
  redirectMode?: "register" | "attendance";
  hideFab?: boolean;
}

export default function QrScanner({
  redirectUrl,
  redirectMode,
  hideFab = false,
}: QrScannerProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("");
  const [isAttendanceScan, setIsAttendanceScan] = useState(false);
  const scannerRef = useRef<any>(null);
  const router = useRouter();
  const isRedirectFlow = !!redirectUrl;

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    const { Html5Qrcode } = await import("html5-qrcode");
    const qr = new Html5Qrcode("qr-reader-modal");
    scannerRef.current = qr;
    await qr.start(
      { facingMode: "environment" },
      { fps: 10 },
      async (decodedText) => {
        await stopScanner();
        await handleScan(decodedText);
      },
      () => { }
    );
  };

  const playSfx = async (type: "scan" | "success" | "error" | "already") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === "scan") {
        // Quick high blip
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1200, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } else if (type === "success") {
        // Pleasant rising tone
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
      } else if (type === "already") {
        // Neutral mid tone
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(660, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
      } else if (type === "error") {
        // Low buzz/thud
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(150, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
      }
    } catch (e) {
      console.warn("SFX failed", e);
    }
  };

  const handleScan = async (url: string) => {
    await playSfx("scan");
    setStatus("processing");
    try {
      // Handle both /register/event/<id>, /attendance/event/<id>, and workshop equivalents
      const regMatch = url.match(/\/register\/(event|workshop)\/([^/?#]+)/);
      const attMatch = url.match(/\/attendance\/(event|workshop)\/([^/?#]+)/);

      const isAttendance = !!attMatch;
      setIsAttendanceScan(isAttendance);
      const match = attMatch || regMatch;

      if (!match) {
        setStatus("error");
        setMessage("Invalid QR code. Please scan an AI Horizon event/workshop QR.");
        return;
      }

      const type = match[1]; // event or workshop
      const id = match[2];

      const apiPath = isAttendance
        ? `/api/events/${id}/qr-attendance?type=${type}`
        : `/api/events/${id}/qr-register?type=${type}`;

      const res = await fetch(apiPath, { method: "POST" });
      const data = await res.json();

      if (res.status === 201) {
        await playSfx("success");
        setStatus("success");
        setMessage(isAttendance
          ? `Attendance marked for "${data.eventTitle}"!`
          : `You're registered for "${data.eventTitle}"!`
        );
      } else if (res.status === 200 && (data.alreadyRegistered || data.alreadyMarked)) {
        await playSfx("already");
        setStatus("already");
        setMessage(isAttendance
          ? "Your attendance is already marked."
          : "You're already registered for this item."
        );
      } else if (res.status === 401) {
        await playSfx("error");
        setStatus("error");
        setMessage(`Please sign in first to ${isAttendance ? "mark attendance" : "register"}.`);
      } else {
        await playSfx("error");
        setStatus("error");
        setMessage(data.message || "Action failed. Please try again.");
      }
    } catch {
      await playSfx("error");
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setStatus("scanning");
    setIsAttendanceScan(false); // Reset
    // prevent scroll behind sheet
    document.body.style.overflow = "hidden";
  };

  const handleClose = async () => {
    await stopScanner();
    setOpen(false);
    setStatus("idle");
    setMessage("");
    document.body.style.overflow = "";
    if (isRedirectFlow) {
      router.push("/dashboard");
    }
  };

  const handleRetry = () => {
    setStatus(isRedirectFlow ? "processing" : "scanning");
    setMessage("");
    if (!isRedirectFlow) {
      return;
    }

    if (redirectUrl) {
      void handleScan(redirectUrl);
    }
  };

  useEffect(() => {
    if (open && status === "scanning") {
      const t = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(t);
    }
  }, [open, status]);

  useEffect(() => {
    if (!redirectUrl) {
      return;
    }

    setOpen(true);
    setStatus("processing");
    setIsAttendanceScan(redirectMode === "attendance");
    document.body.style.overflow = "hidden";
    void handleScan(redirectUrl);
  }, [redirectMode, redirectUrl]);

  useEffect(() => () => { stopScanner(); document.body.style.overflow = ""; }, []);

  return (
    <>
      {/* ── Mobile-only: Docked QR Button ────────────── */}
      {!hideFab && (
      <div className={styles.fabWrap}>
        <div className={styles.fabContainer}>
          <button className={styles.fab} onClick={handleOpen} id="qr-fab-btn">
            <span className={styles.ring1} />
            <span className={styles.ring2} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.fabIcon}>
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="3" height="3" rx="0.5" />
              <rect x="18" y="14" width="3" height="3" rx="0.5" /><rect x="14" y="18" width="3" height="3" rx="0.5" /><rect x="18" y="18" width="3" height="3" rx="0.5" />
            </svg>
          </button>
          <span className={styles.fabLabel}>Scan QR</span>
        </div>
      </div>
      )}

      {/* ── Slide-up modal sheet ─────────────────────── */}
      {open && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <div className={styles.handle} />

            {/* Header */}
            <div className={styles.sheetHeader}>
              <div>
                <h2 className={styles.sheetTitle}>Scan QR Code</h2>
                <p className={styles.sheetSub}>
                  {isAttendanceScan ? "Point at an event QR to mark attendance" : "Point at an event QR to register"}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={handleClose} id="qr-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scanner view */}
            {status === "scanning" && (
              <div className={styles.scanBody}>
                <div className={styles.viewfinder}>
                  <div id="qr-reader-modal" className={styles.qrReader} />
                  {/* Animated corners */}
                  <div className={styles.corner} data-pos="tl" />
                  <div className={styles.corner} data-pos="tr" />
                  <div className={styles.corner} data-pos="bl" />
                  <div className={styles.corner} data-pos="br" />
                  {/* Scan line */}
                  <div className={styles.scanLine} />
                </div>
                <p className={styles.scanHint}>Align QR code within the frame</p>
              </div>
            )}


            {/* Processing */}
            {status === "processing" && (
              <div className={styles.statusBody}>
                <div className={styles.spinner} />
                <p className={styles.statusTitle}>{isAttendanceScan ? "Marking attendance…" : "Registering you…"}</p>
                <p className={styles.statusSub}>Please wait a moment</p>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className={styles.statusBody}>
                <div className={`${styles.statusIcon} ${styles.successIcon}`}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className={styles.statusTitle}>{isAttendanceScan ? "Marked!" : "Registered!"}</p>
                <p className={styles.statusSub}>{message}</p>
                <div className={styles.sheetActions}>
                  <button className="btn-primary" onClick={handleRetry}>{isRedirectFlow ? "Try Again" : "Scan Another"}</button>
                  <button className="btn-secondary" onClick={handleClose}>{isRedirectFlow ? "Close" : "Done"}</button>
                </div>
              </div>
            )}

            {/* Already registered */}
            {status === "already" && (
              <div className={styles.statusBody}>
                <div className={`${styles.statusIcon} ${styles.alreadyIcon}`}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className={styles.statusTitle}>{isAttendanceScan ? "Already Marked" : "Already Registered"}</p>
                <p className={styles.statusSub}>{message}</p>
                <div className={styles.sheetActions}>
                  <button className="btn-secondary" onClick={handleRetry}>{isRedirectFlow ? "Try Again" : "Scan Another"}</button>
                  <button className="btn-secondary" onClick={handleClose}>Close</button>
                </div>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className={styles.statusBody}>
                <div className={`${styles.statusIcon} ${styles.errorIcon}`}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className={styles.statusTitle}>Oops!</p>
                <p className={styles.statusSub}>{message}</p>
                <div className={styles.sheetActions}>
                  <button className="btn-primary" onClick={handleRetry}>Try Again</button>
                  <button className="btn-secondary" onClick={handleClose}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
