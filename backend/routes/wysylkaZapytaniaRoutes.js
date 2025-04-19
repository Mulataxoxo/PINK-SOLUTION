const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const sendMail = require("../mailer");
const path = require("path");

// Wysyłka zapytania do kontrahenta
router.post("/api/zlecenia/:id/zapytanie", async (req, res) => {
  const { id } = req.params;
  const { email, wyslanePrzez } = req.body;

  const token = uuidv4();
  const link = `https://twojadomena.pl/formularz/${token}`;

  try {
    const zlecenie = await db.get("SELECT * FROM oficjalne_trasy WHERE id = ?", [id]);
    if (!zlecenie) return res.status(404).json({ error: "Zlecenie nie istnieje" });

    await db.run(
      `INSERT INTO zapytania_wysylkowe (id_zlecenia, token, email, data, status)
       VALUES (?, ?, ?, datetime('now'), ?)`,
      [id, token, email, "oczekujące"]
    );

    const html = `
      <p>Dzień dobry,</p>
      <p>Użytkownik <strong>${wyslanePrzez}</strong> prosi o potwierdzenie, w jaki sposób możemy dostarczyć dokumenty:</p>
      <p><a href="${link}" style="font-size:16px; padding:10px 16px; background:#007bff; color:white; text-decoration:none; border-radius:6px">📝 Otwórz formularz odpowiedzi</a></p>
    `;

    await sendMail(email, "Prośba o potwierdzenie formy dostarczenia dokumentów", html);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd wysyłki zapytania:", err);
    res.status(500).json({ error: "Błąd wysyłki zapytania" });
  }
});

// Serwowanie formularza (GET)
router.get("/formularz/:token", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/formularz.html"));
});

// Odbiór odpowiedzi kontrahenta (POST)
router.post("/formularz/:token/odpowiedz", async (req, res) => {
  const { token } = req.params;
  const { email, adres, metoda } = req.body;

  try {
    const entry = await db.get("SELECT * FROM zapytania_wysylkowe WHERE token = ?", [token]);
    if (!entry) return res.status(404).json({ error: "Zapytanie nie istnieje" });

    let adnotacja = [];
    if (metoda.includes("mail")) adnotacja.push("MAIL: " + email);
    if (metoda.includes("poczta")) adnotacja.push("POCZTA: " + adres);

    await db.run(`
      UPDATE oficjalne_trasy
      SET adnotacje = COALESCE(adnotacje, '') || ?
      WHERE id = ?
    `, ["\nWYSYŁKA: " + adnotacja.join(" | "), entry.id_zlecenia]);

    await db.run(`UPDATE zapytania_wysylkowe SET status = ? WHERE token = ?`, ["zrealizowane", token]);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd zapisu odpowiedzi:", err);
    res.status(500).json({ error: "Błąd zapisu odpowiedzi" });
  }
});

module.exports = router;
