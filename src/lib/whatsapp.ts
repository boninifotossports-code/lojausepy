import type { CartItem } from "../types/catalog";
import { centsToBRL } from "./format";

const WHATSAPP_NUMBER = import.meta.env.VITE_STORE_WHATSAPP || "5500000000000";

export function buildWhatsappOrderLink(params: {
  orderId: string;
  items: CartItem[];
  subtotalCents: number;
  shippingCents: number;
  customerName: string;
}): string {
  const { orderId, items, subtotalCents, shippingCents, customerName } = params;
  const lines = [
    `Olá! Sou ${customerName} e quero fechar meu pedido #${orderId.slice(0, 8)} na Usepy:`,
    "",
    ...items.map(
      (i) =>
        `• ${i.quantity}x ${i.productName} ${[i.size, i.color].filter(Boolean).join("/")} — ${centsToBRL(
          i.unitPriceCents * i.quantity
        )}`
    ),
    "",
    `Subtotal: ${centsToBRL(subtotalCents)}`,
    `Frete: ${centsToBRL(shippingCents)}`,
    `Total: ${centsToBRL(subtotalCents + shippingCents)}`,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
