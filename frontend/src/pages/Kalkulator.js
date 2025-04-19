import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";



const GOOGLE_MAPS_API_KEY = "AIzaSyBQfbB1-KewAmrPcoPXq4aYNsQggT1iPHY";



const Kalkulator = () => {

  const [form, setForm] = useState({
    dojazd: "",
    zaladunek: "",
    rozladunek: "",
    przystanki: [],
    kwota: "",
    oplatyDrogowe: "",
    kosztHotelu: "",
    zezwolDrogiPlatne: false
  });
  const [editRoute, setEditRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [kosztPaliwa, setKosztPaliwa] = useState(0);
  const [calkowiteKoszty, setCalkowiteKoszty] = useState(0);
  const [marza, setMarza] = useState(0);
  const [zyskNetto, setZyskNetto] = useState(0);
  const mapRef = useRef(null);
  const directionsService = useRef(null);
  const directionsRenderer = useRef(null);
  const navigate = useNavigate();
  const inputRefs = useRef({});
  const [trasaKoordynaty, setTrasaKoordynaty] = useState([]);
  const [podgladKoordynat, setPodgladKoordynat] = useState([]);

  // ✅ Poprawnie ustawiony loggedUser:
  const [loggedUser, setLoggedUser] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedUser")) || {};
    setLoggedUser(user);
  
    const route = JSON.parse(localStorage.getItem("editRoute"));
    if (route) {
      setEditRoute(route);
      setForm({
        dojazd: route.dojazd || "",
        zaladunek: route.zaladunek || "",
        rozladunek: route.rozladunek || "",
        przystanki: Array.isArray(route.przystanki) ? route.przystanki : [],
        kwota: route.kwota || "",
        oplatyDrogowe: route.oplatyDrogowe || "",
        kosztHotelu: route.kosztHotelu || "",
        zezwolDrogiPlatne: false
      });
  
      setDistance(route.distance || null);
      setDuration(route.duration || null);
      setTrasaKoordynaty(Array.isArray(route.przystanki) ? route.przystanki : []);
    }
  
    console.log("📌 Użytkownik w Kalkulatorze:", user);
  }, []);
  
  const handleChangeStopType = (index, typ) => {
    setForm((prev) => ({
      ...prev,
      przystanki: prev.przystanki.map((stop, i) =>
        i === index ? { ...stop, typ } : stop
      ),
    }));
  };


  
  

  useEffect(() => {
    if (window.google && window.google.maps) {
        initMap();
        return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initMap();
    document.body.appendChild(script);
}, []);


  useEffect(() => {
    form.przystanki.forEach((_, index) => initAutocompleteForStop(index));
  }, [form.przystanki]);
  
  

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
  const initAutocompleteForStop = (index) => {
    if (!window.google || !window.google.maps || !inputRefs.current[`stop-${index}`]) return;
  
    const autocomplete = new window.google.maps.places.Autocomplete(inputRefs.current[`stop-${index}`]);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        setForm((prev) => ({
          ...prev,
          przystanki: prev.przystanki.map((stop, i) =>
            i === index ? { ...stop, adres: place.formatted_address } : stop
          ),
        }));
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

// FORMAT TRASY — kod krajowy ➝ kod krajowy ➝ ...
const formatTrasa = (przystanki) => {
  const extractKod = (adres = "") => {
    const match = adres.match(/[A-Z]{2}[- ]?\\d{4,6}/i);
    return match ? match[0].toUpperCase() : adres.slice(0, 6);
  };

  return przystanki
    .map(p => extractKod(p.adres))
    .filter(Boolean)
    .join(" ➝ ");
};







const calculateRoute = () => {
  if (!directionsService.current || !directionsRenderer.current) {
      console.error("Błąd: Google Maps API nie zostało poprawnie załadowane.");
      return;
  }
  
  const waypoints = form.przystanki
      .filter(stop => stop.lat && stop.lng)
      .map(stop => ({
          location: { lat: stop.lat, lng: stop.lng },
          stopover: true
      }));

  const request = {
      origin: form.dojazd,
      destination: form.rozladunek,
      waypoints: [{ location: form.zaladunek, stopover: true }, ...waypoints], 
      travelMode: "DRIVING",
      avoidTolls: !form.zezwolDrogiPlatne, 
  };

  try {
      directionsService.current.route(request, (result, status) => {
          if (status === "OK") {
              directionsRenderer.current.setDirections(result);
              
              // Pobieranie współrzędnych wszystkich przystanków
              const fullCoords = [
                  { adres: form.zaladunek, lat: result.routes[0].legs[0].start_location.lat(), lng: result.routes[0].legs[0].start_location.lng() },
                  ...form.przystanki.map((stop, i) => ({
                      adres: stop.adres,
                      lat: result.routes[0].legs[i + 1]?.start_location?.lat() || null,
                      lng: result.routes[0].legs[i + 1]?.start_location?.lng() || null
                  })),
                  { adres: form.rozladunek, lat: result.routes[0].legs.slice(-1)[0].end_location.lat(), lng: result.routes[0].legs.slice(-1)[0].end_location.lng() }
              ];

              setTrasaKoordynaty(fullCoords);
              setPodgladKoordynat(fullCoords);

              const totalDistance = result.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
              setDistance((totalDistance / 1000).toFixed(1));
              const totalDuration = result.routes[0].legs.reduce((acc, leg) => acc + leg.duration.value, 0);
              setDuration((totalDuration / 60).toFixed(0));
          } else {
              console.error("Błąd przy obliczaniu trasy:", status);
          }
      });
  } catch (error) {
      console.error("Błąd podczas wywołania route():", error);
  }
};






  const saveRoute = () => {
    const newRoute = {
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

    // Pobieramy aktualnie zapisane trasy lub tworzymy pustą tablicę
    const savedRoutes = JSON.parse(localStorage.getItem("savedRoutes")) || [];
    
    // Dodajemy nową trasę do tablicy
    savedRoutes.push(newRoute);
    
    // Zapisujemy zaktualizowaną listę tras do localStorage
    localStorage.setItem("savedRoutes", JSON.stringify(savedRoutes));
    
    alert("Trasa została zapisana!");
};

// Funkcja dodająca trasę do Brudnolisty
const addToBrudnolist = async () => {
  const newEntry = {
    spedytorId: loggedUser.brudnolistId,
    dojazd: form.dojazd,
    zaladunek: form.zaladunek,
    rozladunek: form.rozladunek,
    przystanki: trasaKoordynaty,
    trasa: formatTrasa(trasaKoordynaty),
    kwota: form.kwota,
    oplatyDrogowe: form.oplatyDrogowe,
    kosztHotelu: form.kosztHotelu,
    distance,
    duration
  };

  console.log("📤 Wysyłane przystanki:", trasaKoordynaty);


  const url = editRoute 
    ? `http://localhost:5001/api/brudnolist/${editRoute.id}` 
    : "http://localhost:5001/api/brudnolist";

  const method = editRoute ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    });

    if (response.ok) {
      alert(`✅ Trasa ${editRoute ? "zaktualizowana" : "dodana"} pomyślnie!`);
      localStorage.removeItem("editRoute");
      setEditRoute(null);
      navigate("/dashboard/spedytor", { state: { activeTab: 'brudnolist' } });

    } else {
      const errorData = await response.json();
      alert(`❌ ${errorData.error}`);
    }
  } catch (error) {
    console.error("❌ Błąd połączenia z serwerem:", error);
  }
};



