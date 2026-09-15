import { Link, useSearchParams } from "react-router-dom";

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get("order");

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl text-usepy-bark mb-3">Pedido recebido!</h1>
      <p className="text-usepy-ink/70 mb-1">
        Assim que o pagamento for confirmado você recebe a atualização por WhatsApp/e-mail.
      </p>
      {orderId && (
        <p className="text-usepy-ink/40 text-sm mb-6">Pedido #{orderId.slice(0, 8)}</p>
      )}
      <Link to="/" className="text-usepy-copper underline">
        Voltar para a loja
      </Link>
    </div>
  );
}
