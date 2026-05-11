import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import styles from "./AdminWorkshopDetail.module.css";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { AttendanceMarker } from "@/components/admin/AttendanceMarker";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { DeleteMediaButton } from "@/components/admin/DeleteMediaButton";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { ManualEnrollmentForm } from "@/components/admin/ManualEnrollmentForm";
import { RemoveRegistrationButton } from "@/components/admin/RemoveRegistrationButton";
import Link from "next/link";

export default async function AdminWorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: {
      registrations: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      attendances: {
        include: { user: true },
      },
      media: true,
    },
  });

  if (!workshop) notFound();

  const attendeeIds = new Set(workshop.attendances.map((a) => a.userId));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <p className={styles.breadcrumb}>Admin / Workshops / {id.substring(0, 8)}</p>
          <h1>{workshop.title}</h1>
        </div>
        <div className={styles.controls} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AdminDeleteButton id={id} type="workshop" />
          <Link href={`/admin/workshops/edit/${id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', display: 'inline-block' }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Workshop
          </Link>
          <StatusUpdater id={id} type="workshop" currentStatus={workshop.status} />
        </div>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Enrolled Students</h3>
          <p>{workshop.registrations.length}</p>
        </div>
        <div className={`${styles.statCard} glass-card`} style={{ color: 'var(--success)' }}>
          <h3>Verified Attendees</h3>
          <p>{workshop.attendances.length}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Enrollment List</h2>
            </div>
            <ManualEnrollmentForm workshopId={id} />
            <div className={`${styles.tableWrapper} glass-card`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>User ID</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workshop.registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>
                        <div className={styles.userName}>{reg.user.name}</div>
                        <div className={styles.userEmail}>{reg.user.email}</div>
                      </td>
                      <td><code className={styles.nodeId}>{reg.userId.substring(0, 8)}</code></td>
                      <td>
                        {attendeeIds.has(reg.userId) ? (
                          <span className={styles.attended}>VERIFIED</span>
                        ) : (
                          <span className={styles.registered}>ENROLLED</span>
                        )}
                      </td>
                      <td>
                        <AttendanceMarker 
                          workshopId={id} 
                          userId={reg.userId} 
                          isAttended={attendeeIds.has(reg.userId)} 
                          disabled={workshop.status !== "ONGOING"}
                        />
                      </td>
                      <td>
                        <RemoveRegistrationButton userId={reg.userId} workshopId={id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {workshop.registrations.length === 0 && <p className={styles.noData}>No enrollments yet.</p>}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h2>Workshop Assets</h2>
            <div className={`${styles.mediaSection} glass-card`}>
              <div className={styles.mediaGrid}>
                {workshop.media.map((m) => (
                  <div key={m.id} className={styles.mediaItem} style={{ position: 'relative' }}>
                    <DeleteMediaButton id={m.id} />
                    <img src={m.url} alt="Workshop Media" />
                  </div>
                ))}
              </div>
              <MediaUpload id={id} type="workshop" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
