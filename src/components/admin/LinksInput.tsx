"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";
import styles from "./LinksInput.module.css";

interface ExternalLink {
  label: string;
  url: string;
}

interface LinksInputProps {
  links: ExternalLink[];
  onChange: (links: ExternalLink[]) => void;
}

export const LinksInput = ({ links, onChange }: LinksInputProps) => {
  const addLink = () => {
    onChange([...links, { label: "", url: "" }]);
  };

  const updateLink = (index: number, field: keyof ExternalLink, value: string) => {
    const updated = [...links];
    updated[index][field] = value;
    onChange(updated);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>External Resources (Links)</label>
      <div className={styles.list}>
        {links.map((link, index) => (
          <div key={index} className={styles.row}>
            <input
              type="text"
              placeholder="Label (e.g. GitHub Repo)"
              value={link.label}
              onChange={(e) => updateLink(index, "label", e.target.value)}
              className={styles.input}
            />
            <input
              type="url"
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(index, "url", e.target.value)}
              className={styles.input}
            />
            <button type="button" onClick={() => removeLink(index)} className={styles.removeBtn}>
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addLink} className={styles.addBtn}>
        <PlusIcon className="w-4 h-4" /> Add Protocol Link
      </button>
    </div>
  );
};
