import React, { useState } from "react";
import axios from "axios";
import Tesseract from "tesseract.js";

const PanelNadawca = () => {
  const NADAWCA = {
    nazwa: "Grand spółka z ograniczoną odpowiedzialnością",
    adres: "Łężyca-Chabrowa 6/1",
    miasto: "Zielona Góra",
    kod: "66-016",
    nip: "9731073283",
    telefon: "123456789",
    email: "biuro@firma.pl"
  };

  const [nip, setNip] = useState("");
  const [dataNadania, setDataNadania] = useState(new Date().toISOString().split("T")[0]);

  const [danePrzesylki, setDanePrzesylki] = useState({
    odbiorca: "",
    ulica: "",
    numer_domu: "",
    numer_lokalu: "",
    kod: "",
    miasto: "",
    telefon: "",
    email: "",
    masa: "1.000",
    format: "S",
    wartosc: "0.00",
    uslugi: {
      potwierdzenie: false,
      doręczenieWlasne: true,
      niestandard: false,
    },
    skrytka_pocztowa: false,
    uwagi: ""
  });
  

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name.startsWith("uslugi.")) {
      const key = name.split(".")[1];
      setDanePrzesylki(prev => ({
        ...prev,
        uslugi: { ...prev.uslugi, [key]: checked }
      }));
    } else {
      setDanePrzesylki(prev => ({ ...prev, [name]: value }));
    }
  };

  const szukajKontrahenta = async () => {
    if (!nip) return alert("Wpisz NIP");
  
    try {
      console.log("👉 Szukam kontrahenta po NIP:", nip);
      const res = await axios.get(`http://localhost:5001/api/rejestr/${nip}`);
      console.log("✅ Dane z backendu:", res.data);
  
      const k = res.data.company;
      const kod = k.address.match(/\d{2}-\d{3}/)?.[0] || "";
      const miasto = k.address.replace(/\d{2}-\d{3}/, "").trim().split(",").pop()?.trim() || "";
  
      const ulicaPelna = k.address.replace(/\d{2}-\d{3}/, "").trim().split(",")[0] || "";
      const dopasowanie = ulicaPelna.match(/(.+?)\s(\d+[A-Z]?)(?:\/(\d+))?/);
  
      setDanePrzesylki(prev => ({
        ...prev,
        odbiorca: k.name,
        ulica: dopasowanie?.[1] || "",
        numer_domu: dopasowanie?.[2] || "",
        numer_lokalu: dopasowanie?.[3] || "",
        kod,
        miasto,
        telefon: k.telefon || "",
        email: k.email || ""
      }));
  
    

    } catch (err) {
      console.error("❌ Błąd wyszukiwania:", err);
      alert("Nie znaleziono kontrahenta");
    }
  };

  const nadajSOAP = async () => {
    try {
        const payload = {
            nadawca: NADAWCA,
            przesylka: {
              ...danePrzesylki,
              adres: `${danePrzesylki.ulica} ${danePrzesylki.numer_domu}${danePrzesylki.numer_lokalu ? '/' + danePrzesylki.numer_lokalu : ''}`
            },
            dataNadania
          };
          
        console.log("📦 Payload do SOAP:", JSON.stringify(payload, null, 2));          
  
      const res = await axios.post("http://localhost:5001/api/pocztex/soap/nadaj", payload);
      alert("📦 SOAP Nadanie OK! Zwrócono:\n" + JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error("❌ Błąd SOAP:", err);
      alert("❌ Błąd SOAP");
    }
  };
  

  const nadaj = async () => {
    try {
      const payload = {
        nadawca: NADAWCA,
        przesylka: {
            ...danePrzesylki,
            adres: `${danePrzesylki.ulica} ${danePrzesylki.numer_domu}${danePrzesylki.numer_lokalu ? '/' + danePrzesylki.numer_lokalu : ''}`
          }
          
      };
      const res = await axios.post("http://localhost:5001/api/pocztex/nadaj", payload);

      alert("📦 Przesyłka nadana! ID: " + res.data.id);
    } catch (err) {
      console.error(err);
      alert("❌ Błąd nadania przesyłki");
    }
  };

  const handleScanImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const { data: { text } } = await Tesseract.recognize(file, "pol");
    const linie = text.split("\n").map(l => l.trim()).filter(Boolean);
    const kod = text.match(/\d{2}-\d{3}/)?.[0] || "";
    const miasto = linie.find(l => l.includes(kod))?.replace(kod, "").trim() || "";
    const ulicaPelna = linie.find(l => /\d{2}-\d{3}/.test(l)) || "";
  
    const ulicaDopasuj = ulicaPelna.replace(kod, "").trim().match(/(.+?)\s(\d+[A-Z]?)(?:\/(\d+))?/);
  
    setDanePrzesylki(prev => ({
      ...prev,
      kod,
      miasto,
      ulica: ulicaDopasuj?.[1] || "",
      numer_domu: ulicaDopasuj?.[2] || "",
      numer_lokalu: ulicaDopasuj?.[3] || ""
    }));
  };
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📦 Nadawca Elektroniczny</h2>

      <div className="flex gap-4 mb-4">
        <input placeholder="🔍 NIP odbiorcy" value={nip} onChange={(e) => setNip(e.target.value)} className="border p-2" />
        <button onClick={szukajKontrahenta} className="bg-blue-600 text-white px-4 py-2 rounded">Szukaj</button>
        <input type="file" accept="image/*" onChange={handleScanImage} className="p-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input name="odbiorca" placeholder="Nazwa odbiorcy" value={danePrzesylki.odbiorca} onChange={handleChange} className="border p-2" />
        <input name="ulica" placeholder="Ulica" value={danePrzesylki.ulica} onChange={handleChange} className="border p-2" />
