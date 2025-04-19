import React, { useEffect, useState } from "react";
import axios from "axios";
import ModalKontrahent from "./ModalKontrahent";

const PanelKontrahenci = () => {
  const [kontrahenci, setKontrahenci] = useState([]);
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchKontrahenci = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/kontrahenci");
      setKontrahenci(res.data);
    } catch (err) {
      console.error("❌ Błąd pobierania kontrahentów:", err);
    }
  };

  useEffect(() => {
    fetchKontrahenci();
  }, []);

  const dodajKontrahenta = async (dane) => {
    try {
      await axios.post("http://localhost:5001/api/kontrahenci", dane);
      fetchKontrahenci();
    } catch (err) {
      console.error("❌ Błąd zapisu kontrahenta:", err);
    }
  };

  const usunKontrahenta = async (id) => {
    if (!window.confirm("Na pewno usunąć kontrahenta?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/kontrahenci/${id}`);
      fetchKontrahenci();
    } catch (err) {
      console.error("❌ Błąd usuwania kontrahenta:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🧾 Kontrahenci</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          ➕ Dodaj kontrahenta
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Szukaj po nazwie, NIP..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nazwa</th>
            <th className="border p-2">NIP</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Telefon</th>
            <th className="border p-2">Adres korespondencyjny</th>
            <th className="border p-2">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {kontrahenci
            .filter((k) =>
              k.nazwa?.toLowerCase().includes(filter.toLowerCase()) ||
              k.nip?.includes(filter)
            )
            .map((k) => (
              <tr key={k.id} className="text-center">
                <td className="border p-2">{k.nazwa}</td>
                <td className="border p-2">{k.nip}</td>
                <td className="border p-2">{k.email}</td>
                <td className="border p-2">{k.telefon}</td>
                <td className="border p-2">{k.adres_korespondencyjny}</td>
                <td className="border p-2">
                  <button
                    onClick={() => usunKontrahenta(k.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    🗑️ Usuń
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {showModal && (
        <ModalKontrahent
          onClose={() => setShowModal(false)}
          onSave={dodajKontrahenta}
        />
      )}
    </div>
  );
};

export default PanelKontrahenci;
