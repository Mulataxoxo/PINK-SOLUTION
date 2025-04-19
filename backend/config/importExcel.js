const XLSX = require('xlsx');
const db = require('./database');



// Wczytanie Excela
const workbook = XLSX.readFile('./polaczone_kontrahenci.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Przygotowanie zapytania do bazy
db.serialize(() => {
  const stmt = db.prepare(`INSERT INTO kontrahenci (
    nazwa, nip, regon, krs, email, telefon, uwagi, status_firmy, informacje_dodatkowe,
    kod_pocztowy_korespondencyjny, miasto_korespondencyjne, ulica_korespondencyjna,
    numer_domu_korespondencyjny, numer_lokalu_korespondencyjny, kraj_korespondencyjny,
    kod_pocztowy_rejestrowy, miasto_rejestrowe, ulica_rejestrowa,
    numer_domu_rejestrowy, numer_lokalu_rejestrowy, kraj_rejestrowy
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  data.forEach(row => {
    stmt.run([
      row["NAZWA FIRMY"],
      row["NIP"],
      row["REGON"],
      row["KRS"],
      row["MAIL DO DZIAŁU KSIĘGOWEGO"],
      row["NR KONTAKTOWY"],
      row["INFORMACJE DODATKOWE"],
      row["STATUS FIRMY"],
      row["INFORMACJE DODATKOWE"],
      row["KOD_POCZTOWY_ADRES_KORESPONDENCYJNY"],
      row["MIEJSCOWOŚĆ_ADRES_KORESPONDENCYJNY"],
      row["ULICA_ADRES_KORESPONDENCYJNY"],
      row["NUMER_DOMU_ADRES_KORESPONDENCYJNY"],
      row["NUMER_LOKALU_ADRES_KORESPONDENCYJNY"],
      row["KRAJ_ADRES_KORESPONDENCYJNY"],
      row["KOD_POCZTOWY_ADRES_REJESTRACJI"],
      row["MIEJSCOWOŚĆ_ADRES_REJESTRACJI"],
      row["ULICA_ADRES_REJESTRACJI"],
      row["NUMER_DOMU_ADRES_REJESTRACJI"],
      row["NUMER_LOKALU_ADRES_REJESTRACJI"],
      row["KRAJ_ADRES_REJESTRACJI"]
    ]);
  });

  stmt.finalize();
  console.log("✅ Dane zostały zaimportowane do bazy.");
});
