import { Routes, Route } from "react-router-dom";
import { ADMIN_PATH } from "./lib/supabase";

import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import RequireAdmin from "./components/RequireAdmin";

export default function App() {
  return (
    <Routes>
      {/* Loja pública — nenhuma dessas rotas linka para o painel admin */}
      <Route path="/" element={<Home />} />
      <Route path="/produto/:slug" element={<ProductPage />} />
      <Route path="/carrinho" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/pedido-confirmado" element={<OrderConfirmation />} />

      {/* Painel admin — rota "escondida", só encontrada por quem conhece o caminho.
          O caminho fica configurável em VITE_ADMIN_PATH (.env), então nunca vai
          parar em builds públicos do repositório nem em menus do site. */}
      <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin />} />
      <Route
        path={ADMIN_PATH}
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="produtos" element={<AdminProducts />} />
        <Route path="produtos/novo" element={<AdminProductForm />} />
        <Route path="produtos/:id" element={<AdminProductForm />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="pagamentos" element={<AdminPaymentSettings />} />
      </Route>
    </Routes>
  );
}
