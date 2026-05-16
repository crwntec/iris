import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import pjson from "@/../package.json";

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
      <div className="mb-4 text-center flex flex-row items-center">
        <img
          className="mr-5 "
          width={64}
          height={64}
          src="/favicon.ico"
          alt="IRIS"
        />
        <div className="pl-5 border-l-2 border-white flex items-start justify-center flex-col">
          <h1 className="text-4xl font-thin tracking-widest text-white">
            iris
          </h1>
          <p className="text-zinc-500 text-xs mt-1 tracking-widest uppercase">
            insights for WebUntis
          </p>
        </div>
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
      <footer className="text-zinc-500 text-xs mt-3 tracking-widest">
        <p>&copy; {new Date().getFullYear()} crwntec</p>
        <p className="text-center">v{pjson.version}</p>
      </footer>
    </div>
  );
}
