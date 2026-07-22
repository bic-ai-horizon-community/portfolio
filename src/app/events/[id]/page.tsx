import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { RegisterButton } from "@/components/events/RegisterButton";
import { ExternalLinkIcon, CalendarIcon, ClockIcon } from "@/components/icons";
import QRCode from "qrcode";
import styles from "./EventDetail.module.css";
import { getQrAccess } from "@/lib/qr-access";

const STATUS_LABEL: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Open for Registration",
  ONGOING: "Live Now",
  COMPLETED: "Completed",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.description?.substring(0, 155) || `Details for ${event.title} at AI Horizon`,
    alternates: { canonical: `/events/${id}` },
    openGraph: { type: "article" },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizedBy: { select: { name: true } }, media: true },
  });

  if (!event) notFound();

  let isRegistered = false;
  let registration: any = null;
  if (session) {
    registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: id } },
    });
    isRegistered = !!registration;
  }

  // Get the current host for QR code generation
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXTAUTH_URL || "http://localhost:3000");

  const isOngoing = event.status === "ONGOING";
  const qrAccess = getQrAccess({
    showQr: event.showQr,
    qrVisibility: event.qrVisibility,
    isAdmin,
  });
  
  // Event QR code (for scanning by users to register/attend)
  const qrUrl = isOngoing 
    ? `${baseUrl}/attendance/event/${id}` 
    : `${baseUrl}/register/event/${id}`;

  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 220,
    margin: 2,
    color: { dark: "#fafaf9", light: "#1c1917" },
  });

  // Personal user QR code (for admin to scan for attendance)
  let userQrDataUrl: string | null = null;
  if (isRegistered && user) {
    const userQrContent = `AIHORIZON:EVENT:${id}:USER:${user.id}`;
    userQrDataUrl = await QRCode.toDataURL(userQrContent, {
      width: 280,
      margin: 2,
      color: { dark: "#fafaf9", light: "#1c1917" },
    });
  }

  const externalLinks = (event.externalLinks as any[]) || [];
  const dailySchedules = (event.dailySchedules as any[]) || [];
  const formFields = (event.formFields as any[]) || [];
  const canShowSidebar = event.status !== "COMPLETED" || isRegistered;

  return (
    <div className={styles.container}>
      {/* Hero banner */}
      <div className={`${styles.heroBanner} ${
        event.status === "OPEN_FOR_REGISTRATION" ? styles.heroOpen :
        event.status === "ONGOING" ? styles.heroOngoing : styles.heroCompleted
      }`}>
        <div className={styles.heroInner}>
          <span className={`badge ${
            event.status === "OPEN_FOR_REGISTRATION" ? "badge-open" :
            event.status === "ONGOING" ? "badge-ongoing" : "badge-completed"
          }`}>{STATUS_LABEL[event.status]}</span>
          <h1 className={styles.heroTitle}>{event.title}</h1>
          <div className={styles.heroMeta}>
            <div className={styles.metaItem}>
              <CalendarIcon className="w-5 h-5" />
              {event.eventType === "ONE_DAY" ? (
                <span>
                  {event.startDate && new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              ) : (
                <span>
                  {event.startDate && new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {event.endDate && new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            
            {event.startTime && (
              <>
                <span className={styles.metaDivider}>·</span>
                <div className={styles.metaItem}>
                  <ClockIcon className="w-5 h-5" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          {event.eventType === "MULTIPLE_DAY" && dailySchedules.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Full Event Schedule</h2>
              <div className={styles.scheduleGrid}>
                {dailySchedules.map((day, idx) => (
                  <div key={idx} className={`${styles.scheduleCard} glass-card`}>
                    <div className={styles.scheduleDate}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className={styles.scheduleTime}>
                      <ClockIcon className="w-3 h-3 inline-block mr-1" />
                      {day.startTime} - {day.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>About this Event</h2>
            <p className={styles.description}>{event.description}</p>
          </section>

          {externalLinks.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Resources &amp; Links</h2>
              <div className={styles.linkGrid}>
                {externalLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={`${styles.linkCard} glass-card`}>
                    <div>
                      <p className={styles.linkLabel}>{link.label}</p>
                      <p className={styles.linkUrl}>{new URL(link.url).hostname}</p>
                    </div>
                    <ExternalLinkIcon className="w-4 h-4 text-primary" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {event.media.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Gallery</h2>
              <div className={styles.mediaGrid}>
                {event.media.map((item) => (
                  <div key={item.id} className={styles.mediaItem}>
                    {item.type === "IMAGE"
                      ? <img src={item.url} alt="Event media" />
                      : <video src={item.url} controls />
                    }
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          {canShowSidebar && (
            <div className={`${styles.sideCard} glass-card`}>
              {/* Registration / Attendance section */}
              <h3>{isOngoing ? "Attendance" : "Register"}</h3>
              <RegisterButton
                id={id}
                type="event"
                isRegistered={isRegistered}
                registrationStatus={registration?.status || null}
                initialFormResponses={registration?.formResponses || {}}
                isOpen={event.status === "OPEN_FOR_REGISTRATION"}
                eventStatus={event.status}
                registrationType={event.registrationType as "BUTTON" | "FORM"}
                formFields={formFields}
                audienceType={event.audienceType as "COLLEGE_ONLY" | "PUBLIC_ONLY" | "BOTH"}
                userEmail={user?.email || ""}
                userQrDataUrl={userQrDataUrl || undefined}
              />
              {!isRegistered && !isOngoing && event.status !== "COMPLETED" && (
                <p className={styles.sideNote}>Secure your spot for this event.</p>
              )}


            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
