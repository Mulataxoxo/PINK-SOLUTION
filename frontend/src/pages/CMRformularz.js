import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = "AIzaSyBQfbB1-KewAmrPcoPXq4aYNsQggT1iPHY";
const countrySymbols = {
  "PL": "PL", "DE": "DE", "FR": "FR", "ES": "ES", "IT": "IT",
  "GB": "UK", "NL": "NL", "BE": "BE", "AT": "AT", "CH": "CH",
  "DK": "DK", "SE": "SE", "NO": "NO", "FI": "FI", "CZ": "CZ",
  "SK": "SK", "HU": "HU", "LT": "LT", "LV": "LV", "EE": "EE",
  "PT": "PT", "GR": "GR", "RO": "RO", "BG": "BG", "IE": "IE"
};


// Kalkulator.js
const Kalkulator = () => {
  const [form, setForm] = useState({
    dojazd: "",
    zaladunek: "",
    rozladunek: "",
    przystanki: [],
    zezwolDrogiPlatne: false,
    dataZaladunku: "",
    dataRozladunku: "",
  });
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [mapLink, setMapLink] = useState("");  // 📌 Nowy stan na link do trasy
  const mapRef = useRef(null);
  const [textRoute, setTextRoute] = useState(""); // 📌 Nowy stan na trasę w tekście
  const directionsService = useRef(null);
  const [truckType, setTruckType] = useState("europejec"); // Tryb zapisu trasy
  const directionsRenderer = useRef(null);
  const navigate = useNavigate();
  const inputRefs = useRef({});

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initMap();
    document.body.appendChild(script);
  }, []);
  
  const [firma, setFirma] = useState(""); // Wybrana firma
  const [pojazdy, setPojazdy] = useState([]); // Wszystkie pojazdy
  const [filteredPojazdy, setFilteredPojazdy] = useState([]); // Pojazdy filtrowane wg firmy
  const [pojazd, setPojazd] = useState(""); // Wybrany pojazd
  
  // Pobieranie pojazdów i podział na firmy
const pobierzPojazdy = async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/samochody");

    // Podział pojazdów na Graal i Grand
    const graalPojazdy = res.data.filter(p =>
      ["FZ3909R", "WGM2833F", "FZ8606R", "TK326AV", "TKI4674K", "FZ1936S",
       "FZ2014S", "WPR8501P", "WPR8502P", "WPR8503P", "WPR8504P", "FZ0295S",
       "FZ0296S", "FZ3611S", "FZ3648S", "FZ3631S", "FZ4404S", "FZ9893S",
       "FZ0414T", "FZ0691T", "FZ0692T"].includes(p.id_samochodu)
    );

    const grandPojazdy = res.data.filter(p =>
      ["WGM1642G", "FZ5217S", "FZ0291S", "FZ0292S", "FZ0293S", "FZ0294S",
       "FZ0523S", "FZ0612S", "FZ0613S", "FZ3609S", "FZ4346S", "FZ4308S",
       "FZ4317S", "FZ4405S", "FZ9892S", "FZ0413T", "FZ0569T", "FZ0570T",
       "FZ0739T", "FZ0740U", "FZ5474U"].includes(p.id_samochodu)
    );

    setPojazdy({
      graal: graalPojazdy,
      grand: grandPojazdy
    });
  } catch (error) {
    console.error("❌ Błąd pobierania pojazdów:", error);
  }
};

// Pobieranie pojazdów po załadowaniu komponentu
useEffect(() => {
  pobierzPojazdy();
}, []);


