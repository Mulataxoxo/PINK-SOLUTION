import React, { useState } from "react";
import axios from "axios";

const ModalWysylka = ({ zlecenieId, onClose, onWyslane }) => {
  const [mailChecked, setMailChecked] = useState(false);
  const [pocztaChecked, setPocztaChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [adres, setAdres] = useState("");

  const wyslij = async () => {
    if (!mailChecked && !pocztaChecked) return alert("Wybierz przynajmniej jedną opcję");

    try {
      await axios.post(`http://localhost:5001/api/zlecenia/${zlecenieId}/wyslij-dokumenty`, {
        email: mailChecked ? email : null,
        adres: pocztaChecked ? adres : null,
      });
      onWyslane();
      onClose();
    } catch (err) {
      console.error("❌ Błąd wysyłki dokumentów:", err);
      alert("Błąd podczas wysyłania dokumentów");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-xl">
        <h3 className="text-xl font-bold mb-4">📤 Wyślij dokumenty do kontrahenta</h3>

        <label className="block mb-2">
          <input type="checkbox" checked={mailChecked} onChange={(e) => setMailChecked(e.target.checked)} /> 📧 Wyślij mailem
        </label>
        {mailChecked && (
          <input
            type="email"
            placeholder="Adres e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full mb-3"
          />
        )}

        <label className="block mb-2">
          <input type="checkbox" checked={pocztaChecked} onChange={(e) => setPocztaChecked(e.target.checked)} /> 📬 Wyślij pocztą
        </label>
        {pocztaChecked && (
          <textarea
            placeholder="Adres korespondencyjny"
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
            className="border p-2 w-full mb-3"
          />
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">Anuluj</button>
          <button onClick={wyslij} className="bg-green-600 text-white px-4 py-2 rounded">📨 Wyślij</button>
        </div>
      </div>
    </div>
  );
};

export default ModalWysylka;