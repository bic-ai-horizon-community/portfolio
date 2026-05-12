import prisma from "@/lib/prisma";
import Link from "next/link";
import styles from "./Workshops.module.css";
import { CalendarIcon } from "@/components/icons";

export const revalidate = 60;

const STATUS_LABEL: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Open",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
};

export default async function WorkshopsPage() {
  const workshops = await prisma.workshop.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      status: true,
      eventType: true,
      schedule: true,
      speakers: true,
    }
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="section-title">Workshops</h1>
          <p className={styles.pageDesc}>Hands-on training sessions covering everything from ML basics to production AI systems.</p>
        </div>
        <div className={styles.filterBar}>
          <span className={styles.count}>{workshops.length} total</span>
        </div>
      </div>

      {workshops.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <h3>No Workshops Scheduled</h3>
          <p>New learning opportunities are coming soon. Stay tuned!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {workshops.map((workshop) => (
            <div key={workshop.id} className={`${styles.card} glass-card`}>
              <div className={styles.cardTop}>
                <span className={`badge ${
                  workshop.status === "OPEN_FOR_REGISTRATION" ? "badge-open" :
                  workshop.status === "ONGOING" ? "badge-ongoing" : "badge-completed"
                }`}>
                  {(workshop.status === "OPEN_FOR_REGISTRATION" || workshop.status === "ONGOING") && <span className={styles.liveDot} />}
                  {STATUS_LABEL[workshop.status]}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{workshop.title}</h2>
              <div className={styles.schedule}>
                <CalendarIcon className="w-4 h-4" />
                {workshop.eventType === "ONE_DAY" ? (
                  <span>
                    {new Date(workshop.startDate || workshop.schedule!).toLocaleDateString('en-US', { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                ) : (
                  <span>
                    {new Date(workshop.startDate!).toLocaleDateString('en-US', { month: "short", day: "numeric" })}
                    {" - "}
                    {new Date(workshop.endDate!).toLocaleDateString('en-US', { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {workshop.startTime && (
                  <>
                    {" · "}
                    <svg className="w-4 h-4 inline-block mr-1 opacity-70" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {workshop.startTime} - {workshop.endTime}
                  </>
                )}
              </div>
              {workshop.speakers && (
                <div className={styles.conductedBy}>
                  Speaker: <strong>{workshop.speakers}</strong>
                </div>
              )}
              <Link href={`/workshops/${workshop.id}`} className={styles.viewBtn}>
                Learn More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
