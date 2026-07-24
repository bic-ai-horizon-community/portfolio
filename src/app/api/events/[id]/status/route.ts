import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!Object.values(EventStatus).includes(status as EventStatus)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: { status: status as EventStatus },
    });

    if (event.isDedicated) {
      const { syncDedicatedRegistrations } = await import("@/lib/firebase-sync");
      syncDedicatedRegistrations({
        targetId: event.id,
        targetType: "event",
        title: event.title,
        organizedById: event.organizedById,
      }).catch((err) => console.error("Background sync error:", err));
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
