export default function DashboardLoading() {
  return (
    <main className="relative grid h-[calc(100svh-64px)] place-items-center overflow-hidden bg-background px-6">
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-popover/70 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          <span className="h-3 w-3 rounded-full bg-secondary animate-pulse [animation-delay:150ms]" />
          <span className="h-3 w-3 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-headline-md">Loading your dashboard</h1>
          <p className="text-sm text-text-muted">
            Getting your pawpals and navigation ready.
          </p>
        </div>
      </div>
    </main>
  );
}
