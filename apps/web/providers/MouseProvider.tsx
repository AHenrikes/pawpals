"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type MousePos = {
  x: number;
  y: number;
  inside: boolean;
};

const DEFAULT_POS: MousePos = { x: 0, y: 0, inside: false };
const MouseContext = createContext<MousePos>(DEFAULT_POS);

export function useMouse(): MousePos {
  return useContext(MouseContext);
}

export function MouseProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [pos, setPos] = useState<MousePos>(DEFAULT_POS);
  const raf = useRef<number | null>(null);
  const latest = useRef<MousePos>(DEFAULT_POS);

  useEffect(() => {
    const flush = () => {
      setPos(latest.current);
      raf.current = null;
    };

    const onMove = (e: MouseEvent) => {
      latest.current = { x: e.clientX, y: e.clientY, inside: true };
      raf.current ??= requestAnimationFrame(flush);
    };

    const onLeave = () => {
      latest.current = { ...latest.current, inside: false };
      raf.current ??= requestAnimationFrame(flush);
    };

    globalThis.addEventListener("mousemove", onMove);
    globalThis.addEventListener("mouseleave", onLeave);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      globalThis.removeEventListener("mousemove", onMove);
      globalThis.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Memoize context value to prevent unnecessary child re-renders
  const value = useMemo(() => pos, [pos]);

  return (
    <MouseContext.Provider value={value}>{children}</MouseContext.Provider>
  );
}
