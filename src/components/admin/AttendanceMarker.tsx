"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";

interface AttendanceMarkerProps {
  eventId?: string;
  workshopId?: string;
  userId: string;
  isAttended: boolean;
  disabled: boolean;
}

export const AttendanceMarker = ({ eventId, workshopId, userId, isAttended, disabled }: AttendanceMarkerProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (isAttended && !window.confirm("Are you sure you want to un-mark attendance for this user?")) {
      return;
    }

    setLoading(true);
    const type = eventId ? "events" : "workshops";
    const id = eventId || workshopId;

    try {
      if (isAttended) {
        // Un-mark attendance
        const res = await fetch(`/api/${type}/${id}/attendance?userId=${userId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to un-mark attendance");
      } else {
        // Mark attendance
        const res = await fetch(`/api/${type}/${id}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error("Failed to mark attendance");
      }
      router.refresh();
    } catch (err) {
      alert("Error updating attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle} 
      disabled={loading || disabled}
      className={isAttended ? "attendance-toggle present" : "attendance-toggle absent"}
      style={{ 
        opacity: (loading || disabled) ? 0.7 : 1
      }}
      title={isAttended ? "Click to Mark Absent" : "Click to Mark Present"}
    >
      <div className="attendance-box">
        {loading ? (
          <span className="loading-dots">...</span>
        ) : (
          <>
            <div className="attendance-icon">
              {isAttended && <CheckIcon className="w-4 h-4" />}
            </div>
            <span className="attendance-label">
              {isAttended ? "Present" : "Absent"}
            </span>
          </>
        )}
      </div>
    </button>
  );
};
