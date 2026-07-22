import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const workshopSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  organizedById: z.string().uuid(),
  speakers: z.string().optional(),
  schedule: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  dailySchedules: z.any().optional(),
  eventType: z.enum(["ONE_DAY", "MULTIPLE_DAY"]).optional(),
  materials: z.any().optional(),
  status: z.enum(["OPEN_FOR_REGISTRATION", "ONGOING", "COMPLETED"]).optional(),
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
  })).optional().nullable(),
});

export async function GET() {
  try {
    const workshops = await prisma.workshop.findMany({
      include: {
        organizedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ schedule: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(workshops);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching workshops" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = workshopSchema.parse(body);

    const workshop = await prisma.workshop.create({
      data: validatedData,
    });

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error("API POST Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
