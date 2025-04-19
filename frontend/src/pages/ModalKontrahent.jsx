import React, { useState } from "react";
import axios from "axios";

const ModalKontrahent = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    nip: "",
    nazwa: "",
    regon: "",
    krs: "",
    adres_rejestrowy: "",
    adres_korespondencyjny: "",
    email: "",
    telefon: "",
    uwagi: ""
  });

  const pobierzZKRS = async () => {
    if (!form.nip) return alert("Wpisz NIP");
  
    try {
      const res = await axios.get(`http://localhost:5001/api/rejestr/${form.nip}`);
      const firma = res.data?.company;
  
      if (!firma) return alert("❌ Nie znaleziono firmy");
  
      setForm((prev) => ({
        ...prev,
        nazwa: firma.name || "",
        regon: firma.regon || "",
        krs: firma.krs || "",
        adres_rejestrowy: firma.address || "",
        adres_korespondencyjny: firma.correspondence_address || firma.address || ""
      }));
    } catch (err) {
        if (err.response?.status === 410) {
          return alert("📛 Podmiot został wykreślony z rejestru – brak danych.");
        }
        console.error("❌ Błąd zapytania:", err);
        alert("Błąd podczas pobierania danych z MF API");
      }
      
  };
  
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const zapisz = () => {
    if (!form.nazwa || !form.nip) return alert("Nazwa i NIP są wymagane");
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">➕ Nowy kontrahent</h2>

        <div className="grid grid-cols-2 gap-4">
          <input name="nip" placeholder="NIP" value={form.nip} onChange={handleChange} className="p-2 border" />
          <button onClick={pobierzZKRS} className="bg-blue-600 text-white rounded px-4 py-2">🔍 Szukaj w KRS</button>

          <input name="nazwa" placeholder="Nazwa firmy" value={form.nazwa} onChange={handleChange} className="p-2 border col-span-2" />
          <input name="krs" placeholder="KRS" value={form.krs} onChange={handleChange} className="p-2 border" />
          <input name="regon" placeholder="REGON" value={form.regon} onChange={handleChange} className="p-2 border" />

          <textarea name="adres_rejestrowy" placeholder="Adres rejestrowy" value={form.adres_rejestrowy} onChange={handleChange} className="p-2 border col-span-2" />
          <textarea name="adres_korespondencyjny" placeholder="Adres korespondencyjny" value={form.adres_korespondencyjny} onChange={handleChange} className="p-2 border col-span-2" />

          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="p-2 border" />
          <input name="telefon" placeholder="Telefon" value={form.telefon} onChange={handleChange} className="p-2 border" />

          <textarea name="uwagi" placeholder="Uwagi" value={form.uwagi} onChange={handleChange} className="p-2 border col-span-2" />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded">Anuluj</button>
          <button onClick={zapisz} className="px-4 py-2 bg-green-600 text-white rounded">💾 Zapisz</button>
        </div>
      </div>
    </div>
  );
};

export default ModalKontrahent;
