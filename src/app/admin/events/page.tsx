import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./AdminEvents.module.css";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const query = ((await searchParams).q || "").trim();

  const events = await prisma.event.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: { registrations: true, attendances: true },
      },
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="section-title">Event Management</h1>
        <div className={styles.headerActions}>
          <form className={styles.searchForm}>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search events..."
              className={styles.searchInput}
            />
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <Link href="/admin/events/new" className="btn-primary">
            + Create Event
          </Link>
        </div>
      </div>

      <div className={`${styles.tableWrapper} glass-card`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Registrations</th>
              <th>Attendees</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className={styles.eventTitle}>
                  <span>{event.title}</span>
                </td>
                <td>
                  <span className={styles.status} data-status={event.status}>
                    {event.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td>{event._count.registrations}</td>
                <td>{event._count.attendances}</td>
                <td className={styles.actions}>
                  <Link href={`/admin/events/${event.id}`}>Manage</Link>
                  <Link href={`/events/${event.id}`} target="_blank" className={styles.viewLink}>View Live</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <div className={styles.empty}>{query ? "No matching events found." : "No events initialized."}</div>}
      </div>
    </div>
  );
}
