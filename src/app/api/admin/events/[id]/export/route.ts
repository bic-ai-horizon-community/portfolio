import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/events/[id]/export
 * Export event participants as CSV/Excel download
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
        attendances: {
          include: { user: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Build attendance lookup: userId -> timestamp
    const attendanceMap = new Map<string, Date>();
    for (const att of event.attendances) {
      attendanceMap.set(att.userId, att.timestamp);
    }

    // Determine dynamic form field columns
    const formFields = (event.formFields as any[]) || [];
    const dynamicColumns = formFields.map((f: any) => f.label);

    // Build CSV header
    const baseColumns = ["S.N.", "Name", "Email", "Registration Date", "Status"];
    const endColumns = ["Attendance Timestamp"];
    const allColumns = [...baseColumns, ...dynamicColumns, ...endColumns];

    // Escape CSV value
    const csvEscape = (val: string): string => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    // Build rows
    const rows: string[][] = [allColumns];

    event.registrations.forEach((reg, index) => {
      const formResponses = (reg.formResponses as Record<string, any>) || {};
      const attendanceTs = attendanceMap.get(reg.userId);

      const row: string[] = [
        String(index + 1),
        reg.user.name,
        reg.user.email,
        new Date(reg.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        reg.status,
      ];

      // Add dynamic form field values
      for (const col of dynamicColumns) {
        const val = formResponses[col];
        row.push(val !== undefined && val !== null ? String(val) : "");
      }

      // Add attendance timestamp
      row.push(
        attendanceTs
          ? new Date(attendanceTs).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "Not Attended"
      );

      rows.push(row);
    });

    // Generate CSV content
    const csvContent = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

    // Sanitize filename
    const safeTitle = event.title.replace(/[^a-zA-Z0-9_\- ]/g, "").substring(0, 50);
    const filename = `${safeTitle}_participants_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
