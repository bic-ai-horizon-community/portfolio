"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./Home.module.css";
import { ArrowRightIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.collegeLogos} style={{ animationDelay: "0ms" }}>
            <img src="/ai-horizon-logo.png" alt="AI Horizon" className={styles.mainLogo} />
            <div className={styles.logoDivider}></div>
            <img src="/college-logo.svg" alt="Biratnagar International College" className={styles.collegeLogo} />
          </div>
        </div>

        <div className={styles.badge} style={{ animationDelay: "100ms" }}>
          <span className={styles.badgeDot} />
          Official Student Community
        </div>

        <h1 className={styles.title} style={{ animationDelay: "200ms" }}>
          Where Students Master{" "}
          <span className={styles.highlight}>Artificial Intelligence</span>
        </h1>

        <p className={styles.subtitle} style={{ animationDelay: "300ms" }}>
          The premier AI community at Biratnagar International College. Learn, build, and innovate 
          with hands-on workshops, hackathons, and a network of future engineers.
        </p>

        <div className={styles.actions} style={{ animationDelay: "400ms" }}>
          <Link href="/events" className="btn-primary" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
            Explore Events <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="btn-secondary"
            style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}
          >
            Join the Community
          </button>
        </div>

        {/* Stats */}
        <div className={styles.stats} style={{ animationDelay: "500ms" }}>
          <div className={styles.stat}>
            <span className={styles.statNum}>Events</span>
            <span className={styles.statLabel}>Hackathons & Talks</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>Workshops</span>
            <span className={styles.statLabel}>Hands-on Learning</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>Community</span>
            <span className={styles.statLabel}>BIC Students</span>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className={styles.features}>
        <div className={`${styles.feature} glass-card`} style={{ animationDelay: "600ms" }}>
          <div className={styles.featureIcon} style={{ "--icon-color": "#3b82f6" } as any}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3>Workshops</h3>
          <p>Practical, hands-on sessions covering everything from ML fundamentals to production-grade LLMs — led by industry practitioners.</p>
        </div>

        <div className={`${styles.feature} glass-card`} style={{ animationDelay: "700ms" }}>
          <div className={styles.featureIcon} style={{ "--icon-color": "#8b5cf6" } as any}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3>Events</h3>
          <p>Hackathons, guest lectures, and networking sessions with researchers and engineers building the future of AI.</p>
        </div>

        <div className={`${styles.feature} glass-card`} style={{ animationDelay: "800ms" }}>
          <div className={styles.featureIcon} style={{ "--icon-color": "#06b6d4" } as any}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <h3>Resources</h3>
          <p>Access curated reading lists, project repositories, technical documentation, and community-created learning materials.</p>
        </div>
      </section>
    </div>
  );
}
