import React, { useState, useEffect } from "react";
import axios from "axios";

const LoginPage = () => {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [officeUsers, setOfficeUsers] = useState([]);


  useEffect(() => {
    // Pobieranie listy kierowców z backendu
    axios.get("http://localhost:5001/api/auth/drivers").then((response) => {
      setDrivers(response.data);
    });
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("savedUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setRole(userData.role);
      setName(userData.name);
    }
  }, []);
  
  useEffect(() => {
    axios.get("http://localhost:5001/api/auth/office-users")
        .then((response) => {
            setOfficeUsers(response.data);
        })
        .catch((error) => {
            console.error("Błąd pobierania użytkowników biura/kadr:", error);
        });
}, []);



const handleLogin = async () => {
  setLoading(true);
  setError("");
  try {
    const payload = role === "biuro" || role === "kadry" || role === "ksiegowosc"
      ? { role, name, password }
      : { role, name, pin };

    const response = await axios.post("http://localhost:5001/api/auth/login", payload);

    console.log("📌 Zalogowano poprawnie:", response.data.user);

    // ✅ Poprawny zapis do localStorage
    localStorage.setItem("loggedUser", JSON.stringify({
        id: response.data.user.id,
        name: response.data.user.name,
        role: response.data.user.role,
        brudnolistId: response.data.user.brudnolistId
    }));

    window.location.href = `/dashboard/${response.data.user.role}`;
  } catch (err) {
    setError(err.response?.data?.error || "Błąd logowania. Sprawdź dane.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Wybierz sposób logowania</h2>
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setRole("spedytor")} className="p-4 bg-blue-500 text-white rounded-lg">Spedytor</button>
        <button onClick={() => setRole("kierowca")} className="p-4 bg-green-500 text-white rounded-lg">Kierowca</button>
        <button onClick={() => setRole("biuro")} className="p-4 bg-red-500 text-white rounded-lg">Biuro/Kadry</button>
        <button onClick={() => setRole("ksiegowosc")} className="p-4 bg-yellow-500 text-white rounded-lg">Księgowość</button>
      </div>

      {role && (
  <div className="mt-6">
    <h3 className="text-xl font-semibold mb-2">Logowanie jako {role}</h3>

    {role === "biuro" || role === "kadry" ? (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {officeUsers.map((user) => (
          <button
            key={user.name}
            onClick={() => setName(user.name)}
            className={`p-2 rounded-lg ${name === user.name ? "bg-red-700 text-white" : "bg-gray-300"}`}
          >
            {user.name}
          </button>
        ))}
      </div>
    ) : null}

    {role === "ksiegowosc" || role === "biuro" || role === "kadry" ? (
      <input 
        type="password" 
        placeholder="Hasło" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="p-2 border rounded w-full mb-2"
      />
    ) : role === "spedytor" ? (
      <>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["Viktoria", "Maria", "Andrii", "Kiryl"].map((spedytor) => (
            <button
              key={spedytor}
              onClick={() => setName(spedytor)}
              className={`p-2 rounded-lg ${name === spedytor ? "bg-blue-700 text-white" : "bg-gray-300"}`}
            >
              {spedytor}
            </button>
          ))}
        </div>
        <input 
          type="password" 
          placeholder="PIN (4 cyfry)" 
          value={pin} 
          onChange={(e) => setPin(e.target.value)} 
          className="p-2 border rounded w-full mb-2"

       /> 
      </>
 
    
) : role === "kierowca" ? (
  <>
    <select
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="p-2 border rounded w-full mb-2"
    >
      <option value="">Wybierz samochód</option>
      {drivers.map((driver) => (
        <option key={driver.name} value={driver.name}>
          {driver.name}
        </option>
      ))}
    </select>

    {name && (
      <input
        type="password"
        placeholder="Wpisz PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="border rounded p-2 w-full my-2"
      />
    )}
  </>
) : null}


    <label className="flex items-center mt-2">
      <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
      <span className="ml-2">Zapamiętaj mnie</span>
    </label>

    {error && <p className="text-red-500">{error}</p>}
    <button onClick={handleLogin} className="p-2 bg-blue-600 text-white rounded w-full" disabled={loading}>
      {loading ? "Logowanie..." : "Zaloguj"}
    </button>
  </div>
)}

    </div>
  );
}

export default LoginPage;