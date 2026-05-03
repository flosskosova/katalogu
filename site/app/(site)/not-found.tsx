import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
        404
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-brand)] text-3xl font-semibold text-[var(--foreground)]">
        Page not found
      </h1>
      <p className="mt-3 text-[var(--foreground-muted)]">
        That page does not exist or the catalog entry was moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/browse" variant="secondary">
          Browse tools
        </Button>
      </div>
    </div>
  );
}
