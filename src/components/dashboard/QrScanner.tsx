"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./QrScanner.module.css";

type ScanStatus = "idle" | "scanning" | "processing" | "confirming" | "success" | "error" | "already";

interface QrScannerProps {
  redirectUrl?: string;
  redirectMode?: "register" | "attendance";
  hideFab?: boolean;
  isAdmin?: boolean;
}

export default function QrScanner({
  redirectUrl,
  redirectMode,
  hideFab = false,
  isAdmin = false,
}: QrScannerProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("");
  const [studentData, setStudentData] = useState<{name: string, email: string, timestamp?: string} | null>(null);
  const [scanInfo, setScanInfo] = useState<any>(null);
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
      if (isAdmin) {
        const userQrMatch = url.match(/^AIHORIZON:(EVENT|WORKSHOP):([^:]+):USER:([^:]+)$/);
        
        if (userQrMatch) {
          const res = await fetch('/api/admin/scan-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrData: url })
          });
          const data = await res.json();
          
          if (res.status === 200 && data.success) {
            await playSfx("success");
            setScanInfo({ ...data, rawUrl: url });
            
            if (data.alreadyMarked) {
              setStatus("already");
              setStudentData({ name: data.user.name, email: data.user.email, timestamp: data.timestamp });
              setMessage(`${data.user.name}'s attendance was already marked`);
              setTimeout(() => { handleRetry(); }, 3000);
            } else {
              setStatus("confirming");
              setMessage(`Verify details for ${data.user.name}`);
            }
          } else {
            await playSfx("error");
            setStatus("error");
            setMessage(data.message || "Action failed.");
          }
        } else if (url.match(/\/register\/(event|workshop)\/([^/?#]+)/) || url.match(/\/attendance\/(event|workshop)\/([^/?#]+)/)) {
          await playSfx("error");
          setStatus("error");
          setMessage("This is an event QR, not a student registration QR. Ask the student to show their personal QR from their dashboard.");
        } else {
          await playSfx("error");
          setStatus("error");
          setMessage("Invalid QR code format. Please scan a student's personal registration QR.");
        }
        return;
      }

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

  const handleConfirmAttendance = async () => {
    setStatus("processing");
    try {
      const res = await fetch('/api/admin/scan-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: scanInfo.rawUrl })
      });
      const data = await res.json();
      
      if (res.status === 201) {
        await playSfx("success");
        setStatus("success");
        setStudentData({ name: data.user.name, email: data.user.email, timestamp: data.timestamp });
        setMessage(`Attendance marked for "${data.itemTitle}"!`);
        router.refresh();
        setTimeout(() => { handleRetry(); }, 3000);
      } else {
        await playSfx("error");
        setStatus("error");
        setMessage(data.message || "Action failed.");
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
    setScanInfo(null);
    document.body.style.overflow = "";
    if (isRedirectFlow) {
      router.push("/dashboard");
    }
  };

  const handleRetry = () => {
    setStatus(isRedirectFlow ? "processing" : "scanning");
    setMessage("");
    setScanInfo(null);
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.fabIcon}>
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"/>
              <rect x="9" y="9" width="6" height="6" rx="1"/>
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
                <h2 className={styles.sheetTitle}>{isAdmin ? "Admin Scanner" : "Scan QR Code"}</h2>
                <p className={styles.sheetSub}>
                  {isAdmin 
                    ? "Scan student QR codes to mark attendance" 
                    : (isAttendanceScan ? "Point at an event QR to mark attendance" : "Point at an event QR to register")}
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

            {/* Confirming (Admin Only) */}
            {status === "confirming" && scanInfo && (
              <div className={styles.statusBody} style={{ textAlign: 'left', padding: '0 1rem' }}>
                <h3 className={styles.statusTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>Verify Attendee</h3>
                
                <div style={{ background: 'var(--bg-card-2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', width: '100%' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{scanInfo.user.name}</p>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{scanInfo.user.email}</p>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {scanInfo.type === 'event' ? 'Event' : 'Workshop'}: {scanInfo.itemTitle}
                    </p>
                    
                    {scanInfo.registrationType === 'FORM' && scanInfo.formFields && scanInfo.formFields.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Form Responses:</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                          {scanInfo.formFields.map((field: any, idx: number) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{field.label}:</span>{' '}
                              <span style={{ fontWeight: '500' }}>
                                {scanInfo.formResponses[field.label] !== undefined 
                                  ? String(scanInfo.formResponses[field.label]) 
                                  : <em style={{ color: 'var(--text-muted)' }}>Not provided</em>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.sheetActions} style={{ width: '100%', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="btn-primary" onClick={handleConfirmAttendance} style={{ width: '100%' }}>
                    Confirm & Mark Present
                  </button>
                  <button className="btn-secondary" onClick={handleRetry} style={{ width: '100%' }}>
                    Cancel
                  </button>
                </div>
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
                <p className={styles.statusTitle}>{isAdmin ? studentData?.name : (isAttendanceScan ? "Marked!" : "Registered!")}</p>
                {isAdmin ? (
                  <>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{studentData?.email}</p>
                    <p className={styles.statusSub} style={{ fontWeight: 'bold', color: '#10b981' }}>{message}</p>
                    {studentData?.timestamp && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{new Date(studentData.timestamp).toLocaleTimeString()}</p>}
                  </>
                ) : (
                  <p className={styles.statusSub}>{message}</p>
                )}
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
                <p className={styles.statusTitle}>{isAdmin ? studentData?.name : (isAttendanceScan ? "Already Marked" : "Already Registered")}</p>
                {isAdmin ? (
                  <>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{studentData?.email}</p>
                    <p className={styles.statusSub} style={{ fontWeight: 'bold', color: '#f59e0b' }}>{message}</p>
                  </>
                ) : (
                  <p className={styles.statusSub}>{message}</p>
                )}
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
