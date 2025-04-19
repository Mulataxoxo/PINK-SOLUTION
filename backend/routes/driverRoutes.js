const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const db = require('../config/database');


router.post('/trasy/:id/dokumenty', driverController.uploadDocuments);



// Endpointy dla tras kierowców
router.get('/trasy/:auto/dzisiaj', driverController.getTodayRoute);
router.get('/trasy/:auto/wczoraj', driverController.getYesterdayRoute);
router.get('/trasy/:auto/jutro', driverController.getTomorrowRoute);

// Przyjęcie trasy
router.post('/trasy/:id/przyjmij', driverController.acceptRoute);



//oficjalne trasy
router.post("/oficjalne_trasy", (req, res) => {
  const { grupa_trasy_id, trasy } = req.body;

  const stmt = db.prepare(`
    INSERT INTO oficjalne_trasy (
  grupa_trasy_id, pojazd, spedytor, data_zaladunku, data_rozladunku,
  adres_zaladunku, adres_rozladunku, trasa, status, planowane_km,
  komentarz, przystanki, wiadomosc, szczegoly
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

  `);

  for (const t of trasy) {
    stmt.run(
      grupa_trasy_id,
      t.pojazd,
      t.spedytor,
      t.dataZaladunku,
      t.dataRozladunku,
      t.miejsceZaladunku,
      t.miejscePrzeznaczenia,
      t.trasa,
      "ZAŁADOWANA",
      t.planowane_km,
      "",
      JSON.stringify(t.kolejnoscKodow || []),
      t.wiadomosc || "",
      JSON.stringify(t) // 🧠 Zapisz cały formularz!
    );
    
  }

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Trasy zapisane" });
  });
});

router.get("/oficjalne_trasy", (req, res) => {
  db.all(`SELECT * FROM oficjalne_trasy`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
router.patch("/oficjalne_trasy/:id", (req, res) => {
  const { id } = req.params;
  const {
    nr_zlecenia,
    pdf_zlecenie,
    kwota_zlecenia,
    stawka_przeliczona,
    adnotacje,
    kto,
    akcja
  } = req.body;

  // Pobierz aktualną historię
  db.get("SELECT historia FROM oficjalne_trasy WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    let historia = [];
    if (row?.historia) {
      try {
        historia = JSON.parse(row.historia);
      } catch (e) {
        console.warn("❗ Nie udało się sparsować historii:", e.message);
      }
    }

    const now = new Date().toLocaleString("pl-PL");
    historia.push({ kto, akcja, czas: now });

    const stmt = `
      UPDATE oficjalne_trasy
      SET nr_zlecenia = ?, pdf_zlecenie = ?, kwota_zlecenia = ?, stawka_przeliczona = ?,
          adnotacje = ?, historia = ?
      WHERE id = ?
    `;

    db.run(
      stmt,
      [
        nr_zlecenia || null,
        pdf_zlecenie || null,
        kwota_zlecenia || null,
        stawka_przeliczona || null,
        adnotacje || null,
        JSON.stringify(historia),
        id
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Trasa zaktualizowana", zmieniono: this.changes });
      }
    );
  });
});



module.exports = router;
