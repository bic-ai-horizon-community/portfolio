import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  organizedById: z.string().uuid(),
  status: z.enum(["OPEN_FOR_REGISTRATION", "ONGOING", "COMPLETED"]).optional(),
  eventType: z.enum(["ONE_DAY", "MULTIPLE_DAY"]).optional(),
  startDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  dailySchedules: z.any().optional(), // Flexible JSON
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

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = eventSchema.parse(body);

    const event = await prisma.event.create({
      data: validatedData,
    });

    return NextResponse.json(event, { status: 201 });
    } catch (error) {
    console.error("API POST Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
