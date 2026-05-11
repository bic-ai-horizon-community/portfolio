import Link from "next/link";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <h1 className={styles.errorCode}>404</h1>
        <div className={styles.divider} />
        <h2 className={styles.title}>EVEN AI CAN'T FIX THIS </h2>
        <p className={styles.description}>
          You are trying to access the page that doesn't exist. Maybe AI can help you find it.
        </p>
        <Link href="/" className="btn-primary">
          Back to Core
        </Link>
      </div>
    </div>
  );
}
