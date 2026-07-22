import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const eventUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(["OPEN_FOR_REGISTRATION", "ONGOING", "COMPLETED"]).optional(),
  eventType: z.enum(["ONE_DAY", "MULTIPLE_DAY"]).optional(),
  startDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  dailySchedules: z.any().optional(),
  externalLinks: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })).optional(),
  audienceType: z.enum(["COLLEGE_ONLY", "PUBLIC_ONLY", "BOTH"]).optional(),
  registrationType: z.enum(["BUTTON", "FORM"]).optional(),
  formFields: z.array(z.object({
    label: z.string(),
    type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "number"]),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional().nullable().transform(val => val === null ? undefined : val),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizedBy: {
          select: { name: true, email: true },
        },
        media: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching event" }, { status: 500 });
  }
}

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
    const body = await req.json();
    const validatedData = eventUpdateSchema.parse(body);

    const event = await prisma.event.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
    }
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

    const url = new URL(req.url);
    const password = url.searchParams.get("password");
    if (password !== (process.env.ADMIN_PASSWORD || "aihorizon@admin")) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
