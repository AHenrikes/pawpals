"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from "@repo/ui/map";
import { Button } from "@repo/ui/button";
import { SearchIcon, LoaderCircleIcon } from "lucide-react";
import { fetchInBounds, type OverpassElement } from "@/lib/map/overpass";

interface NearbyPlacesProps {
  tag?: string;
  value?: string;
  limit: number;
  onPlacesChange: (places: OverpassElement[]) => void;
  /** Minimum map-center movement (meters) before "search this area" appears */
  moveThresholdMeters?: number;
}

function haversineMeters(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function NearbyPlaces({
  tag = "leisure",
  value = "park",
  limit = 200,
  onPlacesChange,
  moveThresholdMeters = 800,
}: Readonly<NearbyPlacesProps>) {
  const { map, isLoaded } = useMap();
  const [canSearchArea, setCanSearchArea] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0);
  const lastFetchCenterRef = useRef<[number, number] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async () => {
    if (!map) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const b = map.getBounds();
    const center: [number, number] = [map.getCenter().lng, map.getCenter().lat];

    setIsSearching(true);
    onPlacesChange([]);
    setErrorMsg(null);
    try {
      const places = await fetchInBounds({
        bounds: {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        },
        tag,
        value,
        limit,
        signal: controller.signal,
      });
      onPlacesChange(places);
      lastFetchCenterRef.current = center;
      setCanSearchArea(false);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMsg("Couldn't load places — try again");
      }
    } finally {
      setIsSearching(false);
    }
  }, [map, tag, value, onPlacesChange, limit]);

  // Initial fetch once the map is ready.
  useEffect(() => {
    if (!map || !isLoaded || lastFetchCenterRef.current) return;
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded]);

  // We never auto-fetch on pan — Overpass's usage policy explicitly
  // discourages querying on every map movement. Instead, reveal a button
  // once the view has moved far enough that cached results no longer cover it.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const handleMoveEnd = () => {
      if (!lastFetchCenterRef.current) return;
      const center: [number, number] = [
        map.getCenter().lng,
        map.getCenter().lat,
      ];
      if (
        haversineMeters(lastFetchCenterRef.current, center) >
        moveThresholdMeters
      ) {
        setCanSearchArea(true);
      }
    };
    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, isLoaded, moveThresholdMeters]);

  useEffect(() => {
    if (!map) return;

    const updateZoom = () => setZoom(map.getZoom());

    updateZoom();
    map.on("zoomend", updateZoom);

    return () => {
      map.off("zoomend", updateZoom);
    };
  }, [map]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!canSearchArea && !errorMsg) return null;

  return (
    <div
      className={`absolute top-20 left-1/2 -translate-x-1/2 z-10 ${zoom < 11.9 ? "hidden" : null}`}
    >
      <Button
        size="sm"
        variant={"outline"}
        onClick={search}
        disabled={zoom < 11.9}
      >
        {isSearching ? (
          <LoaderCircleIcon className="animate-spin size-4" />
        ) : (
          <SearchIcon className="size-4" />
        )}
        {errorMsg ?? "Search this area"}
      </Button>
    </div>
  );
}
