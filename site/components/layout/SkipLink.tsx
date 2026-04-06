export function SkipLink() {
  return (
    <a
      href="#main"
      className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-16 rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] opacity-0 transition-all duration-200 focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ring)]"
    >
      Skip to content
    </a>
  );
}
