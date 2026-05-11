"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const MediaUpload = ({ id, type }: { id: string, type: "event" | "workshop" }) => {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url, type: mediaType } = await res.json();

      await fetch(`/api/${type}s/${id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: mediaType.toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE" }),
      });

      router.refresh();
    } catch (err) {
      alert("Error: Asset synchronization failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <label style={{ 
        display: 'block',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px dashed var(--border)',
        borderRadius: '8px',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        fontSize: '0.8rem',
        fontWeight: '600',
        color: 'var(--text-muted)',
        transition: 'all 0.2s'
      }}>
        {uploading ? "Uploading Asset..." : "+ Add Technical Asset"}
        <input 
          type="file" 
          accept="image/*,video/*" 
          onChange={handleUpload} 
          disabled={uploading} 
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};
