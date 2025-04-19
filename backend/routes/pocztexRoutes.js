const express = require("express");
const router = express.Router();
const axios = require("axios");
const soap = require("soap");
const path = require("path");



require("dotenv").config();
const uuid = require("uuid");
const WSDL_PATH = path.resolve(__dirname, "../soap/en.wsdl");





const EN_LOGIN = process.env.EN_LOGIN;
const EN_PASSWORD = process.env.EN_PASSWORD;

router.post("/soap/bufor/create", async (req, res) => {
    console.log("➡️ Ładowanie WSDL z:", WSDL_PATH);

    soap.createClient(WSDL_PATH, {
        overrideRootElement: {
          namespace: "tns",
          xmlnsAttributes: [{
            name: "xmlns:xsi",
            value: "http://www.w3.org/2001/XMLSchema-instance"
          }, {
            name: "xmlns:xsd",
            value: "http://www.w3.org/2001/XMLSchema"
          }]
        }
      }, (err, client) => {
      
      if (err) {
        console.error("❌ Błąd klienta SOAP:", err);
        return res.status(500).json({ error: "SOAP client error" });
      }
  
      // ✅ tutaj jest autoryzacja
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
      client.setEndpoint("https://e-nadawca.poczta-polska.pl/websrv/en.php");

      const today = new Date().toISOString().split("T")[0];
  
      const args = {
        bufor: [{
          idKarta: 902793,
          dataNadania: {
            $value: today,
            $attributes: { "xsi:type": "xsd:date" }
          }
        }]
      };
  
      console.log("📦 BUFOR payload:", JSON.stringify(args, null, 2));
      console.log("➡️ Data nadania:", args.bufor[0].dataNadania);
      
      
  
      client.createEnvelopeBufor(args, (err, result) => {
        if (err) {
          console.error("❌ Błąd tworzenia bufora:", err.body || err);
          return res.status(500).json({ error: "createEnvelopeBufor failed", details: err.body || err.message });
        }
        console.log("📥 result.error:", JSON.stringify(result.error, null, 2));

        console.log("✅ BUFOR OK:", result);
        res.json(result);
      });
    });
  });
  
  // /soap/profil/list
  router.get("/soap/profil/list", async (req, res) => {
    soap.createClient(WSDL_PATH, {
      wsdl_headers: {
        Authorization: "Basic " + Buffer.from(`${EN_LOGIN}:${EN_PASSWORD}`).toString("base64")
      }
    }, (err, client) => {
      if (err) {
        console.error("❌ Błąd klienta SOAP:", err);
        return res.status(500).json({ error: "SOAP client error" });
      }
  
      client.getProfilList({}, (err, result) => {
        if (err) {
          console.error("❌ Błąd getProfilList:", err);
          return res.status(500).json({ error: "getProfilList failed", details: err.body || err.message });
        }
  
        console.log("📋 Lista profili:", result);
        res.json(result);
      });
    });
  });
  


  router.post("/soap/nadaj", async (req, res) => {
    console.log("▶️ BODY:", req.body);
    const { nadawca, przesylka } = req.body;
  
    // Tworzenie klienta SOAP
    soap.createClient(WSDL_PATH, {
        overrideRootElement: {
          namespace: "tns",
          xmlnsAttributes: [{
            name: "xmlns:xsi",
            value: "http://www.w3.org/2001/XMLSchema-instance"
          }, {
            name: "xmlns:xsd",
            value: "http://www.w3.org/2001/XMLSchema"
          }]
        }
      }, async (err, client) => {
      
      if (err) {
        console.error("❌ Błąd tworzenia klienta SOAP:", err);
        return res.status(500).json({ error: "SOAP client error" });
      }
  
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
  
      
      const dataNadania = req.body.dataNadania || new Date().toISOString().split("T")[0];

      const buforArgs = {
        bufor: [{
          idKarta: 902793,
          urzadNadania: 197550, // 🔐 Zielona Góra z listy urzędów
          dataNadania: {
            $value: dataNadania,
            $attributes: {
              "xsi:type": "xsd:date"
            }
          }
        }]
      };
      
      
       
  
      client.createEnvelopeBufor(buforArgs, (err, buforResult) => {
        console.log("📥 buforResult:", require("util").inspect(buforResult, { depth: 10, colors: true }));


        if (err) {
          console.error("❌ Błąd tworzenia bufora:", err);
          return res.status(500).json({ error: "createEnvelopeBufor failed", details: err.body || err.message });
        }
  
        const idBufor = buforResult.return?.idBufor;
        if (!idBufor) {
          return res.status(500).json({ error: "Brak idBufor w odpowiedzi" });
        }
  
        // 🧪 2. Dodaj przesyłkę do bufora
        const shipmentArgs = {
            przesylki: {
              przesylka: [{
                guid: uuid.v4(), // ← TEGO NIE MA
                masa: parseFloat(przesylka.masa),
                wartosc: parseFloat(przesylka.wartosc),
                rodzaj: "POCZTEX",
                adresat: {
                  nazwa: przesylka.odbiorca,
                  ulica: przesylka.ulica,
                  numerDomu: przesylka.numer_domu,
                  numerLokalu: przesylka.numer_lokalu || "",
                  kodPocztowy: przesylka.kod,
                  miejscowosc: przesylka.miasto,
                  telefon: przesylka.telefon,
                  email: przesylka.email?.trim() || "brak@email.pl"
                }
              }]
            },
            idBufor
          };
          
          

          console.log("📦 shipmentArgs:", JSON.stringify(shipmentArgs, null, 2));
        client.addShipment(shipmentArgs, (err, result) => {
            if (err) {
                console.error("❌ Błąd SOAP addShipment:", err.body || err);
                return res.status(500).json({ error: "SOAP addShipment failed", details: err.body || err.message });
              }
  
          console.log("✅ addShipment OK:", result);
          res.json({ wynik: result, idBufor });
        });
      });
    });
  });



  router.post("/soap/send", async (req, res) => {
    const { idBufor } = req.body;
  
    soap.createClient(WSDL_PATH, {
        overrideRootElement: {
          namespace: "tns",
          xmlnsAttributes: [{
            name: "xmlns:xsi",
            value: "http://www.w3.org/2001/XMLSchema-instance"
          }, {
            name: "xmlns:xsd",
            value: "http://www.w3.org/2001/XMLSchema"
          }]
        }
      }, async (err, client) => {
      
      if (err) return res.status(500).json({ error: "SOAP client error" });
  
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
  
      client.sendEnvelope({ idBufor }, (err, result) => {
        if (err) {
          console.error("❌ Błąd sendEnvelope:", err.body || err);
          return res.status(500).json({ error: "sendEnvelope failed" });
        }
  
        console.log("✅ Bufor zatwierdzony:", result);
        res.json(result);
      });
    });
  });

  router.post("/soap/etykieta", async (req, res) => {
    const { guid, idBufor } = req.body;
  
    soap.createClient(WSDL_PATH, {
        overrideRootElement: {
          namespace: "tns",
          xmlnsAttributes: [{
            name: "xmlns:xsi",
            value: "http://www.w3.org/2001/XMLSchema-instance"
          }, {
            name: "xmlns:xsd",
            value: "http://www.w3.org/2001/XMLSchema"
          }]
        }
      }, async (err, client) => {
      
      if (err) return res.status(500).json({ error: "SOAP client error" });
  
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
  
      client.getAddresLabelByGuid({ "guid": [guid], idBufor }, (err, result) => {
        if (err) {
          console.error("❌ Błąd pobierania etykiety:", err.body || err);
          return res.status(500).json({ error: "getAddresLabel failed" });
        }
  
        const pdfContent = result.content?.[0]?.pdfContent;
        res.json({ pdfContent }); // base64 PDF
      });
    });
  });
  
  router.post("/soap/status", async (req, res) => {
    const { idEnvelope } = req.body;
  
    soap.createClient(WSDL_PATH, {
        overrideRootElement: {
          namespace: "tns",
          xmlnsAttributes: [{
            name: "xmlns:xsi",
            value: "http://www.w3.org/2001/XMLSchema-instance"
          }, {
            name: "xmlns:xsd",
            value: "http://www.w3.org/2001/XMLSchema"
          }]
        }
      }, (err, client) => {
      
      if (err) return res.status(500).json({ error: "SOAP client error" });
  
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
  
      client.getEnvelopeStatus({ idEnvelope }, (err, result) => {
        if (err) {
          console.error("❌ Błąd statusu:", err.body || err);
          return res.status(500).json({ error: "status failed" });
        }
  
        res.json(result);
      });
    });
  });
  
  router.get("/soap/urzedy", async (req, res) => {
    soap.createClient(WSDL_PATH, {
        overrideRootElement: {
          namespace: "tns",
          xmlnsAttributes: [{
            name: "xmlns:xsi",
            value: "http://www.w3.org/2001/XMLSchema-instance"
          }, {
            name: "xmlns:xsd",
            value: "http://www.w3.org/2001/XMLSchema"
          }]
        }
      }, async (err, client) => {
      
      if (err) return res.status(500).json({ error: "SOAP client error" });
  
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
  
      client.getUrzedyNadania({}, (err, result) => {
        if (err) {
          console.error("❌ Błąd getUrzedyNadania:", err.body || err);
          return res.status(500).json({ error: "getUrzedyNadania failed" });
        }
  
        console.log("📬 Lista urzędów nadania:", result);
        res.json(result.return || result);
      });
    });
  });
  




  
