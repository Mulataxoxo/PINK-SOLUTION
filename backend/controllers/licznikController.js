const db = require("../config/database");

exports.dodajPrzebieg = (req, res) => {
  const { rejestracja, data, przebieg } = req.body;

  db.run(`
    INSERT INTO licznik_od_kierowcy (rejestracja, data, przebieg)
    VALUES (?, ?, ?)
  `, [rejestracja, data, przebieg], function(err) {
    if (err) return res.status(500).json({ error: "Błąd zapisu" });
    res.json({ message: "Przebieg zapisany", id: this.lastID });
  });
};

exports.historiaPrzebiegow = (req, res) => {
  const { rejestracja } = req.params;
  db.all(`
    SELECT * FROM licznik_od_kierowcy
    WHERE rejestracja = ?
    ORDER BY data DESC
    LIMIT 5
  `, [rejestracja], (err, rows) => {
    if (err) return res.status(500).json({ error: "Błąd pobierania historii" });
    res.json(rows);
  });
};
