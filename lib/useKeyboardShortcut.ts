"use client";

import { useEffect, useRef } from "react";

// Cmd na Mac, Ctrl nos outros SOs — o mesmo padrão dos Kbd exibidos na UI.
export function useKeyboardShortcut(key: string, callback: () => void) {
  const callbackRef = useRef(callback);
  // Atualiza a ref fora do render para sempre chamar o callback mais recente
  // sem reassinar o listener a cada mudança.
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
