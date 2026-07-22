"use client";

import { useState } from "react";
import UserQrModal from "./UserQrModal";

interface DashboardQrButtonProps {
  eventTitle: string;
  qrDataUrl: string;
  registrationDate: string;
}

export function DashboardQrButton({
  eventTitle,
  qrDataUrl,
  registrationDate,
}: DashboardQrButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="btn-secondary" 
        style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        onClick={() => setIsOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="3" height="3" rx="0.5" />
          <rect x="18" y="14" width="3" height="3" rx="0.5" /><rect x="14" y="18" width="3" height="3" rx="0.5" /><rect x="18" y="18" width="3" height="3" rx="0.5" />
        </svg>
        Show QR
      </button>

      <UserQrModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eventTitle={eventTitle}
        qrDataUrl={qrDataUrl}
        registrationDate={registrationDate}
      />
    </>
  );
}
