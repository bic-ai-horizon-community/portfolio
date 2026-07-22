"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./UserQrModal.module.css";

interface UserQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  qrDataUrl: string;
  registrationDate: string;
}

export default function UserQrModal({
  isOpen,
  onClose,
  eventTitle,
  qrDataUrl,
  registrationDate,
}: UserQrModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.eventTitle}>{eventTitle}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          <p className={styles.subtitle}>Your Registration QR</p>
          <div className={styles.qrWrapper}>
            <img src={qrDataUrl} alt="Registration QR Code" className={styles.qrImage} />
          </div>
          <p className={styles.date}>Registered: {new Date(registrationDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
