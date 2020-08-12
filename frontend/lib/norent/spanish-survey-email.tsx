import React, { useContext } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { AppContext } from "../app-context";
import { useLocation } from "react-router-dom";
import { getQuerystringVar } from "../util/querystring";

const Content: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  const firstName = session.firstName || "";
  const loc = useLocation();
  const senderName = getQuerystringVar(loc.search, "sender") || "JustFix.nyc";

  return (
    <>
      <p>Estimad@ {firstName},</p>
      <p>
        Aquí {senderName}. Te escribimos porque usaste NoRent.org para enviarle
        una carta al dueño o manager de tu edificio.
      </p>
      <p>
        Nos gustaría saber cómo fue tu experiencia con la versión de la
        herramienta en Español. Si quieres dar tu opinión,{" "}
        <a href="https://forms.gle/RxfbF5kMDsDAADZa8">
          completa este formulario
        </a>
        . Tardarás menos de 10 minutos.
      </p>
      <p>
        Si completas la encuesta antes del 31 de Agosto, 2020, te incluiremos en
        el sorteo de una tarjeta de regalo digital de $50.
      </p>
      <p>
        NoRent.org fue creado por el equipo de JustFix.nyc. Somos una
        organización sin fines de lucro que fabrica herramientas digitales para
        que los inquilinos luchen contra el desplazamiento logrando permacer en
        hogares dignos. Si quieres obtener más información, visita{" "}
        <a href="https://www.justfix.nyc/">nuestro sitio web</a>.
      </p>
      <p>¡Agradecemos tu ayuda!</p>
      <p>-- {senderName}</p>
    </>
  );
};

export const SpanishSurveyEmail = asEmailStaticPage(() => (
  <HtmlEmail subject="¿Nos Ayudas? ¿Que tal te fue con NoRent.org en Español?">
    <Content />
  </HtmlEmail>
));
