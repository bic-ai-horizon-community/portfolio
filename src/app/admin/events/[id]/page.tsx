import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import styles from "./AdminEventDetail.module.css";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusUpdater } from "@/components/admin/StatusUpdater";

import { AttendanceMarker } from "@/components/admin/AttendanceMarker";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { DeleteMediaButton } from "@/components/admin/DeleteMediaButton";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { ManualEnrollmentForm } from "@/components/admin/ManualEnrollmentForm";
import { RemoveRegistrationButton } from "@/components/admin/RemoveRegistrationButton";
import { RealtimeRefresher } from "@/components/admin/RealtimeRefresher";
import Link from "next/link";

export default async function AdminEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ users?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;
  const userQuery = ((await searchParams).users || "").trim();
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        where: userQuery
          ? {
              user: {
                OR: [
                  { name: { contains: userQuery, mode: "insensitive" } },
                  { email: { contains: userQuery, mode: "insensitive" } },
                ],
              },
            }
          : undefined,
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      attendances: {
        include: { user: true },
      },
      media: true,
    },
  });

  if (!event) notFound();

  const attendeeIds = new Set(event.attendances.map((a) => a.userId));

  // Build attendance timestamp lookup
  const attendanceTimestamps = new Map<string, Date>();
  for (const att of event.attendances) {
    attendanceTimestamps.set(att.userId, att.timestamp);
  }

  const audienceLabels: Record<string, string> = {
    BOTH: "Everyone",
    COLLEGE_ONLY: "College Only",
    PUBLIC_ONLY: "General Public",
  };
  const regTypeLabels: Record<string, string> = {
    BUTTON: "Single Button",
    FORM: "Custom Form",
  };

  return (
    <div className={styles.page}>
      <RealtimeRefresher intervalMs={3000} />
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <p className={styles.breadcrumb}>Admin / Events / {id.substring(0, 8)}</p>
            <h1>{event.title}</h1>
          </div>
          <div className={styles.primaryActions}>
            <a
              href={`/api/admin/events/${id}/export`}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}
              download
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', display: 'inline-block' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Excel
            </a>
            <AdminDeleteButton id={id} type="event" />
            <Link href={`/admin/events/edit/${id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', display: 'inline-block' }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Event
            </Link>
          </div>
        </div>

        <div className={styles.utilityGrid}>
          <StatusUpdater id={id} type="event" currentStatus={event.status} />
        </div>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Registrations</h3>
          <p>{event.registrations.length}</p>
        </div>
        <div className={`${styles.statCard} glass-card`} style={{ color: 'var(--success)' }}>
          <h3>Attendees</h3>
          <p>{event.attendances.length}</p>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Audience</h3>
          <p style={{ fontSize: '0.9rem' }}>{audienceLabels[event.audienceType] || 'Everyone'}</p>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Registration</h3>
          <p style={{ fontSize: '0.9rem' }}>{regTypeLabels[event.registrationType] || 'Button'}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Registered Users</h2>
            </div>
            <div className={styles.sectionToolbar}>
              <ManualEnrollmentForm eventId={id} />
              <SearchInput placeholder="Search registered users..." queryKey="users" />
            </div>
            <div className={`${styles.tableWrapper} glass-card`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>User ID</th>
                    <th>Status</th>
                    <th>Attendance Time</th>
                    <th>Mark Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {event.registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <div className={styles.userName}>{reg.user.name}</div>
                        <div className={styles.userEmail}>{reg.user.email}</div>
                      </td>
                      <td><code className={styles.nodeId}>{reg.userId.substring(0, 8)}</code></td>
                      <td>
                        {attendeeIds.has(reg.userId) ? (
                          <span className={styles.attended}>ATTENDED</span>
                        ) : (
                          <span className={styles.registered}>REGISTERED</span>
                        )}
                      </td>
                      <td>
                        {attendanceTimestamps.has(reg.userId) ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                            {new Date(attendanceTimestamps.get(reg.userId)!).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <AttendanceMarker 
                          eventId={id} 
                          userId={reg.userId} 
                          isAttended={attendeeIds.has(reg.userId)} 
                          disabled={event.status !== "ONGOING"}
                        />
                      </td>
                      <td>
                        <RemoveRegistrationButton userId={reg.userId} eventId={id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {event.registrations.length === 0 && <p className={styles.noData}>{userQuery ? "No matching users found." : "No users registered yet."}</p>}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h2>Event Gallery</h2>
            <div className={`${styles.mediaSection} glass-card`}>
              <div className={styles.mediaGrid}>
                {event.media.map((m) => (
                  <div key={m.id} className={styles.mediaItem} style={{ position: 'relative' }}>
                    <DeleteMediaButton id={m.id} />
                    <img src={m.url} alt="Event Media" />
                  </div>
                ))}
              </div>
              <MediaUpload id={id} type="event" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
