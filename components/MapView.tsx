"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { DEFAULT_CENTER } from "@/lib/types";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const tradespersonIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export interface MapPin {
  lat: number;
  lng: number;
  label?: string;
  type?: "customer" | "tradesperson" | "default";
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pins?: MapPin[];
  draggable?: boolean;
  onPinDrop?: (lat: number, lng: number) => void;
  className?: string;
}

function ClickHandler({
  onPinDrop,
}: {
  onPinDrop?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPinDrop?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView({
  center = DEFAULT_CENTER,
  zoom = 13,
  pins = [],
  draggable = false,
  onPinDrop,
  className = "h-80 w-full rounded-xl overflow-hidden border border-slate-200",
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${className} bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 text-sm`}
      >
        Loading map…
      </div>
    );
  }

  const iconFor = (type?: MapPin["type"]) => {
    if (type === "customer") return customerIcon;
    if (type === "tradesperson") return tradespersonIcon;
    return defaultIcon;
  };

  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {draggable && onPinDrop && <ClickHandler onPinDrop={onPinDrop} />}
        {pins.map((pin, i) => (
          <Marker
            key={`${pin.lat}-${pin.lng}-${i}`}
            position={[pin.lat, pin.lng]}
            icon={iconFor(pin.type)}
            draggable={draggable && pin.type === "default"}
            eventHandlers={
              draggable && pin.type === "default"
                ? {
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      onPinDrop?.(lat, lng);
                    },
                  }
                : undefined
            }
          >
            {pin.label && <Popup>{pin.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
