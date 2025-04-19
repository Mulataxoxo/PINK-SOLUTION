import React, { useEffect, useState } from "react";
import axios from "axios";

const PanelSerwisowy = () => {
  const [rejestracja, setRejestracja] = useState("");
  const [auta, setAuta] = useState([]);
  const [historia, setHistoria] = useState([]);
  const [edytowanyId, setEdytowanyId] = useState(null);

  const [nowy, setNowy] = useState({
    data: "",
    przebieg: "",
    olej: false,
    filtr_powietrza: false,
    filtr_paliwa: false,
    opis: ""
  });

  // Pobierz listę pojazdów
  useEffect(() => {
    axios.get("http://localhost:5001/api/samochody").then(res => {
      setAuta(res.data.map(a => a.id_samochodu));
    });
  }, []);

  // Pobierz historię po wybraniu pojazdu
  useEffect(() => {
    if (!rejestracja) return;
    axios.get(`http://localhost:5001/api/serwis/${rejestracja}`).then(res => {
      setHistoria(res.data);
    });
  }, [rejestracja]);

  const zapiszWpis = async () => {
    const wpis = {
      rejestracja,
      ...nowy,
      olej: nowy.olej ? 1 : 0,
      filtr_powietrza: nowy.filtr_powietrza ? 1 : 0,
      filtr_paliwa: nowy.filtr_paliwa ? 1 : 0
    };
  
    if (edytowanyId) {
      await axios.put(`http://localhost:5001/api/serwis/${edytowanyId}`, wpis);
    } else {
      await axios.post("http://localhost:5001/api/serwis", wpis);
    }
  
    setNowy({ data: "", przebieg: "", olej: false, filtr_powietrza: false, filtr_paliwa: false, opis: "" });
    setEdytowanyId(null);
    const aktualna = await axios.get(`http://localhost:5001/api/serwis/${rejestracja}`);
    setHistoria(aktualna.data);
  };
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📘 Panel Serwisowy</h2>
  
      <label>Wybierz pojazd:</label>
      <select value={rejestracja} onChange={(e) => setRejestracja(e.target.value)} className="border p-2 mb-4 w-full">
        <option value="">-- wybierz --</option>
        {auta.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
  
      {rejestracja && (
        <>
          <h3 className="text-xl font-semibold mt-4 mb-2">➕ Nowy wpis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="date" className="border p-2" value={nowy.data} onChange={e => setNowy({ ...nowy, data: e.target.value })} />
            <input type="number" placeholder="Przebieg" className="border p-2" value={nowy.przebieg} onChange={e => setNowy({ ...nowy, przebieg: e.target.value })} />
            <label><input type="checkbox" checked={nowy.olej} onChange={e => setNowy({ ...nowy, olej: e.target.checked })} /> Wymiana oleju</label>
            <label><input type="checkbox" checked={nowy.filtr_powietrza} onChange={e => setNowy({ ...nowy, filtr_powietrza: e.target.checked })} /> Filtr powietrza</label>
            <label><input type="checkbox" checked={nowy.filtr_paliwa} onChange={e => setNowy({ ...nowy, filtr_paliwa: e.target.checked })} /> Filtr paliwa</label>
            <textarea placeholder="Opis czynności" className="border p-2 col-span-1 md:col-span-2" value={nowy.opis} onChange={e => setNowy({ ...nowy, opis: e.target.value })}></textarea>
          </div>
          <button onClick={zapiszWpis} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Zapisz wpis</button>
  
          <h3 className="text-xl font-semibold mt-8 mb-2">📜 Historia serwisowa</h3>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-1 border">Data</th>
                <th className="p-1 border">Przebieg</th>
                <th className="p-1 border">Olej</th>
                <th className="p-1 border">Filtr pow.</th>
                <th className="p-1 border">Filtr paliwa</th>
                <th className="p-1 border">Opis</th>
                <th className="p-1 border">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(historia) && historia.map(row => (
                <tr key={row.id} className="border-b">
                  <td className="p-1 border">{row.data}</td>
                  <td className="p-1 border">{row.przebieg}</td>
                  <td className="p-1 border text-center">{row.olej ? "✔️" : ""}</td>
                  <td className="p-1 border text-center">{row.filtr_powietrza ? "✔️" : ""}</td>
                  <td className="p-1 border text-center">{row.filtr_paliwa ? "✔️" : ""}</td>
                  <td className="p-1 border">{row.opis}</td>
                  <td className="p-1 border text-center">
                    <button
                      onClick={() => {
                        setNowy({
                          data: row.data,
                          przebieg: row.przebieg,
                          olej: !!row.olej,
                          filtr_powietrza: !!row.filtr_powietrza,
                          filtr_paliwa: !!row.filtr_paliwa,
                          opis: row.opis
                        });
                        setEdytowanyId(row.id);
                      }}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={async () => {
                        await axios.delete(`http://localhost:5001/api/serwis/${row.id}`);
                        const aktualna = await axios.get(`http://localhost:5001/api/serwis/${rejestracja}`);
                        setHistoria(aktualna.data);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
  
};

export default PanelSerwisowy;
