import React, { useState } from "react";
import OficjalnaListaTras from "./OficjalnaLista";
import PanelKontrahenci from "./PanelKontrahenci";
import PanelNadawca from "./PanelNadawca";

import CMRformularz from "./CMRformularz";

const DashboardBiuro = () => {
  const [activeTab, setActiveTab] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Nagłówek */}
      <header className="p-4 bg-blue-600 text-white flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Panel Biura</h1>
      </header>

      {/* Menu nawigacyjne */}
      <nav className="bg-white p-4 flex justify-center gap-4 shadow">
        <button onClick={() => setActiveTab("cmrformularz")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          📄 CMR Formularz
        </button>
        <button onClick={() => setActiveTab("dokumenty")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          📂 Dokumenty
        </button>
        <button onClick={() => setActiveTab("raporty")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          📊 Raporty
        </button>
        <button onClick={() => setActiveTab("oficjalna-lista")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
  📋 Oficjalna Lista Tras
</button>
<button onClick={() => setActiveTab("kontrahenci")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
  🧾 Kontrahenci
</button>
<button onClick={() => setActiveTab("nadawca")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
  📦 Nadawca
</button>


        <button onClick={() => setActiveTab("ustawienia")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          ⚙️ Ustawienia
        </button>
      </nav>

      {/* Główna treść */}
      <main className="p-6 text-center">
        {activeTab === "cmrformularz" && <CMRformularz />} {/* Wyświetlanie formularza w tym samym oknie */}
        {activeTab === "dokumenty" && <p>📂 Moduł dokumentów - przeglądaj i zarządzaj plikami.</p>}
        {activeTab === "raporty" && <p>📊 Moduł raportów - generowanie i analiza.</p>}
        {activeTab === "oficjalna-lista" && <OficjalnaListaTras />}
        {activeTab === "kontrahenci" && <PanelKontrahenci />}
        {activeTab === "nadawca" && <PanelNadawca />}

        {activeTab === "ustawienia" && <p>⚙️ Ustawienia - konfiguracja systemu.</p>}
        {activeTab === null && (
          <>
            <h2 className="text-3xl font-semibold text-gray-800">Witaj w Panelu Biura!</h2>
            <p className="text-lg text-gray-600 mt-2">Wybierz funkcję, którą chcesz uruchomić.</p>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardBiuro;