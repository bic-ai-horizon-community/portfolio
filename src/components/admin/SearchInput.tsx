"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import styles from "@/app/admin/events/[id]/AdminEventDetail.module.css";

interface SearchInputProps {
  placeholder?: string;
  queryKey?: string;
}

export const SearchInput = ({
  placeholder = "Search...",
  queryKey = "users",
}: SearchInputProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialValue = searchParams.get(queryKey) || "";
  const [value, setValue] = useState(initialValue);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(queryKey, value);
      } else {
        params.delete(queryKey);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [value, pathname, queryKey, router, searchParams]);

  return (
    <div className={styles.sectionSearch}>
      <input
        type="search"
        placeholder={placeholder}
        className={styles.searchInput}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};
