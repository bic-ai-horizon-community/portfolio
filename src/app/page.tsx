"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./Home.module.css";
import { ArrowRightIcon, CalendarIcon, ClockIcon, UserIcon } from "@/components/icons";

type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  startDate?: string | null;
  schedule?: string | null;
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

export default function Home() {
  const [events, setEvents] = useState<TimelineItem[]>([]);
  const [workshops, setWorkshops] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [eventsResponse, workshopsResponse] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/workshops"),
        ]);

        if (!eventsResponse.ok || !workshopsResponse.ok) {
          throw new Error("Failed to fetch landing data");
        }

        const [eventsData, workshopsData] = await Promise.all([
          eventsResponse.json(),
          workshopsResponse.json(),
        ]);

        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setWorkshops(Array.isArray(workshopsData) ? workshopsData : []);
      } catch {
        setEvents([]);
        setWorkshops([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const latestEvents = useMemo(
    () => [...events].sort((a, b) => getLatestDate(b) - getLatestDate(a)).slice(0, 3),
    [events]
  );
  const latestWorkshops = useMemo(
    () => [...workshops].sort((a, b) => getLatestDate(b) - getLatestDate(a)).slice(0, 3),
    [workshops]
  );

  return (
    <div className={styles.page}>
      {/* ─── Hero Section ─── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badgeWrapper}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              <span>BIC AI Community</span>
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            Architecting the <br />
            <span className={styles.gradientText}>Intelligence Frontier</span>
          </h1>

          <p className={styles.heroDescription}>
            The definitive ecosystem for AI innovation at Biratnagar International College.
            We bridge the gap between academic theory and industry-grade deployment.
          </p>

          <div className={styles.heroActions}>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="btn-primary"
            >
              Start Your Journey <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
            <Link href="/events" className="btn-secondary">
              View Roadmap
            </Link>
          </div>
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
              <p>Move beyond the basics. Build production-ready RAG pipelines, fine-tune LLMs, and deploy computer vision models.</p>
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
            <p>Connect with top-tier student developers and industry mentors.</p>
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
              {isLoading ? (
                <p className={styles.timelineFallback}>Loading events...</p>
              ) : latestEvents.length === 0 ? (
                <p className={styles.timelineFallback}>No events available yet.</p>
              ) : (
                latestEvents.map((event) => (
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
              {isLoading ? (
                <p className={styles.timelineFallback}>Loading workshops...</p>
              ) : latestWorkshops.length === 0 ? (
                <p className={styles.timelineFallback}>No workshops available yet.</p>
              ) : (
                latestWorkshops.map((workshop) => (
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
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="btn-primary"
              style={{ padding: "1.25rem 3.5rem" }}
            >
              Join AI Horizon
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
