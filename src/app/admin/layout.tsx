import styles from "./Admin.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.adminContainer}>
      <div className={styles.mobileBlock}>
        <div className={styles.blockContent}>
          <div className={styles.blockIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <h1>Desktop Access Only</h1>
          <p>Only access admin panel from your Laptop Device</p>
        </div>
      </div>
      <div className={styles.desktopContent}>
        {children}
      </div>
    </div>
  );
}
