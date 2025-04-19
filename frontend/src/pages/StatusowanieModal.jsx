import React, { useState, useEffect } from "react";
import DraggableList from "./DraggableList"; // osobny komponent drag&drop
import GoogleMapTrasa from "./GoogleMapTrasa";




const StatusowanieModal = ({ isOpen, onClose, trasa, brudnolist, onConfirm }) => {
  const [form, setForm] = useState({
    dataZaladunku: "",
    dataRozladunku: "",
    nadawca: "",
    odbiorca: "",
    miejscePrzeznaczenia: trasa.rozladunek || "",
    miejsceZaladunku: trasa.zaladunek || "",
    dokumenty: "",
    infoTowar: "",
    numerStatyczny: "",
    wagaBrutto: "",
    objetosc: "",
    instrukcjeNadawcy: "",
    przewozneUwagi: "",
    przewoznik: "Graal Wit",
    doZaplaty: false,
    wiadomosc: "",
  });

  const [doladunek, setDoladunek] = useState(null);
  const [kolejnoscKodow, setKolejnoscKodow] = useState([]);
  const [pokazDoladunki, setPokazDoladunki] = useState(false);
  const [pokazWiadomosc, setPokazWiadomosc] = useState(false);
 const [samochody, setSamochody] = useState([]);
  const handleField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };
// wybór doładunku
  const wybierzDoladunek = (d) => {
    const parse = (p) => (typeof p === "string" ? JSON.parse(p) : p);

    const przystanki1 = parse(trasa.przystanki);
    const przystanki2 = parse(d.przystanki);
    

    setDoladunek(d);
    const combined = [...przystanki1, ...przystanki2].map((p, i) => ({
        id: `kod-${i}`,
        label: `${(p.typ || '??').slice(0, 2).toUpperCase()}: ${p.adres || 'Brak'}`,
        adres: p.adres,
        typ: p.typ,
        lat: p.lat,
        lng: p.lng
      }));
      
        
      
      setKolejnoscKodow(combined);
      
      
    setPokazDoladunki(false);
  };

  const wypisz2Cmr = () => {
    onConfirm({
      ...form,
      kolejnoscKodow,
      doladunekId: doladunek?.id || null,
      kontynuujZ: { przewoznik: form.przewoznik }
    });
  };
  
  const zatwierdzStatusowanie = () => {
    if (
        !form.pojazd ||
        !form.dataZaladunku ||
        !form.dataRozladunku ||
        !form.nadawca ||
        !form.odbiorca ||
        !form.wagaBrutto
      ) {
        return alert("⚠️ Uzupełnij wszystkie obowiązkowe pola, w tym samochód!");
      }
    const dane = { ...form, kolejnoscKodow, doladunekId: doladunek?.id || null };
    onConfirm(dane);
  };
  useEffect(() => {
    const spedytor = JSON.parse(localStorage.getItem("loggedUser"))?.name;
    if (spedytor) {
      fetch(`http://localhost:5001/api/samochody/${spedytor}`)
        .then(res => res.json())
        .then(data => setSamochody(data.map(s => s.id_samochodu)))
        .catch(err => console.error("❌ Błąd pobierania aut:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!trasa?.przystanki) return;
  
    try {
      const punkty = JSON.parse(trasa.przystanki || "[]");
  
      // Jeśli masz też doladunek
      const doladunekPunkty = doladunek?.przystanki
        ? JSON.parse(doladunek.przystanki)
        : [];
  
      const wszystkie = [...punkty, ...doladunekPunkty];
  
      setKolejnoscKodow(wszystkie);
      console.log("✅ Zbudowano kolejnoscKodow:", wszystkie);
    } catch (err) {
      console.warn("❌ Błąd przetwarzania przystanków:", err);
    }
  }, []);
  
  

  if (!isOpen) return null;

  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Statusowanie trasy</h2>

        <div className="grid grid-cols-2 gap-4">
        {samochody.length > 0 && (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">🚚 Wybierz samochód:</label>
    <select
      className="p-2 border rounded w-full"
      value={form.pojazd || ""}
      onChange={(e) => setForm({ ...form, pojazd: e.target.value })}
    >
      <option value="">-- wybierz --</option>
      {samochody.map((s, i) => (
        <option key={i} value={s}>{s}</option>
      ))}
    </select>
  </div>
)}

          <input name="dataZaladunku" type="date" value={form.dataZaladunku} onChange={handleField} className="p-2 border" required />
          <input name="dataRozladunku" type="date" value={form.dataRozladunku} onChange={handleField} className="p-2 border" required />
          <input name="nadawca" placeholder="Nadawca" value={form.nadawca} onChange={handleField} className="p-2 border" required />
          <input name="odbiorca" placeholder="Odbiorca" value={form.odbiorca} onChange={handleField} className="p-2 border" required />
          <input name="miejscePrzeznaczenia" placeholder="Miejsce przeznaczenia" value={form.miejscePrzeznaczenia} onChange={handleField} className="p-2 border" />
          <input name="miejsceZaladunku" placeholder="Miejsce załadunku" value={form.miejsceZaladunku} onChange={handleField} className="p-2 border" />
          <input name="wagaBrutto" placeholder="Waga brutto (kg)" value={form.wagaBrutto} onChange={handleField} className="p-2 border" required />
          <input name="objetosc" placeholder="Objętość (m3)" value={form.objetosc} onChange={handleField} className="p-2 border" />
        </div>

        <textarea name="dokumenty" placeholder="Załączone dokumenty" value={form.dokumenty} onChange={handleField} className="p-2 border w-full mt-4" />
        <textarea name="infoTowar" placeholder="Info o towarze (cechy, liczba, opakowanie, rodzaj)" value={form.infoTowar} onChange={handleField} className="p-2 border w-full mt-2" />
        <textarea name="numerStatyczny" placeholder="Numer statyczny" value={form.numerStatyczny} onChange={handleField} className="p-2 border w-full mt-2" />
        <textarea name="instrukcjeNadawcy" placeholder="Instrukcje nadawcy" value={form.instrukcjeNadawcy} onChange={handleField} className="p-2 border w-full mt-2" />
        <textarea name="przewozneUwagi" placeholder="Postanowienia odnośnie przewoźnego" value={form.przewozneUwagi} onChange={handleField} className="p-2 border w-full mt-2" />

        <select name="przewoznik" value={form.przewoznik} onChange={handleField} className="p-2 border w-full mt-2">
          <option>Graal Wit</option>
          <option>Grand</option>
        </select>

        <label className="flex items-center mt-2 gap-2">
          <input type="checkbox" name="doZaplaty" checked={form.doZaplaty} onChange={handleField} />
          Do zapłacenia
        </label>

        <hr className="my-4" />

        {!doladunek ? (
          <>
            <button onClick={() => setPokazDoladunki(!pokazDoladunki)} className="bg-blue-500 text-white px-4 py-2 rounded">
              ➕ Doładuj trasę
            </button>
            {pokazDoladunki && (
              <div className="mt-2 space-y-1">
                {brudnolist.filter(b => b.id !== trasa.id).map((b) => (
                  <div key={b.id} className="p-2 border cursor-pointer hover:bg-gray-100" onClick={() => wybierzDoladunek(b)}>
                    {b.zaladunek} ➝ {b.rozladunek}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div>
    <p className="font-semibold mb-2">🧩 Kolejność kodów (przeciągnij):</p>
    <DraggableList items={kolejnoscKodow} setItems={setKolejnoscKodow} />
    <button className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded" onClick={wypisz2Cmr}>✍️ Wypisz 2 CMR</button>
  </div>

  <div>
    <GoogleMapTrasa
      przystanki={kolejnoscKodow}
      avoidTolls={true}
      stawka1={parseFloat(trasa.kwota || 0)}
      stawka2={parseFloat(doladunek?.kwota || 0)}
    />
  </div>
</div>

          </>
        )}

        <hr className="my-4" />

        {!pokazWiadomosc ? (
          <button onClick={() => setPokazWiadomosc(true)} className="text-blue-500 underline">
            ➕ Napisz wiadomość do kierowcy
          </button>
        ) : (
          <textarea name="wiadomosc" placeholder="Wiadomość do kierowcy" value={form.wiadomosc} onChange={handleField} className="p-2 border w-full" />
        )}

        <div className="flex justify-end mt-6 gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded">Anuluj</button>
          <button onClick={zatwierdzStatusowanie} className="px-4 py-2 bg-green-600 text-white rounded">ŁADUJ!</button>
        </div>
      </div>
    </div>
  );
};

export default StatusowanieModal;
