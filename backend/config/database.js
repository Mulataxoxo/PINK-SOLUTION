const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Połączenie z bazą
const db = new sqlite3.Database('./database.sqlite', (err) => {


    if (err) {
        console.error('Błąd połączenia z bazą danych:', err.message);
    } else {
        console.log('Połączono z bazą SQLite');
    }
});

// Tworzenie tabeli użytkowników
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,  -- spedytor, kierowca, biuro, kadry
            pin TEXT, -- PIN dla spedytorów i kierowców
            password TEXT  -- Hasło dla biura i kadr
        )
    `);
});

// Dodawanie użytkowników, jeśli tabela jest pusta
db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (row.count === 0) {
        const users = [
            { name: "Viktoria", role: "spedytor", pin: "1111", password: null },
            { name: "Andrii", role: "spedytor", pin: "1234", password: null },
            { name: "Maria", role: "spedytor", pin: "6666", password: null },
            { name: "Kiryl", role: "spedytor", pin: "9999", password: null },
            { name: "Alex", role: "biuro", pin: null, password: "Q1q2q3q4!!" },
            { name: "Lesia", role: "biuro", pin: null, password: "Q1q2q3q4!!" },
            { name: "Oliwka", role: "kadry", pin: null, password: "Q1q2q3q4!!" },
            { name: "Vitalii", role: "kadry", pin: null, password: "Q1q2q3q4!!" }
        ];

        // Tworzenie tabeli spalanie (jeśli nie istnieje)
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS spalanie (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_samochodu INTEGER NOT NULL,
            miesiac INTEGER NOT NULL,
            rok INTEGER NOT NULL,
            srednie_spalanie REAL NOT NULL,
            edytowal TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_samochodu) REFERENCES samochody(id)
        )
    `);
    console.log("Tabela 'spalanie' została utworzona (jeśli nie istniała).");
});

// Tworzenie tabeli przydzielonych samochodów (jeśli nie istnieje)
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS przydzielone_samochody (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_samochodu TEXT NOT NULL,
            spedytor TEXT,
            status TEXT DEFAULT 'wolny', -- 'wolny', 'przydzielony'
            FOREIGN KEY (spedytor) REFERENCES users(name)
        )
    `);
    console.log("Tabela 'przydzielone_samochody' została utworzona (jeśli nie istniała).");
});


        // Lista kierowców Graal i Grand z PIN-ami
        const drivers = [
            { name: "FZ3909R", role: "kierowca", pin: "2471" },
            { name: "WGM2833F", role: "kierowca", pin: "3952" },
            { name: "FZ8606R", role: "kierowca", pin: "5813" },
            { name: "TK326AV", role: "kierowca", pin: "9238" },
            { name: "TKI4674K", role: "kierowca", pin: "1469" },
            { name: "FZ1936S", role: "kierowca", pin: "3725" },
            { name: "FZ2014S", role: "kierowca", pin: "6594" },
            { name: "WPR8501P", role: "kierowca", pin: "8047" },
            { name: "WPR8502P", role: "kierowca", pin: "2176" },
            { name: "WPR8503P", role: "kierowca", pin: "9352" },
            { name: "WPR8504P", role: "kierowca", pin: "6083" },
            { name: "FZ0295S", role: "kierowca", pin: "4521" },
            { name: "FZ0296S", role: "kierowca", pin: "1387" },
            { name: "FZ3611S", role: "kierowca", pin: "7649" },
            { name: "FZ3648S", role: "kierowca", pin: "2358" },
            { name: "FZ3631S", role: "kierowca", pin: "9476" },
            { name: "FZ4404S", role: "kierowca", pin: "5243" },
            { name: "FZ9893S", role: "kierowca", pin: "8735" },
            { name: "FZ0414T", role: "kierowca", pin: "3128" },
            { name: "FZ0691T", role: "kierowca", pin: "5762" },
            { name: "FZ0692T", role: "kierowca", pin: "8491" },
            { name: "WGM1642G", role: "kierowca", pin: "3621" },
            { name: "FZ5217S", role: "kierowca", pin: "8472" },
            { name: "FZ0291S", role: "kierowca", pin: "9134" },
            { name: "FZ0292S", role: "kierowca", pin: "2748" },
            { name: "FZ0293S", role: "kierowca", pin: "5893" },
            { name: "FZ0294S", role: "kierowca", pin: "4362" },
            { name: "FZ0523S", role: "kierowca", pin: "1298" },
            { name: "FZ0612S", role: "kierowca", pin: "3457" },
            { name: "FZ0613S", role: "kierowca", pin: "7624" },
            { name: "FZ3609S", role: "kierowca", pin: "9275" },
            { name: "FZ4346S", role: "kierowca", pin: "5128" },
            { name: "FZ4308S", role: "kierowca", pin: "6894" },
            { name: "FZ4317S", role: "kierowca", pin: "1573" },
            { name: "FZ4405S", role: "kierowca", pin: "8265" },
            { name: "FZ9892S", role: "kierowca", pin: "3984" },
            { name: "FZ0413T", role: "kierowca", pin: "2437" },
            { name: "FZ0569T", role: "kierowca", pin: "6741" },
            { name: "FZ0570T", role: "kierowca", pin: "9513" },
            { name: "FZ0739T", role: "kierowca", pin: "3285" },
            { name: "FZ0740U", role: "kierowca", pin: "7826" },
            { name: "FZ5474U", role: "kierowca", pin: "6159" }
        ];

        const stmt = db.prepare("INSERT INTO users (name, role, pin, password) VALUES (?, ?, ?, ?)");

        [...users, ...drivers].forEach(user => {
            const hashedPassword = user.password ? bcrypt.hashSync(user.password, 10) : null;
            stmt.run(user.name, user.role, user.pin, hashedPassword);
        });

        stmt.finalize();
        console.log("Dodano domyślnych użytkowników i kierowców Graal + Grand.");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS brudnolist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spedytorId TEXT NOT NULL,
            dojazd TEXT,
            zaladunek TEXT,
            rozladunek TEXT,
            przystanki TEXT,  -- Zapiszemy jako JSON
            trasa TEXT,
            kwota REAL,
            oplatyDrogowe REAL,
            kosztHotelu REAL,
            distance REAL,
            duration REAL
        )
    `);
    console.log("Tabela 'brudnolist' została utworzona (jeśli nie istniała).");
});

