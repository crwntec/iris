import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await login(username, password);
      navigate("/absences");
    } catch {
      setError("Benutzername oder Passwort falsch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-8 gap-6">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">👁️Iris</h1>
        <p className="text-zinc-500 text-sm mt-1 tracking-widest uppercase">
          WebUntis
        </p>
      </div>

      <div className="w-full space-y-3">
        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <button
        className="w-full bg-white text-black font-medium rounded-2xl py-3 transition-opacity disabled:opacity-40"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Anmelden…" : "Anmelden"}
      </button>
    </div>
  );
}
