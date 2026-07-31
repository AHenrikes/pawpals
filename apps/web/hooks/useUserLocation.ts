"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UserLocation {
  lng: number;
  lat: number;
}

const STORAGE_KEY = "lastKnownLocation";

async function getIpFallbackLocation(): Promise<UserLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number")
      return null;
    return { lng: data.longitude, lat: data.latitude };
  } catch {
    return null;
  }
}

function readCached(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserLocation) : null;
  } catch {
    return null;
  }
}

function writeCached(loc: UserLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // private browsing / quota-exceeded — safe to ignore
  }
}

/**
 * Resolves user location with graceful fallback: cached (instant) -> browser
 * geolocation -> IP geolocation. `locate()` re-triggers a fresh read (wire it
 * to a "near me" button); `setLocation()` accepts coordinates you already
 * have (e.g. from a map control that did its own geolocation) without firing
 * a second browser prompt.
 */
export function useUserLocation() {
  const [locationState, setLocationState] = useState<UserLocation | null>(null);
  const [source, setSource] = useState<"cache" | "gps" | "ip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const cancelledRef = useRef(false);

  const setLocation = useCallback((loc: UserLocation) => {
    setLocationState(loc);
    setSource("gps");
    writeCached(loc);
  }, []);

  const locate = useCallback(
    (opts?: { highAccuracy?: boolean }) => {
      if (!("geolocation" in navigator)) {
        setError("Geolocation isn't supported in this browser.");
        return;
      }
      setIsLocating(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelledRef.current) return;
          setLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
          setIsLocating(false);
        },
        async (err) => {
          if (cancelledRef.current) return;
          setIsLocating(false);
          if (err.code === err.PERMISSION_DENIED) {
            setError(
              "Location access was denied — showing an approximate location instead.",
            );
          }
          const ipLoc = await getIpFallbackLocation();
          if (!cancelledRef.current && ipLoc) {
            setLocationState(ipLoc);
            setSource("ip");
          }
        },
        {
          timeout: 10000,
          enableHighAccuracy: opts?.highAccuracy ?? true,
          maximumAge: 0,
        },
      );
    },
    [setLocation],
  );

  useEffect(() => {
    cancelledRef.current = false;
    const cached = readCached();
    if (cached) {
      setLocationState(cached);
      setSource("cache");
    }
    locate();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    location: locationState,
    source,
    error,
    isLocating,
    locate,
    setLocation,
  };
}
