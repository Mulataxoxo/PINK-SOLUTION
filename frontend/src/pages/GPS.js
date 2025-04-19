import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const GPS = () => {
    const { id } = useParams();
    const mapRef = useRef(null);
    const [position, setPosition] = useState([51.9665, 15.4507]); // Domyślna lokalizacja
    const [trasa, setTrasa] = useState(null);
    
    const [status, setStatus] = useState("W drodze na załadunek");
    const [files, setFiles] = useState([]);
    const [canChangeStatus, setCanChangeStatus] = useState(false);
    const [etapIndex, setEtapIndex] = useState(0);
    const [historiaEtapow, setHistoriaEtapow] = useState([]);
    const [nawigacjaAktywna, setNawigacjaAktywna] = useState(false);
    const [eta, setEta] = useState(null);
    const [przejechanaTrasa, setPrzejechanaTrasa] = useState([]);

    const przystanki = Array.isArray(trasa?.przystanki)
    ? trasa.przystanki
    : JSON.parse(trasa?.przystanki || "[]");
  

    useEffect(() => {
        // Pobranie trasy z API
        const fetchData = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/trasy/${id}`);
                console.log("📌 Otrzymane dane trasy:", res.data);
                setTrasa(res.data);
                setStatus(res.data.status || "W drodze na załadunek");
            } catch (error) {
                console.error("❌ Błąd pobierania trasy:", error);
            }
        };
        fetchData();
    }, [id]);

    const pobierzETA = () => {
      if (!position || !trasa) return;
  
      const przystanki = Array.isArray(trasa.przystanki)
      ? trasa.przystanki
      : JSON.parse(trasa.przystanki || "[]");
    
    const aktualny = przystanki[etapIndex];
    if (!aktualny?.lat || !aktualny?.lng) return;
    
    const routeURL = `https://router.project-osrm.org/route/v1/driving/${position[1]},${position[0]};${aktualny.lng},${aktualny.lat}?overview=false`;
    
  
      fetch(routeURL)
          .then(res => res.json())
          .then(data => {
              if (data.code === "Ok") {
                  const czasSekundy = data.routes[0].duration;
                  const czasMinuty = Math.round(czasSekundy / 60);
                  setEta(czasMinuty);
              }
          })
          .catch(err => console.error("❌ Błąd pobierania ETA:", err));
  };
  
  useEffect(() => {
    pobierzETA();
}, [pobierzETA, position, trasa]); // ✅ Wszystkie zależności w jednym miejscu

  

    const toggleNawigacja = () => {
      setNawigacjaAktywna((prev) => !prev);
  
      if (!nawigacjaAktywna) {
          // 🔹 Tryb nawigacji: auto śledzenie pojazdu, zoom 17
          if (mapRef.current && position) {
              mapRef.current.setView(position, 17); 
          }
      } else {
          // 🔹 Tryb normalny: NIE UŻYWAMY `fitBounds()`, tylko `setView()` z zoomem 14
          if (mapRef.current && position) {
              mapRef.current.setView(position, 14); // 🔥 Ustawienie na trasę, ale bliżej!
          }
      }
  };
  
  
  
  
  
  useEffect(() => {
    if (!trasa) return;
  
    const przystanki = Array.isArray(trasa.przystanki)
      ? trasa.przystanki
      : JSON.parse(trasa.przystanki || "[]");
  
    if (
      !przystanki ||
      etapIndex >= przystanki.length ||
      !przystanki[etapIndex]
    ) {
      return;
    }
    
  
      if (!mapRef.current) {
        const punkt = przystanki[etapIndex];

        const lat = punkt?.lat;
        const lng = punkt?.lng;
        
        // jeśli nie ma poprawnych danych — użyj fallbacku
        const viewLat = lat ?? 52.0;
        const viewLng = lng ?? 19.0;
        
        mapRef.current = L.map('map').setView([viewLat, viewLng], 6);
        
        
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
          }).addTo(mapRef.current);
      }
  
      // Usuwamy stare warstwy (markery i trasę)
      mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
              mapRef.current.removeLayer(layer);
          }
      });
  
      let start, end;
      if (etapIndex === 0) {
        start = position;
      } else {
        start = [przystanki[etapIndex - 1].lat, przystanki[etapIndex - 1].lng];
      }
      end = [przystanki[etapIndex].lat, przystanki[etapIndex].lng];
      
      // 🔹 Tworzenie ikon
