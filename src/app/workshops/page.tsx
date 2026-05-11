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
    include: { organizedBy: { select: { name: true } } },
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
                  {workshop.status === "OPEN_FOR_REGISTRATION" && <span className={styles.liveDot} />}
                  {STATUS_LABEL[workshop.status]}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{workshop.title}</h2>
              <div className={styles.schedule}>
                <CalendarIcon className="w-4 h-4" />
                {workshop.eventType === "ONE_DAY" ? (
                  <span>
                    {new Date(workshop.startDate || workshop.schedule!).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                ) : (
                  <span>
                    {new Date(workshop.startDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" - "}
                    {new Date(workshop.endDate!).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {workshop.startTime && (
                  <>
                    {" · "}
                    {workshop.startTime} - {workshop.endTime}
                  </>
                )}
              </div>
              <p className={styles.description}>{workshop.description.substring(0, 120)}…</p>
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
