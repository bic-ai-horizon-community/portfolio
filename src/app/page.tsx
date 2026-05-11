import prisma from "@/lib/prisma";
import { HeroActions, JoinCTA } from "@/components/home/HomeActions";
import styles from "./Home.module.css";
import { CalendarIcon, ClockIcon, UserIcon } from "@/components/icons";
import Link from "next/link";

export const revalidate = 60;


type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  startDate?: Date | null;
  schedule?: Date | null;
};

const getLatestDate = (item: TimelineItem) => {
  const possibleDates = [item.startDate, item.schedule, item.createdAt];
  const validDate = possibleDates.find((dateValue) => dateValue && !Number.isNaN(new Date(dateValue).getTime()));
  return validDate ? new Date(validDate).getTime() : 0;
};

const formatTimelineDate = (item: TimelineItem) => {
  const possibleDates = [item.startDate, item.schedule, item.createdAt];
  const validDate = possibleDates.find((dateValue) => dateValue && !Number.isNaN(new Date(dateValue).getTime()));
  return validDate
    ? new Date(validDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "Date TBD";
};

export default async function Home() {
  // Fetch data on the server
  const [eventsData, workshopsData] = await Promise.all([
    prisma.event.findMany({
      take: 3,
      orderBy: { startDate: "desc" },
      select: { id: true, title: true, description: true, createdAt: true, startDate: true }
    }),
    prisma.workshop.findMany({
      take: 3,
      orderBy: { schedule: "desc" },
      select: { id: true, title: true, description: true, createdAt: true, startDate: true, schedule: true }
    })
  ]);

  const events = eventsData as any[];
  const workshops = workshopsData as any[];

  return (
    <div className={styles.page}>
      {/* ─── Hero Section ─── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badgeWrapper}>
            {/* <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span>BIC AI Community</span>
            </div> */}
          </div>

          <h1 className={styles.heroTitle}>
            Collaboration<br />
            <span className={styles.gradientText}>For Innovation</span>
          </h1>

          <p className={styles.heroDescription}>
            The place for AI enthusiasts at BIC to explore, learn, and research.
          </p>

          <HeroActions />
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.visualCard}>
            <div className={styles.cardHeader}>
              <div className={styles.dotRed} />
              <div className={styles.dotYellow} />
              <div className={styles.dotGreen} />
            </div>
            <div className={styles.cardBody}>
              <code className={styles.codeLine}><span>$</span> ai init community</code>
              <code className={styles.codeLine}><span className={styles.codeBlue}>SUCCESS</span> Found 25+ developers...</code>
              <code className={styles.codeLine}><span className={styles.codePurple}>FETCH</span> Latest workshops...</code>
              <code className={styles.codeLine}><span className={styles.codeGreen}>READY</span> Shaping the future.</code>
            </div>
          </div>
          <div className={styles.floatingLogo}>
            <img src="/ai-horizon-logo.png" alt="AI Horizon" />
          </div>
        </div>
      </section>

      {/* ─── Bento Grid Section ─── */}
      <section className={styles.bentoSection}>
        <div className={styles.bentoGrid}>
          {/* Main Feature */}
          <div className={`${styles.bentoItem} ${styles.mainBento} glass-card`}>
            <div className={styles.bentoContent}>
              <div className={styles.bentoIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--primary)" }}>
                <CalendarIcon />
              </div>
              <h3>Hands-on Workshops</h3>
              <p>Collaborate on innovative projects, attend workshops, and connect with fellow AI enthusiasts. Learn and Research on our community project and many more. </p>
            </div>
            <div className={styles.bentoGraphic}>
              <div className={styles.abstractShapes}>
                <div className={styles.shape1} />
                <div className={styles.shape2} />
              </div>
            </div>
          </div>

          {/* Stat Card 1 */}
          <div className={`${styles.bentoItem} ${styles.statBento} glass-card`}>
            <span className={styles.statValue}>30+</span>
            <span className={styles.statLabel}>Active Members</span>
          </div>

          {/* Stat Card 2 */}
          <div className={`${styles.bentoItem} ${styles.statBento} glass-card`}>
            <span className={styles.statValue}>15+</span>
            <span className={styles.statLabel}>Expert Sessions</span>
          </div>

          {/* Secondary Feature */}
          <div className={`${styles.bentoItem} ${styles.featureBento} glass-card`}>
            <div className={styles.bentoIcon} style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
              <UserIcon />
            </div>
            <h3>Network</h3>
            <p>Connect with curious and learning oriented student developers and industry mentors.</p>
          </div>

          {/* Small Feature */}
          <div className={`${styles.bentoItem} ${styles.smallBento} glass-card`}>
            <h3>Hackathons</h3>
            <p>24h sprints to build and ship innovative AI solutions.</p>
          </div>

          {/* Partners/Logos */}
          <div className={`${styles.bentoItem} ${styles.logoBento} glass-card`}>
            <div className={styles.logoGroup}>
              <img src="/college-logo.svg" alt="BIC" className={styles.bentoCollegeLogo} />
              <div className={styles.logoDivider} />
              <span className={styles.partnerText}>Official Chapter</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.timelineSection}>
        <div className={styles.timelineGrid}>
          <div className={`glass-card ${styles.timelineCard}`}>
            <div className={styles.timelineHeader}>
              <h3>Latest Events</h3>
              <Link href="/events">View all</Link>
            </div>
            <div className={styles.timelineList}>
              {events.length === 0 ? (
                <p className={styles.timelineFallback}>No events available yet.</p>
              ) : (
                events.map((event) => (
                  <article key={event.id} className={styles.timelineItem}>
                    <div className={styles.timelineTitleRow}>
                      <CalendarIcon />
                      <h4>{event.title}</h4>
                    </div>
                    <p>{event.description?.slice(0, 110) || "Details coming soon."}</p>
                    <span className={styles.timelineMeta}>
                      <ClockIcon />
                      {formatTimelineDate(event)}
                    </span>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className={`glass-card ${styles.timelineCard}`}>
            <div className={styles.timelineHeader}>
              <h3>Latest Workshops</h3>
              <Link href="/workshops">View all</Link>
            </div>
            <div className={styles.timelineList}>
              {workshops.length === 0 ? (
                <p className={styles.timelineFallback}>No workshops available yet.</p>
              ) : (
                workshops.map((workshop) => (
                  <article key={workshop.id} className={styles.timelineItem}>
                    <div className={styles.timelineTitleRow}>
                      <CalendarIcon />
                      <h4>{workshop.title}</h4>
                    </div>
                    <p>{workshop.description?.slice(0, 110) || "Details coming soon."}</p>
                    <span className={styles.timelineMeta}>
                      <ClockIcon />
                      {formatTimelineDate(workshop)}
                    </span>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className={styles.finalCta}>
        <div className={styles.ctaBackground}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
        </div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Don&apos;t watch the future. <br /><span>Build it.</span></h2>
          <p className={styles.ctaText}>
            Join the most ambitious student community at BIC. Access exclusive resources,
            mentorship, and a network that matters.
          </p>
          <div className={styles.ctaButtons}>
            <JoinCTA />
          </div>
        </div>
      </section>
    </div>
  );
}
