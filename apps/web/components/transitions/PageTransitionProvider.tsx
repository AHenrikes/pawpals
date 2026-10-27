"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type NavigateOptions = {
  replace?: boolean;
  scroll?: boolean;
  transition?: boolean;
};
type TransitionContextValue = {
  navigate: (href: string, options?: NavigateOptions) => void;
  back: () => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);
const droplets = [
  { x: 24, y: 28, delay: 0 },
  { x: 77, y: 37, delay: 0.18 },
  { x: 44, y: 78, delay: 0.32 },
  { x: 88, y: 86, delay: 0.44 },
];

function durationFor(pathname: string) {
  if (
    /^\/(sign-in|sign-up|sign-up-success|forgot-password|new-password|error)(\/|$)/.test(
      pathname,
    )
  ) {
    return 0.78;
  }
  if (pathname.startsWith("/@")) return 0.74;
  return 0.7;
}

export function PageTransitionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const blur = useMotionValue(0);
  const tint = useMotionValue(0);
  const reveal = useMotionValue(0);
  const backdropFilter = useMotionTemplate`blur(${blur}px)`;
  const backgroundColor = useMotionTemplate`hsla(var(--surface), ${tint})`;
  const dropletMask = useTransform(reveal, (progress) =>
    droplets
      .map(({ x, y, delay }) => {
        const radius = Math.max(0, (progress - delay) / (1 - delay)) * 80;
        return `radial-gradient(circle at ${x}% ${y}%, transparent calc(${radius}vmax - 5vmax), black ${radius}vmax)`;
      })
      .join(", "),
  );
  const busy = useRef(false);
  const finishing = useRef(false);
  const pendingFrom = useRef<string | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = useRef(0.7);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const finish = useCallback(async () => {
    if (finishing.current || !busy.current) return;
    finishing.current = true;
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    fallbackTimer.current = null;
    loadingTimer.current = null;
    pendingFrom.current = null;
    setShowLoading(false);

    try {
      reveal.set(0);
      setIsRevealing(true);
      // Let the fully blurred destination settle before the droplets open.
      await new Promise((resolve) => setTimeout(resolve, 160));
      await animate(reveal, 1, {
        duration: duration.current * 1.65,
        ease: [0.4, 0, 0.4, 1],
      });
    } finally {
      blur.set(0);
      tint.set(0);
      reveal.set(0);
      setIsRevealing(false);
      busy.current = false;
      finishing.current = false;
      setIsTransitioning(false);
    }
  }, [blur, tint, reveal]);

  const run = useCallback(
    async (destination: string, action: () => void) => {
      if (busy.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        action();
        return;
      }

      busy.current = true;
      setIsTransitioning(true);
      setIsRevealing(false);
      setShowLoading(false);
      duration.current = durationFor(destination);
      blur.set(0);
      tint.set(0);
      reveal.set(0);

      try {
        await Promise.all([
          animate(blur, 56, {
            duration: duration.current,
            ease: [0.32, 0, 0.2, 1],
          }),
          animate(tint, 1, {
            duration: duration.current,
            ease: [0.32, 0, 0.2, 1],
          }),
        ]);
        // Paint the opaque cover before replacing the page beneath it.
        if (document.visibilityState === "visible") {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
        }
        pendingFrom.current = window.location.pathname;
        action();
        loadingTimer.current = setTimeout(() => {
          loadingTimer.current = null;
          setShowLoading(true);
        }, 900);
        // A failed navigation must never leave the app behind the cover.
        fallbackTimer.current = setTimeout(() => void finish(), 10000);
      } catch {
        void finish();
      }
    },
    [blur, tint, reveal, finish],
  );

  const navigate = useCallback(
    (href: string, options?: NavigateOptions) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
      }

      const next = url.pathname + url.search + url.hash;
      if (url.pathname === window.location.pathname) {
        if (
          next !==
          window.location.pathname +
            window.location.search +
            window.location.hash
        ) {
          if (options?.replace)
            router.replace(next, { scroll: options.scroll });
          else router.push(next, { scroll: options?.scroll });
        }
        return;
      }

      if (options?.transition === false) {
        if (options.replace) router.replace(next, { scroll: options.scroll });
        else router.push(next, { scroll: options.scroll });
        return;
      }

      void run(url.pathname, () => {
        if (options?.replace) router.replace(next, { scroll: options.scroll });
        else router.push(next, { scroll: options?.scroll });
      });
    },
    [router, run],
  );

  const back = useCallback(() => {
    void run(window.location.pathname, () => router.back());
  }, [router, run]);

  const contextValue = useMemo(() => ({ navigate, back }), [navigate, back]);

  useEffect(() => {
    if (pendingFrom.current && pathname !== pendingFrom.current) {
      // Let the destination layout paint before uncovering it.
      const frame = requestAnimationFrame(() => void finish());
      return () => cancelAnimationFrame(frame);
    }
  }, [pathname, finish]);

  useEffect(() => {
    function interceptLink(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.dataset.noPageTransition !== undefined
      )
        return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      )
        return;

      event.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    }

    document.addEventListener("click", interceptLink, true);
    return () => document.removeEventListener("click", interceptLink, true);
  }, [navigate]);

  useEffect(
    () => () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    },
    [],
  );

  return (
    <TransitionContext.Provider value={contextValue}>
      {children}
      <div
        className={`fixed inset-0 z-40 ${isTransitioning ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0"
          style={{
            backdropFilter,
            WebkitBackdropFilter: backdropFilter,
            backgroundColor,
            maskImage: isRevealing ? dropletMask : "none",
            WebkitMaskImage: isRevealing ? dropletMask : "none",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
        {isTransitioning && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{ opacity: showLoading ? 1 : 0, y: showLoading ? 0 : 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-3 rounded-full border border-border/50 bg-surface-container-highest/60 px-5 py-3 text-sm text-text-muted shadow-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading page...</span>
            </div>
          </motion.div>
        )}
      </div>
      {showLoading && <output className="sr-only">Loading page...</output>}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context)
    throw new Error(
      "usePageTransition must be used inside PageTransitionProvider",
    );
  return context;
}
