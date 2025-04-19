import React, { useState } from "react";
import axios from "axios";

const ModalFormaWysylki = ({ zlecenieId, spedytor, onClose, onZapisz, onZapytanie }) => {
  const [metoda, setMetoda] = useState("");
  const [email, setEmail] = useState("");
  const [adres, setAdres] = useState("");

  const handleZapisz = async () => {
    if (!metoda) return alert("Wybierz formę wysyłki");
    if (metoda === "mail" && !email) return alert("Podaj adres e-mail");
    if (metoda === "poczta" && !adres) return alert("Podaj adres korespondencyjny");

    try {
      await axios.post(`http://localhost:5001/api/zlecenia/${zlecenieId}/wyslij-dokumenty`, {
        email: metoda === "mail" ? email : null,
        adres: metoda === "poczta" ? adres : null,
      });
      
      // 📩 Jeśli wpisano maila – zaktualizuj go też w trasie
      if (metoda === "mail" && email) {
        await axios.patch(`http://localhost:5001/api/oficjalne_trasy/${zlecenieId}`, {
          email,
          kto: spedytor || "system",
          akcja: "autouzupełnienie e-mail z formy wysyłki"
        });
      }
      
      onZapisz();
      onClose();
      
    } catch (err) {
      console.error("Błąd zapisu formy wysyłki:", err);
      alert("❌ Błąd zapisu formy wysyłki");
    }
  };

  const handleZapytanie = () => {
    onClose();
    onZapytanie();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-xl">
        <h3 className="text-xl font-bold mb-4">📄 Forma wysyłki dokumentów</h3>

        <label className="block mb-2">
          <input type="radio" name="metoda" value="mail" onChange={(e) => setMetoda(e.target.value)} /> 📧 Wyślij mailem
        </label>
        {metoda === "mail" && (
          <input
            type="email"
            className="border p-2 w-full mb-4"
            placeholder="Adres e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <label className="block mb-2">
          <input type="radio" name="metoda" value="poczta" onChange={(e) => setMetoda(e.target.value)} /> 📬 Wyślij pocztą
        </label>
        {metoda === "poczta" && (
          <textarea
            className="border p-2 w-full mb-4"
            placeholder="Adres do wysyłki"
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
          />
        )}

        <label className="block mt-3">
          <input type="radio" name="metoda" value="nie_wiem" onChange={(e) => setMetoda(e.target.value)} /> ❓ Nie wiem – wyślij zapytanie do kontrahenta
        </label>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">Anuluj</button>
          {metoda === "nie_wiem" ? (
            <button onClick={handleZapytanie} className="bg-blue-600 text-white px-4 py-2 rounded">📩 Wyślij zapytanie</button>
          ) : (
            <button onClick={handleZapisz} className="bg-green-600 text-white px-4 py-2 rounded">💾 Zapisz</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalFormaWysylki;
