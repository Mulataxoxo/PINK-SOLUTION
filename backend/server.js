require('dotenv').config();
const db = require('./config/database');
const express = require('express');
const path = require('path'); // upewnij się, że jest zaimportowany!
const app = express();

app.use('/uploads', (req, res, next) => {
    if (req.url.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  });
  
const cors = require('cors');
const bodyParser = require('body-parser');
const brudnolistRoutes = require("./routes/brudnolistRoutes");
const oficjalneTrasyRoutes = require("./routes/oficjalneTrasyRoutes");
const serwisRoutes = require("./routes/serwisRoutes");
const licznikRoutes = require("./routes/licznikRoutes");

console.log("📅 Serwer startuje z datą:", new Date().toISOString());
console.log("🕒 Strefa czasowa systemu:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("🧪 EN_LOGIN:", process.env.EN_LOGIN);
console.log("🧪 EN_PASSWORD:", process.env.EN_PASSWORD ? "OK" : "Brak!");

app.use(express.static("public")); // ⬅️ to umożliwia wyświetlanie formularza


const kontrahenciRoutes = require('./routes/kontrahenciRoutes');
const wysylkaZapytaniaRoutes = require("./routes/wysylkaZapytaniaRoutes");
const pocztexRoutes = require("./routes/pocztexRoutes");
const axios = require('axios');
const qs = require('querystring');


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/soap', pocztexRoutes);

app.use(oficjalneTrasyRoutes);
app.use("/api", serwisRoutes);
app.use("/api", licznikRoutes);

app.use((req, res, next) => {
    console.log(`📌 Otrzymano żądanie: ${req.method} ${req.url}`);
    next();
});


//api kontrahenci
app.use("/api/kontrahenci", kontrahenciRoutes);

// Obsługa Brudnolisty
app.use("/api", brudnolistRoutes); // 💡 TO BYŁO BRAK!

// Middleware do parsowania JSON
app.use("/", wysylkaZapytaniaRoutes);
// Połączenie z bazą danych
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get('/auth/trans/callback', async (req, res) => {
    const code = req.query.code;  // Otrzymujemy kod autoryzacyjny
  
    if (!code) {
      return res.status(400).send('Brak kodu autoryzacyjnego.');
    }
  
    try {
      // Wymiana kodu na access token
      const response = await axios.post('https://api.trans.eu/v1/oauth/token', qs.stringify({
        client_id: 'YOUR_CLIENT_ID',
        client_secret: 'YOUR_CLIENT_SECRET',
        code: code,
        redirect_uri: 'https://localhost:5001/auth/trans/callback',
        grant_type: 'authorization_code'
      }));
  
      const access_token = response.data.access_token;  // Pobieramy access token
      console.log('Access Token:', access_token);
  
      // Zapisujemy token w sesji lub w bazie
      req.session.access_token = access_token;
  
      res.send('Autoryzacja zakończona sukcesem!');
    } catch (err) {
      console.error('Błąd wymiany kodu na token:', err);
      res.status(500).send('Błąd wymiany kodu na token.');
    }
  });
  
 

// Pobieranie samochodów (dostępnych i przypisanych)
app.get("/api/samochody", (req, res) => {
    console.log("📌 Pobieranie listy samochodów...");
    db.all(`
      SELECT u.name AS id_samochodu, 
       COALESCE(p.spedytor, 'wolny') AS spedytor,
       COALESCE(p.status, 'wolny') AS status

        FROM users u
        LEFT JOIN przydzielone_samochody p ON u.name = p.id_samochodu
        WHERE u.role = 'kierowca'
    `, [], (err, rows) => {
        if (err) {
            console.error("❌ Błąd pobierania samochodów:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("✅ Lista samochodów:", rows);
        res.json(rows);
    });
});

// Pobieranie przypisanych samochodów do spedytora
app.get("/api/samochody/:spedytor", (req, res) => {
    
    const { spedytor } = req.params;
    console.log(`📌 Pobieranie samochodów dla spedytora: ${spedytor}`);
    db.all(`
        SELECT id_samochodu FROM przydzielone_samochody WHERE spedytor = ?
    `, [spedytor], (err, rows) => {
        if (err) {
            console.error("❌ Błąd pobierania samochodów dla spedytora:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ Samochody przypisane do ${spedytor}:`, rows);
        res.json(rows);
    });
});


// Przydzielanie samochodu
app.post("/api/samochody/przydziel", (req, res) => {
    const { id_samochodu, spedytor } = req.body;
    console.log(`📌 Przydzielanie samochodu ${id_samochodu} do ${spedytor}`);
    
    db.run(
        `INSERT INTO przydzielone_samochody (id_samochodu, spedytor, status)
         VALUES (?, ?, 'przydzielony')
         ON CONFLICT(id_samochodu) DO UPDATE SET spedytor = ?, status = 'przydzielony'`,
        [id_samochodu, spedytor, spedytor], 
        function (err) {
            if (err) {
                console.error("❌ Błąd przypisywania samochodu:", err);
                return res.status(500).json({ error: err.message });
            }
            console.log("✅ Samochód przypisany do spedytora!");
            res.json({ message: "Samochód przypisany do spedytora!" });
        }
    );
});

// 📌 2. Nowy osobny endpoint do pobierania WSZYSTKICH zajętych samochodów
app.get("/api/samochody/zajete", (req, res) => {
    db.all(`SELECT id_samochodu FROM przydzielone_samochody WHERE status = 'przydzielony'`, [], (err, rows) => {
        if (err) {
            console.error("❌ Błąd pobierania zajętych samochodów:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Oddanie samochodu
app.post("/api/samochody/oddaj", (req, res) => {
    const { id_samochodu } = req.body;
    console.log(`📌 Oddawanie samochodu ${id_samochodu}`);
    
    db.run(
        "UPDATE przydzielone_samochody SET spedytor = NULL, status = 'wolny' WHERE id_samochodu = ?",
        [id_samochodu],
        function (err) {
            if (err) {
                console.error("❌ Błąd oddawania samochodu:", err);
                return res.status(500).json({ error: err.message });
            }
            console.log("✅ Samochód oddany!");
            res.json({ message: "Samochód oddany" });
        }
    );
});
app.get("/api/rejestr/:nip", async (req, res) => {
    const nip = req.params.nip;
    console.log(`📥 Zapytanie o NIP: ${nip}`);
  
    db.get("SELECT * FROM kontrahenci WHERE nip = ?", [nip], async (err, row) => {
      if (err) {
        console.error("❌ Błąd bazy danych:", err);
        return res.status(500).json({ error: "Błąd bazy danych" });
      }
  
      if (row) {
        console.log("✅ Znaleziono lokalnie:", row.nazwa);
        return res.json({
          company: {
            name: row.nazwa,
            nip: row.nip,
            regon: row.regon,
            address: row.adres_korespondencyjny || row.adres_rejestrowy || "",
            email: row.email,
            telefon: row.telefon
          }
        });
      }
  
      const formatDate = () => {
        const d = new Date();
        return d.toISOString().split("T")[0];
      };
      
  
      const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${formatDate()}`;
      console.log("🌐 Zapytanie do MF:", url);
      console.log("🔥 FINALNY URL DO MF:", url);

  
      try {
        const response = await axios.get(url);
        const result = response.data;
        console.log("📦 Wynik z MF:", result);
  
        const podmiot = result?.result?.subject;
  
        if (!podmiot || !podmiot.name) {
          console.warn("⚠️ Brak danych podmiotu lub brak nazwy");
          return res.status(404).json({ error: "Nie znaleziono danych o podmiocie." });
        }
  
        console.log("✅ Podmiot z MF:", podmiot.name);
  
        const adres = podmiot.workingAddress || podmiot.residenceAddress || "";
  
        const insertQuery = `
          INSERT INTO kontrahenci (nazwa, nip, regon, krs, adres_rejestrowy, adres_korespondencyjny)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
  
        db.run(insertQuery, [
          podmiot.name,
          podmiot.nip,
          podmiot.regon,
          podmiot.krs,
          adres,
          adres
        ], function (err) {
          if (err) {
            console.error("❌ Błąd zapisu kontrahenta:", err.message);
          } else {
            console.log(`✅ Kontrahent zapisany do bazy: ${podmiot.name}`);
          }
        });
  
        return res.json({
          company: {
            name: podmiot.name,
            nip: podmiot.nip,
            regon: podmiot.regon,
            address: adres
          }
        });
      } catch (err) {
        console.error("❌ Błąd zapytania do MF:", err.message);
        return res.status(500).json({ error: "Błąd zapytania do MF" });
      }
    });
  });
  
   
  
  

// Uruchomienie serwera
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Serwer działa na porcie ${PORT}`);
});

app.get('/api/trasy/:id', (req, res) => {
    const id = req.params.id;
    console.log(`📌 Otrzymane ID trasy: ${id}`);

    db.get(`SELECT * FROM oficjalne_trasy WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error("❌ Błąd pobierania trasy:", err);
            return res.status(500).json({ error: "Błąd pobierania trasy" });
        } else if (!row) {
            console.log("🚨 Trasa nie znaleziona w bazie!");
            return res.status(404).json({ error: "Nie znaleziono trasy" });
        } else {
            console.log("✅ Trasa znaleziona:", row);
            res.json(row);
        }
    });
});



app.post("/api/trasy/:id/pozycja", (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.body;

    db.run(
        `UPDATE oficjalne_trasy SET lat_kierowca=?, lng_kierowca=? WHERE id=?`,
        [lat, lng, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Lokalizacja kierowcy zaktualizowana" });
        }
    );
});


app.get("/api/trasy/:id/pozycja", (req, res) => {
    const { id } = req.params;

    db.get(`SELECT lat_kierowca, lng_kierowca FROM oficjalne_trasy WHERE id=?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.get('/auth/trans', (req, res) => {
    const client_id = 'YOUR_CLIENT_ID';
    const redirect_uri = 'https://localhost:5001/auth/trans/callback';
    const url = `https://api.trans.eu/v1/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`;
    res.redirect(url);  // przekierowanie do logowania
  });
  


  

const driverRoutes = require('./routes/driverRoutes');
app.use('/api', driverRoutes);

app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
