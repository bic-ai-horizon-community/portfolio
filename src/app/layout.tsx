import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://aihorizon-omega.vercel.app"),
  title: {
    template: "%s | AI Horizon",
    default: "AI Horizon | Student AI Community — BIC Nepal",
  },
  description:
    "AI Horizon is the premier student AI community at Biratnagar International College, Nepal. Join workshops, hackathons, events, and hands-on AI projects.",
  keywords: [
    "AI Horizon",
    "artificial intelligence community",
    "BIC Nepal",
    "Biratnagar International College",
    "student AI club",
    "AI workshops Nepal",
    "machine learning community",
    "AI events",
    "hackathons Nepal",
    "deep learning",
    "AI Horizon BIC",
    "tech community Nepal",
  ],
  authors: [{ name: "AI Horizon", url: "https://aihorizon-omega.vercel.app" }],
  creator: "AI Horizon — BIC",
  publisher: "AI Horizon",
  applicationName: "AI Horizon",
  referrer: "origin-when-cross-origin" as const,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aihorizon-omega.vercel.app",
    siteName: "AI Horizon",
    title: "AI Horizon | Student AI Community",
    description:
      "AI Horizon is the premier student AI community at Biratnagar International College, Nepal. Join workshops, hackathons, events, and hands-on AI projects.",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "AI Horizon | Student AI Community",
    description:
      "AI Horizon is the premier student AI community at Biratnagar International College, Nepal. Join workshops, hackathons, events, and hands-on AI projects.",
    creator: "@bic_ai_horizon",
  },
  verification: {
    google: "EoSXVM-dKq0hAT5rpygGRlrtr03Io4Wu-U_wpsJ6-IY",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/ai-horizon-logo.png",
    apple: "/ai-horizon-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <div className="bg-mesh" />
        <NextAuthProvider>
          <Navbar />
          <main className="container">
            {children}
          </main>
          <footer className="site-footer">
            <div className="container">
              <div className="footer-inner">
                <div className="footer-brand">
                  <div className="footer-logo">
                    <img src="/ai-horizon-logo.png" alt="AI Horizon Logo" className="footer-logo-img" />
                    <div className="footer-logo-divider"></div>
                    <img src="/college-logo.svg" alt="BIC Logo" className="footer-college-img" />
                  </div>
                  <p>The premier student community for mastering the frontier of Artificial Intelligence. Built for students, by students.</p>
                </div>

                <div className="footer-links">
                  <div className="footer-col">
                    <h4>Explore</h4>
                    <Link href="/events">Events</Link>
                    <Link href="/workshops">Workshops</Link>
                  </div>
                  <div className="footer-col">
                    <h4>Community</h4>
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/login">Sign In</Link>
                  </div>
                  <div className="footer-col">
                    <h4>Connect</h4>
                    <a href="https://www.instagram.com/bic.ai_horizon/" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="https://www.linkedin.com/company/bic-ai-horizon/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  </div>
                </div>
              </div>

              <div className="footer-bottom">
                <p>© {new Date().getFullYear()} AI Horizon. All rights reserved.</p>
                <div className="footer-bottom-links">
                  <span>Biratnagar International College</span>
                </div>
              </div>
            </div>
          </footer>
        </NextAuthProvider>

        <style>{`
          .site-footer {
            border-top: 1px solid var(--border);
            margin-top: 8rem;
            padding: 5rem 0 3rem;
            background: var(--bg-card);
            position: relative;
            z-index: 1;
          }
          .footer-inner {
            display: flex;
            gap: 4rem;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-bottom: 4rem;
          }
          .footer-brand {
            max-width: 360px;
          }
          .footer-logo {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            margin-bottom: 1.75rem;
          }
          .footer-logo-img {
            height: 64px;
            width: auto;
            object-fit: contain;
          }
          .footer-college-img {
            height: 56px;
            width: auto;
            object-fit: contain;
          }
          .footer-logo-divider {
            width: 1px;
            height: 28px;
            background: var(--border);
          }
          .footer-brand p {
            color: var(--text-muted);
            font-size: 0.9375rem;
            line-height: 1.7;
          }
          .footer-links {
            display: flex;
            gap: 6rem;
          }
          .footer-col {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .footer-col h4 {
            font-size: 0.8125rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-main);
            margin-bottom: 0.5rem;
          }
          .footer-col a {
            color: var(--text-muted);
            font-size: 0.9375rem;
            transition: all var(--t-fast);
          }
          .footer-col a:hover {
            color: var(--primary-light);
            transform: translateX(4px);
          }
          .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
            padding-top: 2.5rem;
            border-top: 1px solid var(--border);
            font-size: 0.875rem;
            color: var(--text-muted);
          }
          .footer-bottom-links {
            display: flex;
            gap: 2rem;
            font-weight: 600;
            color: var(--text-sub);
          }
          @media (max-width: 768px) {
            .footer-links { gap: 3rem; }
          }
          @media (max-width: 640px) {
            .footer-inner { gap: 3rem; flex-direction: column; }
            .footer-links { gap: 3rem; flex-wrap: wrap; }
            .footer-bottom { flex-direction: column; text-align: center; }
          }
        `}</style>
      </body>
    </html>
  );
}
