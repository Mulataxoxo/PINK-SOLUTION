const db = require("../config/database");

exports.addToOficjalneTrasy = (req, res) => {
  const { grupa_trasy_id, trasy } = req.body;

  if (!Array.isArray(trasy) || trasy.length === 0) {
    return res.status(400).json({ error: "Brak tras do zapisania" });
  }

  const stmt = db.prepare(`
    INSERT INTO oficjalne_trasy (
      spedytor, pojazd, trasa, przystanki, planowane_km, 
      data_zaladunku, data_rozladunku, adres_zaladunku, adres_rozladunku,
      nadawca, odbiorca, status, dokumenty, szczegoly, grupa_trasy_id,
      dane_formularza
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  trasy.forEach((t) => {
    const timestamp = new Date().toISOString();

    stmt.run([
      t.spedytor || "brak",
      t.pojazd || "brak",
      t.trasa || "nieznana",
      JSON.stringify(t.kolejnoscKodow || []),
      t.planowane_km || 0,
      t.dataZaladunku || null,
      t.dataRozladunku || null,
      t.miejsceZaladunku || "",
      t.miejscePrzeznaczenia || "",
      t.nadawca || "",
      t.odbiorca || "",
      "NOWA",
      JSON.stringify([]), // dokumenty
      JSON.stringify([
        {
          status: "NOWA",
          kto: t.spedytor || "system",
          timestamp
        }
      ]), // szczegoly = historia
      grupa_trasy_id || Date.now().toString(),
      JSON.stringify({
        infoTowar: t.infoTowar || "",
        uwagi: t.przewozneUwagi || "",
        instrukcje: t.instrukcjeNadawcy || "",
        przewoznik: t.przewoznik || "",
        numerStatyczny: t.numerStatyczny || "",
        wagaBrutto: t.wagaBrutto || "",
        objetosc: t.objetosc || ""
      })
    ]);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error("❌ Błąd zapisu tras:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "✅ Trasy zostały zapisane poprawnie" });
  });
};
exports.zapiszHistorieEtapow = (req, res) => {
    const { id } = req.params;
    const { historia } = req.body;
  
    db.run(
      `UPDATE oficjalne_trasy SET historia_etapow = ? WHERE id = ?`,
      [JSON.stringify(historia), id],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: err.message });
        } else {
          res.json({ message: "📌 Historia etapów zapisana" });
        }
      }
    );
  };
  
  exports.zmienStatus = (req, res) => {
    const { id } = req.params;
    let status = req.body.status;
    if (!status) {
      return res.status(400).json({ error: "Brak statusu do zapisania" });
    }
    
if (!status) return res.status(400).json({ error: "Brak statusu do zapisania" });
 // zależnie od multipart
    const timestamp = new Date().toISOString();
  
    db.get(`SELECT szczegoly FROM oficjalne_trasy WHERE id = ?`, [id], (err, row) => {
      if (err || !row) return res.status(500).json({ error: "Brak trasy" });
  
      const historia = JSON.parse(row.szczegoly || "[]");
      historia.push({ status, timestamp });
  
      db.run(
        `UPDATE oficjalne_trasy SET status = ?, szczegoly = ? WHERE id = ?`,
        [status, JSON.stringify(historia), id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: "Status zaktualizowany" });
        }
      );
    });
  };
  exports.zapiszHistorieEtapow = (req, res) => {
    const { id } = req.params;
    const { historia } = req.body;
  
    db.run(
      `UPDATE oficjalne_trasy SET historia_etapow = ? WHERE id = ?`,
      [JSON.stringify(historia), id],
      (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ message: "Historia etapów zapisana" });
      }
    );
  };
  