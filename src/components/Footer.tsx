const WHATSAPP_NUMBER = import.meta.env.VITE_STORE_WHATSAPP || "5500000000000";

export default function Footer() {
  return (
    <footer className="bg-usepy-bark text-usepy-cream/80 px-6 py-10 mt-16">
      <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="font-display text-xl text-white mb-2">usepy</p>
          <p>Moda fitness — conjuntos, leggings e acessórios para o seu treino.</p>
        </div>
        <div>
          <p className="text-white mb-2">Atendimento</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-white"
          >
            Fale no WhatsApp
          </a>
          <p>Formas de pagamento e entrega no checkout</p>
        </div>
        <div>
          <p className="text-white mb-2">Usepy Moda Fitness</p>
          <p>© {new Date().getFullYear()}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
