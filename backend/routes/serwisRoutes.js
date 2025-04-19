const express = require("express");
const router = express.Router();
const serwisController = require("../controllers/serwisController");

router.post("/serwis", serwisController.dodajWpisSerwisowy);
router.get("/serwis/:rejestracja", serwisController.listaWpisow);
router.delete("/serwis/:id", serwisController.usunWpis);
router.put("/serwis/:id", serwisController.edytujWpis);

module.exports = router;
