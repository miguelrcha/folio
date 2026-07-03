"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoadingTransitionPage() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      router.replace("/login");
    }, 1400);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <main className="signin-transition-overlay relative z-10 min-h-screen flex items-center justify-center overflow-hidden">
      <div className="hero-glow" />
      <span className="signin-transition-wordmark relative font-lato text-5xl md:text-6xl tracking-tight">
        folio
      </span>
    </main>
  );
}