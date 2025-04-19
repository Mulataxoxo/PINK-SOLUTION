import React, { useState, useEffect } from "react";
import axios from "axios";
import UploadPDF from "../components/UploadPDF";
import LeafletMap from "../components/LeafletMap";
import ModalFormaWysylki from "../components/ModalFormaWysylki";




const OficjalnaListaTras = () => {
  const [trasy, setTrasy] = useState([]);
  const [wybranaTrasa, setWybranaTrasa] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [trybEdycji, setTrybEdycji] = useState(false);
  const [edycja, setEdycja] = useState({});
  const [filtr, setFiltr] = useState("");
  const [anulacjaModal, setAnulacjaModal] = useState(false);
const [anulowanaTrasa, setAnulowanaTrasa] = useState(null);
const [typAnulacji, setTypAnulacji] = useState("");
const [anulacjaInfo, setAnulacjaInfo] = useState("");
const [anulacjaKwota, setAnulacjaKwota] = useState("");
const [modalWysylki, setModalWysylki] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem("loggedUser"));
  const userRole = savedUser ? savedUser.role : "spedytor";

  useEffect(() => {
    pobierzTrasy();
  }, []);

  const pobierzTrasy = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/oficjalne_trasy");
      setTrasy(res.data);
    } catch (error) {
      console.error("Błąd pobierania tras:", error);
    }
  };


  const wyslijZapytanie = async (trasa) => {
    const email = prompt("Podaj adres e-mail kontrahenta:");
    if (!email) return;
  
    const spedytor = savedUser?.name || "spedytor";
  
    try {
      await axios.post(`http://localhost:5001/api/zlecenia/${trasa.id}/zapytanie`, {
        email,
        wyslanePrzez: spedytor,
      });
      alert("✅ Zapytanie zostało wysłane");
    } catch (err) {
      console.error("Błąd zapytania:", err);
      alert("❌ Błąd wysyłki zapytania");
    }
  };
  
  // Funkcja do anulowania trasy
