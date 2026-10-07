"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/workshops", label: "Workshops" },
  { href: "/awards", label: "Awards" },
  { href: "/about", label: "About" },
];

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const user = session?.user as any;

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <img src="/ai-horizon-logo.png" alt="AI Horizon Logo" className={styles.logoImg} />
          </Link>

          {/* Desktop nav */}
          <div className={styles.desktopLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname.startsWith(link.href) ? styles.active : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth — desktop */}
          <div className={styles.authGroup}>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className={`${styles.navLink} ${pathname === "/dashboard" ? styles.active : ""}`}
                >
                  Dashboard
                </Link>
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={`${styles.navLink} ${pathname.startsWith("/admin") ? styles.active : ""}`}
                  >
                    Admin
                  </Link>
                )}
                <button onClick={() => signOut()} className={`btn-danger ${styles.signOut}`}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${styles.navLink} ${pathname === "/login" ? styles.active : ""}`}
                >
                  Sign In
                </Link>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="btn-primary"
                  style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname.startsWith(link.href) ? styles.mobileLinkActive : ""}`}
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link href="/dashboard" className={`${styles.mobileLink} ${pathname === "/dashboard" ? styles.mobileLinkActive : ""}`}>
                Dashboard
              </Link>
              {user?.role === "ADMIN" && (
                <Link href="/admin" className={`${styles.mobileLink} ${pathname.startsWith("/admin") ? styles.mobileLinkActive : ""}`}>
                  Admin
                </Link>
              )}
              <div className={styles.mobileDivider} />
              <button onClick={() => signOut()} className={styles.mobileSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <div className={styles.mobileDivider} />
              <Link href="/login" className={styles.mobileLink}>Sign In</Link>
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className={`btn-primary ${styles.mobileRegister}`}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
};