// Dodanie kolumny brudnolistId do tabeli users, jeśli jeszcze nie istnieje
db.serialize(() => {
    db.run(`ALTER TABLE users ADD COLUMN brudnolistId INTEGER`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("❌ Błąd dodawania kolumny brudnolistId:", err.message);
        } else {
            console.log("✅ Kolumna brudnolistId dodana lub już istnieje");
        }
    });

    // Aktualizacja użytkowników o konkretne numery brudnolisty
    const updateStmt = db.prepare(`UPDATE users SET brudnolistId = ? WHERE name = ?`);

    const usersBrudnolistIds = [
        { name: "Viktoria", id: 1 },
        { name: "Maria", id: 2 },
        { name: "Andrii", id: 3 },
        { name: "Kiryl", id: 4 },
        { name: "Alex", id: 5 }, // Biuro
        { name: "Lesia", id: 5 }, // Biuro
        { name: "Oliwka", id: 5 }, // Kadry
        { name: "Vitalii", id: 5 }  // Kadry
    ];

    usersBrudnolistIds.forEach(user => {
        updateStmt.run(user.id, user.name, (err) => {
            if (err) {
                console.error(`❌ Błąd przypisania brudnolistId dla ${user.name}:`, err.message);
            } else {
                console.log(`✅ Ustawiono brudnolistId ${user.id} dla ${user.name}`);
            }
        });
    });

    updateStmt.finalize();
});

db.run(`
    CREATE TABLE IF NOT EXISTS zapytania_wysylkowe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_zlecenia INTEGER,
      token TEXT,
      email TEXT,
      data TEXT,
      status TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS raporty_serwisowe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rejestracja TEXT NOT NULL,
      data TEXT,
      przebieg INTEGER,
      olej INTEGER DEFAULT 0,
      filtr_powietrza INTEGER DEFAULT 0,
      filtr_paliwa INTEGER DEFAULT 0,
      opis TEXT
    )
  `);
  


module.exports = db;
