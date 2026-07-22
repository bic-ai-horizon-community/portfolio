import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { RegisterButton } from "@/components/events/RegisterButton";
import { ExternalLinkIcon, CalendarIcon, ClockIcon } from "@/components/icons";
import QRCode from "qrcode";
import styles from "./WorkshopDetail.module.css";
import { getQrAccess } from "@/lib/qr-access";

const STATUS_LABEL: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Open for Registration",
  ONGOING: "Live Now",
  COMPLETED: "Completed",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!workshop) return { title: "Workshop Not Found" };
  return {
    title: workshop.title,
    description: workshop.description?.substring(0, 155) || `Details for ${workshop.title} at AI Horizon`,
    alternates: { canonical: `/workshops/${id}` },
    openGraph: { type: "article" },
  };
}

export default async function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: { organizedBy: { select: { name: true } }, media: true },
  });

  if (!workshop) notFound();

  let isRegistered = false;
  let registration: any = null;
  if (session) {
    registration = await prisma.registration.findUnique({
      where: { userId_workshopId: { userId: user.id, workshopId: id } },
    });
    isRegistered = !!registration;
  }

  // Get the current host for QR code generation
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXTAUTH_URL || "http://localhost:3000");

  const isOngoing = workshop.status === "ONGOING";
  const qrAccess = getQrAccess({
    showQr: workshop.showQr,
    qrVisibility: workshop.qrVisibility,
    isAdmin,
  });
  
  const qrUrl = isOngoing 
    ? `${baseUrl}/attendance/workshop/${id}` 
    : `${baseUrl}/register/workshop/${id}`;

  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 220,
    margin: 2,
    color: { dark: "#fafaf9", light: "#1c1917" },
  });

  let userQrDataUrl: string | null = null;
  if (isRegistered && user) {
    const userQrContent = `AIHORIZON:WORKSHOP:${id}:USER:${user.id}`;
    userQrDataUrl = await QRCode.toDataURL(userQrContent, {
      width: 280,
      margin: 2,
      color: { dark: "#fafaf9", light: "#1c1917" },
    });
  }

  const externalLinks = (workshop.externalLinks as any[]) || [];
  const dailySchedules = (workshop.dailySchedules as any[]) || [];
  const canShowSidebar = workshop.status !== "COMPLETED" && (!isOngoing || qrAccess.canSeeQr);

  return (
    <div className={styles.container}>
      <div className={`${styles.heroBanner} ${
        workshop.status === "OPEN_FOR_REGISTRATION" ? styles.heroOpen :
        workshop.status === "ONGOING" ? styles.heroOngoing : styles.heroCompleted
      }`}>
        <div className={styles.heroInner}>
          <span className={`badge ${
            workshop.status === "OPEN_FOR_REGISTRATION" ? "badge-open" :
            workshop.status === "ONGOING" ? "badge-ongoing" : "badge-completed"
          }`}>{STATUS_LABEL[workshop.status]}</span>
          <h1 className={styles.heroTitle}>{workshop.title}</h1>
          <div className={styles.heroMeta}>
            <div className={styles.metaItem}>
              <CalendarIcon className="w-5 h-5" />
              {workshop.eventType === "ONE_DAY" ? (
                <span>
                  {(workshop.startDate || workshop.schedule) && new Date(workshop.startDate || workshop.schedule!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              ) : (
                <span>
                  {workshop.startDate && new Date(workshop.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {workshop.endDate && new Date(workshop.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            
            {workshop.startTime && (
              <>
                <span className={styles.metaDivider}>·</span>
                <div className={styles.metaItem}>
                  <ClockIcon className="w-5 h-5" />
                  <span>{workshop.startTime} - {workshop.endTime}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          {workshop.eventType === "MULTIPLE_DAY" && dailySchedules.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Full Workshop Schedule</h2>
              <div className={styles.scheduleGrid}>
                {dailySchedules.map((day, idx) => (
                  <div key={idx} className={styles.scheduleCard}>
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
            <h2 className={styles.sectionTitle}>Workshop Overview</h2>
            <p className={styles.description}>{workshop.description}</p>
          </section>

          {workshop.speakers && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Speakers &amp; Mentors</h2>
              <div className={`${styles.speakersCard} glass-card`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {workshop.speakers}
              </div>
            </section>
          )}

          {externalLinks.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Learning Materials &amp; Links</h2>
              <div className={styles.linkGrid}>
                {externalLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={`${styles.linkCard} glass-card`}>
                    <div>
                      <p className={styles.linkLabel}>{link.label}</p>
                      <p className={styles.linkUrl}>{new URL(link.url).hostname}</p>
                    </div>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {workshop.media.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Gallery</h2>
              <div className={styles.mediaGrid}>
                {workshop.media.map((item) => (
                  <div key={item.id} className={styles.mediaItem}>
                    {item.type === "IMAGE" ? <img src={item.url} alt="Workshop media" /> : <video src={item.url} controls />}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          {canShowSidebar && (
            <div className={`${styles.sideCard} glass-card`}>
              <h3>{isOngoing ? "Attendance" : "Enroll"}</h3>
              <RegisterButton
                id={id}
                type="workshop"
                isRegistered={isRegistered}
                registrationStatus={registration?.status || null}
                initialFormResponses={registration?.formResponses || {}}
                isOpen={workshop.status === "OPEN_FOR_REGISTRATION"}
                eventStatus={workshop.status}
                registrationType={(workshop as any).registrationType || "BUTTON"}
                formFields={((workshop as any).formFields as any[]) || []}
                audienceType={(workshop as any).audienceType || "BOTH"}
                userEmail={user?.email || ""}
                userQrDataUrl={userQrDataUrl || undefined}
              />


            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
