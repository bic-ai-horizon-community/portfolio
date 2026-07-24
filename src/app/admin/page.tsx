import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./Admin.module.css";
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  const [eventsCount, workshopsCount, usersCount, registrationsCount] = await Promise.all([
    prisma.event.count(),
    prisma.workshop.count(),
    prisma.user.count(),
    prisma.registration.count(),
  ]);

  const stats = [
    { label: "Users", value: usersCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, color: "var(--primary)" },
    { label: "Events", value: eventsCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: "var(--accent)" },
    { label: "Workshops", value: workshopsCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, color: "var(--secondary)" },
    { label: "Registrations", value: registrationsCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, color: "var(--success)" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Manage events, workshops, and users</p>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={`${styles.statCard} glass-card`}>
            <div className={styles.statIcon} style={{ color: s.color, background: `${s.color}18` }}>
              {s.icon}
            </div>
            <div>
              <p className={styles.statNum}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Link href="/admin/events/new" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Event
        </Link>
        <Link href="/admin/workshops/new" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Workshop
        </Link>
        <Link href="/admin/users" className="btn-secondary">Manage Users</Link>
      </div>

      <div className={styles.mgmtSection}>
        <h2 className={styles.mgmtTitle}>Management</h2>
        <div className={styles.mgmtGrid}>
          {[
            { href: "/admin/events", label: "Events", desc: "Create, edit, and manage all events" },
            { href: "/admin/workshops", label: "Workshops", desc: "Manage workshop schedules and enrollments" },
            { href: "/admin/users", label: "Users", desc: "View and manage user roles and accounts" },
            { href: "https://aihorizonregistration.samipregmi123456.workers.dev/admin", label: "Registration Portal", desc: "Access the external Firebase registration site", external: true },
          ].map((link) => (
            <Link key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} className={`${styles.mgmtCard} glass-card`}>
              <div>
                <p className={styles.mgmtCardTitle}>{link.label}</p>
                <p className={styles.mgmtCardDesc}>{link.desc}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {link.external ? (
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                ) : (
                  <path d="M5 12h14M12 5l7 7-7 7" />
                )}
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
