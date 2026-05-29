export default function ThreadDetailLoading() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-full px-8 py-8">
          <nav className="mb-4 flex items-center gap-2">
            <span className="h-4 w-20 animate-pulse rounded bg-secondary" />
            <span className="text-muted-foreground/40">/</span>
            <span className="h-4 w-24 animate-pulse rounded bg-secondary" />
          </nav>

          <div className="mb-5 space-y-2">
            <div className="h-9 w-3/4 animate-pulse rounded-md bg-secondary" />
            <div className="h-9 w-1/2 animate-pulse rounded-md bg-secondary" />
          </div>

          <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-secondary" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                </div>
              </div>
              <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
            </div>
            <div className="space-y-3 px-6 py-5">
              <div className="h-4 w-full animate-pulse rounded bg-secondary" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-secondary" />
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-20 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-8 animate-pulse rounded-full bg-secondary" />
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                    <div className="h-2.5 w-16 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full animate-pulse rounded bg-secondary" />
                  <div className="h-3.5 w-10/12 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="hidden h-full w-80 shrink-0 border-l border-border bg-card lg:block">
        <div className="space-y-8 p-8">
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-secondary" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 animate-pulse rounded-full bg-secondary"
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                <div className="h-3.5 w-full animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