// Generowanie kodu trasy z odprawami celnymi
const newEntry = {
  id: Date.now(), 
  dojazd: form.dojazd,
  zaladunek: form.zaladunek,
  rozladunek: form.rozladunek,
  przystanki: form.przystanki.map(stop => ({
      adres: stop.adres,
      typ: stop.typ,
      lat: stop.lat || null,
      lng: stop.lng || null
  })),
  trasaKoordynaty: trasaKoordynaty, // 🔥 NOWE POLE
  trasa: formatTrasa(trasaKoordynaty), // ✅ właściwy format
  kwota: form.kwota,
  oplatyDrogowe: form.oplatyDrogowe,
  kosztHotelu: form.kosztHotelu,
  distance: distance,
  duration: duration,
};




  const przeliczKoszty = (km) => {
    const spalanie = 12; // L/100km - pobierane z ustawień
    const cenaPaliwa = 1.6; // EUR/L - pobierane z ustawień
    const marzaPrzewoznika = 10; // % - pobierane z ustawień
    
    const kosztPaliwa = (km / 100) * spalanie * cenaPaliwa;
    const oplaty = parseFloat(form.oplatyDrogowe) || 0;
    const hotel = parseFloat(form.kosztHotelu) || 0;
    const calkowiteKoszty = kosztPaliwa + oplaty + hotel;
    const marza = (marzaPrzewoznika / 100) * (parseFloat(form.kwota) || 0);
    const zysk = (parseFloat(form.kwota) || 0) - calkowiteKoszty - marza;
    
    setKosztPaliwa(kosztPaliwa.toFixed(2));
    setCalkowiteKoszty(calkowiteKoszty.toFixed(2));
    setMarza(marza.toFixed(2));
    setZyskNetto(zysk.toFixed(2));
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
      <h2 className="text-2xl font-bold mb-4">Kalkulator Spedycyjny</h2>
      <div ref={mapRef} className="w-full h-64 mb-4 border" />
      <form className="space-y-4">
        {/* Nowe pola dojazd, załadunek, przystanki, rozładunek */}
        <input ref={(el) => (inputRefs.current.dojazd = el)} type="text" name="dojazd" placeholder="Dojazd" value={form.dojazd} onChange={handleChange} className="p-2 border w-full" />
        <input ref={(el) => (inputRefs.current.zaladunek = el)} type="text" name="zaladunek" placeholder="Załadunek" value={form.zaladunek} onChange={handleChange} className="p-2 border w-full" />
        
        {/* Dynamiczne przystanki */}
        {form.przystanki.map((stop, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex gap-2">

  <span>📍 {stop.adres}</span>

  <label>
    <input
      type="radio"
      name={`stop-${index}`}
      checked={form.przystanki[index]?.typ === "załadunek"}
      onChange={() => handleChangeStopType(index, "załadunek")}
    />
    ZA
  </label>
  <label>
    <input
      type="radio"
      name={`stop-${index}`}
      checked={form.przystanki[index]?.typ === "rozładunek"}
      onChange={() => handleChangeStopType(index, "rozładunek")}
    />
    RO
  </label>
  <label>
    <input
      type="radio"
      name={`stop-${index}`}
      checked={form.przystanki[index]?.typ === "odprawa celna"}
      onChange={() => handleChangeStopType(index, "odprawa celna")}
    />
    ODP
  </label>
</div>

<input
  ref={(el) => (inputRefs.current[`stop-${index}`] = el)}
  type="text"
  placeholder={`Przystanek ${index + 1}`}
  value={stop.adres}
  onChange={(e) => updateStop(index, e.target.value)}
  className="p-2 border w-full"
/>

            <button type="button" onClick={() => removeStop(index)} className="bg-red-500 text-white px-2 py-1 rounded">Usuń</button>
          </div>
        ))}
        <button type="button" onClick={addStop} className="bg-green-500 text-white px-4 py-2 rounded">+ Dodaj przystanek</button>
  
        <input ref={(el) => (inputRefs.current.rozladunek = el)} type="text" name="rozladunek" placeholder="Rozładunek" value={form.rozladunek} onChange={handleChange} className="p-2 border w-full" />
  
        {/* Istniejące pola */}
        <input type="text" name="kwota" placeholder="Kwota za zlecenie (EUR)" value={form.kwota} onChange={handleChange} className="p-2 border w-full" />
        <input type="text" name="oplatyDrogowe" placeholder="Opłaty drogowe (EUR)" value={form.oplatyDrogowe} onChange={handleChange} className="p-2 border w-full" />
        <input type="text" name="kosztHotelu" placeholder="Koszt hotelu (EUR)" value={form.kosztHotelu} onChange={handleChange} className="p-2 border w-full" />
  
        {/* 🔹 Tutaj dodajemy opcję płatnych dróg */}
        <label className="flex items-center space-x-2">
          <input type="checkbox" name="zezwolDrogiPlatne" checked={form.zezwolDrogiPlatne} onChange={handleChange} />
          <span>Zezwalaj na drogi płatne</span>
        </label>
        <div className="mt-4 p-2 border bg-gray-100">
    <label className="font-bold">Podgląd współrzędnych:</label>
    {podgladKoordynat.length > 0 ? (
        <ul>
            {podgladKoordynat.map((point, idx) => (
                <li key={idx}>
                    📍 {point.adres} - <strong>Lat:</strong> {point.lat || "Brak"}, <strong>Lng:</strong> {point.lng || "Brak"}
                </li>
            ))}
        </ul>
    ) : (
        <p className="text-gray-500">Brak współrzędnych</p>
    )}
</div>

  
        <button type="button" onClick={calculateRoute} className="bg-blue-500 text-white px-4 py-2 rounded">Oblicz trasę</button>
        <button
  type="button"
  onClick={addToBrudnolist}
  className={`px-4 py-2 rounded ${editRoute ? 'bg-yellow-500' : 'bg-purple-500'} text-white`}
>
  {editRoute ? "Zaktualizuj trasę" : "Dodaj trasę do Brudnolisty"}
</button>

        
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
      <p className="mt-2 text-lg">Koszt paliwa: {kosztPaliwa} EUR</p>
      <p className="mt-2 text-lg">Całkowite koszty: {calkowiteKoszty} EUR</p>
      <p className="mt-2 text-lg">Marża przewoźnika: {marza} EUR</p>
      <p className="mt-2 text-lg font-bold">Zysk netto: {zyskNetto} EUR</p>
    </div>
  );
}  




export default Kalkulator;