// Filtrowanie pojazdów po zmianie firmy
useEffect(() => {
  if (firma) {
    setFilteredPojazdy(pojazdy[firma] || []);
    setPojazd(""); // Reset wyboru pojazdu
  }
}, [firma, pojazdy]);

  

  
  const initMap = () => {
    if (!window.google) {
      console.error("Google Maps API nie załadowane");
      return;
    }
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 6,
      center: { lat: 52.2297, lng: 21.0122 },
    });
    
    directionsService.current = new window.google.maps.DirectionsService();
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({ map, draggable: true });

    initAutocomplete("dojazd");
    initAutocomplete("zaladunek");
    initAutocomplete("rozladunek");
  };

  const initAutocomplete = (field) => {
    if (!window.google || !window.google.maps) return;
    if (!inputRefs.current[field]) return;
  
    const autocomplete = new window.google.maps.places.Autocomplete(inputRefs.current[field]);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        setForm((prev) => ({ ...prev, [field]: place.formatted_address }));
      }
    });
  };
  

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // 📌 Dodaj tę funkcję TUTAJ:
const validateForm = () => {
    if (!form.zaladunek.trim() || !form.rozladunek.trim() || !form.kwota.trim()) {
        alert("Proszę uzupełnić pola: Załadunek, Rozładunek i Kwota!");
        return false;
    }
    return true;
};
// LICZENIE TRASY
const calculateRoute = () => {
  if (!directionsService.current || !directionsRenderer.current) return;

  const waypoints = form.przystanki.map(stop => ({ location: stop, stopover: true }));
  const request = {
      origin: form.dojazd,
      destination: form.rozladunek,
      waypoints: [{ location: form.zaladunek, stopover: true }, ...waypoints],
      travelMode: "DRIVING",
      avoidTolls: !form.zezwolDrogiPlatne,
  };

  directionsService.current.route(request, (result, status) => {
      if (status === "OK") {
          directionsRenderer.current.setDirections(result);

          // 📌 Obliczanie dystansu i czasu
          const totalDistance = result.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
          setDistance((totalDistance / 1000).toFixed(1));
          const totalDuration = result.routes[0].legs.reduce((acc, leg) => acc + leg.duration.value, 0);
          setDuration((totalDuration / 60).toFixed(0));

          // 📌 Pobieranie kodów pocztowych i krajów
          const routeLegs = result.routes[0].legs.map(leg => ({
              start: leg.start_address,
              end: leg.end_address
          }));

          const pickupCode = getPostalCode(routeLegs[0].start);
          const deliveryCode = getPostalCode(routeLegs[routeLegs.length - 1].end);
          const stopsCodes = routeLegs.slice(1, -1).map(leg => getPostalCode(leg.start)).filter(Boolean);

          let formattedRoute = "";

          // 🔹 Tryb "Europejec"
          if (truckType === "europejec") {
              formattedRoute = [pickupCode, ...stopsCodes, deliveryCode].join("-");
          }

          // 🔹 Tryb "Meblowy"
          else if (stopsCodes.length > 0) {
              let firstStop = stopsCodes[0];
              let firstStopPrefix = firstStop.substring(0, 2);
              let firstStopPostal = firstStop.match(/\d{2}/);
              let formattedStops = `${firstStopPrefix}${firstStopPostal ? firstStopPostal[0] : "00"}*${stopsCodes.length}`;
              formattedRoute = `${pickupCode}-${formattedStops}-${deliveryCode}`;
          } else {
              formattedRoute = `${pickupCode}-${deliveryCode}`;
          }

          setTextRoute(formattedRoute);
      } else {
          console.error("Błąd przy obliczaniu trasy:", status);
      }
  });
};
const countryNames = {
  "PL": "Polska",
  "DE": "Niemcy",
  "FR": "Francja",
  "ES": "Hiszpania",
  "IT": "Włochy",
  "GB": "Wielka Brytania",
  "NL": "Holandia",
  "BE": "Belgia",
  "AT": "Austria",
  "CH": "Szwajcaria",
  "DK": "Dania",
  "SE": "Szwecja",
  "NO": "Norwegia",
  "FI": "Finlandia",
  "CZ": "Czechy",
  "SK": "Słowacja",
  "HU": "Węgry",
  "LT": "Litwa",
  "LV": "Łotwa",
  "EE": "Estonia",
  "PT": "Portugalia",
  "GR": "Grecja",
  "RO": "Rumunia",
  "BG": "Bułgaria",
  "IE": "Irlandia"
};

