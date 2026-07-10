"use client";

import { useEffect, useRef } from "react";

// Cmd on Mac, Ctrl on other OSes — the same pattern as the Kbd shown in the UI.
export function useKeyboardShortcut(key: string, callback: () => void) {
  const callbackRef = useRef(callback);
  // Updates the ref outside of render to always call the latest callback
  // without re-attaching the listener on every change.
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

    const onKeyDown = (e: KeyboardEvent) => {
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey;
      if (!modifierPressed || e.key.toLowerCase() !== key.toLowerCase()) return;

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;

      e.preventDefault();
      callbackRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);
}