const ikonaZaladunku = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // 🚛 Ikona załadunku
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

const ikonaRozladunku = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png', // 📦 Ikona rozładunku
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

przystanki.forEach((p) => {
    if (!p.lat || !p.lng) return;
    const ikona = p.typ?.includes("ZAŁADUNEK") ? ikonaZaladunku : ikonaRozladunku;
    L.marker([p.lat, p.lng], { icon: ikona }).addTo(mapRef.current).bindPopup(`${p.typ}: ${p.adres}`);
  });
  
  

  
      // 🔹 Pobranie trasy z OSRM API
      const routeURL = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  
      fetch(routeURL)
          .then(res => res.json())
          .then(data => {
              if (data.code === "Ok") {
                  const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                  L.polyline(routeCoords, { color: 'blue' }).addTo(mapRef.current);
                  mapRef.current.fitBounds(L.polyline(routeCoords).getBounds());
              } else {
                  console.error("❌ Błąd OSRM:", data);
              }
          })
          .catch(err => console.error("❌ Błąd pobierania trasy:", err));
  
      // 🔹 Śledzenie GPS - aktualizacja pozycji kierowcy
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
                // 🔹 Dodajemy nową pozycję do przejechanej trasy
// 🔹 Aktualizujemy przejechaną trasę i rysujemy linię
setPrzejechanaTrasa(prev => {
  const nowaTrasa = [...prev, [latitude, longitude]];

  // 🔹 Usuwamy starą trasę przed dodaniem nowej
  mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Polyline && layer.options.color === "red") {
          mapRef.current.removeLayer(layer);
      }
  });

  // 🔹 Rysujemy przejechaną trasę na czerwono
  if (nowaTrasa.length > 1) {
      L.polyline(nowaTrasa, { color: 'red' }).addTo(mapRef.current);
  }

  return nowaTrasa; // 🔥 Aktualizujemy `przejechanaTrasa`
});


// 🔹 Usuwamy starą trasę przed dodaniem nowej
mapRef.current.eachLayer((layer) => {
    if (layer instanceof L.Polyline && layer.options.color === "red") {
        mapRef.current.removeLayer(layer);
    }
});

