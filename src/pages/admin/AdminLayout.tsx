import { Outlet, Link } from "react-router-dom";
import { ADMIN_PATH } from "../../lib/supabase";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-usepy-bark text-white p-4 space-y-2">
        <p className="font-display text-lg mb-4">Usepy Admin</p>
        <Link className="block" to={ADMIN_PATH}>Dashboard</Link>
        <Link className="block" to={`${ADMIN_PATH}/produtos`}>Produtos</Link>
        <Link className="block" to={`${ADMIN_PATH}/pedidos`}>Pedidos</Link>
        <Link className="block" to={`${ADMIN_PATH}/pagamentos`}>Pagamentos</Link>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
