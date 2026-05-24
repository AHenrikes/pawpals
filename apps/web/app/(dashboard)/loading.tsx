export default function DashboardLoading() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-background px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(207,136,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,69,132,0.12),transparent_28%)]" />

      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-popover/70 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur">
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
