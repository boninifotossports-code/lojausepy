import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPaymentSettings() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("payment_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setToken(data.credentials?.token ?? "");
          setEmail(data.credentials?.email ?? "");
          setIsSandbox(data.is_sandbox);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    await supabase
      .from("payment_settings")
      .update({
        provider: "pagseguro",
        is_sandbox: isSandbox,
        credentials: { token, email },
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-usepy-ink/50">Carregando...</p>;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl text-usepy-bark mb-2">Pagamento online</h1>
      <p className="text-sm text-usepy-ink/60 mb-6">
        Cole aqui o token de integração da sua conta PagSeguro/PagBank. Essas credenciais
        ficam guardadas no banco (protegidas por RLS, só o admin lê) e só são usadas pela
        função de checkout no momento da cobrança — nunca aparecem no site público.
      </p>

      <div className="space-y-3">
        <input
          className="w-full border p-2"
          placeholder="Token de integração PagBank"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="E-mail da conta PagBank"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isSandbox} onChange={(e) => setIsSandbox(e.target.checked)} />
          Usar ambiente de testes (sandbox) — desmarque quando for começar a receber de verdade
        </label>

        <button onClick={handleSave} className="bg-usepy-copper text-white px-6 py-2 rounded">
          {saved ? "Salvo ✓" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
