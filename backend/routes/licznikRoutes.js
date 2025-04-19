const express = require("express");
const router = express.Router();
const db = require("../config/database");

// ZAPIS PRZEBIEGU
router.post("/licznik", (req, res) => {
  const { rejestracja, data, przebieg } = req.body;

  console.log("📥 Próba zapisu przebiegu:", { rejestracja, data, przebieg });

  if (!rejestracja || !data || !przebieg) {
    return res.status(400).json({ error: "Brakuje danych" });
  }

  const query = `
    INSERT INTO licznik_od_kierowcy (rejestracja, data, przebieg)
    VALUES (?, ?, ?)
  `;

  db.run(query, [rejestracja, data, przebieg], function (err) {
    if (err) {
      console.error("❌ Błąd zapisu:", err.message);
      return res.status(500).json({ error: "Błąd zapisu", details: err.message });
    }
    res.json({ message: "Dodano przebieg", id: this.lastID });
  });
});

// POBIERANIE HISTORII
router.get("/licznik/:rejestracja", (req, res) => {
  const { rejestracja } = req.params;

  db.all(
    "SELECT * FROM licznik_od_kierowcy WHERE rejestracja = ? ORDER BY data DESC",
    [rejestracja],
    (err, rows) => {
      if (err) {
        console.error("❌ Błąd pobierania:", err.message);
        return res.status(500).json({ error: "Błąd pobierania", details: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
