const db = require("../config/database");


// Dodawanie nowej trasy do Brudnolisty
exports.addToBrudnolist = (req, res) => {
    const { spedytorId, dojazd, zaladunek, rozladunek, przystanki, trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration } = req.body;
    
    const query = `INSERT INTO brudnolist (spedytorId, dojazd, zaladunek, rozladunek, przystanki, trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [spedytorId, dojazd, zaladunek, rozladunek, JSON.stringify(przystanki), trasa, kwota, oplatyDrogowe, kosztHotelu, distance, duration], function(err) {
        if (err) {
            res.status(500).json({ message: "Błąd zapisu w bazie", error: err });
        } else {
            res.json({ message: "Trasa dodana do Brudnolisty!", id: this.lastID });
        }
    });
};

exports.getBrudnolist = (req, res) => {
    const { spedytorId } = req.params;
    db.all(`SELECT * FROM brudnolist WHERE spedytorId = ?`, [spedytorId], (err, rows) => {
        if (err) {
            res.status(500).json({ message: "Błąd pobierania danych", error: err });
        } else {
            res.json(rows.map(row => ({
                ...row,
                przystanki: JSON.parse(row.przystanki) // Konwersja JSON na obiekt
            })));
        }
    });
};
