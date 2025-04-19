const db = require('../config/database');
const multer = require('multer');

// Konfiguracja przesyłania zdjęć
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = "zdj_z_trasy"; // stały folder
    cb(null, `./uploads/${folder}`);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});


const upload = multer({ storage });

// 🟢 Helper: przetwórz trasę i dodaj przystanki jako array
const prepareTrasa = (row) => {
  return {
    ...row,
    przystanki: row?.przystanki ? JSON.parse(row.przystanki) : []
  };
};

// 🔹 Trasa na dziś
exports.getTodayRoute = (req, res) => {
  const auto = req.params.auto;
  const dzisiaj = new Date().toISOString().slice(0, 10);

  db.get(
    `SELECT * FROM oficjalne_trasy WHERE auto=? AND data_zaladunku=?`,
    [auto, dzisiaj],
    (err, row) => {
      if (err) return res.status(500).json({ error: err });
      if (!row) return res.json({});
      res.json(prepareTrasa(row));
    }
  );
};

// 🔹 Wczorajsza
exports.getYesterdayRoute = (req, res) => {
  const auto = req.params.auto;
  const data = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  db.get(
    `SELECT * FROM oficjalne_trasy WHERE auto=? AND data_zaladunku=?`,
    [auto, data],
    (err, row) => {
      if (err) return res.status(500).json({ error: err });
      if (!row) return res.json({});
      res.json(prepareTrasa(row));
    }
  );
};

// 🔹 Jutrzejsza
exports.getTomorrowRoute = (req, res) => {
  const auto = req.params.auto;
  const jutro = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  db.get(
    `SELECT * FROM oficjalne_trasy WHERE auto=? AND data_zaladunku=?`,
    [auto, jutro],
    (err, row) => {
      if (err) return res.status(500).json({ error: err });
      if (!row) return res.json({});
      res.json(prepareTrasa(row));
    }
  );
};

// 🔹 Akceptacja
exports.acceptRoute = (req, res) => {
  const id = req.params.id;
  db.run(
    `UPDATE oficjalne_trasy SET status=? WHERE id=?`,
    ['ZLECENIE PRZYJĘTE PRZEZ KIEROWCĘ', id],
    (err) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ message: "Zlecenie przyjęte przez kierowcę" });
    }
  );
};

// 🔹 Upload zdjęć
exports.uploadDocuments = (req, res) => {
  upload.array('zdjecia')(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });

    const id = req.params.id;
    const files = req.files;
    const rodzaj = req.body.typ;

    db.run(
      `UPDATE oficjalne_trasy SET dokumenty = ? WHERE id = ?`,
      [JSON.stringify({ typ: rodzaj, pliki: files }), id],
      (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ message: "Dokumenty dodane" });
      }
    );
  });
};

exports.saveEtapHistorie = (req, res) => {
  const { id } = req.params;
  const { historia } = req.body;

  db.run(
    `UPDATE oficjalne_trasy SET historia_etapow=? WHERE id=?`,
    [JSON.stringify(historia), id],
    (err) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ message: "Historia etapów zapisana" });
    }
  );
};
