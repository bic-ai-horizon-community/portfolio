import type { Metadata } from "next";
import styles from "./About.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "AI Horizon is the student AI community at Biratnagar International College, Nepal. Founded by Suraj Poddar, Dilasha Poudel, Ayush Pradhan, Roshan Karki and Adarsh Acharya, co-founded by Samip Regmi.",
  alternates: { canonical: "/about" },
};

type Member = {
  name: string;
  initials: string;
  since: string;
};

const FOUNDING_DATE = "7 January 2026";

const FOUNDERS: Member[] = [
  { name: "Suraj Poddar", initials: "SP", since: FOUNDING_DATE },
  { name: "Dilasha Poudel", initials: "DP", since: FOUNDING_DATE },
  { name: "Ayush Pradhan", initials: "AP", since: FOUNDING_DATE },
  { name: "Roshan Karki", initials: "RK", since: FOUNDING_DATE },
  { name: "Adarsh Acharya", initials: "AA", since: FOUNDING_DATE },
];

const CO_FOUNDER: Member = { name: "Samip Regmi", initials: "SR", since: "2 February 2026" };

const PILLARS = [
  {
    title: "Learn",
    body: "Workshops and sessions that go past the surface. Machine learning, deep learning, NLP and computer vision, taught by people who work with them every day.",
  },
  {
    title: "Build",
    body: "Hands-on events where ideas turn into working projects. Hackathons, competitions and long-running builds, with mentors in the room the whole way.",
  },
  {
    title: "Belong",
    body: "An open community for anyone curious about AI. College students, recent graduates and the wider public, learning and shipping together.",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>About Us</p>
        <h1 className="section-title">Built for students, by students in Biratnagar, Nepal</h1>
        <p className={styles.lead}>
          AI Horizon is the student AI community at Biratnagar International College. We
          run workshops, hackathons and hands-on projects so that anyone with an interest
          in artificial intelligence has somewhere to start, somewhere to practise, and
          people to do it with.
        </p>
        <p className={styles.foundedNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Community officially started on {FOUNDING_DATE}
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What we do</h2>
        <div className={styles.pillarGrid}>
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className={`${styles.pillar} glass-card`}>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Founders</h2>
        <p className={styles.sectionDesc}>
          AI Horizon was started by five students at BIC on {FOUNDING_DATE}. Samip Regmi
          joined as a co-founder later, on 2 February 2026, on the recommendation of
          Sandip Tiwari Sir.
        </p>
        <ul className={styles.peopleGrid}>
          {FOUNDERS.map((person) => (
            <li key={person.name} className={`${styles.person} glass-card`}>
              <span className={styles.avatar} aria-hidden="true">
                {person.initials}
              </span>
              <span className={styles.personName}>{person.name}</span>
              <span className={styles.personRole}>Founder</span>
              <span className={styles.personSince}>Since {person.since}</span>
            </li>
          ))}
          <li className={`${styles.person} glass-card`}>
            <span className={styles.avatar} aria-hidden="true">
              {CO_FOUNDER.initials}
            </span>
            <span className={styles.personName}>{CO_FOUNDER.name}</span>
            <span className={styles.personRole}>Co-Founder</span>
            <span className={styles.personSince}>Since {CO_FOUNDER.since}</span>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>In Memory</h2>
        <div className={`${styles.memorial} glass-card`}>
          <span className={styles.memorialAvatar} aria-hidden="true">
            AA
          </span>
          <div className={styles.memorialBody}>
            <p className={styles.memorialName}>Adarsh Acharya</p>
            <p className={styles.memorialRole}>Founder</p>
            <p className={styles.memorialDates}>2059 Paush 16 – 2083 Bhadra 27 BS</p>
            <p className={styles.memorialDatesAlt}>31 December 2002 – 12 September 2026</p>
            <p className={styles.memorialText}>
              A founder of AI Horizon, remembered by the community he helped build. His
              place in this club is permanent, and the work he started here continues in
              the hands of everyone who carries it forward.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
