import Link from "next/link";

export function CTASection() {
  return (
    <section id="cta" className="mx-auto px-4 md:px-6 pt-16 sm:pt-32 pb-28 sm:pb-40 max-w-6xl relative z-10 text-center scroll-mt-[60px] md:scroll-mt-[58px]">
      <h2 className="text-[2.75rem] md:text-[5rem] tracking-tighter leading-[110%] mb-6 font-normal">
        <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
          Start testing in minutes
        </span>
      </h2>
      <p className="text-base md:text-2xl text-neutral-400 font-normal max-w-3xl mx-auto">
        Connect your GitHub repos, and get a public profile and resume
        <br className="hidden md:block" />
        fully set up in a few clicks.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
        <Link
          href="/loading"
          className="inline-flex items-center justify-center h-[3.25rem] px-8 bg-[var(--color-text)] text-[var(--color-ink)] text-base font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Get started
        </Link>
        <Link
          href="/miguelrcha"
          className="inline-flex items-center justify-center h-[3.25rem] px-8 text-base font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          View example →
        </Link>
      </div>
    </section>
  );
}
