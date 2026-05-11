import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { RegisterButton } from "@/components/events/RegisterButton";
import { ExternalLinkIcon, UserIcon } from "@/components/icons";
import styles from "./EventDetail.module.css";

const STATUS_LABEL: Record<string, string> = {
  OPEN_FOR_REGISTRATION: "Open for Registration",
  ONGOING: "Live Now",
  COMPLETED: "Completed",
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizedBy: { select: { name: true } }, media: true },
  });

  if (!event) notFound();

  let isRegistered = false;
  if (session) {
    const reg = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: (session.user as any).id, eventId: id } },
    });
    isRegistered = !!reg;
  }

  const externalLinks = (event.externalLinks as any[]) || [];

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
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
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
          <div className={`${styles.sideCard} glass-card`}>
            <h3>Register</h3>
            <RegisterButton id={id} type="event" isRegistered={isRegistered} isOpen={event.status === "OPEN_FOR_REGISTRATION"} />
            <p className={styles.sideNote}>Secure your spot for this event.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
