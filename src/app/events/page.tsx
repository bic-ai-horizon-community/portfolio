import prisma from "@/lib/prisma";
import Link from "next/link";
import styles from "./Events.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Open",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
};

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { organizedBy: { select: { name: true } } },
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="section-title">Events</h1>
          <p className={styles.pageDesc}>Explore our upcoming and past programs — hackathons, talks, and networking sessions.</p>
        </div>
        <div className={styles.filterBar}>
          <span className={styles.count}>{events.length} total</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h3>No Events Yet</h3>
          <p>We&apos;re planning new activities. Check back soon!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => (
            <div key={event.id} className={`${styles.card} glass-card`}>
              <div className={styles.cardTop}>
                <span className={`badge ${
                  event.status === "OPEN_FOR_REGISTRATION" ? "badge-open" :
                  event.status === "ONGOING" ? "badge-ongoing" : "badge-completed"
                }`}>
                  {event.status === "OPEN_FOR_REGISTRATION" && <span className={styles.liveDot} />}
                  {STATUS_LABEL[event.status]}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{event.title}</h2>
              <div className={styles.cardMeta}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {event.startDate && new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {event.startTime && (
                  <>
                    <span className={styles.metaDivider}>•</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {event.startTime} - {event.endTime}
                  </>
                )}
              </div>
              <p className={styles.description}>{event.description.substring(0, 120)}…</p>
              <Link href={`/events/${event.id}`} className={styles.viewBtn}>
                View Details
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
