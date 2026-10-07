import type { Metadata } from "next";
import Image from "next/image";
import styles from "./Awards.module.css";

export const metadata: Metadata = {
  title: "Awards",
  description:
    "AI Horizon was named Community of the Year 2026 by Biratnagar International College at BIC DevFest 2026, taking home Rs. 3,00,000.",
  alternates: { canonical: "/awards" },
};

type Award = {
  title: string;
  year: string;
  awardedBy: string;
  event: string;
  date: string;
  prize: string | null;
  citation: string;
  photos: { src: string; alt: string }[];
};

const AWARDS: Award[] = [
  {
    title: "Community of the Year",
    year: "2026",
    awardedBy: "Biratnagar International College",
    event: "BIC DevFest 2026",
    date: "4 September 2026",
    prize: "Rs. 3,00,000",
    citation:
      "AI Horizon was named Community of the Year at BIC DevFest 2026, taking home the top prize of Rs. 3,00,000. The award recognises a student community that turned curiosity into practice: a full calendar of workshops and hackathons, a door open to students well past the college gates, and a habit of shipping things that actually work.",
    photos: [
      {
        src: "/community_of_the_year_2026/1.jpg",
        alt: "AI Horizon members holding framed DevFest 2026 certificates and the Community of the Year trophy",
      },
      {
        src: "/community_of_the_year_2026/2.jpg",
        alt: "The full AI Horizon team celebrating with the cheque for Rs. 3,00,000 at BIC DevFest 2026",
      },
      {
        src: "/community_of_the_year_2026/3.jpg",
        alt: "AI Horizon team members posing outdoors with their certificates and the trophy",
      },
    ],
  },
];

export default function AwardsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Recognition</p>
        <h1 className="section-title">Awards and recognition</h1>
        <p className={styles.lead}>
          What AI Horizon has been recognised for, and by whom. We keep this page so the
          work behind each one stays on the record.
        </p>
      </header>

      {AWARDS.map((award) => (
        <section key={`${award.title}-${award.year}`} className={styles.section}>
          <article className={`${styles.award} glass-card`}>
            <div className={styles.badge} aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
                <path d="M7 6H4.5a2.5 2.5 0 002.5 3M17 6h2.5a2.5 2.5 0 01-2.5 3" />
                <path d="M12 14v3M9 21h6M10 17h4l.5 4h-5l.5-4z" />
              </svg>
            </div>

            <div className={styles.awardBody}>
              <p className={styles.awardYear}>{award.year}</p>
              <h2 className={styles.awardTitle}>{award.title}</h2>

              <dl className={styles.facts}>
                <div className={styles.fact}>
                  <dt>Awarded by</dt>
                  <dd>{award.awardedBy}</dd>
                </div>
                <div className={styles.fact}>
                  <dt>At</dt>
                  <dd>{award.event}</dd>
                </div>
                <div className={styles.fact}>
                  <dt>Presented on</dt>
                  <dd>{award.date}</dd>
                </div>
                {award.prize && (
                  <div className={styles.fact}>
                    <dt>Prize</dt>
                    <dd className={styles.factPrize}>{award.prize}</dd>
                  </div>
                )}
              </dl>

              <p className={styles.awardCitation}>{award.citation}</p>
            </div>
          </article>

          <div className={styles.gallery}>
            {award.photos.map((photo) => (
              <figure key={photo.src} className={`${styles.photo} glass-card`}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1280}
                  height={960}
                  sizes="(max-width: 720px) 100vw, 380px"
                  className={styles.photoImg}
                />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
