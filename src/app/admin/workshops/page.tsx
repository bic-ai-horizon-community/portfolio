import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./AdminWorkshops.module.css";

export default async function AdminWorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const query = ((await searchParams).q || "").trim();

  const workshops = await prisma.workshop.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { speakers: { contains: query, mode: "insensitive" } },
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
        <h1 className="section-title">Workshop Management</h1>
        <div className={styles.headerActions}>
          <form className={styles.searchForm}>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search workshops..."
              className={styles.searchInput}
            />
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <Link href="/admin/workshops/new" className="btn-primary">
            + Create Workshop
          </Link>
        </div>
      </div>

      <div className={`${styles.tableWrapper} glass-card`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workshop Title</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Registrations</th>
              <th>Attendees</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {workshops.map((workshop) => (
              <tr key={workshop.id}>
                <td className={styles.titleCell}>
                  <span>{workshop.title}</span>
                  {workshop.isDedicated && (
                    <span style={{ marginLeft: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                      ⚡ Dedicated
                    </span>
                  )}
                </td>
                <td className={styles.dateCell}>
                  {workshop.schedule || workshop.startDate 
                    ? new Date(workshop.schedule || workshop.startDate!).toLocaleDateString() 
                    : "TBD"}
                </td>
                <td>
                  <span className={styles.status} data-status={workshop.status}>
                    {workshop.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td>{workshop._count.registrations}</td>
                <td>{workshop._count.attendances}</td>
                <td className={styles.actions}>
                  <Link href={`/admin/workshops/${workshop.id}`}>Manage</Link>
                  <Link href={`/workshops/${workshop.id}`} target="_blank" className={styles.viewLink}>Live</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workshops.length === 0 && <div className={styles.empty}>{query ? "No matching workshops found." : "No workshops initialized."}</div>}
      </div>
    </div>
  );
}
