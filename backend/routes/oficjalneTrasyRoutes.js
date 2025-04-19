const express = require("express");
const router = express.Router();
const controller = require("../controllers/oficjalneTrasyController");
const db = require("../config/database");
router.patch("/api/trasy/:id/historia", controller.zapiszHistorieEtapow);
router.post("/api/oficjalne_trasy", controller.addToOficjalneTrasy);
router.post("/api/trasy/:id/status", controller.zmienStatus);
const multer = require("multer");
const fs = require("fs");

// Tworzenie folderów
["zlecenia", "faktury", "dokumenty", "zdj_z_trasy","inne"].forEach((f) => {
  const dir = `./uploads/${f}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


router.delete("/api/oficjalne_trasy/:id", (req, res) => {
    const { id } = req.params;
  
    const query = `DELETE FROM oficjalne_trasy WHERE id = ?`;
    db.run(query, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: "❌ Błąd przy usuwaniu" });
      }
      res.json({ success: true });
    });
  });
  



router.patch("/api/oficjalne_trasy/:id", async (req, res) => {
    const { id } = req.params;
    const { status, adnotacje, kwota_zlecenia, kto, akcja } = req.body;
  
    const query = `
      UPDATE oficjalne_trasy
      SET 
        status = COALESCE(?, status),
        adnotacje = COALESCE(?, adnotacje),
        kwota_zlecenia = COALESCE(?, kwota_zlecenia)
      WHERE id = ?
    `;
  
    db.run(query, [status, adnotacje, kwota_zlecenia, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
  
      // dopisz wpis do historii (szczegoly)
      db.get(`SELECT szczegoly FROM oficjalne_trasy WHERE id = ?`, [id], (err, row) => {
        if (!row) return res.end();
  
        const historia = JSON.parse(row.szczegoly || "[]");
        historia.push({ status, kto, timestamp: new Date().toISOString(), akcja });
        db.run(`UPDATE oficjalne_trasy SET szczegoly = ? WHERE id = ?`, [JSON.stringify(historia), id]);
      });
  
      res.json({ success: true });
    });
  });

  const dayjs = require("dayjs");

["dzisiaj", "jutro", "wczoraj"].forEach((kiedy) => {
  router.get(`/api/trasy/:pojazd/${kiedy}`, (req, res) => {
    const { pojazd } = req.params;
    let date = dayjs();

    if (kiedy === "jutro") date = date.add(1, "day");
    if (kiedy === "wczoraj") date = date.subtract(1, "day");

    const dateStr = date.format("YYYY-MM-DD");

    const sql = `SELECT * FROM oficjalne_trasy WHERE pojazd = ? AND data_zaladunku = ?`;

    db.get(sql, [pojazd, dateStr], (err, row) => {
      if (err) {
        console.error("❌ Błąd zapytania:", err);
        return res.status(500).json({ error: "Błąd bazy danych" });
      }
      res.json(row || null);

    });
  });
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const typ = req.body.typ;
      console.log("📌 Otrzymany typ dokumentu:", typ); // <-- DODAJ TEN LOG!
      let folder = "inne";
  
      if (typ === "pdf_zlecenie") folder = "zlecenia";
      else if (typ === "pdf_faktura") folder = "faktury";
      else if (typ === "pdf_dokumenty") folder = "dokumenty";
      else if (typ === "pdf_nota") folder = "noty"; 
  
      cb(null, `./uploads/${folder}`);
    },
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  });
  
  const upload = multer({ storage });

  
  router.post("/api/oficjalne_trasy/:id/upload", upload.single("plik"), (req, res) => {
    const typ = req.body.typ || "pdf_zlecenie";
    const filename = req.file.filename;
    const folderMap = {
        pdf_zlecenie: 'zlecenia',
        pdf_faktura: 'faktury',
        pdf_dokumenty: 'dokumenty',
        pdf_nota: 'noty',
        zdjecie: 'zdj_z_trasy'
      };
      
      const folder = folderMap[typ] || 'inne';
      const path = `/uploads/${folder}/${filename}`;
      
  
    // NIE zapisujemy do bazy – tylko odsyłamy info o pliku
    res.json({ message: "📁 Plik zapisany", path, filename });
  });
  // === Wysyłka dokumentów do kontrahenta ===
router.post("/api/zlecenia/:id/wyslij-dokumenty", async (req, res) => {
  const { id } = req.params;
  const { email, adres } = req.body;
  let adnotacja = [];

  try {
    const zlecenie = await db.get("SELECT * FROM oficjalne_trasy WHERE id = ?", [id]);
    if (!zlecenie) return res.status(404).json({ error: "Zlecenie nie znalezione" });

    if (email && zlecenie.pdf_zlecenie) {
      const nodemailer = require("nodemailer");

      const transporter = nodemailer.createTransport({
        host: "smtp.firma.pl", // zmień na swój serwer SMTP
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `GRAND SPEDYCJA <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Zlecenie transportowe",
        text: "W załączeniu przesyłamy dokument zlecenia.",
        attachments: [
          {
            filename: "zlecenie.pdf",
            path: `./public${zlecenie.pdf_zlecenie}`
          }
        ]
      });

      adnotacja.push(`MAIL: ${email}`);
    }

    if (adres) {
      adnotacja.push(`POCZTA: ${adres}`);
    }

    if (adnotacja.length > 0) {
      await db.run(
        "UPDATE oficjalne_trasy SET adnotacje = COALESCE(adnotacje, '') || ? WHERE id = ?",
        ["\nWYSYŁKA: " + adnotacja.join(" | "), id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd wysyłki dokumentów:", err);
    res.status(500).json({ error: "Błąd wysyłki dokumentów" });
  }
});

router.get("/api/oficjalne_trasy", (req, res) => {
  db.all("SELECT * FROM oficjalne_trasy ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("❌ Błąd pobierania oficjalnych tras:", err);
      return res.status(500).json({ error: "Błąd bazy danych" });
    }
    res.json(rows);
  });
});

  

module.exports = router;
