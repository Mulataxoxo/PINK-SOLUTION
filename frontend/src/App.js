import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Kalkulator from "./pages/Kalkulator";
import Brudnolist from "./pages/Brudnolist";
import CMRformularz from "./pages/CMRformularz";
import DashboardBiuro from "./pages/DashboardBiuro"; // Dodaj import
import DashboardKierowca from "./pages/DashboardKierowca"; // 👈 upewnij się, że masz ten import
import GPS from "./pages/GPS";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard/:role" element={<Dashboard />} />
        <Route path="/dashboard/spedytor/kalkulator" element={<Kalkulator />} />
        <Route path="/dashboard/spedytor/brudnolist" element={<Brudnolist />} />
        {/*  ścieżkę dla kierowcy */}
        <Route path="/dashboard/kierowca" element={<DashboardKierowca />} />
        <Route path="/dashboard/kierowca/gps/:id" element={<GPS />} />

        {/* Nowe trasy dla Biura */}
        <Route path="/dashboard/biuro" element={<DashboardBiuro />} /> 
        <Route path="/dashboard/biuro/cmrformularz" element={<CMRformularz />} />
      </Routes>
    </Router>
  );
};

export default App;
