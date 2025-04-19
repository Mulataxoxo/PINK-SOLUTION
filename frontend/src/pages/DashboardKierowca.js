import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashboardKierowca = () => {
  const navigate = useNavigate();
  const [trasy, setTrasy] = useState({ dzisiaj: {}, wczoraj: {}, jutro: {} });

  const pobierzTrasy = async () => {
    
    const auto = JSON.parse(localStorage.getItem("loggedUser"))?.name;

    try {
      const dzisiaj = await axios.get(`http://localhost:5001/api/trasy/${auto}/dzisiaj`);
      console.log("📦 Trasa dzisiaj:", dzisiaj.data);

      const wczoraj = await axios.get(`http://localhost:5001/api/trasy/${auto}/wczoraj`);
      const jutro = await axios.get(`http://localhost:5001/api/trasy/${auto}/jutro`);

      setTrasy({ dzisiaj: dzisiaj.data, wczoraj: wczoraj.data, jutro: jutro.data });
    } catch (err) {
      console.error(err);
    }
  };
  const noweTrasy = trasy.dzisiaj?.status === "NOWA" ? [trasy.dzisiaj] : [];
const aktywneTrasy = trasy.dzisiaj?.status === "ZLECENIE PRZYJĘTE PRZEZ KIEROWCĘ" ? [trasy.dzisiaj] : [];


if (trasy.dzisiaj?.id) {
  console.log("📌 ID trasy dla GPS:", trasy.dzisiaj.id);
}


  useEffect(() => {
    const auto = JSON.parse(localStorage.getItem('loggedUser'))?.name;
    if (auto) pobierzTrasy();
    
  }, []);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Panel Kierowcy:{JSON.parse(localStorage.getItem("loggedUser"))?.name}
        </h1>
        <button className="bg-red-500 text-white px-4 py-2 rounded">Wyloguj</button>
      </header>

      {trasy.dzisiaj?.id && (
  <section className="bg-white shadow rounded p-4 my-4">
    <h2 className="text-xl font-semibold">🟢 Dzisiaj</h2>
    <p><strong>Załadunek:</strong> {trasy.dzisiaj?.adres_zaladunku || "Brak danych"}</p>
<p><strong>Rozładunek:</strong> {trasy.dzisiaj?.adres_rozladunku || "Brak danych"}</p>



    {trasy.dzisiaj.status === "NOWA" && (
      <button
        onClick={async () => {
          await fetch(`http://localhost:5001/api/oficjalne_trasy/${trasy.dzisiaj.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "ZLECENIE PRZYJĘTE PRZEZ KIEROWCĘ",
              kto: trasy.dzisiaj.pojazd,
              akcja: "Kierowca przyjął zlecenie",
            }),
          });
          pobierzTrasy();
        }}
        className="bg-green-600 text-white px-4 py-2 rounded mt-2"
      >
        ✅ Przyjmij Zlecenie
      </button>
    )}

    {trasy.dzisiaj.status === "ZLECENIE PRZYJĘTE PRZEZ KIEROWCĘ" && (
      <button
        onClick={() => navigate(`/dashboard/kierowca/gps/${trasy.dzisiaj.id}`)}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
      >
        📍 Przejdź do zlecenia
      </button>
    )}
  </section>
)}


      <section className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold">Wczoraj</h2>
          <p>{trasy.wczoraj?.adres_zaladunku || "Brak trasy"}</p>
<p>{trasy.dzisiaj?.adres_zaladunku || "Brak trasy"}</p>
<p>{trasy.jutro?.adres_zaladunku || "Brak trasy"}</p>

        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold">Dzisiaj</h2>
          <p>{trasy.dzisiaj?.adres_zaladunku || "Brak trasy"}</p>

        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold">Jutro</h2>
          <p>{trasy.jutro?.adres_zaladunku || "Brak trasy"}</p>

        </div>
      </section>
    </div>
  );
};

export default DashboardKierowca;
