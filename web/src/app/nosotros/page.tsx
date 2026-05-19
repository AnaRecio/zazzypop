import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acerca de ZazzyPop — Eventos en Costa Rica",
  description: "ZazzyPop centraliza los eventos de Costa Rica en un solo lugar: música, ferias, mercaditos, stand-up y más.",
};

export default function NosotrosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3">
          zazzy<span className="text-orange-500">pop</span>
        </h1>
        <p className="text-xl text-gray-600">La cartelera de eventos de Costa Rica</p>
      </div>

      <div className="space-y-10 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">¿Qué es ZazzyPop?</h2>
          <p className="leading-relaxed">
            ZazzyPop es una cartelera digital que reúne eventos de toda Costa Rica en un solo lugar.
            Conciertos, ferias, mercaditos, obras de teatro, stand-up, talleres, deportes y más —
            filtrados por ciudad, fecha y categoría para que encontrés planes que se ajustan a lo
            que buscás.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">¿Por qué existe?</h2>
          <p className="leading-relaxed">
            Los eventos en Costa Rica están dispersos en Instagram, Facebook, WhatsApp y decenas de
            sitios distintos. ZazzyPop centraliza esa información para que no te perdás lo que pasa
            cerca de vos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">¿Tenés un evento?</h2>
          <p className="leading-relaxed mb-4">
            Si organizás eventos en Costa Rica, podés publicarlo gratis en ZazzyPop. Llegamos a
            personas que buscan activamente qué hacer, lo que significa público genuinamente
            interesado en tu evento.
          </p>
          <Link
            href="/publicar"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Publicar mi evento gratis →
          </Link>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Contacto</h2>
          <p className="leading-relaxed">
            Para consultas, reportar un evento incorrecto, o destacar tu evento, escribinos a{" "}
            <a
              href="mailto:hola@zazzypop-cr.app"
              className="text-orange-500 underline"
            >
              hola@zazzypop-cr.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
