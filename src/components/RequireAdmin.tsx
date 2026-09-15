import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase, ADMIN_PATH } from "../lib/supabase";

/**
 * A segurança real do painel não é a rota estar "escondida" — é essa
 * checagem: precisa estar logado no Supabase Auth E ter uma linha em
 * `admin_users` (ver supabase/migrations) para passar. RLS no banco
 * reforça a mesma regra do lado do servidor, então mesmo alguém que
 * descubra a URL não consegue ler/gravar nada sem essa permissão.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) {
        if (active) setStatus("denied");
        return;
      }
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) setStatus(adminRow ? "ok" : "denied");
    }

    check();
    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") return null;
  if (status === "denied") return <Navigate to={`${ADMIN_PATH}/login`} replace />;
  return <>{children}</>;
}