// 🔧 TESTOWY ENDPOINT addShipment bez tworzenia bufora
router.post("/soap/test-add-shipment", async (req, res) => {
    const { przesylka } = req.body;
  
    soap.createClient(WSDL_PATH, {
      overrideRootElement: {
        namespace: "tns",
        xmlnsAttributes: [
          { name: "xmlns:xsi", value: "http://www.w3.org/2001/XMLSchema-instance" },
          { name: "xmlns:xsd", value: "http://www.w3.org/2001/XMLSchema" }
        ]
      }
    }, (err, client) => {
      if (err) {
        console.error("❌ Błąd klienta SOAP:", err);
        return res.status(500).json({ error: "SOAP client error" });
      }
  
      client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
      client.setEndpoint("https://e-nadawca.poczta-polska.pl/websrv/en.php");
  
      const shipmentArgs = {
        przesylki: {
          przesylka: [{
            guid: uuid.v4(),
            masa: parseFloat(przesylka.masa || "1.0"),
            wartosc: parseFloat(przesylka.wartosc || "0.0"),
            rodzaj: "POCZTEX",
            adresat: {
              nazwa: przesylka.odbiorca || "Test Firma",
              ulica: przesylka.ulica || "Testowa",
              numerDomu: przesylka.numer_domu || "1",
              numerLokalu: przesylka.numer_lokalu || "",
              kodPocztowy: przesylka.kod || "00-001",
              miejscowosc: przesylka.miasto || "Warszawa",
              telefon: przesylka.telefon || "123456789",
              email: przesylka.email || "test@firma.pl"
            }
          }]
        }
      };
  
      console.log("📦 TEST addShipment payload:", shipmentArgs);
  
      client.addShipment(shipmentArgs, (err, result) => {
        if (err) {
          console.error("❌ Błąd testowego addShipment:", err.body || err);
          return res.status(500).json({ error: "addShipment test failed", details: err.body || err.message });
        }
        console.log("✅ Test addShipment OK:", result);
        res.json({ wynik: result });
      });
    });
  });
  

module.exports = router;


