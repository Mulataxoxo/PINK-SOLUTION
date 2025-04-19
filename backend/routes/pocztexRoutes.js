const express = require("express");
const router = express.Router();
const soap = require("soap");
const uuid = require("uuid");
require("dotenv").config();

const EN_LOGIN = process.env.EN_LOGIN;
const EN_PASSWORD = process.env.EN_PASSWORD;

const WSDL_PATH = "https://en-testwebapi.poczta-polska.pl/websrv/en.wsdl";
const SOAP_ENDPOINT = "https://en-testwebapi.poczta-polska.pl/websrv/en.php";

// 📨 /soap/nadaj – tworzenie bufora i dodanie przesyłki
router.post("/soap/nadaj", async (req, res) => {
  const { nadawca, przesylka, dataNadania } = req.body;
  const today = dataNadania || new Date().toISOString().split("T")[0];

  console.log("▶️ BODY:", JSON.stringify(req.body, null, 2));
  console.log("🧪 Dzisiaj:", today);

  soap.createClient(WSDL_PATH, {}, (err, client) => {
    if (err) {
      console.error("❌ Błąd tworzenia klienta SOAP:", err);
      return res.status(500).json({ error: "SOAP client error", details: err });
    }

    client.setSecurity(new soap.BasicAuthSecurity(EN_LOGIN, EN_PASSWORD));
    client.setEndpoint(SOAP_ENDPOINT);
    console.log("🧪 Metody klienta SOAP:", Object.keys(client));

    const buforArgs = {
      bufor: {
        idKarta: 902793,
        urzadNadania: 197550,
        dataNadania: today
      }
    };

    console.log("📦 Tworzenie bufora:", buforArgs);

    client.createEnvelopeBufor(buforArgs, (err, buforResult) => {
      if (err) {
        console.error("❌ Błąd createEnvelopeBufor:", err.body || err);
        return res.status(500).json({ error: "createEnvelopeBufor failed", details: err.body || err });
      }

      const idBufor = buforResult.return?.idBufor;
      if (!idBufor) {
        console.error("❌ Brak idBufor w odpowiedzi:", buforResult);
        return res.status(500).json({ error: "Brak idBufor w odpowiedzi" });
      }

      console.log("✅ BUFOR UTWORZONY:", idBufor);

      const shipmentArgs = {
        przesylki: {
          przesylka: [{
            guid: uuid.v4(),
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
              telefon: przesylka.telefon || "000000000",
              email: przesylka.email || "brak@email.pl"
            }
          }]
        },
        idBufor
      };

      console.log("📦 Dodawanie przesyłki do bufora:", shipmentArgs);

      client.addShipment(shipmentArgs, (err, result) => {
        if (err) {
          console.error("❌ Błąd addShipment:", err.body || err);
          return res.status(500).json({ error: "addShipment failed", details: err.body || err });
        }

        const guid = result?.return?.guid || null;
        console.log("✅ PRZESYŁKA DODANA:", guid);

        res.json({ message: "OK", bufor: idBufor, guid });
      });
    });
  });
});


module.exports = router;