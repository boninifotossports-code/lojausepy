import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, ADMIN_PATH } from "../../lib/supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    navigate(ADMIN_PATH);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-usepy-cream">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-xl mb-6">Painel Usepy</h1>
        <input
          className="w-full border p-2 mb-3"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-3"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button className="w-full bg-usepy-copper text-white py-2 rounded" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
