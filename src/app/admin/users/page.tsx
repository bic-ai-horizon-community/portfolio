import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./AdminUsers.module.css";
import { RoleToggle } from "@/components/admin/RoleToggle";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const query = ((await searchParams).q || "").trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Manage Users</h1>
        <form className={styles.searchForm}>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search users..."
            className={styles.searchInput}
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={styles.roleBadge} data-role={user.role}>
                  {user.role}
                </span>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <RoleToggle userId={user.id} currentRole={user.role} isSelf={user.id === (session.user as any).id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <div className={styles.empty}>{query ? "No matching users found." : "No users found."}</div>}
    </div>
  );
}