const getPostalCode = (address) => {
  if (!address) return "";

  const countryMatch = address.match(/\b[A-Z]{2}\b/); // Szuka kraju (np. PL, DE)
  const postalMatch = address.match(/\b\d{2}-\d{3}\b/); // Szuka kodu pocztowego (np. 12-345)

  let country = "";
  let postal = postalMatch ? postalMatch[0].replace("-", "") : "000"; // Domyślnie 000 jeśli brak kodu

  // Szukamy kraju po skrócie lub pełnej nazwie
  if (countryMatch) {
      country = countrySymbols[countryMatch[0]] || countryMatch[0];
  } else {
      for (let key in countryNames) {
          if (address.includes(countryNames[key])) {
              country = key;
              break;
          }
      }
  }

  if (!country || !postal) {
      console.warn(`⚠️ Nie udało się pobrać kodu pocztowego lub kraju dla adresu: ${address}`);
      return "";
  }

  return `${country}${postal}`;
};



// link do mapy
const generujLinkDoMapy = () => {
  if (!form.zaladunek || !form.rozladunek) {
    alert("Najpierw wpisz załadunek i rozładunek!");
    return;
  }

  const baseUrl = "https://www.google.com/maps/dir/";
  let locations = [form.zaladunek, ...form.przystanki, form.rozladunek];

  const formattedLocations = locations
    .filter(loc => loc.trim() !== "")
    .map(loc => encodeURIComponent(loc)) 
    .join("/");

  const finalLink = `${baseUrl}${formattedLocations}`;
  setMapLink(finalLink);
};


  const saveRoute = () => {
    const newRoute = {
        dojazd: form.dojazd,
        zaladunek: form.zaladunek,
        rozladunek: form.rozladunek,
        przystanki: form.przystanki,
        distance: distance,
        duration: duration,
    };

    // Pobieramy aktualnie zapisane trasy lub tworzymy pustą tablicę
    const savedRoutes = JSON.parse(localStorage.getItem("savedRoutes")) || [];
    
    // Dodajemy nową trasę do tablicy
    savedRoutes.push(newRoute);
    
    // Zapisujemy zaktualizowaną listę tras do localStorage
    localStorage.setItem("savedRoutes", JSON.stringify(savedRoutes));
    
    alert("Trasa została zapisana!");
};

