

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Kalkulator from "./Kalkulator";
import Brudnolist from "./Brudnolist";
import ListaSamochodow from "./ListaSamochodow"; // Import nowego modułu
import OficjalnaListaTras from "./OficjalnaLista";
import { useLocation } from 'react-router-dom';

const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
const spedytor = loggedUser ? loggedUser.name : "Nieznany użytkownik";


console.log("📌 Zalogowany spedytor:", spedytor);



const DashboardSpedytor = () => {
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate(); // Hook do nawigacji
  const location = useLocation();

  useEffect(() => {  // ← tutaj dodaj
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleLogout = () => {
    localStorage.removeItem("loggedUser"); // Usunięcie danych użytkownika
    navigate("/"); // Przekierowanie na stronę logowania
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Nagłówek */}
      <header className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Panel Spedytora</h1>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Wyloguj
        </button>
      </header>

      {/* Menu nawigacyjne */}
      <nav className="bg-white p-4 flex justify-center gap-4 shadow">
        <button onClick={() => setActiveTab("kalkulator")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Kalkulator
        </button>
        <button onClick={() => setActiveTab("brudnolist")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Brudnolist
        </button>
        <button onClick={() => setActiveTab("oficjalna-lista")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
  📋 Oficjalna Lista Tras
</button>

        <button onClick={() => setActiveTab("statusy")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Statusy
        </button>
        <button onClick={() => setActiveTab("ustawienia")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Ustawienia
        </button>
        <button onClick={() => setActiveTab("samochody")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Przydziel Samochód
          </button>

      </nav>

      {/* Główna treść zmienia się dynamicznie */}
      <main className="p-6 text-center">
        {activeTab === "kalkulator" && <Kalkulator />}
        {activeTab === "brudnolist" && <Brudnolist/>}
        {activeTab === "samochody" && <ListaSamochodow />}
        {activeTab === "oficjalna-lista" && <OficjalnaListaTras />}
        {activeTab === null && (
          <>
            <h2 className="text-3xl font-semibold text-gray-800">Witaj spedytorze!</h2>
            <p className="text-lg text-gray-600 mt-2">Wybierz funkcję, którą chcesz uruchomić.</p>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardSpedytor;

