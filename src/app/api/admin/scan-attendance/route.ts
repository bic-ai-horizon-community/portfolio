import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/admin/scan-attendance
 * Admin scans a user's QR code to mark attendance.
 * QR format: AIHORIZON:EVENT:<eventId>:USER:<userId>
 *         or AIHORIZON:WORKSHOP:<workshopId>:USER:<userId>
 */
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

    // Parse QR format: AIHORIZON:EVENT:<id>:USER:<id> or AIHORIZON:WORKSHOP:<id>:USER:<id>
    const match = qrData.match(/^AIHORIZON:(EVENT|WORKSHOP):([^:]+):USER:([^:]+)$/);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid QR code format. Not an AI Horizon registration QR." },
        { status: 400 }
      );
    }

    const type = match[1].toLowerCase(); // "event" or "workshop"
    const itemId = match[2];
    const userId = match[3];

    // Verify the item exists and is ongoing
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

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is registered
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

    // Check if already attended
    const attendanceWhere = type === "workshop"
      ? { userId_workshopId: { userId, workshopId: itemId } }
      : { userId_eventId: { userId, eventId: itemId } };

    const existingAttendance = await prisma.attendance.findUnique({
      where: attendanceWhere as any,
    });

    if (existingAttendance) {
      return NextResponse.json({
        message: `${user.name} already has attendance marked`,
        alreadyMarked: true,
        user: { name: user.name, email: user.email },
        timestamp: existingAttendance.timestamp,
      }, { status: 200 });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        eventId: type === "event" ? itemId : null,
        workshopId: type === "workshop" ? itemId : null,
        verifiedById: (session.user as any).id,
      },
    });

    // Update registration status
    if (type === "workshop") {
      await prisma.registration.updateMany({
        where: { userId, workshopId: itemId },
        data: { status: "ATTENDED" },
      });
    } else {
      await prisma.registration.updateMany({
        where: { userId, eventId: itemId },
        data: { status: "ATTENDED" },
      });
    }

    return NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
      itemTitle: item.title,
      type,
      timestamp: attendance.timestamp,
    }, { status: 201 });
  } catch (error) {
    console.error("Scan Attendance Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
