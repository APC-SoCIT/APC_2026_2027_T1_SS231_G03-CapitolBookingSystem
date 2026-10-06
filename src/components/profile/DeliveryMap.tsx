import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { RESTAURANT_INFO } from "../../constants";
import { fetchRoute, geocodeAddress, type LatLng } from "../../lib/geo";

const PACKAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

const restaurantIcon = L.divIcon({
  className: "delivery-marker delivery-marker--restaurant",
  html: PACKAGE_SVG,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function homeIcon(delivered: boolean) {
  return L.divIcon({
    className: `delivery-marker delivery-marker--home${delivered ? " delivery-marker--delivered" : ""}`,
    html: PIN_SVG,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

type DeliveryMapProps = {
  address: string;
  delivered: boolean;
};

function FitBounds({ points }: { points: L.LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
  }, [map, points]);
  return null;
}

export function DeliveryMap({ address, delivered }: DeliveryMapProps) {
  const origin = RESTAURANT_INFO.location;
  const [dest, setDest] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [geocodeFailed, setGeocodeFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDest(null);
    setRoute(null);
    setMinutes(null);
    setGeocodeFailed(false);
    geocodeAddress(address).then((point) => {
      if (cancelled) return;
      if (point) setDest(point);
      else setGeocodeFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    if (!dest) return;
    let cancelled = false;
    fetchRoute(RESTAURANT_INFO.location, dest).then((result) => {
      if (cancelled || !result) return;
      setRoute(result.coords);
      setMinutes(result.minutes);
    });
    return () => {
      cancelled = true;
    };
  }, [dest]);

  const path = useMemo<L.LatLngTuple[]>(() => {
    const coords = route ?? (dest ? [origin, dest] : null);
    if (!coords) return [];
    return coords.map((point) => [point.lat, point.lng]);
  }, [route, dest, origin]);

  const label = delivered
    ? "Delivered"
    : geocodeFailed
      ? "Address not found on map"
      : !dest
        ? "Locating address…"
        : minutes !== null
          ? `≈ ${minutes} min drive`
          : null;

  return (
    <div className="delivery-map">
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="delivery-map__leaflet"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[origin.lat, origin.lng]} icon={restaurantIcon} />
        {dest && (
          <Marker position={[dest.lat, dest.lng]} icon={homeIcon(delivered)} />
        )}
        {path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{
              color: delivered ? "#087443" : "#b70100",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}
        {path.length > 1 && <FitBounds points={path} />}
      </MapContainer>
      {label && <span className="delivery-map__label">{label}</span>}
    </div>
  );
}
