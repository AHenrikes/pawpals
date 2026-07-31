"use client";

import { useEffect } from "react";
import { useMap } from "@repo/ui/map";
import type maplibregl from "maplibre-gl";

interface PlaceZoomHandlerProps {
  currentPos: [lng: number, lat: number];
}

// Reasonable zoom targets per OpenMapTiles place "class"
const ZOOM_BY_CLASS: Record<string, number> = {
  continent: 3,
  country: 5,
  state: 7,
  province: 7,
  city: 10,
  town: 12,
  village: 13,
  suburb: 13,
  quarter: 14,
  neighbourhood: 14,
  hamlet: 13,
  isolated_dwelling: 13,
};

export function PlaceZoomHandler({
  currentPos,
}: Readonly<PlaceZoomHandlerProps>) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);
      const placeFeature = features.find((f) => f.sourceLayer === "place");
      if (!placeFeature) return;

      const [lng, lat] = (placeFeature.geometry as GeoJSON.Point).coordinates;
      const placeClass = placeFeature.properties?.class as string | undefined;
      const targetZoom = placeClass ? (ZOOM_BY_CLASS[placeClass] ?? 12) : 12;

      if (currentPos[0] === lng && currentPos[1] === lat) return;

      map.flyTo({
        center: [lng ?? 0, lat ?? 0],
        zoom: targetZoom,
        duration: 1200,
      });
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const overPlace = map
        .queryRenderedFeatures(e.point)
        .some((f) => f.sourceLayer === "place");
      map.getCanvas().style.cursor = overPlace ? "pointer" : "";
    };

    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
    };
  }, [map, isLoaded, currentPos]);

  return null;
}
