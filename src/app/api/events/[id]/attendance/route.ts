import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const { userId } = await req.json();

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (event.status !== "ONGOING") {
      return NextResponse.json({ message: "Attendance can only be marked during ongoing events" }, { status: 400 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        eventId,
        verifiedById: (session.user as any).id,
      },
    });

    // Also update registration status
    await prisma.registration.update({
      where: { userId_eventId: { userId, eventId } },
      data: { status: "ATTENDED" },
    }).catch(() => { /* User might not have registered but attended, that's fine for some cases */ });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    await prisma.attendance.deleteMany({
      where: { userId, eventId },
    });

    // Optionally revert registration status to REGISTERED
    await prisma.registration.updateMany({
      where: { userId, eventId },
      data: { status: "REGISTERED" },
    });

    return NextResponse.json({ message: "Attendance removed" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

