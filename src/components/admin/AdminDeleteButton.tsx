"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDeleteButton({ id, type }: { id: string; type: "event" | "workshop" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const password = window.prompt(`Enter the admin password to delete this ${type}:`);
    if (!password) return;

    if (!window.confirm(`Are you absolutely sure you want to delete this ${type}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/${type}s/${id}?password=${encodeURIComponent(password)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete");
      }

      router.push(`/admin/${type}s`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading} 
      className="btn-secondary" 
      style={{ 
        padding: '0.5rem 1rem', 
        borderColor: 'var(--danger)', 
        color: 'var(--danger)',
        opacity: loading ? 0.7 : 1
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', display: 'inline-block' }}>
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
      </svg>
      {loading ? "Deleting..." : `Delete ${type === "event" ? "Event" : "Workshop"}`}
    </button>
  );
}
