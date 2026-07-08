"use client";

import { useEffect, useState } from "react";

export function ObfuscatedText({
  encoded,
  className,
}: {
  encoded: string;
  className?: string;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(atob(encoded));
  }, [encoded]);

  return <span className={className}>{text}</span>;
}