<div className="flex gap-2">
  <input name="numer_domu" placeholder="Numer domu" value={danePrzesylki.numer_domu} onChange={handleChange} className="border p-2 w-1/2" />
  <input name="numer_lokalu" placeholder="Numer lokalu" value={danePrzesylki.numer_lokalu} onChange={handleChange} className="border p-2 w-1/2" />
</div>
<div className="flex gap-2">
  <input name="kod" placeholder="Kod pocztowy" value={danePrzesylki.kod} onChange={handleChange} className="border p-2 w-1/2" />
  <input name="miasto" placeholder="Miejscowość" value={danePrzesylki.miasto} onChange={handleChange} className="border p-2 w-1/2" />
</div>
<label><input type="checkbox" name="skrytka_pocztowa" checked={danePrzesylki.skrytka_pocztowa} onChange={handleChange} /> Skrytka pocztowa</label>
        <input name="telefon" placeholder="Telefon" value={danePrzesylki.telefon} onChange={handleChange} className="border p-2" />
        <input name="masa" placeholder="Masa (kg)" value={danePrzesylki.masa} onChange={handleChange} className="border p-2" />
        <input name="wartosc" placeholder="Wartość [zł]" value={danePrzesylki.wartosc} onChange={handleChange} className="border p-2" />
        <select name="format" value={danePrzesylki.format} onChange={handleChange} className="border p-2">
          <option value="S">S</option>
          <option value="M">M</option>
        </select>
        <label><input type="checkbox" name="uslugi.potwierdzenie" checked={danePrzesylki.uslugi.potwierdzenie} onChange={handleChange} /> Potwierdzenie odbioru</label>
        <label><input type="checkbox" name="uslugi.doręczenieWlasne" checked={danePrzesylki.uslugi.doręczenieWlasne} onChange={handleChange} /> Do rąk własnych</label>
        <label><input type="checkbox" name="uslugi.niestandard" checked={danePrzesylki.uslugi.niestandard} onChange={handleChange} /> Niestandardowa</label>
        <textarea name="uwagi" placeholder="Uwagi / Instrukcje" value={danePrzesylki.uwagi} onChange={handleChange} className="border p-2 col-span-2" />
      </div>
      <div className="mt-4">
  <label className="block mb-1 font-semibold">📅 Planowana data nadania:</label>
  <input
    type="date"
    value={dataNadania}
    onChange={(e) => setDataNadania(e.target.value)}
    className="border px-2 py-1 rounded"
  />
</div>

      <button onClick={nadajSOAP} className="bg-purple-600 text-white px-6 py-2 rounded mt-6 ml-4">
  ⚙️ Nadaj przez SOAP
</button>

    </div>
  );
};

export default PanelNadawca;