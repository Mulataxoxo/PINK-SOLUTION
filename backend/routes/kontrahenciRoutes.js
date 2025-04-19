
const express = require("express");
const router = express.Router();
const db = require("../config/database");

// 🔍 Pobierz wszystkich kontrahentów
router.get("/", (req, res) => {
  db.all("SELECT * FROM kontrahenci ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("❌ Błąd pobierania kontrahentów:", err);
      return res.status(500).json({ error: "Błąd bazy danych" });
    }
    res.json(rows);
  });
});

// ➕ Dodaj nowego kontrahenta
router.post("/", (req, res) => {
  const {
    nazwa, nip, regon, krs,
    adres_rejestrowy, adres_korespondencyjny,
    email, telefon, uwagi
  } = req.body;

  const sql = `INSERT INTO kontrahenci
    (nazwa, nip, regon, krs, adres_rejestrowy, adres_korespondencyjny, email, telefon, uwagi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    nazwa, nip, regon, krs,
    adres_rejestrowy, adres_korespondencyjny,
    email, telefon, uwagi
  ], function (err) {
    if (err) {
      console.error("❌ Błąd dodawania kontrahenta:", err);
      return res.status(500).json({ error: "Nie można dodać kontrahenta" });
    }
    res.json({ message: "✅ Kontrahent dodany", id: this.lastID });
  });
});

// 🗑️ Usuń kontrahenta
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM kontrahenci WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("❌ Błąd usuwania kontrahenta:", err);
      return res.status(500).json({ error: "Nie można usunąć kontrahenta" });
    }
    res.json({ message: "🗑️ Kontrahent usunięty" });
  });
});

module.exports = router;