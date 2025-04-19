const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Pobieranie tras dla danego spedytora
router.get("/brudnolist/:spedytorId", (req, res) => {
    const { spedytorId } = req.params;

    db.all("SELECT * FROM brudnolist WHERE spedytorId = ?", [spedytorId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Błąd pobierania Brudnolisty" });
        res.json(rows);
    });
});

// Dodawanie trasy do brudnolisty z walidacją koordynatów
router.post("/brudnolist", (req, res) => {
    const { spedytorId, dojazd, zaladunek, rozladunek, przystanki, trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration } = req.body;

    // Walidacja koordynatów
    const invalidCoords = przystanki.some(p => p.lat == null || p.lng == null);
    if (invalidCoords) {
        return res.status(400).json({ error: "Wszystkie przystanki muszą mieć koordynaty lat i lng!" });
    }

    const query = `INSERT INTO brudnolist (spedytorId, dojazd, zaladunek, rozladunek, przystanki, trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [spedytorId, dojazd, zaladunek, rozladunek, JSON.stringify(przystanki), trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration], function(err) {
        if (err) return res.status(500).json({ error: "Błąd zapisu w bazie" });
        res.json({ message: "Trasa dodana do Brudnolisty!", id: this.lastID });
    });
});

// Edycja istniejącej trasy w Brudnoliście
router.put("/brudnolist/:id", (req, res) => {
    const { id } = req.params;
    const { dojazd, zaladunek, rozladunek, przystanki, trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration } = req.body;

    // Walidacja koordynatów
    const invalidCoords = przystanki.some(p => p.lat == null || p.lng == null);
    if (invalidCoords) {
        return res.status(400).json({ error: "Wszystkie przystanki muszą mieć koordynaty lat i lng!" });
    }

    const query = `UPDATE brudnolist SET dojazd = ?, zaladunek = ?, rozladunek = ?, przystanki = ?, trasa = ?, kwota = ?, oplatyDrogowe = ?, kosztHotelu = ?, distance = ?, duration = ? WHERE id = ?`;

    db.run(query, [dojazd, zaladunek, rozladunek, JSON.stringify(przystanki), trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration, id], function(err) {
        if (err) return res.status(500).json({ error: "Błąd aktualizacji w bazie" });
        res.json({ message: "Trasa zaktualizowana pomyślnie" });
    });
});

// Usuwanie trasy z brudnolisty
router.delete("/brudnolist/:id", (req, res) => {
    const { id } = req.params;
  
    db.run("DELETE FROM brudnolist WHERE id = ?", [id], function(err) {
      if (err) {
        return res.status(500).json({ error: "Błąd przy usuwaniu trasy" });
      }
      res.json({ message: "Trasa usunięta pomyślnie" });
    });
  });
  

module.exports = router;

