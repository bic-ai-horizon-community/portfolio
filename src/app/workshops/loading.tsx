import React from "react";
import styles from "./Workshops.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div style={{ width: "100%" }}>
          <div className="skeleton" style={{ height: "40px", width: "250px", marginBottom: "1rem" }} />
          <div className="skeleton" style={{ height: "20px", width: "100%", maxWidth: "500px" }} />
        </div>
      </div>

      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`${styles.card} glass-card`} style={{ minHeight: "350px" }}>
            <div className="skeleton" style={{ height: "24px", width: "80px", borderRadius: "20px", marginBottom: "1rem" }} />
            <div className="skeleton" style={{ height: "32px", width: "90%", marginBottom: "1rem" }} />
            <div className="skeleton" style={{ height: "20px", width: "150px", marginBottom: "1.5rem" }} />
            <div className="skeleton" style={{ height: "80px", width: "100%", marginBottom: "1.5rem" }} />
            <div className="skeleton" style={{ height: "48px", width: "100%", borderRadius: "12px" }} />
          </div>
        ))}
      </div>

      <style>{`
        .skeleton {
          background: linear-gradient(90deg, var(--bg-card-2) 25%, var(--border) 50%, var(--bg-card-2) 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
          border-radius: 8px;
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
