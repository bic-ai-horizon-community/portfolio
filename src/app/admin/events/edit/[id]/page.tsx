"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "../../new/EventForm.module.css";
import { LinksInput } from "@/components/admin/LinksInput";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "OPEN_FOR_REGISTRATION",
    eventType: "ONE_DAY",
    startDate: "",
    endDate: "",
    externalLinks: [] as { label: string, url: string }[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        
        const formatDate = (d: string | null) => d ? new Date(d).toISOString().slice(0, 16) : "";

        setFormData({
          title: data.title || "",
          description: data.description || "",
          status: data.status || "OPEN_FOR_REGISTRATION",
          eventType: data.eventType || "ONE_DAY",
          startDate: formatDate(data.startDate),
          endDate: formatDate(data.endDate),
          externalLinks: data.externalLinks || [],
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (!session || (session.user as any).role !== "ADMIN") {
    return <p>Unauthorized</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          externalLinks: formData.externalLinks.filter(l => l.label && l.url),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update event");
      }

      router.push(`/admin/events/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}><p>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Event</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.field}>
          <label>Event Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className={styles.field}>
          <label>Event Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={6}
          />
        </div>
        
        <LinksInput 
          links={formData.externalLinks} 
          onChange={(links) => setFormData({ ...formData, externalLinks: links })} 
        />

        <div className={styles.field}>
          <label>Event Type</label>
          <select
            value={formData.eventType}
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
          >
            <option value="ONE_DAY">One Day Event</option>
            <option value="MULTIPLE_DAY">Multiple Day Event</option>
          </select>
        </div>

        <div className={styles.fieldRow} style={{ display: 'flex', gap: '1rem' }}>
          <div className={styles.field} style={{ flex: 1 }}>
            <label>Start Date</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          {formData.eventType === "MULTIPLE_DAY" && (
            <div className={styles.field} style={{ flex: 1 }}>
              <label>End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="OPEN_FOR_REGISTRATION">Open for Registration</option>
            <option value="ONGOING">Ongoing (Live)</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.875rem 2rem' }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
