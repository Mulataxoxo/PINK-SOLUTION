import React, { useEffect, useRef, useState } from "react";

const GoogleMapTrasa = ({ przystanki, avoidTolls = true, stawka1 = 0, stawka2 = 0 }) => {
  const mapRef = useRef(null);
  const [szczegoly, setSzczegoly] = useState(null);

  useEffect(() => {
    console.log("📍 Przystanki do mapy:", przystanki);
    if (!window.google || !Array.isArray(przystanki) || przystanki.length < 2) return;

    const isValidCoord = (p) => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng);
    const punkty = przystanki.filter(isValidCoord);

    if (punkty.length < 2) return;

    const origin = punkty[0];
    const destination = punkty[punkty.length - 1];
    const waypoints = punkty.slice(1, -1).map(p => ({
      location: { lat: parseFloat(p.lat), lng: parseFloat(p.lng) },
      stopover: true
    }));

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer();
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 6,
      center: { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng) },
    });

    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng) },
        destination: { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) },
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidTolls: avoidTolls,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);

          const legs = result.routes[0].legs;
          let totalKm = 0;
          let totalMin = 0;
          legs.forEach(leg => {
            totalKm += leg.distance.value / 1000;
            totalMin += leg.duration.value / 60;
          });

          const spalanie = (totalKm * 12) / 100;
          const kosztPaliwo = spalanie * 1.4;
          const sumaStawki = parseFloat(stawka1) + parseFloat(stawka2);
          const stawkaZaKm = sumaStawki / totalKm;

          setSzczegoly({
            km: totalKm.toFixed(1),
            czas: Math.round(totalMin),
            spalanie: spalanie.toFixed(1),
            paliwo: kosztPaliwo.toFixed(2),
            stawka: sumaStawki,
            zaKm: stawkaZaKm.toFixed(2),
          });
        } else {
          console.error("❌ Błąd generowania trasy:", status);
        }
      }
    );
  }, [przystanki, avoidTolls]);

  if (!przystanki || przystanki.length < 2) {
    return <p className="text-sm text-gray-500">⚠️ Za mało punktów, aby wygenerować trasę.</p>;
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div ref={mapRef} className="w-full h-[400px] rounded shadow" />
      {szczegoly && (
        <div className="bg-gray-100 p-4 rounded shadow text-sm">
          <p>🛣️ Dystans: <strong>{szczegoly.km} km</strong></p>
          <p>⏱️ Czas przejazdu: <strong>{szczegoly.czas} min</strong></p>
          <p>⛽ Szacowane spalanie: <strong>{szczegoly.spalanie} l</strong></p>
          <p>💶 Koszt paliwa (~1.4€/l): <strong>{szczegoly.paliwo} €</strong></p>
          <p>📦 Łączna stawka: <strong>{szczegoly.stawka} €</strong></p>
          <p>📊 Stawka za km: <strong>{szczegoly.zaKm} €/km</strong></p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapTrasa;
