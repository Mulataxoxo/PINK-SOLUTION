const db = require("../config/database");

exports.dodajWpisSerwisowy = (req, res) => {
  const { rejestracja, data, przebieg, olej, filtr_powietrza, filtr_paliwa, opis } = req.body;

  const query = `
    INSERT INTO raporty_serwisowe 
    (rejestracja, data, przebieg, olej, filtr_powietrza, filtr_paliwa, opis)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [rejestracja, data, przebieg, olej, filtr_powietrza, filtr_paliwa, opis], function(err) {
    if (err) return res.status(500).json({ error: "Błąd zapisu do bazy", details: err });
    res.json({ message: "Wpis dodany", id: this.lastID });
  });
};

exports.listaWpisow = (req, res) => {
  const { rejestracja } = req.params;
  db.all("SELECT * FROM raporty_serwisowe WHERE rejestracja = ? ORDER BY data DESC", [rejestracja], (err, rows) => {
    if (err) return res.status(500).json({ error: "Błąd pobierania danych" });
    res.json(rows);
  });
};
exports.usunWpis = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM raporty_serwisowe WHERE id = ?", [id], function(err) {
      if (err) return res.status(500).json({ error: "Błąd usuwania" });
      res.json({ message: "Usunięto wpis" });
    });
  };
  exports.edytujWpis = (req, res) => {
    const { id } = req.params;
    const { data, przebieg, olej, filtr_powietrza, filtr_paliwa, opis } = req.body;
  
    db.run(`
      UPDATE raporty_serwisowe
      SET data = ?, przebieg = ?, olej = ?, filtr_powietrza = ?, filtr_paliwa = ?, opis = ?
      WHERE id = ?
    `, [data, przebieg, olej, filtr_powietrza, filtr_paliwa, opis, id], function(err) {
      if (err) return res.status(500).json({ error: "Błąd aktualizacji" });
      res.json({ message: "Zaktualizowano wpis" });
    });
  };
  