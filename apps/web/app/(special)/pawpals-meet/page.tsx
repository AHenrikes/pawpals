"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map,
  MapControls,
  MapViewport,
  // MapArc,
  // MapClusterLayer,
  // MapGeoJSON,
  // MapMarker,
  // MapPopup,
  // MapRoute,
  // MarkerContent,
  // MarkerLabel,
  // MarkerPopup,
  // MarkerTooltip,
  // useMap
} from "@repo/ui/map";
import { Card, CardFooter, CardHeader } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

async function getIpFallbackLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") return null;
    return { lng: data.longitude, lat: data.latitude };
  } catch {
    return null;
  }
}

export default function PawpalsMeet() {
  const route = useRouter();
  const hasCenteredRef = useRef(false);

  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [viewport, setViewport] = useState<MapViewport>({
    center: [0, 0],
    zoom: 0,
    bearing: 0,
    pitch: 0,
  });

  useEffect(() => {
    if (!userLocation || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    setViewport((prev) => ({ ...prev, center: [userLocation.lng, userLocation.lat], zoom: 11 }));
  }, [userLocation]);

  useEffect(() => {
    let cancelled = false;

    async function resolveInitialLocation() {
      const cached = localStorage.getItem("lastKnownLocation");
      if (cached) {
        try {
          setUserLocation(JSON.parse(cached));
        } catch {
          localStorage.removeItem("lastKnownLocation");
        }
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const loc = { lng: pos.coords.longitude, lat: pos.coords.latitude };
          setUserLocation(loc);
          localStorage.setItem("lastKnownLocation", JSON.stringify(loc));
        },
        async () => {
          if (!cached) {
            const ipLoc = await getIpFallbackLocation();
            if (!cancelled && ipLoc) setUserLocation(ipLoc);
          }
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 },
      );
    }

    resolveInitialLocation();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className="w-full h-dvh p-0 overflow-hidden">
      <Map
        viewport={viewport}
        onViewportChange={setViewport}
        // center={[-74.006, 40.7128]}
        // zoom={11}
      >
        <CardHeader className="absolute top-0 left-0 flex items-center w-full h-16 gap-4 px-4 backdrop-blur-xs z-10">
          <Button
            size={"icon-sm"}
            variant={"outline"}
            onClick={() => route.back()}
          >
            <ArrowLeftIcon />
          </Button>
        </CardHeader>

        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
          onLocate={(coords) => {
            const loc = { lng: coords.longitude, lat: coords.latitude };
            setUserLocation(loc);
            localStorage.setItem("lastKnownLocation", JSON.stringify(loc));
          }}
        />

        <CardFooter className="absolute right-0 bottom-0 justify-end w-full h-fit p-0 text-sm font-mono">
          <div className="hidden flex-wrap gap-x-3 gap-y-1 bg-background rounded border px-2 py-1.5 mx-2 my-1 md:flex z-20">
            <span>
              <span className="text-muted-foreground">lng:</span>{" "}
              {viewport.center[0].toFixed(3)}
            </span>
            <span>
              <span className="text-muted-foreground">lat:</span>{" "}
              {viewport.center[1].toFixed(3)}
            </span>
            <span>
              <span className="text-muted-foreground">zoom:</span>{" "}
              {viewport.zoom.toFixed(1)}
            </span>
            <span>
              <span className="text-muted-foreground">bearing:</span>{" "}
              {viewport.bearing.toFixed(1)}°
            </span>
            <span>
              <span className="text-muted-foreground">pitch:</span>{" "}
              {viewport.pitch.toFixed(1)}°
            </span>
          </div>
        </CardFooter>

        {/* <MapMarker longitude={...} latitude={...}>
          <MarkerContent>
            <MarkerLabel>
              like this?
            </MarkerLabel>
          </MarkerContent>
          <MarkerPopup />
          <MarkerTooltip />
        </MapMarker>

        <MapPopup longitude={...} latitude={...} />
        <MapRoute coordinates={...} />
        <MapArc data={...} />
        <MapGeoJSON data={...} />
        <MapClusterLayer data={...} /> */}
      </Map>
    </Card>
  );
}
