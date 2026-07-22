import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { qrData } = await req.json();

    if (!qrData || typeof qrData !== "string") {
      return NextResponse.json({ message: "Invalid QR data" }, { status: 400 });
    }

    const match = qrData.match(/^AIHORIZON:(EVENT|WORKSHOP):([^:]+):USER:([^:]+)$/);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid QR code format. Not an AI Horizon registration QR." },
        { status: 400 }
      );
    }

    const type = match[1].toLowerCase(); 
    const itemId = match[2];
    const userId = match[3];

    let item;
    if (type === "workshop") {
      item = await prisma.workshop.findUnique({ where: { id: itemId } });
    } else {
      item = await prisma.event.findUnique({ where: { id: itemId } });
    }

    if (!item) {
      return NextResponse.json(
        { message: `${type === "workshop" ? "Workshop" : "Event"} not found` },
        { status: 404 }
      );
    }

    if (item.status !== "ONGOING" && item.status !== "OPEN_FOR_REGISTRATION") {
      return NextResponse.json(
        { message: `This ${type} is not currently active. Attendance can only be marked for ongoing or open ${type}s.` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const registrationWhere = type === "workshop"
      ? { userId, workshopId: itemId }
      : { userId, eventId: itemId };

    const registration = await prisma.registration.findFirst({
      where: registrationWhere,
    });

    if (!registration) {
      return NextResponse.json(
        { message: `${user.name} is not registered for this ${type}` },
        { status: 400 }
      );
    }

    const attendanceWhere = type === "workshop"
      ? { userId_workshopId: { userId, workshopId: itemId } }
      : { userId_eventId: { userId, eventId: itemId } };

    const existingAttendance = await prisma.attendance.findUnique({
      where: attendanceWhere as any,
    });

    return NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
      itemTitle: item.title,
      type,
      registrationType: (item as any).registrationType,
      formFields: (item as any).formFields || [],
      formResponses: registration.formResponses || {},
      status: registration.status,
      alreadyMarked: !!existingAttendance,
      timestamp: existingAttendance?.timestamp || null,
    }, { status: 200 });

  } catch (error) {
    console.error("Scan Info Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
