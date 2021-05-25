import React, { useContext } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { AppContext } from "../app-context";
import i18n, { SupportedLocaleMap } from "../i18n";

type ContentProps = {
  firstName: string;
};

const EnglishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Hello {props.firstName},</p>
    <p>
      You're receiving this email because you submitted a hardship declaration
      form using EvictionFreeNY.org. Good news! New York's eviction protections
      were recently extended, so your eviction case will remain on hold until
      August 31st. Remember: ONLY a judge can evict you, do not give up your
      home! If you have received a Notice to Pay Rent or Quit or any other kind
      of eviction notice, contact Housing Court Answers (NYC) at 212-962-4795,
      Monday - Friday, 9am-5pm or the Statewide Hotline at 833-503-0447, open
      24/7.
    </p>
    <p>
      For more information about New York’s eviction protections and your rights
      as a tenant, check out our{" "}
      <a href="https://www.righttocounselnyc.org/eviction_protections_during_covid">
        FAQ
      </a>{" "}
      on the Right to Counsel website.
    </p>
    <p>
      To get involved in organizing and the fight to #StopEvictions and
      #CancelRent, follow us on Twitter at{" "}
      <a href="https://twitter.com/RTCNYC">@RTCNYC</a> and{" "}
      <a href="https://twitter.com/housing4allNY">@housing4allNY</a>.
    </p>
  </>
);

const SpanishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Hola {props.firstName},</p>
    <p>
      Estás recibiendo este correo electrónico porque enviaste un formulario de
      declaración de dificultades a través de EvictionFreeNY.org. ¡Buenas
      noticias! Las protecciones contra el desalojo de Nueva York se extendieron
      recientemente, por lo que su caso de desalojo permanecerá detenido hasta
      el 31 de agosto. Recuerde: SOLO un juez puede desalojarlo, ¡no renuncie a
      su hogar! Si ha recibido notificación diciéndole que pague el alquiler o
      se vaya o cualquier otro tipo de aviso de desalojo, comuníquese con
      Housing Court Answers (NYC) al 212-962-4795, de lunes a viernes, de
      9am-5pm o con la línea directa estatal al 833-503-0447, abierto 24 horas
      al día, 7 días a la semana.
    </p>
    <p>
      Para obtener más información sobre las protecciones contra el desalojo de
      Nueva York y sus derechos como inquilino, consulte nuestra{" "}
      <a href="https://www.righttocounselnyc.org/protecciones_contra_desalojos">
        página de preguntas frecuentes
      </a>{" "}
      en el sitio web de Derecho a un abogado.
    </p>
    <p>
      Para participar en la organización y la lucha por #StopEvictions y
      #CancelRent, síganos en Twitter en{" "}
      <a href="https://twitter.com/RTCNYC">@RTCNYC</a> y{" "}
      <a href="https://twitter.com/housing4allNY">@housing4allNY</a>.
    </p>
  </>
);

const CONTENT: SupportedLocaleMap<React.FC<ContentProps>> = {
  en: EnglishContent,
  es: SpanishContent,
};

const SUBJECT: SupportedLocaleMap<string> = {
  en: "Eviction Protections Extended until August 31: #EvictionFreeNY Update",
  es:
    "Protecciones de desalojo extendidas hasta el 31 de agosto: Noticia #EvictionFreeNY",
};

const Content: React.FC<{}> = () => {
  const { session } = useContext(AppContext);
  const Content = CONTENT[i18n.locale];

  return <Content firstName={session.firstName || ""} />;
};

export const OneOffEmail = asEmailStaticPage(() => (
  <HtmlEmail subject={SUBJECT[i18n.locale]}>
    <Content />
  </HtmlEmail>
));
