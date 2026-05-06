"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type SaveStatus = "idle" | "edited" | "saving" | "saved";

interface UseAutoSaveCodeProps {
  problemId: string;
  language: string;
  initialCode?: string;
  debounceMs?: number;
}

export const useAutoSaveCode = ({
  problemId,
  language,
  initialCode = "",
  debounceMs = 1500,
}: UseAutoSaveCodeProps) => {
  const [code, setCode] = useState<string>("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `olymplab_draft_${problemId}_${language}`;

  // Hydration: Load initial value from localStorage on mount
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Using a microtask or requestAnimationFrame to avoid "synchronous" setState in effect warning
    // although for hydration it's technically fine.
    const savedCode = localStorage.getItem(storageKey);
    if (savedCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(savedCode);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, [storageKey, initialCode]);

  // Save to localStorage with debounce
  const saveToLocalStorage = useCallback((value: string) => {
    setStatus("saving");
    try {
      localStorage.setItem(storageKey, value);
      // Small delay to make "Saving..." state visible if it's too fast
      setTimeout(() => {
        setStatus("saved");
      }, 300);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
      setStatus("idle");
    }
  }, [storageKey]);

  const handleCodeChange = useCallback((newCode: string | undefined) => {
    const value = newCode || "";
    setCode(value);
    setStatus("edited");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveToLocalStorage(value);
    }, debounceMs);
  }, [debounceMs, saveToLocalStorage]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStatus("idle");
  }, [storageKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    code,
    setCode,
    status,
    handleCodeChange,
    clearDraft,
    isHydrated,
  };
};
