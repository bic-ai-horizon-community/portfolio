"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./RegisterButton.module.css";
import { RegistrationForm, FormField } from "./RegistrationForm";

interface RegisterButtonProps {
  id: string;
  type: "event" | "workshop";
  isRegistered: boolean;
  isOpen: boolean;
  registrationType: "BUTTON" | "FORM";
  formFields: FormField[];
  audienceType: "COLLEGE_ONLY" | "PUBLIC_ONLY" | "BOTH";
  userEmail?: string;
  registrationStatus?: string | null;
  initialFormResponses?: Record<string, any>;
  userQrDataUrl?: string;
  eventStatus?: "OPEN_FOR_REGISTRATION" | "ONGOING" | "COMPLETED";
}

export const RegisterButton = ({ 
  id, 
  type, 
  isRegistered, 
  isOpen,
  registrationType,
  formFields,
  audienceType,
  userEmail,
  registrationStatus,
  initialFormResponses = {},
  userQrDataUrl,
  eventStatus
}: RegisterButtonProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(isRegistered);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const handleRegister = async (formResponses: Record<string, any> = {}) => {
    if (!session) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const method = (registered && isEditing) ? "PATCH" : "POST";
      const res = await fetch(`/api/${type}s/${id}/register`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formResponses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setRegistered(true);
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (registered && !isEditing) {
    return (
      <div className={styles.successBlock}>
        <div className={styles.success}>
          <svg className={styles.checkIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeDasharray="50" strokeDashoffset="0" style={{ animation: "drawCheck 0.5s ease both" }}/>
          </svg>
          You&apos;re Registered
        </div>
        
        {userQrDataUrl && registrationStatus !== "ATTENDED" && eventStatus !== "COMPLETED" && (
          <div className={styles.personalQrBlock}>
            <p className={styles.qrDesc}>Present this QR code at the venue</p>
            <div className={styles.qrImageWrapper}>
              <img src={userQrDataUrl} alt="Your Personal QR Code" width={220} height={220} className={styles.personalQrImage} />
            </div>
          </div>
        )}

        {registrationType === "FORM" && registrationStatus !== "ATTENDED" && (
          <button 
            className="btn-secondary" 
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => setIsEditing(true)}
          >
            Edit Form Responses
          </button>
        )}
      </div>
    );
  }

  if (!isOpen && !isEditing) {
    return <div className={styles.closed}>Registration Closed</div>;
  }
  
  if (audienceType === "COLLEGE_ONLY") {
    if (!userEmail || !userEmail.endsWith("@bicnepal.edu.np")) {
      return <div className={styles.closed}>This event is for college members only</div>;
    }
  } else if (audienceType === "PUBLIC_ONLY") {
    if (!userEmail || !userEmail.endsWith("@gmail.com")) {
      return <div className={styles.closed}>This event is for general public only</div>;
    }
  }

  if (registrationType === "FORM") {
    return (
      <div style={{ marginTop: isEditing ? '1rem' : 0 }}>
        {isEditing && <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Edit Your Details</h4>}
        <RegistrationForm 
          fields={formFields} 
          onSubmit={handleRegister} 
          loading={loading} 
          error={error} 
          initialValues={initialFormResponses}
          buttonText={isEditing ? "Save Changes" : "Register Now"}
          onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      <button className={`btn-primary ${styles.button}`} onClick={() => handleRegister({})} disabled={loading}>
        {loading ? "Registering…" : "Register Now"}
      </button>
    </div>
  );
};
