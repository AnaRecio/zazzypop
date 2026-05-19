import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — ZazzyPop",
  description: "Política de privacidad de ZazzyPop, la cartelera de eventos en Costa Rica.",
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: mayo 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información general</h2>
          <p>
            ZazzyPop (<strong>zazzypop-cr.app</strong>) es una cartelera de eventos en Costa Rica.
            No requerimos que los usuarios creen una cuenta ni proporcionen datos personales para
            navegar el sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Datos que recopilamos</h2>
          <p>Al usar ZazzyPop podemos recopilar automáticamente:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Dirección IP y datos de acceso generados por tu navegador</li>
            <li>Páginas visitadas y tiempo de navegación (datos agregados y anónimos)</li>
            <li>Tipo de dispositivo y navegador</li>
          </ul>
          <p className="mt-3">
            Si enviás un evento a través de nuestro formulario, recopilamos el nombre del evento,
            descripción, fecha, lugar y dirección de correo electrónico de contacto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Uso de la información</h2>
          <p>Usamos la información para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Mostrar eventos relevantes según tu ubicación o preferencias de filtro</li>
            <li>Mejorar el funcionamiento del sitio</li>
            <li>Revisar y publicar eventos enviados por organizadores</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cookies y publicidad</h2>
          <p>
            ZazzyPop puede utilizar <strong>Google AdSense</strong> para mostrar anuncios. Google
            usa cookies para personalizar los anuncios según tus intereses. Podés desactivar la
            personalización de anuncios en{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              adssettings.google.com
            </a>
            .
          </p>
          <p className="mt-3">
            También podemos utilizar herramientas de analítica (como Vercel Analytics) para
            entender el uso del sitio. Estos datos son anónimos y agregados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Servicios de terceros</h2>
          <p>ZazzyPop utiliza los siguientes servicios externos:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Supabase</strong> — base de datos y almacenamiento de eventos
            </li>
            <li>
              <strong>Vercel</strong> — hosting del sitio web
            </li>
            <li>
              <strong>Google AdSense</strong> — publicidad (cuando esté activo)
            </li>
          </ul>
          <p className="mt-3">
            Cada servicio tiene su propia política de privacidad. No vendemos ni compartimos tus
            datos personales con terceros fuera de los servicios mencionados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Tus derechos</h2>
          <p>
            Si enviaste un evento y querés que eliminemos tu información de contacto, escribinos a{" "}
            <a
              href="mailto:hola@zazzypop-cr.app"
              className="text-orange-500 underline"
            >
              hola@zazzypop-cr.app
            </a>{" "}
            y lo procesamos en un plazo de 7 días hábiles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. La fecha en la parte superior indica
            cuándo fue la última modificación. El uso continuado del sitio implica aceptación de
            los cambios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contacto</h2>
          <p>
            Para consultas sobre privacidad escribinos a{" "}
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
