import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import QrScanner from "@/components/dashboard/QrScanner";
import { DashboardQrButton } from "@/components/dashboard/DashboardQrButton";
import styles from "./Dashboard.module.css";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";

  const [
    registrations, 
    attendances,
    totalEvents,
    totalWorkshops
  ] = await Promise.all([
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
    prisma.event.count(),
    prisma.workshop.count(),
  ]);

  const attended = registrations.filter((r) => r.status === "ATTENDED").length;
  const totalRegistrations = registrations.length;

  // Generate QR codes for each registration
  const registrationQrCodes: Record<string, string> = {};
  for (const reg of registrations) {
    const type = reg.eventId ? "EVENT" : "WORKSHOP";
    const itemId = reg.eventId || reg.workshopId;
    if (itemId) {
      const qrContent = `AIHORIZON:${type}:${itemId}:USER:${userId}`;
      registrationQrCodes[reg.id] = await QRCode.toDataURL(qrContent, {
        width: 280,
        margin: 2,
        color: { dark: "#fafaf9", light: "#1c1917" },
      });
    }
  }

  return (
    <>
      <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {session.user?.name?.split(" ")[0]}</h1>
          <p className={styles.subtitle}>Here&apos;s what&apos;s happening at AI Horizon</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Row 1: My Activity */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} glass-card`}>
            <div className={styles.statIcon} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
            </div>
            <div>
              <p className={styles.statNum}>{totalRegistrations}</p>
              <p className={styles.statLabel}>Registrations</p>
            </div>
          </div>
          <div className={`${styles.statCard} glass-card`}>
            <div className={styles.statIcon} style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <p className={styles.statNum}>{attended}</p>
              <p className={styles.statLabel}>My Attendance</p>
            </div>
          </div>
        </div>

        {/* Row 2: Platform Overview */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} glass-card`}>
            <div className={styles.statIcon} style={{ background: "rgba(249, 115, 22, 0.1)", color: "var(--primary)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <p className={styles.statNum}>{totalEvents}</p>
              <p className={styles.statLabel}>Total Events</p>
            </div>
          </div>
          <div className={`${styles.statCard} glass-card`}>
            <div className={styles.statIcon} style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <div>
              <p className={styles.statNum}>{totalWorkshops}</p>
              <p className={styles.statLabel}>Total Workshops</p>
            </div>
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
            {registrations.map((reg) => {
              const isAttended = reg.status === "ATTENDED";
              const isDedicated = (reg.event as any)?.isDedicated || (reg.workshop as any)?.isDedicated;
              const formResponses = reg.formResponses as Record<string, string> | null;
              const responseEntries = formResponses ? Object.entries(formResponses) : [];

              return (
                <div key={reg.id} className={`${styles.item} glass-card`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.25rem' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
                    <div className={styles.itemIcon}>
                      {reg.event ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                      )}
                    </div>
                    <div className={styles.itemInfo} style={{ flex: 1 }}>
                      <strong>{reg.event?.title || reg.workshop?.title}</strong>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {reg.event ? "Event" : "Workshop"}
                        {isDedicated && (
                          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', padding: '0.05rem 0.4rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            ⚡ Dedicated
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {registrationQrCodes[reg.id] && (
                        <DashboardQrButton
                          eventTitle={reg.event?.title || reg.workshop?.title || "Event"}
                          qrDataUrl={registrationQrCodes[reg.id]}
                          registrationDate={new Date(reg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        />
                      )}
                      {/* Presence / status badge */}
                      {isAttended ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
                          Present
                        </span>
                      ) : (
                        <span className={`badge ${reg.status === "REJECTED" ? styles.badgeDanger : "badge-ongoing"}`}>
                          {reg.status === "REJECTED" ? "Rejected" : "Registered"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic form responses (from Firebase or local form) */}
                  {responseEntries.length > 0 && (
                    <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem' }}>
                      {responseEntries.map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{key}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.1rem' }}>{String(value) || '—'}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registered On</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.1rem' }}>{new Date(reg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
      {isAdmin && <QrScanner isAdmin={true} />}
    </>
  );
}
