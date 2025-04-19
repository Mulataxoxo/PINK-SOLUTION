import React, { useEffect, useState } from "react";
import axios from "axios";

const PanelPrzebieg = () => {
  const [rejestracja, setRejestracja] = useState("");
  const [data, setData] = useState("");
  const [przebieg, setPrzebieg] = useState("");
  const [historia, setHistoria] = useState([]);
 

  const kierowca = JSON.parse(localStorage.getItem("loggedUser"))?.name;

  useEffect(() => {
    if (!kierowca) return;
    setRejestracja(kierowca); // name = rejestracja pojazdu
    pobierzHistorie(kierowca);
  }, [kierowca]);
  

  const pobierzHistorie = (rej) => {
    axios.get(`http://localhost:5001/api/licznik/${rej}`).then(res => {
      console.log("📦 Pobranie historii:", res.data);  // Debugowanie
      setHistoria(res.data);  // Ustawienie stanu historii
    });
  };
  
  const zapisz = async () => {
    await axios.post("http://localhost:5001/api/licznik", {
      rejestracja,
      data,
      przebieg
    });
    setData("");
    setPrzebieg("");
    pobierzHistorie(rejestracja);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📏 Wpisz przebieg</h2>
      <div className="flex flex-col gap-2 w-full md:w-1/2">
        <input type="date" className="border p-2" value={data} onChange={e => setData(e.target.value)} />
        <input type="number" placeholder="Przebieg" className="border p-2" value={przebieg} onChange={e => setPrzebieg(e.target.value)} />
        <button onClick={zapisz} className="bg-blue-600 text-white px-4 py-2 rounded">Zapisz</button>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-2">📜 Ostatnie wpisy</h3>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-1 border">Data</th>
            <th className="p-1 border">Przebieg</th>
          </tr>
        </thead>
        <tbody>
        {Array.isArray(historia) && historia.map((row) => (
  <tr key={row.id} className="border-b">
    <td className="p-1 border">{row.data}</td>
    <td className="p-1 border">{row.przebieg}</td>
  </tr>
))}

        </tbody>
      </table>
    </div>
  );
};

export default PanelPrzebieg;
