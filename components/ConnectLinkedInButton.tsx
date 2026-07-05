"use client";

import { useState } from "react";

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ConnectLinkedInButton() {
  const [showNotice, setShowNotice] = useState(false);

  const handleClick = () => {
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 2500);
  };

  return (
    <span className="relative inline-flex">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-mono text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:border-[var(--color-border-bright)] transition-colors"
      >
        <LinkedInIcon className="h-3 w-3" />
        importar do LinkedIn
      </button>

      {showNotice && (
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-1 text-xs font-mono text-[var(--color-text-muted)] shadow-lg z-10">
          em breve — por enquanto, edite manualmente
        </span>
      )}
    </span>
  );
}