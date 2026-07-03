export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-5xl md:text-6xl" };
  const iconSizes = { sm: "h-5 w-5", md: "h-5 w-5", lg: "h-5 w-5" };
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span className={`${iconSizes[size]} shrink-0 overflow-hidden rounded-md inline-block`}>
        <img
          src="/logo.png"
          alt=""
          className="h-full w-full object-cover scale-150"
        />
      </span>
      <span className={`font-lato font-semibold  ${sizes[size]} tracking-tight text-[var(--color-text)]`}>
        folio
      </span>
    </span>
  );
}