const addToBrudnolist = () => {
    if (!validateForm()) return; // Walidacja przed dodaniem

    const newEntry = {
        id: Date.now(), 
        dojazd: form.dojazd,
        zaladunek: form.zaladunek,
        rozladunek: form.rozladunek,
        przystanki: form.przystanki,
        kwota: form.kwota,
        oplatyDrogowe: form.oplatyDrogowe,
        kosztHotelu: form.kosztHotelu,
        distance: distance,
        duration: duration,
    };

    const brudnolist = JSON.parse(localStorage.getItem("brudnolist")) || [];

    const istnieje = brudnolist.some(entry =>
        entry.zaladunek === newEntry.zaladunek &&
        entry.rozladunek === newEntry.rozladunek &&
        entry.kwota === newEntry.kwota
    );

    if (istnieje) {
        alert("Ta trasa już istnieje w Brudnoliście!");
        return;
    }

    brudnolist.push(newEntry);
    localStorage.setItem("brudnolist", JSON.stringify(brudnolist));
    
    alert("Trasa dodana do Brudnolisty!");
};





  const addStop = () => {
    setForm({ ...form, przystanki: [...form.przystanki, ""] });
  };
  
  const updateStop = (index, value) => {
    const newStops = [...form.przystanki];
    newStops[index] = value;
    setForm({ ...form, przystanki: newStops });
  };
  
  const removeStop = (index) => {
    const newStops = form.przystanki.filter((_, i) => i !== index);
    setForm({ ...form, przystanki: newStops });
  };

  return (
  
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">CMR FORMULARZ</h2>
      <label className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={truckType === "meblowy"}
    onChange={() => setTruckType(truckType === "europejec" ? "meblowy" : "europejec")}
  />
  <span>Tryb meblowy</span>
</label>

      <div ref={mapRef} className="w-full h-64 mb-4 border" />
      {/* Pole wyświetlające trasę tekstową */}
{textRoute && (
  <div className="mt-2 p-2 border bg-gray-100">
    <p className="font-semibold">Trasa:</p>
    <p>{textRoute}</p>
  </div>
)}

      <form className="space-y-4">
        {/* Wybór firmy */}
<label htmlFor="firma">Wybierz firmę:</label>
<select id="firma" value={firma} onChange={(e) => setFirma(e.target.value)}>
  <option value="">-- Wybierz firmę --</option>
  <option value="graal">Graal</option>
  <option value="grand">Grand</option>
</select>

{/* Wybór pojazdu */}
<label htmlFor="pojazd">Wybierz pojazd:</label>
<select id="pojazd" value={pojazd} onChange={(e) => setPojazd(e.target.value)} disabled={!firma}>
  <option value="">-- Wybierz pojazd --</option>
  {filteredPojazdy.map((p) => (
    <option key={p.id_samochodu} value={p.id_samochodu}>
      {p.id_samochodu}
    </option>
  ))}
</select>
{/* Wybór daty załadunku */}
<label htmlFor="dataZaladunku">Data załadunku:</label>
<input
  type="date"
  id="dataZaladunku"
  name="dataZaladunku"
  value={form.dataZaladunku}
  onChange={handleChange}
  className="p-2 border w-full"
/>

{/* Wybór daty rozładunku */}
<label htmlFor="dataRozladunku">Data rozładunku:</label>
<input
  type="date"
  id="dataRozladunku"
  name="dataRozladunku"
  value={form.dataRozladunku}
  onChange={handleChange}
  className="p-2 border w-full"
/>


        {/* Nowe pola dojazd, załadunek, przystanki, rozładunek */}
        <input ref={(el) => (inputRefs.current.dojazd = el)} type="text" name="dojazd" placeholder="Dojazd" value={form.dojazd} onChange={handleChange} className="p-2 border w-full" />
        <input ref={(el) => (inputRefs.current.zaladunek = el)} type="text" name="zaladunek" placeholder="Załadunek" value={form.zaladunek} onChange={handleChange} className="p-2 border w-full" />
        
        {/* Dynamiczne przystanki */}
        {form.przystanki.map((stop, index) => (
          <div key={index} className="flex gap-2">
            <input type="text" placeholder={`Przystanek ${index + 1}`} value={stop} onChange={(e) => updateStop(index, e.target.value)} className="p-2 border w-full" />
            <button type="button" onClick={() => removeStop(index)} className="bg-red-500 text-white px-2 py-1 rounded">Usuń</button>
          </div>
        ))}
        <button type="button" onClick={addStop} className="bg-green-500 text-white px-4 py-2 rounded">+ Dodaj przystanek</button>
  
        <input ref={(el) => (inputRefs.current.rozladunek = el)} type="text" name="rozladunek" placeholder="Rozładunek" value={form.rozladunek} onChange={handleChange} className="p-2 border w-full" />
  
      
        {/* 🔹 Tutaj dodajemy opcję płatnych dróg */}
        <label className="flex items-center space-x-2">
          <input type="checkbox" name="zezwolDrogiPlatne" checked={form.zezwolDrogiPlatne} onChange={handleChange} />
          <span>Zezwalaj na drogi płatne</span>
        </label>
  
        <button type="button" onClick={calculateRoute} className="bg-blue-500 text-white px-4 py-2 rounded">Oblicz trasę</button>
        {/* Przycisk generujący link do Google Maps */}
<button type="button" onClick={generujLinkDoMapy} className="bg-green-500 text-white px-4 py-2 rounded">
  Generuj link do trasy
</button>

{/* Pole z linkiem i przycisk kopiowania */}
{mapLink && (
  <div className="mt-2 flex items-center gap-2">
    <input type="text" readOnly value={mapLink} className="p-2 border w-full" />
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(mapLink)}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Kopiuj
    </button>
  </div>
)}

        <button type="button" onClick={addToBrudnolist} className="bg-purple-500 text-white px-4 py-2 rounded">Dodaj trasę do Brudnolisty</button>
        
        {/* 📌 Przycisk do przejścia do Brudnolisty */}
        <button
          type="button"
          onClick={() => navigate("/dashboard/spedytor/brudnolist")}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Przejdź do Brudnolisty
        </button>
      </form>
  
      {/* Wyniki */}
      {distance && <p className="mt-4 text-lg">Dystans: {distance} km</p>}
      {duration && <p className="mt-2 text-lg">Czas przejazdu: {duration} min</p>}

    </div>
  );
}  




export default Kalkulator;