// 🔹 Rysujemy przejechaną trasę na czerwono
if (przejechanaTrasa.length > 1) {
    L.polyline(przejechanaTrasa, { color: 'red' }).addTo(mapRef.current);
}
    
                if (nawigacjaAktywna && mapRef.current) {
                    mapRef.current.setView([latitude, longitude], 17, { animate: true });
                }
                const heading = pos.coords.heading; // Kierunek jazdy w stopniach
                if (heading !== null && nawigacjaAktywna && mapRef.current) {
                    mapRef.current.setBearing(heading); // 🔥 Obrót mapy zgodnie z kierunkiem jazdy
                }
                
    
      
          // Usunięcie starego markera kierowcy, aby nie powielał się
          mapRef.current.eachLayer((layer) => {
              if (layer instanceof L.Marker && layer.options.icon?.options.iconUrl.includes("flaticon")) {
                  mapRef.current.removeLayer(layer);
              }
          });

          // Dodanie nowego markera kierowcy
          L.marker([latitude, longitude], {
              icon: L.icon({
                  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                  iconSize: [40, 40],
                  iconAnchor: [20, 40]
              })
          }).addTo(mapRef.current);
      },
      (error) => {
          console.error("❌ Błąd GPS:", error);
          alert("Nie możemy uzyskać Twojej lokalizacji. Sprawdź ustawienia GPS.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
  );
}

}, [trasa, etapIndex, position]);

  

    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const przejdzDoKolejnegoEtapu = async () => {
      if (files.length === 0) {
          alert("Musisz dodać zdjęcia dokumentów, aby kontynuować!");
          return;
      }

      const aktualny = przystanki[etapIndex];
const timestamp = new Date().toLocaleString("pl-PL");

const nowyEtap = {
    etap: etapIndex + 1,
    typ: aktualny.typ,
    adres: aktualny.adres,
    czas: timestamp,
    pliki: Array.isArray(files) ? files.map(f => f.name) : [files?.name]

  };
  
  const nowaHistoria = [...historiaEtapow, nowyEtap];
  
  setHistoriaEtapow(nowaHistoria);
  
  // 🟢 WYŚLIJ NA BACKEND
  try {
    await axios.patch(`http://localhost:5001/api/trasy/${trasa.id}/historia`, {
      historia: nowaHistoria
    });
  } catch (err) {
    console.error("❌ Błąd zapisu historii etapów:", err);
  }
  // 1. Upload dokumentów
  
  const formData = new FormData();
  formData.append("typ", "zdj_z_trasy"); // NAJPIERW TYP!
  for (let i = 0; i < files.length; i++) {
      formData.append("dokumenty", files[i]); // POTEM PLIKI
  }
  
  try {
      await axios.post(`http://localhost:5001/api/trasy/${trasa.id}/dokumenty`, formData);
  } catch (err) {
      console.error("❌ Błąd uploadu dokumentów:", err);
  }
  
// 2. Zmiana statusu
try {
    const nowyStatus = `${etapIndex + 1}. ${przystanki[etapIndex].typ}`;
    await axios.post(`http://localhost:5001/api/trasy/${trasa.id}/status`, {
        status: nowyStatus
    });
    setStatus(nowyStatus);
    setFiles([]);
    setCanChangeStatus(false);
} catch (err) {
    console.error("❌ Błąd zmiany statusu:", err);
}

    };

    

    return (
      <div className="flex">
          {/* Panel boczny z informacjami */}
          <div className="w-1/3 bg-white p-4 shadow-lg rounded-lg">
              <h2 className="text-lg font-bold">Nawigacja</h2>
              <p><strong>Adres załadunku:</strong> {trasa?.adres_zaladunku || "Brak danych"}</p>
              <p><strong>Adres rozładunku:</strong> {trasa?.adres_rozladunku || "Brak danych"}</p>
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Przejechane km:</strong> {trasa?.przejechane_km || 0} km</p>
              <p><strong>Pozostały czas:</strong> {eta ? `${eta} min` : "Ładowanie..."}</p>

              <input type="file" multiple onChange={handleFileChange} className="mt-2" />
  
              <button 
    onClick={przejdzDoKolejnegoEtapu} 
    className={`mt-4 px-4 py-2 rounded ${files.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
    disabled={files.length === 0}
>
{trasa?.przystanki?.[etapIndex]?.typ === "ZAŁADUNEK" && "Załadowany"}
{trasa?.przystanki?.[etapIndex]?.typ?.includes("ROZŁADUNEK") && "Rozładowany"}
{!["ZAŁADUNEK", "ROZŁADUNEK"].includes(trasa?.przystanki?.[etapIndex]?.typ) && "Dalej"}

</button>

<button 
    onClick={toggleNawigacja} 
    className="mt-2 px-4 py-2 rounded bg-blue-500 text-white"
>
    {nawigacjaAktywna ? "Zakończ nawigację" : "Nawiguj"}
</button>


          </div>
  
          {/* Mapa */}
          <div className="w-2/3">
              <div id="map" className="w-full h-[600px] rounded shadow mt-4 border-2 border-gray-300"></div>
  
              {/* Podsumowanie trasy - wyświetla się, gdy transport zakończony */}
              {etapIndex >= trasa?.przystanki?.length && (

                  <div className="p-4 bg-white shadow-lg rounded-lg mt-4">
                      <h2 className="text-xl font-bold">Podsumowanie trasy</h2>
                      <p><strong>Przejechane km:</strong> {trasa?.przejechane_km} km</p>
                      <p><strong>Godzina załadunku:</strong> {trasa?.godzina_zaladunku}</p>
                      <p><strong>Godzina rozładunku:</strong> {trasa?.godzina_rozladunku}</p>
                      <p><strong>Dodane dokumenty:</strong> {files.length > 0 ? "Tak" : "Nie"}</p>
                  </div>
              )}
          </div>
      </div>
  );
  
  
};

export default GPS;
