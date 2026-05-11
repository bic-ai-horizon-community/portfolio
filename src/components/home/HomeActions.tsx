"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import styles from "@/app/Home.module.css";

export const HeroActions = () => {
  return (
    <div className={styles.heroActions}>
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="btn-primary"
      >
        Lets's Join <ArrowRightIcon className="w-5 h-5 ml-2" />
      </button>
      {/* <Link href="/events" className="btn-secondary">
        View Roadmap
      </Link> */}
    </div>
  );
};

export const JoinCTA = () => {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="btn-primary"
      style={{ padding: "1.25rem 3.5rem" }}
    >
      Join AI Horizon
    </button>
  );
};
