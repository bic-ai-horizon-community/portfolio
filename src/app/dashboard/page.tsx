import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import styles from "./Dashboard.module.css";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;

  const [registrations, attendances] = await Promise.all([
    prisma.registration.findMany({
      where: { userId },
      include: { event: true, workshop: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendance.findMany({
      where: { userId },
      include: { event: true, workshop: true },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const attended = registrations.filter((r) => r.status === "ATTENDED").length;
  const pending  = registrations.filter((r) => r.status === "REGISTERED").length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {session.user?.name?.split(" ")[0]}</h1>
          <p className={styles.subtitle}>Here&apos;s your activity overview</p>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.stats}>
        <div className={`${styles.statCard} glass-card`}>
          <div className={styles.statIcon} style={{ background: "rgba(59,130,246,0.1)", color: "var(--primary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p className={styles.statNum}>{registrations.length}</p>
            <p className={styles.statLabel}>Registered</p>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <div className={styles.statIcon} style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <p className={styles.statNum}>{attended}</p>
            <p className={styles.statLabel}>Attended</p>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <div className={styles.statIcon} style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p className={styles.statNum}>{pending}</p>
            <p className={styles.statLabel}>Upcoming</p>
          </div>
        </div>
      </div>

      {/* Registrations */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>My Registrations</h2>
        {registrations.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <h3>No registrations yet</h3>
            <p>Browse our events and workshops to get started.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {registrations.map((reg) => (
              <div key={reg.id} className={`${styles.item} glass-card`}>
                <div className={styles.itemIcon}>
                  {reg.event ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <strong>{reg.event?.title || reg.workshop?.title}</strong>
                  <span>{reg.event ? "Event" : "Workshop"}</span>
                </div>
                <span className={`badge ${
                  reg.status === "ATTENDED" ? "badge-open" :
                  reg.status === "REJECTED" ? styles.badgeDanger : "badge-ongoing"
                }`}>{reg.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Attendance History</h2>
        {attendances.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <h3>No attendance records yet</h3>
            <p>Attend an event or workshop to see your history here.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {attendances.map((att) => (
              <div key={att.id} className={`${styles.item} glass-card`}>
                <div className={styles.itemIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className={styles.itemInfo}>
                  <strong>{att.event?.title || att.workshop?.title}</strong>
                  <span>{new Date(att.timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
                <span className="badge badge-open">Attended</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
