import type { ReactNode } from "react";

export function AppShell({
  children,
  contextLabel,
  modeLabel = "Race replay",
}: {
  children: ReactNode;
  contextLabel?: string;
  modeLabel?: string;
}) {
  return (
    <div className="app-shell">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-8">
          <div className="brand-mark animate-rise min-w-0">
            <span className="brand-bar" aria-hidden />
            <div className="min-w-0">
              <h1 className="brand-title">F1 Apex</h1>
              <p className="brand-subtitle">{modeLabel}</p>
            </div>
          </div>
          <div className="animate-rise min-w-0 md:pb-1 md:text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
              Race context
            </p>
            <p className="truncate font-[family-name:var(--font-teko)] text-2xl uppercase tracking-wide text-[var(--text)] md:max-w-[min(100%,42rem)] md:text-3xl">
              {contextLabel || "Select a race"}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
      <footer className="mt-auto">
        <div className="mx-auto flex w-full max-w-[1400px] justify-center px-4 py-5 md:px-8">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Built by{" "}
            <a
              href="https://instagram.com/mendes.tsx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] transition-opacity hover:opacity-80"
            >
              Marcos Mendes
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
