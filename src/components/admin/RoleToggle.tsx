"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const RoleToggle = ({ userId, currentRole, isSelf }: { userId: string, currentRole: string, isSelf: boolean }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole: string) => {
    if (isSelf && !confirm("Warning: Modification of primary administrative role detected. Proceed?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");
      router.refresh();
    } catch (err) {
      alert("Error: Command failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select 
      value={currentRole} 
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={loading}
      style={{
        background: "var(--bg-card)",
        color: "var(--text-main)",
        border: "1px solid var(--border)",
        padding: "0.5rem",
        borderRadius: "8px",
        fontSize: "0.8rem",
        fontWeight: "600",
        cursor: "pointer",
        outline: "none"
      }}
    >
      <option value="PUBLIC">PUBLIC</option>
      <option value="MEMBER">MEMBER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
};
