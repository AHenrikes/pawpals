"use client";

import { useState } from "react";
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

export default function PawpalsMeet() {
  // const { map, isLoaded } = useMap();
  // const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // const [error, setError] = useState<string | null>(null);

  const route = useRouter();

  const [viewport, setViewport] = useState<MapViewport>({
    center: [-74.006, 40.7128],
    zoom: 11,
    bearing: 0,
    pitch: 0,
  });
  // const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);

  // function handleLocate(coords: { longitude: number; latitude: number }) {
  //   setUserLocation({ lng: coords.longitude, lat: coords.latitude });
  //   setViewport((v) => ({ ...v, center: [coords.longitude, coords.latitude], zoom: 14 }));
  // }

  return (
    <Card className="w-full h-dvh p-0 overflow-hidden">
      <Map
        viewport={viewport}
        onViewportChange={setViewport}
        center={[-74.006, 40.7128]}
        zoom={11}
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
