"use client";

import { useEffect, useRef, useState } from "react";
import { Map, MapControls, MapMarker, MapViewport, MarkerContent, MarkerTooltip } from "@repo/ui/map";
import { Card, CardFooter, CardHeader } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlaceZoomHandler } from "@/components/map/PlaceZoomHandler";
import { NearbyPlaces } from "@/components/map/NearbyPlaces";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { OverpassElement } from "@/lib/map/overpass";

const MAX_MARKER_COUNT = 200;

export default function PawpalsMeet() {
  const route = useRouter();
  const hasCenteredRef = useRef(false);
  const { location: userLocation, setLocation } = useUserLocation();

  const [places, setPlaces] = useState<OverpassElement[]>([]);
  const [viewport, setViewport] = useState<MapViewport>({ center: [0, 0], zoom: 0, bearing: 0, pitch: 0 });

  useEffect(() => {
    if (!userLocation || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    setViewport((prev) => ({ ...prev, center: [userLocation.lng, userLocation.lat], zoom: 12 }));
  }, [userLocation]);

  return (
    <Card className="w-full h-dvh p-0 overflow-hidden">
      <Map viewport={viewport} onViewportChange={setViewport}>
        <PlaceZoomHandler currenPos={viewport.center} />
        <NearbyPlaces tag="leisure" value="park" onPlacesChange={setPlaces} limit={MAX_MARKER_COUNT} />

        {places.map((el) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (lat == null || lon == null) return null;
          return (
            <MapMarker key={`${el.type}-${el.id}`} longitude={lon} latitude={lat}>
              <MarkerContent>
                <div className="bg-secondary size-5 rounded-full border-2 border-background shadow" />
              </MarkerContent>
              <MarkerTooltip>{el.tags?.name ?? "Unnamed"}</MarkerTooltip>
            </MapMarker>
          );
        })}

        <CardHeader className="absolute top-0 left-0 flex items-center w-full h-16 gap-4 px-4 backdrop-blur-xs z-10">
          <Button size="icon-sm" variant="outline" onClick={() => route.back()}>
            <ArrowLeftIcon />
          </Button>

          <Button
            size={"icon-sm"}
            variant={"secondary"}
            onClick={() => setPlaces([])}
          >
            <XIcon />
          </Button>
        </CardHeader>

        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
          onLocate={(coords) => setLocation({ lng: coords.longitude, lat: coords.latitude })}
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
      </Map>
    </Card>
  );
}
