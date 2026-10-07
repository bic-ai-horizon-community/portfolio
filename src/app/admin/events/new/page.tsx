"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./EventForm.module.css";
import { LinksInput } from "@/components/admin/LinksInput";

export default function NewEventPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "OPEN_FOR_REGISTRATION",
    eventType: "ONE_DAY" as "ONE_DAY" | "MULTIPLE_DAY",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    dailySchedules: [] as { date: string; startTime: string; endTime: string }[],
    externalLinks: [] as { label: string, url: string }[],
    audienceType: "BOTH" as "COLLEGE_ONLY" | "PUBLIC_ONLY" | "BOTH",
    registrationType: "BUTTON" as "BUTTON" | "FORM",
    formFields: [] as { label: string; type: string; required: boolean; options?: string[] }[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!session || (session.user as any).role !== "ADMIN") {
    return <p>Unauthorized</p>;
  }

  const addDay = () => {
    setFormData({
      ...formData,
      dailySchedules: [...formData.dailySchedules, { date: "", startTime: "", endTime: "" }]
    });
  };

  const removeDay = (index: number) => {
    setFormData({
      ...formData,
      dailySchedules: formData.dailySchedules.filter((_, i) => i !== index)
    });
  };

  const updateDay = (index: number, field: string, value: string) => {
    const newSchedules = [...formData.dailySchedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, dailySchedules: newSchedules });
  };

  const addFormField = (preset?: Partial<{ label: string; type: string; required: boolean; options?: string[] }>) => {
    setFormData({
      ...formData,
      formFields: [
        ...formData.formFields,
        {
          label: preset?.label || "",
          type: preset?.type || "text",
          required: preset?.required ?? false,
          options: preset?.options || []
        }
      ]
    });
  };

  const removeFormField = (index: number) => {
    setFormData({
      ...formData,
      formFields: formData.formFields.filter((_, i) => i !== index)
    });
  };

  const updateFormField = (index: number, field: string, value: any) => {
    const newFields = [...formData.formFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({ ...formData, formFields: newFields });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let finalStartDate = formData.startDate;
      let finalEndDate = formData.endDate;
      let finalStartTime = formData.startTime;
      let finalEndTime = formData.endTime;

      if (formData.eventType === "MULTIPLE_DAY") {
        if (formData.dailySchedules.length === 0) {
          throw new Error("Please add at least one day for multiple day events.");
        }
        const sorted = [...formData.dailySchedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        finalStartDate = sorted[0].date;
        finalEndDate = sorted[sorted.length - 1].date;
        finalStartTime = sorted[0].startTime;
        finalEndTime = sorted[0].endTime;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizedById: (session.user as any).id,
          startDate: finalStartDate || undefined,
          endDate: finalEndDate || undefined,
          startTime: finalStartTime || undefined,
          endTime: finalEndTime || undefined,
          dailySchedules: formData.eventType === "MULTIPLE_DAY" ? formData.dailySchedules : undefined,
          externalLinks: formData.externalLinks.filter(l => l.label && l.url),
          audienceType: formData.audienceType,
          registrationType: formData.registrationType,
          formFields: formData.registrationType === 'FORM' ? formData.formFields : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create event");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create New Event</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.field}>
          <label>Event Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g. Annual AI Summit 2026"
          />
        </div>
        <div className={styles.field}>
          <label>Event Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={6}
            placeholder="Provide a detailed description of the event..."
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
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value as "ONE_DAY" | "MULTIPLE_DAY" })}
          >
            <option value="ONE_DAY">One Day Event</option>
            <option value="MULTIPLE_DAY">Multiple Day Event</option>
          </select>
        </div>

        {formData.eventType === "ONE_DAY" ? (
          <div className={styles.fieldRow} style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>From</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>To</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold' }}>Daily Schedules</label>
              <button type="button" onClick={addDay} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>+ Add Day</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.dailySchedules.map((day, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
                  <button 
                    type="button" 
                    onClick={() => removeDay(idx)} 
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                  <div className={styles.fieldRow} style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block', fontWeight: 'bold', color: 'var(--text-muted)' }}>Date</label>
                      <input type="date" className="form-input" value={day.date} onChange={(e) => updateDay(idx, 'date', e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block', fontWeight: 'bold', color: 'var(--text-muted)' }}>From</label>
                      <input type="time" className="form-input" value={day.startTime} onChange={(e) => updateDay(idx, 'startTime', e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block', fontWeight: 'bold', color: 'var(--text-muted)' }}>To</label>
                      <input type="time" className="form-input" value={day.endTime} onChange={(e) => updateDay(idx, 'endTime', e.target.value)} required />
                    </div>
                  </div>
                </div>
              ))}
              {formData.dailySchedules.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  No days added yet. Click "+ Add Day" to start building the schedule.
                </p>
              )}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label>Audience Type</label>
          <select
            value={formData.audienceType}
            onChange={(e) => setFormData({ ...formData, audienceType: e.target.value as "COLLEGE_ONLY" | "PUBLIC_ONLY" | "BOTH" })}
          >
            <option value="BOTH">Everyone (College + Public)</option>
            <option value="COLLEGE_ONLY">College Only (@bicnepal.edu.np)</option>
            <option value="PUBLIC_ONLY">General Public (@gmail.com)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Registration Type</label>
          <select
            value={formData.registrationType}
            onChange={(e) => setFormData({ ...formData, registrationType: e.target.value as "BUTTON" | "FORM" })}
          >
            <option value="BUTTON">Single Button (One-Click Register)</option>
            <option value="FORM">Custom Form (Collect Additional Info)</option>
          </select>
        </div>

        {formData.registrationType === "FORM" && (
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold' }}>Dynamic Form Builder</label>
              <button type="button" onClick={() => addFormField()} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>+ Add Field</button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => addFormField({ label: "Name", type: "text", required: true })}>+ Name</button>
              <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => addFormField({ label: "Email", type: "email", required: true })}>+ Email</button>
              <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => addFormField({ label: "Phone", type: "phone", required: false })}>+ Phone</button>
              <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => addFormField({ label: "Address", type: "text", required: false })}>+ Address</button>
              <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => addFormField({ label: "College", type: "text", required: false })}>+ College</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.formFields.map((field, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
                  <button 
                    type="button" 
                    onClick={() => removeFormField(idx)} 
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                  <div className={styles.fieldRow} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block', fontWeight: 'bold', color: 'var(--text-muted)' }}>Label</label>
                      <input type="text" className="form-input" value={field.label} onChange={(e) => updateFormField(idx, 'label', e.target.value)} required placeholder="Field Label" />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block', fontWeight: 'bold', color: 'var(--text-muted)' }}>Type</label>
                      <select className="form-input" value={field.type} onChange={(e) => updateFormField(idx, 'type', e.target.value)}>
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={field.required} onChange={(e) => updateFormField(idx, 'required', e.target.checked)} />
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Required</label>
                    </div>
                  </div>
                  {field.type === 'select' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block', fontWeight: 'bold', color: 'var(--text-muted)' }}>Options (comma separated)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={field.options?.join(', ') || ""} 
                        onChange={(e) => updateFormField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                        placeholder="Option 1, Option 2, Option 3" 
                      />
                    </div>
                  )}
                </div>
              ))}
              {formData.formFields.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  No fields added yet. Click "+ Add Field" or use presets to start building the form.
                </p>
              )}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label>Initial Status</label>
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
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.875rem 2rem' }}>
            {loading ? "Creating..." : "Create Event"}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
