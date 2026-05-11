import React from "react";

export default function Loading() {
  return (
    <div style={{ 
      minHeight: "60vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      gap: "1.5rem"
    }}>
      <div className="loading-spinner" />
      <p style={{ color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
        INITIALIZING INTERFACE...
      </p>

      <style>{`
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
