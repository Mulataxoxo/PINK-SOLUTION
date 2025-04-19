import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = defaultIcon;

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [positions, map]);
  return null;
};

const LeafletMap = ({ przystanki }) => {
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (!Array.isArray(przystanki) || przystanki.length < 2) return;

    const coordsStr = przystanki.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const geo = data.routes?.[0]?.geometry;
        if (geo) setRouteCoords(geo.coordinates.map(([lng, lat]) => [lat, lng]));
      })
      .catch(err => console.error("❌ Błąd trasy OSRM:", err));
  }, [przystanki]);

  if (!Array.isArray(przystanki) || przystanki.length === 0) return null;

  const positions = przystanki.map(p => [p.lat, p.lng]);

  return (
    <MapContainer
      style={{ height: '300px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <FitBounds positions={positions} />

      {przystanki.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]}>
          <Popup>
            <strong>{p.typ?.toUpperCase()}</strong><br />
            {p.adres}<br />
            Lat: {p.lat}, Lng: {p.lng}
          </Popup>
        </Marker>
      ))}

      {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />} 
    </MapContainer>
  );
};

export default LeafletMap;