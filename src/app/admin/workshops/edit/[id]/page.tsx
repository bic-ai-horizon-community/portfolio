"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "../../new/WorkshopForm.module.css";
import { LinksInput } from "@/components/admin/LinksInput";

export default function EditWorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    speakers: "",
    schedule: "",
    status: "OPEN_FOR_REGISTRATION",
    externalLinks: [] as { label: string, url: string }[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  useEffect(() => {
    const fetchWorkshop = async () => {
      try {
        const res = await fetch(`/api/workshops/${id}`);
        if (!res.ok) throw new Error("Failed to fetch workshop");
        const data = await res.json();
        
        const formatDate = (d: string | null) => d ? new Date(d).toISOString().slice(0, 16) : "";

        setFormData({
          title: data.title || "",
          description: data.description || "",
          speakers: data.speakers || "",
          schedule: formatDate(data.schedule),
          status: data.status || "OPEN_FOR_REGISTRATION",
          externalLinks: data.externalLinks || [],
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkshop();
  }, [id]);

  if (!session || (session.user as any).role !== "ADMIN") {
    return <p>Unauthorized</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/workshops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          externalLinks: formData.externalLinks.filter(l => l.label && l.url),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update workshop");
      }

      router.push(`/admin/workshops/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className={styles.container}><p>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Workshop</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.field}>
          <label>Workshop Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g. Intro to Neural Networks"
          />
        </div>
        <div className={styles.field}>
          <label>Workshop Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
            placeholder="What will students learn in this session?"
          />
        </div>
        <div className={styles.field}>
          <label>Speakers & Mentors</label>
          <input
            type="text"
            name="speakers"
            value={formData.speakers}
            onChange={handleChange}
            placeholder="e.g. Dr. Smith, Jane Doe"
          />
        </div>
        <div className={styles.field}>
          <label>Date & Time</label>
          <input
            type="datetime-local"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            required
          />
        </div>

        <LinksInput 
          links={formData.externalLinks} 
          onChange={(links) => setFormData({ ...formData, externalLinks: links })} 
        />

        <div className={styles.field}>
          <label>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="OPEN_FOR_REGISTRATION">Open for Registration</option>
            <option value="ONGOING">Ongoing</option>
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
