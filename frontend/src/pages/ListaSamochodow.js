import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// 📌 Pobieranie zalogowanego użytkownika z localStorage
const savedUser = JSON.parse(localStorage.getItem("savedUser"));
const spedytor = savedUser ? savedUser.name : null;


console.log("📌 Sprawdzam zapisany spedytor:", spedytor); // Debugowanie


const ListaSamochodow = () => {
  const { role } = useParams();
  const [dostepneSamochody, setDostepneSamochody] = useState([]);
  const [przypisaneSamochody, setPrzypisaneSamochody] = useState([]);
  const spedytor = JSON.parse(localStorage.getItem("loggedUser"))?.name;



  useEffect(() => {
    pobierzSamochody();
  }, []);

  const pobierzSamochody = async () => {
    try {
      const resDostepne = await axios.get("http://localhost:5001/api/samochody");
      const resPrzypisane = spedytor ? await axios.get(`http://localhost:5001/api/samochody/${spedytor}`) : { data: [] };
  
      const listaDostepnych = resDostepne.data.filter(s => s.status === "wolny");
      setDostepneSamochody(listaDostepnych);
      setPrzypisaneSamochody(resPrzypisane.data);
    } catch (error) {
      console.error("❌ Błąd pobierania samochodów:", error);
    }
  };
  
  

  const przydzielSamochod = async (id_samochodu) => {
    console.log("Próbuję przydzielić samochód:", id_samochodu, "dla", spedytor);
  
    if (!spedytor) {
      console.error("❌ Błąd: brak zalogowanego spedytora!");
      return;
    }
  
    try {
      await axios.post("http://localhost:5001/api/samochody/przydziel", {
        id_samochodu,
        spedytor, // Wysyła teraz tylko string np. "Viktoria"
      });
  
      console.log("✅ Żądanie wysłane!");
      pobierzSamochody();
    } catch (error) {
      console.error("❌ Błąd przypisywania samochodu:", error);
    }
  };
  
  

  const oddajSamochod = async (id_samochodu) => {
    try {
      await axios.post("http://localhost:5001/api/samochody/oddaj", { id_samochodu });
      pobierzSamochody();
    } catch (error) {
      console.error("Błąd oddawania samochodu:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h2 className="text-xl font-bold">Lista Samochodów</h2>
      <div className="flex gap-6 mt-4">
        {/* Lista dostępnych samochodów */}
        <div className="border p-4 w-64 bg-white shadow-md">
          <h3 className="text-lg font-semibold">Dostępne</h3>
          <ul>
            {dostepneSamochody.map((samochod) => (
              <li key={samochod.id_samochodu} className="flex justify-between items-center">
                {samochod.id_samochodu}
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded ml-2"
                  onClick={() => przydzielSamochod(samochod.id_samochodu)}
                >
                  →
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Lista przypisanych samochodów */}
        <div className="border p-4 w-64 bg-white shadow-md">
          <h3 className="text-lg font-semibold">Twoje samochody</h3>
          <ul>
            {przypisaneSamochody.map((samochod) => (
              <li key={samochod.id_samochodu} className="flex justify-between items-center">
                {samochod.id_samochodu}
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded ml-2"
                  onClick={() => oddajSamochod(samochod.id_samochodu)}
                >
                  ←
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ListaSamochodow;
