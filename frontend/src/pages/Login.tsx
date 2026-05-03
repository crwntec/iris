import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await login(username, password);
      navigate("/timetable");
    } catch {
      setError("Login fehlgeschlagen");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
      <h1 className="text-2xl font-bold">Iris</h1>
      <input
        className="w-full border rounded p-2"
        placeholder="Benutzername"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="w-full border rounded p-2"
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        className="w-full bg-black text-white rounded p-2"
        onClick={handleSubmit}
      >
        Anmelden
      </button>
    </div>
  );
}