const anulujTrase = async (trasa) => {
  const typ = window.prompt(
    "Wybierz typ anulacji:\n1 - błędne zlecenie (usuń)\n2 - nota anulacyjna\n3 - faktura anulacyjna"
  );

  if (typ === "1") {
    if (window.confirm("Usunąć trasę?")) {
      await axios.delete(`http://localhost:5001/api/oficjalne_trasy/${trasa.id}`);
      pobierzTrasy();
    }
  }

  if (typ === "2" || typ === "3") {
    const kwota = window.prompt("Podaj kwotę za anulację:");
    const info = window.prompt("Wpisz informację dla biura:");

    await fetch(`http://localhost:5001/api/oficjalne_trasy/${trasa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ZAKOŃCZONA",
        adnotacje: typ === "2" ? `NOTA: ${info}` : `ANULACJA: ${info}`,
        kwota_zlecenia: kwota,
        kto: "spedytor",
        akcja: "anulacja"
      })
    });

    pobierzTrasy();
  }
};

  const usunTrase = async (id) => {
    if (userRole !== "spedytor") return;
    try {
      await axios.delete(`http://localhost:5001/api/oficjalne_trasy/${id}`);
      setTrasy(trasy.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Błąd usuwania trasy:", error);
    }
  };

  const pokazSzczegoly = (trasa) => {
    setWybranaTrasa(trasa);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Oficjalna Lista Tras</h2>
      <input
  type="text"
  placeholder="🔍 Filtruj po zleceniu, pojeździe, kraju..."
  className="border p-2 rounded mb-4 w-full"
  value={filtr}
  onChange={(e) => setFiltr(e.target.value)}
/>

      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Autko</th>
            <th className="border p-2">Data</th>
            <th className="border p-2">Trasa</th>
            <th className="border p-2">Data Załadunku</th>
            <th className="border p-2">Adres Załadunku</th>
            <th className="border p-2">Data Rozładunku</th>
            <th className="border p-2">Adres Rozładunku</th>
            <th className="border p-2">Nr zlecenia</th>
            <th className="border p-2">PDF</th>
            <th className="border p-2">Km planowane</th>
            <th className="border p-2">Km zrobione</th>
            <th className="border p-2">Kwota</th>
            <th className="border p-2">Stawka €/km</th>
            <th className="border p-2">Kraj</th>
            <th className="border p-2">Akcje</th>
          </tr>
        </thead>
        <tbody>
        {trasy
  .filter((trasa) => {
    const f = filtr.toLowerCase();
    return (
      trasa.nr_zlecenia?.toLowerCase().includes(f) ||
      trasa.pojazd?.toLowerCase().includes(f) ||
      trasa.kraj_docelowy?.toLowerCase().includes(f) ||
      trasa.trasa?.toLowerCase().includes(f) ||
      trasa.status?.toLowerCase().includes(f)
    );
  })
  .map((trasa) => (
    <tr
  key={trasa.id}
  className={`text-center ${
    trasa.status === "ZAKOŃCZONA" &&
    (trasa.adnotacje?.includes("NOTA") || trasa.adnotacje?.includes("ANULACJA"))
      ? "bg-yellow-200"
      : ""
  }`}
>

      <td className="border p-2">{trasa.pojazd}</td>
      <td className="border p-2">{trasa.data}</td>
      <td className="border p-2">{trasa.trasa}</td>
      <td className="border p-2">{trasa.data_zaladunku}</td>
      <td className="border p-2">{trasa.adres_zaladunku}</td>
      <td className="border p-2">{trasa.data_rozladunku}</td>
      <td className="border p-2">{trasa.adres_rozladunku}</td>
      <td className="border p-2">{trasa.nr_zlecenia}</td>
      <td className="border p-2">
  {trasa.pdf_zlecenie ? (
    <>
      <a
        href={`http://localhost:5001${trasa.pdf_zlecenie}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline block"
      >
        PDF
      </a>
    </>
  ) : (
    "—"
  )}
</td>

     


      <td className="border p-2">{trasa.planowane_km}</td>
      <td className="border p-2">{trasa.przejechane_km || "-"}</td>
      <td className="border p-2">{trasa.kwota_zlecenia || "-"}</td>
      <td className="border p-2">{trasa.stawka_przeliczona || "-"}</td>
      <td className="border p-2">{trasa.kraj_docelowy || "-"}</td>
      <td className="border p-2 space-x-1">
        <button
          onClick={() => pokazSzczegoly(trasa)}
          className="bg-blue-500 text-white px-2 py-1 rounded"
        >
          📄 Szczegóły
        </button>
        {userRole === "spedytor" && (
  <button
  onClick={() => {
    setAnulowanaTrasa(trasa);
    setAnulacjaModal(true);
    setTypAnulacji("");
    setAnulacjaInfo("");
    setAnulacjaKwota("");
  }}
  
    className="bg-red-500 text-white px-2 py-1 rounded"
  >
    🛑 Anuluj
  </button>
)}

      </td>
    </tr>
  ))
  
}
        </tbody>
      </table>

      {/* MODAL */}
      {showModal && wybranaTrasa && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6">
      <h3 className="text-2xl font-semibold text-center text-blue-800">📄 Szczegóły trasy ID: {wybranaTrasa.id}</h3>

      <button
        onClick={() => setShowModal(false)}
        className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
        title="Zamknij"
      >✖</button>

      {/* 🧾 FAKTURA + DANE FINANSOWE */}
      <div>
  <label className="block text-sm font-medium text-gray-700">📄 Numer faktury:</label>
  <input
    type="text"
    className="border p-2 rounded-lg w-full"
    value={edycja.numer_fv || ''}
    onChange={(e) => setEdycja({ ...edycja, numer_fv: e.target.value })}
    disabled={userRole !== 'biuro' && userRole !== 'kadry'}
  />
  {edycja.pdf_faktura && (
    <a
      href={`http://localhost:5001${edycja.pdf_faktura}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 underline text-sm block mb-1"
    >
      📄 Zobacz dodany plik
    </a>
  )}
  {userRole === 'biuro' && (
    <UploadPDF
      id={wybranaTrasa.id}
      typ="pdf_faktura"
      onUpload={(p) => setEdycja((prev) => ({ ...prev, pdf_faktura: p }))}
    />
  )}
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">📅 Data wystawienia:</label>
  <input
    type="date"
    className="border p-2 rounded-lg w-full"
    value={edycja.data_wystawienia || ''}
    onChange={(e) => setEdycja({ ...edycja, data_wystawienia: e.target.value })}
    disabled={userRole !== 'biuro' && userRole !== 'kadry'}
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">💰 Kwota:</label>
  <input
    type="number"
    className="border p-2 rounded-lg w-full"
    value={edycja.kwota_zlecenia || ''}
    onChange={(e) => setEdycja({ ...edycja, kwota_zlecenia: e.target.value })}
    disabled={userRole === 'kierowca'}
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">📠 NIP kontrahenta:</label>
  <input
    type="text"
    className="border p-2 rounded-lg w-full"
    value={edycja.nip_kontrahenta || ''}
    onChange={(e) => setEdycja({ ...edycja, nip_kontrahenta: e.target.value })}
    disabled={userRole !== 'biuro' && userRole !== 'kadry'}
  />
</div>

{/* 📁 POZOSTAŁE DOKUMENTY */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label className="block text-sm font-medium text-gray-700">📎 PDF Zlecenia:</label>
    {edycja.pdf_zlecenie && (
      <a
        href={`http://localhost:5001${edycja.pdf_zlecenie}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline text-sm block mb-1"
      >
        📄 Zobacz dodany plik
      </a>
    )}
    <UploadPDF
      id={wybranaTrasa.id}
      typ="pdf_zlecenie"
      onUpload={(p) => setEdycja((prev) => ({ ...prev, pdf_zlecenie: p }))}
    />
  </div>
  {edycja.pdf_zlecenie && (
  <div className="mt-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-2">📤 Wysyłka dokumentów:</h4>
    <button
      onClick={() => setModalWysylki(wybranaTrasa)}
      className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700 text-sm"
    >
      📄 Forma wysyłki
    </button>
  </div>
)}


  {userRole === 'biuro' && (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700">📎 PDF Dokumentów:</label>
        {edycja.pdf_dokumenty && (
          <a
            href={`http://localhost:5001${edycja.pdf_dokumenty}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline text-sm block mb-1"
          >
            📄 Zobacz dodany plik
          </a>
        )}
        <UploadPDF
          id={wybranaTrasa.id}
          typ="pdf_dokumenty"
          onUpload={(p) => setEdycja((prev) => ({ ...prev, pdf_dokumenty: p }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">📎 PDF Noty:</label>
        {edycja.pdf_nota && (
          <a
            href={`http://localhost:5001${edycja.pdf_nota}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline text-sm block mb-1"
          >
            📄 Zobacz dodany plik
          </a>
        )}
        <UploadPDF
          id={wybranaTrasa.id}
          typ="pdf_nota"
          onUpload={(p) => setEdycja((prev) => ({ ...prev, pdf_nota: p }))}
        />
      </div>
    </>
  )}
</div>


      {/* 📋 DANE Z FORMULARZA */}
      {wybranaTrasa.dane_formularza && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">📋 Szczegóły ładunku i przewozu:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(JSON.parse(wybranaTrasa.dane_formularza)).map(([k, v]) => (
              <p key={k} className="text-sm text-gray-800"><strong>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}:</strong> {v || '—'}</p>
            ))}
          </div>
        </div>
      )}

      {/* 🗺️ MAPA + PRZYSTANKI */}
      {Array.isArray(JSON.parse(wybranaTrasa.przystanki)) && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">📍 Przystanki i trasa:</h3>
          <ul className="text-sm space-y-1 mb-4">
            {JSON.parse(wybranaTrasa.przystanki).map((p, i) => (
              <li key={i}><strong>{p.typ?.toUpperCase()}:</strong> {p.adres} <span className="text-gray-500">Lat: {p.lat}, Lng: {p.lng}</span></li>
            ))}
          </ul>
          <LeafletMap przystanki={JSON.parse(wybranaTrasa.przystanki)} />
        </div>
      )}

      {/* 🕓 STATUSY */}
      {Array.isArray(JSON.parse(wybranaTrasa.szczegoly)) && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">🕓 Historia statusów:</h3>
          <div className="space-y-1 text-sm">
            {JSON.parse(wybranaTrasa.szczegoly).map((s, i) => (
              <div key={i}><strong>{s.status}</strong> – {s.kto || '—'} – {new Date(s.timestamp).toLocaleString()}</div>
            ))}
          </div>
        </div>
      )}

      {/* ZAPISZ */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button onClick={() => setTrybEdycji(false)} className="px-4 py-2 bg-gray-400 text-white rounded-xl">✖ Anuluj</button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          onClick={async () => {
            const payload = { ...edycja, kto: userRole, akcja: 'Edycja danych biurowych' };
            await fetch(`http://localhost:5001/api/oficjalne_trasy/${wybranaTrasa.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            pobierzTrasy();
            setShowModal(false);
            setTrybEdycji(false);
          }}
        >💾 Zapisz zmiany</button>
      </div>
    </div>
  </div>
)}


{anulacjaModal && anulowanaTrasa && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[400px]">
      <h3 className="text-lg font-semibold mb-4">🛑 Anuluj zlecenie</h3>

      <div className="space-y-2 mb-4">
        <label className="block">
          <input
            type="radio"
            name="typ"
            value="1"
            checked={typAnulacji === "1"}
            onChange={() => setTypAnulacji("1")}
          />{" "}
          ❌ Niewłaściwe zlecenie – usuń
        </label>

        <label className="block">
          <input
            type="radio"
            name="typ"
            value="2"
            checked={typAnulacji === "2"}
            onChange={() => setTypAnulacji("2")}
          />{" "}
          📄 Wystaw NOTĘ – zakończ
        </label>

        <label className="block">
          <input
            type="radio"
            name="typ"
            value="3"
            checked={typAnulacji === "3"}
            onChange={() => setTypAnulacji("3")}
          />{" "}
          💰 Wystaw FAKTURĘ – zakończ
        </label>
      </div>

      {(typAnulacji === "2" || typAnulacji === "3") && (
        <>
          <input
            type="text"
            placeholder="Kwota"
            className="border p-1 rounded w-full mb-2"
            value={anulacjaKwota}
            onChange={(e) => setAnulacjaKwota(e.target.value)}
          />
          <textarea
            placeholder="Informacje dla biura"
            className="border p-1 rounded w-full"
            value={anulacjaInfo}
            onChange={(e) => setAnulacjaInfo(e.target.value)}
          />
        </>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setAnulacjaModal(false)}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Anuluj
        </button>
        <button
          onClick={async () => {
            if (typAnulacji === "1") {
              await axios.delete(`http://localhost:5001/api/oficjalne_trasy/${anulowanaTrasa.id}`);
            } else if (typAnulacji === "2" || typAnulacji === "3") {
              await fetch(`http://localhost:5001/api/oficjalne_trasy/${anulowanaTrasa.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "ZAKOŃCZONA",
                  adnotacje: typAnulacji === "2"
                    ? `NOTA: ${anulacjaInfo}`
                    : `ANULACJA: ${anulacjaInfo}`,
                  kwota_zlecenia: anulacjaKwota,
                  kto: "spedytor",
                  akcja: "anulacja",
                }),
              });
            }

            setAnulacjaModal(false);
            setAnulowanaTrasa(null);
            pobierzTrasy();
          }}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          ✅ Zatwierdź
        </button>
      </div>
    </div>
  </div>
)}

{modalWysylki && (
  <ModalFormaWysylki
    zlecenieId={modalWysylki.id}
    spedytor={savedUser?.name}
    onClose={() => setModalWysylki(null)}
    onZapisz={() => pobierzTrasy()}
    onZapytanie={() => wyslijZapytanie(modalWysylki)}
  />
)}


    </div>
  );
};

export default OficjalnaListaTras;
