import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getQrFriendlyError } from "@/lib/qr-errors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "You must be logged in to mark attendance" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const url = new URL(_req.url);
    const type = url.searchParams.get("type") || "event";

    let item;
    if (type === "workshop") {
      item = await prisma.workshop.findUnique({ where: { id } });
    } else {
      item = await prisma.event.findUnique({ where: { id } });
    }

    if (!item) {
      return NextResponse.json({ message: `${type === 'workshop' ? 'Workshop' : 'Event'} not found` }, { status: 404 });
    }

    if (item.status !== "ONGOING") {
      return NextResponse.json(
        { message: "Attendance can only be marked for live items" },
        { status: 400 }
      );
    }

    if (!item.showQr) {
      return NextResponse.json(
        { message: `QR attendance is currently disabled for this ${type}` },
        { status: 403 }
      );
    }

    const registrationWhereClause = type === "workshop"
      ? { userId, workshopId: id }
      : { userId, eventId: id };

    const registration = await prisma.registration.findFirst({
      where: registrationWhereClause,
    });

    if (!registration) {
      return NextResponse.json(
        { message: `You must be registered for this ${type} to mark attendance` },
        { status: 403 }
      );
    }

    const whereClause = type === "workshop" 
      ? { userId_workshopId: { userId, workshopId: id } }
      : { userId_eventId: { userId, eventId: id } };

    const existing = await prisma.attendance.findUnique({
      where: whereClause as any,
    });

    if (existing) {
      return NextResponse.json(
        { message: "Your attendance is already marked", alreadyMarked: true },
        { status: 200 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        eventId: type === "event" ? id : null,
        workshopId: type === "workshop" ? id : null,
        verifiedById: item.organizedById,
      },
    });

    // Also update registration status to ATTENDED
    if (type === "workshop") {
      await prisma.registration.updateMany({
        where: { userId, workshopId: id },
        data: { status: "ATTENDED" },
      });
    } else {
      await prisma.registration.updateMany({
        where: { userId, eventId: id },
        data: { status: "ATTENDED" },
      });
    }

    return NextResponse.json(
      { success: true, attendance, eventTitle: item.title },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance Error:", error);
    const friendlyError = getQrFriendlyError(error);
    if (friendlyError) {
      return NextResponse.json(
        { message: friendlyError.message },
        { status: friendlyError.status }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
