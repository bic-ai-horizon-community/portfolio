import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import styles from "./AdminWorkshopDetail.module.css";
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
import { SyncDedicatedButton } from "@/components/admin/SyncDedicatedButton";

export default async function AdminWorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ users?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  const { id } = await params;
  const userQuery = ((await searchParams).users || "").trim();

  const workshop = await prisma.workshop.findUnique({
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
      attendances: { include: { user: true } },
      media: true,
    },
  });

  if (!workshop) notFound();

  const attendeeIds = new Set(workshop.attendances.map((a) => a.userId));

  // ── Dedicated: collect all unique Firebase field keys (skip private _ keys)
  const dedicatedFieldKeys: string[] = [];
  if (workshop.isDedicated) {
    const keySet = new Set<string>();
    for (const reg of workshop.registrations) {
      const r = reg.formResponses as Record<string, string> | null;
      if (r) Object.keys(r).filter((k) => !k.startsWith("_")).forEach((k) => keySet.add(k));
    }
    dedicatedFieldKeys.push(...keySet);
  }

  // Build attendance timestamp lookup
  const attendanceTimestamps = new Map<string, Date>();
  for (const att of workshop.attendances) {
    attendanceTimestamps.set(att.userId, att.timestamp);
  }

  return (
    <div className={styles.page}>
      <RealtimeRefresher intervalMs={3000} />
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <p className={styles.breadcrumb}>Admin / Workshops / {id.substring(0, 8)}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1>{workshop.title}</h1>
              {workshop.isDedicated && (
                <span style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", padding: "0.25rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  ⚡ Dedicated Site Sync
                </span>
              )}
            </div>
          </div>
          <div className={styles.primaryActions}>
            {workshop.isDedicated && (
              <>
                <a href={process.env.NEXT_PUBLIC_REGISTRATION_URL || "https://aihorizonregistration.samipregmi123456.workers.dev/admin"} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "0.5rem 1rem", textDecoration: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.5rem", display: "inline-block" }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                  Registration Site
                </a>
                <SyncDedicatedButton id={id} type="workshop" />
              </>
            )}
            <AdminDeleteButton id={id} type="workshop" />
            <Link href={`/admin/workshops/edit/${id}`} className="btn-secondary" style={{ padding: "0.5rem 1rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.5rem", display: "inline-block" }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Workshop
            </Link>
          </div>
        </div>
        <div className={styles.utilityGrid}>
          <StatusUpdater id={id} type="workshop" currentStatus={workshop.status} />
        </div>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Enrolled Students</h3>
          <p>{workshop.registrations.length}</p>
        </div>
        <div className={`${styles.statCard} glass-card`} style={{ color: "var(--success)" }}>
          <h3>Verified Attendees</h3>
          <p>{workshop.attendances.length}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>

          {/* ── DEDICATED: Read-only Firebase table ── */}
          {workshop.isDedicated ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>⚡ Dedicated Registrations</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Read-only · Synced from <strong>aihorizonregistration.samipregmi123456.workers.dev</strong>
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }} className="glass-card">
                {workshop.registrations.length === 0 ? (
                  <p className={styles.noData} style={{ padding: "2rem" }}>
                    No registrations synced yet. Click &ldquo;Sync Dedicated Registrations&rdquo; in the header above.
                  </p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Status</th>
                        {dedicatedFieldKeys.map((k) => (
                          <th key={k} style={{ textTransform: "capitalize" }}>{k}</th>
                        ))}
                        <th>Registered At</th>
                        <th>Attended At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workshop.registrations.map((reg, idx) => {
                        const isPresent = attendeeIds.has(reg.userId);
                        const responses = reg.formResponses as Record<string, string> | null;
                        const rawRegisteredAt = responses?._registeredAt;
                        const rawAttendedAt = responses?._attendedAt;
                        const registeredAt = rawRegisteredAt
                          ? new Date(Number(rawRegisteredAt)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                          : new Date(reg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                        const attendedAt = rawAttendedAt
                          ? new Date(Number(rawAttendedAt)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                          : (attendanceTimestamps.has(reg.userId)
                            ? new Date(attendanceTimestamps.get(reg.userId)!).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                            : null);
                        return (
                          <tr key={reg.id}>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{idx + 1}</td>
                            <td>
                              {isPresent ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)", padding: "0.2rem 0.55rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "bold" }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
                                  Present
                                </span>
                              ) : (
                                <span className={styles.registered}>ENROLLED</span>
                              )}
                            </td>
                            {dedicatedFieldKeys.map((k) => (
                              <td key={k} style={{ fontSize: "0.85rem", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {responses?.[k] != null ? String(responses[k]) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                            ))}
                            <td style={{ fontSize: "0.8rem", color: "var(--text-sub)", whiteSpace: "nowrap" }}>
                              {registeredAt}
                            </td>
                            <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                              {attendedAt ? (
                                <span style={{ color: "#22c55e" }}>{attendedAt}</span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : (
            /* ── STANDARD: Editable enrollment table ── */
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Enrollment List</h2>
              </div>
              <div className={styles.sectionToolbar}>
                <ManualEnrollmentForm workshopId={id} />
                <SearchInput placeholder="Search enrolled users..." queryKey="users" />
              </div>
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
                    {workshop.registrations.map((reg) => {
                      const isPresent = attendeeIds.has(reg.userId);
                      return (
                        <tr key={reg.id}>
                          <td>
                            <div className={styles.userName}>{reg.user.name}</div>
                            <div className={styles.userEmail}>{reg.user.email}</div>
                          </td>
                          <td><code className={styles.nodeId}>{reg.userId.substring(0, 8)}</code></td>
                          <td>
                            {isPresent ? (
                              <span className={styles.attended}>VERIFIED</span>
                            ) : (
                              <span className={styles.registered}>ENROLLED</span>
                            )}
                          </td>
                          <td>
                            <AttendanceMarker
                              workshopId={id}
                              userId={reg.userId}
                              isAttended={isPresent}
                              disabled={workshop.status !== "ONGOING"}
                            />
                          </td>
                          <td>
                            <RemoveRegistrationButton userId={reg.userId} workshopId={id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {workshop.registrations.length === 0 && (
                  <p className={styles.noData}>{userQuery ? "No matching enrollments found." : "No enrollments yet."}</p>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h2>Workshop Assets</h2>
            <div className={`${styles.mediaSection} glass-card`}>
              <div className={styles.mediaGrid}>
                {workshop.media.map((m) => (
                  <div key={m.id} className={styles.mediaItem} style={{ position: "relative" }}>
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
