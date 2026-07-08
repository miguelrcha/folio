"use client";

import { useState } from "react";
import { MailIcon } from "@/components/MailIcon";

export function CopyEmailButton({ encodedEmail }: { encodedEmail: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const email = atob(encodedEmail);
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 hover:text-[var(--color-text)] transition-colors"
    >
      <MailIcon className="h-4 w-4" />
      {copied ? "Copiado ✓" : "Copiar email"}
    </button>
  );
}
