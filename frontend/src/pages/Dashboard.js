import React from "react";
import { useParams } from "react-router-dom";
import DashboardSpedytor from "./DashboardSpedytor";

const Dashboard = () => {
  const { role } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard dla {role}</h1>
      {role === "spedytor" && <DashboardSpedytor />}
      {role === "kierowca" && <p>Widok dla kierowcy</p>}
      {role === "biuro" && <p>Widok dla biura</p>}
      {role === "kadry" && <p>Widok dla kadr</p>}
      {role === "ksiegowosc" && <p>Widok dla księgowości</p>}
    </div>
  );
};

export default Dashboard;
