const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");

const router = express.Router();

// 🔹 Endpoint do logowania użytkowników
router.post("/login", (req, res) => {
    const { role, name, pin, password } = req.body;

    // Sprawdzenie, czy użytkownik istnieje w bazie
    db.get("SELECT * FROM users WHERE name = ? AND role = ?", [name, role], (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Błąd serwera" });
        }
        if (!user) {
            return res.status(401).json({ error: "Nieprawidłowe dane logowania" });
        }

        // 🔹 Logowanie Spedytorów i Kierowców - PIN
        if (role === "spedytor" || role === "kierowca") {
            if (user.pin === pin) {
                return res.json({ 
                    message: "Logowanie udane", 
                    user: { 
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        brudnolistId: user.brudnolistId
                    } 
                });
                
            } else {
                return res.status(401).json({ error: "Nieprawidłowy PIN" });
            }
        }

        // 🔹 Logowanie Biura i Kadr - Hasło
        if (role === "biuro" || role === "kadry") {
            if (bcrypt.compareSync(password, user.password)) {
                return res.json({ message: "Logowanie udane", user });
            } else {
                return res.status(401).json({ error: "Nieprawidłowe hasło" });
            }
        }

        // 🔹 Logowanie Księgowości - Hasło
        if (role === "ksiegowosc" && password === "Q1q2q3q4!!") {
            return res.json({ message: "Logowanie udane", user });
        }

        return res.status(400).json({ error: "Nieprawidłowa rola użytkownika" });
    });
});

// 🔹 Endpoint do pobierania listy kierowców
router.get("/drivers", (req, res) => {
    db.all("SELECT name FROM users WHERE role = 'kierowca'", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Błąd serwera przy pobieraniu kierowców" });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Brak kierowców w bazie" });
        }
        res.json(rows);
    });
});
// 🔹 Endpoint do pobierania listy użytkowników biura i kadr
router.get("/office-users", (req, res) => {
    db.all("SELECT name FROM users WHERE role IN ('biuro', 'kadry')", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Błąd serwera przy pobieraniu użytkowników" });
        }
        res.json(rows);
    });
});


module.exports = router;

