import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusowanieModal from "./StatusowanieModal";

const Brudnolist = () => {
  const [brudnolist, setBrudnolist] = useState([]);
  const navigate = useNavigate();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [statusAuto, setStatusAuto] = useState(null);

  
  const loggedUser = JSON.parse(localStorage.getItem("loggedUser")) || {}; // Definicja użytkownika
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser")) || {};
    
    console.log("📌 Pobieranie Brudnolisty dla brudnolistId:", loggedUser.brudnolistId);
    if (!loggedUser.brudnolistId) return;
  
    fetch(`http://localhost:5001/api/brudnolist/${loggedUser.brudnolistId}`)
      .then(response => response.json())
      .then(data => {
        console.log("📌 Pobranie Brudnolisty:", data);
        setBrudnolist(data);
      })
      .catch(error => console.error("❌ Błąd pobierania Brudnolisty:", error));
  }, []);
  
  const handleEdit = (route) => {
    localStorage.setItem("editRoute", JSON.stringify(route));
    navigate("/dashboard/spedytor/kalkulator");
  };

  const handleDelete = async (id) => {
  console.log("🧪 Kliknięto usuń trasę o ID:", id);

  try {
    const response = await fetch(`http://localhost:5001/api/brudnolist/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    console.log("🧹 Backend zwrócił:", result);

    if (response.ok) {
      const refreshed = await fetch(`http://localhost:5001/api/brudnolist/${loggedUser.brudnolistId}`);
      const data = await refreshed.json();
      console.log("🔁 Nowe dane po usunięciu:", data);
      setBrudnolist(data);
    } else {
      console.error("❌ Błąd usuwania:", result.error);
    }
  } catch (error) {
    console.error("❌ Błąd połączenia z serwerem:", error);
  }
};

  
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Brudnolist - Zapisane Trasy</h2>
      <button onClick={() => navigate("/kalkulator")} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Wróć do Kalkulatora
      </button>
      {brudnolist.length === 0 ? (
        <p className="text-gray-500">Brak zapisanych tras.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
          <tr className="bg-gray-200">
  <th className="border p-2">Załadunek</th>
  <th className="border p-2">Rozładunek</th>
  <th className="border p-2">Trasa</th>
  <th className="border p-2">Kwota</th>
  <th className="border p-2">Koszt paliwa</th>
  <th className="border p-2">Zysk netto</th>
  <th className="border p-2">Stawka za km</th>
  <th className="border p-2">Dystans</th>
  <th className="border p-2">Czas przejazdu</th>
  <th className="border p-2">Akcje</th>
</tr>

          </thead>
          <tbody>
            {brudnolist.map((route) => (
              <React.Fragment key={route.id}>
                <tr className="border">
                  <td className="border p-2">{route.zaladunek}</td>
                  <td className="border p-2">{route.rozladunek}</td>
                  <td className="border p-2">{route.trasa || "Brak"}</td>
                  <td className="border p-2">{route.kwota} EUR</td>
                  <td className="border p-2">{route.kosztPaliwa || "0"} EUR</td>
<td className="border p-2">{route.zyskNetto || "0"} EUR</td>
<td className="border p-2">{route.stawkaZaKm || "0"} EUR/km</td>

                  <td className="border p-2">{route.distance || "0"} km</td>
                  <td className="border p-2">{route.duration || "0"} min</td>
                  <td className="border p-2">
                    <button onClick={() => handleEdit(route)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">
                      Edytuj
                    </button>
                    <button type="button" onClick={() => handleDelete(route.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                      Usuń
                      </button>
                      <button
                      onClick={() => {
                        setSelectedRoute(route);
                        setShowStatusModal(true);
                      }}
                      className="bg-blue-500 text-white px-2 py-1 rounded mt-1"
                      >
                        nadaj status
                        </button>


                  </td>
                </tr>
                <tr key={`row-${route.id}-przystanki`}>
  <td colSpan="9" className="border p-2">
  <strong>Podgląd współrzędnych:</strong><br />
  {(() => {
  const przystanki = Array.isArray(route.przystanki)
    ? route.przystanki
    : JSON.parse(route.przystanki || "[]");

  return przystanki.length > 0 ? (
    <ul className="mt-1 space-y-1">
      {przystanki.map((stop, idx) => (
        <li key={idx}>
          📍 {stop.adres || "Brak adresu"} — <strong>{stop.typ?.toUpperCase() || "Brak typu"}</strong>{" "}
          <span className="text-gray-500">
            Lat: {stop.lat ?? "Brak"}, Lng: {stop.lng ?? "Brak"}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <span className="text-gray-400">Brak przystanków</span>
  );
})()}

 
</td>

                </tr>
              </React.Fragment>
            ))}
          </tbody>
          </table>
      )}
      
      {showStatusModal && selectedRoute && (
  <StatusowanieModal
    isOpen={showStatusModal}
    trasa={selectedRoute}
    brudnolist={brudnolist}
    kontynuacja={!!statusAuto}
    autoDane={statusAuto}
    onClose={() => {
      setShowStatusModal(false);
      setSelectedRoute(null);
      setStatusAuto(null);
    }}
    onConfirm={async (dane) => {
      if (dane.kontynuujZ) {
        const nowaTrasa = brudnolist.find(b => b.id === dane.doladunekId);
        setSelectedRoute(nowaTrasa);
        setStatusAuto(dane.kontynuujZ);
        setShowStatusModal(true);
        return;
      }
    
      const grupa_trasy_id = Date.now(); // unikalne ID grupy tras
      const spedytor = JSON.parse(localStorage.getItem("loggedUser"))?.name;
      const pojazd = dane.pojazd;

    
      const glowna = {
        ...dane,
        spedytor,
        pojazd,
        trasa: `${selectedRoute.zaladunek} ➝ ${selectedRoute.rozladunek}`,
        planowane_km: selectedRoute.distance || 0,
        przystanki: JSON.stringify(dane.kolejnoscKodow || []),
      };
      
      const doladunek = dane.doladunekId
        ? {
            ...dane,
            spedytor,
            pojazd,
            trasa: `${brudnolist.find(b => b.id === dane.doladunekId)?.zaladunek} ➝ ${brudnolist.find(b => b.id === dane.doladunekId)?.rozladunek}`,
            planowane_km: brudnolist.find(b => b.id === dane.doladunekId)?.distance || 0,
          }
        : null;
    
      const trasy = doladunek ? [glowna, doladunek] : [glowna];
    
      await fetch("http://localhost:5001/api/oficjalne_trasy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupa_trasy_id, trasy }),
      });
    
      // Usuń z brudnolist
      await handleDelete(selectedRoute.id);
      if (dane.doladunekId) await handleDelete(dane.doladunekId);
    
      setShowStatusModal(false);
    }}
    
  />
)}

    </div>
  );
}

export default Brudnolist;
