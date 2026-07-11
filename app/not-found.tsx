import Link from "next/link";
import { SearchUsers } from "@/components/ProfileHeader";
import { getServerLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";

// Branded 404 — a mistyped or wrongly-shared username is a hot path for a
// link-sharing product, so it gets a profile search instead of a dead end.
export default async function NotFound() {
  const lang = await getServerLanguage();
  const t = (key: string) => translate(lang, key);

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <span className="font-lato text-5xl md:text-6xl tracking-tight text-[var(--color-text)]">
        folio
      </span>
      <p className="mt-6 font-mono text-sm text-[var(--color-text-faint)]">404</p>
      <p className="mt-2 text-[var(--color-text-muted)]">{t("notFound.title")}</p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-[var(--color-text-faint)]">{t("notFound.hint")}</p>
        <SearchUsers className="w-64" />
      </div>

      <Link
        href="/"
        className="mt-10 text-sm text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
      >
        {t("notFound.goHome")}
      </Link>
    </main>
  );
}
