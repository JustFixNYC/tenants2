import React, { useContext } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { HtmlEmail } from "../static-page/html-email";
import { AppContext } from "../app-context";
import i18n, { SupportedLocaleMap } from "../i18n";
import { NorentRoutes } from "./route-info";

type ContentProps = {
  firstName: string;
  ctaURL: string;
};

const NakedLink: React.FC<{ href: string }> = ({ href }) => (
  <a href={href} data-jf-show-href-only-in-plaintext>
    {href}
  </a>
);

const EnglishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Dear {props.firstName},</p>
    <p>
      You are receiving this message as a reminder of the Emergency Rental
      Assistance Program enacted by the new State Law SB91 in the State of
      California. The application for rental assistance is now available!
    </p>
    <h2>If you live in the City of Los Angeles</h2>
    <ul>
      <li>The last day to apply is April 30th</li>
      <li>
        You can apply at <NakedLink href="https://hcidla.lacity.org/" />
      </li>
      <li>If you have questions, call (833) 373-0587</li>
    </ul>
    <p>Additional application assistance available:</p>
    <ul>
      <li>
        SAJE created a video to walk through the application process:{" "}
        <NakedLink href="https://youtu.be/c2CW2uzccB4" />
      </li>
      <li>
        In person rental assistance clinics in Northeast Los Angeles provided by
        LA MAS:{" "}
        <NakedLink href="https://www.facebook.com/events/811561476446257/" />
      </li>
      <li>
        2806 Clearwater St Los Angeles, CA 90039. Call (323) 899-9428 to find
        out what materials you need to bring.
        <ul>
          <li>Tuesday, April 27 from 4-7 pm</li>
        </ul>
      </li>
    </ul>
    <h2>If you live in Long Beach</h2>
    <ul>
      <li>
        Apply here:{" "}
        <NakedLink href="http://www.longbeach.gov/lbds/hn/emergency-rental-assistance-program/" />
      </li>
    </ul>
    <h2>
      If you live in another city or an unincorporated area of Los Angeles
    </h2>
    <p>
      (for example: Compton, Lynwood, Inglewood or another city NOT the city of
      Los Angeles or Long Beach OR you live in an unincorporated area such as
      East Los Angeles, Florence Firestone)
    </p>
    <ul>
      <li>
        Apply here:{" "}
        <NakedLink href="https://housing.ca.gov/covid_rr/index.html" />
      </li>
      <li>
        Watch a video that SAJE made to help you apply:{" "}
        <NakedLink href="https://youtu.be/OqfDQH3B9x4" />
      </li>
    </ul>
    <p>
      Other offices offering assistance (please call them to schedule an
      appointment):
    </p>
    <ul>
      <li>
        <p>
          <strong>Watts Labor Community Action Committee</strong>
          <br />
          Monday-Friday, 8:30am-5:30pm
          <br />
          (323) 357-6262
        </p>
      </li>
      <li>
        <p>
          <strong>Southwest/Florence The Children’s Collective, Inc</strong>
          <br />
          Monday-Friday, 8:30am-5pm <br />
          (323) 789-4717
        </p>
      </li>
      <li>
        <p>
          <strong>Wilmington/San Pedro Toberman Neighborhood Center</strong>
          <br />
          Monday-Friday, 9am-5pm
          <br />
          (310) 832-1145
        </p>
      </li>
    </ul>
    <p>
      If you have further questions, SAJE is available Monday-Friday 10am-6pm
      for general questions at (213) 745-9961.
    </p>
  </>
);

const SpanishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Estimado/a {props.firstName},</p>
    <p>
      Recibe este mensaje para mandarle información sobre los programas de
      asistencia de fondos para renta para inquilines del Condado de Los
      Ángeles. La ley del estado de California SB91 provee ayuda para inquilines
      que califican. ¡La aplicación ya está disponible!
    </p>
    <h2>Si vive en la Ciudad de Los Ángeles</h2>
    <ul>
      <li>La fecha límite para aplicar es el 30 de abril</li>
      <li>
        ¿Donde aplico? <NakedLink href="https://hcidla.lacity.org/" />
      </li>
      <li>Para preguntas: (833) 373-0587</li>
      <li>
        Video de SAJE para ayuda:{" "}
        <NakedLink href="https://youtu.be/Mh8OvvvJDwE" />
      </li>
    </ul>
    <h2>Si vive en la ciudad de Long Beach</h2>
    <ul>
      <li>
        ¿Donde aplico?{" "}
        <NakedLink href="http://www.longbeach.gov/lbds/hn/emergency-rental-assistance-program/" />
      </li>
    </ul>
    <h2>
      Si vive en otra ciudad del condado de Los Ángeles o un área no incorporada
    </h2>
    <p>(Como por ejemplo el Este de Los Angeles, Florence-Firestone)</p>
    <ul>
      <li>
        ¿Donde aplico?{" "}
        <NakedLink href="https://housing.ca.gov/covid_rr/index_esp.html" />
      </li>
      <li>
        Video de SAJE para ayuda:{" "}
        <NakedLink href="https://youtu.be/gA6NBF5Xzdc" />
      </li>
    </ul>
    <p>Donde llamar para asistencia: Por favor llame para confirmar</p>
    <ul>
      <li>
        <p>
          <strong>Watts Labor Community Action Committee</strong>
          <br />
          Lunes-Viernes, 8:30am-5:30pm
          <br />
          (323) 357-6262
        </p>
      </li>
      <li>
        <p>
          <strong>Southwest/Florence The Children’s Collective, Inc</strong>
          <br />
          Lunes-Viernes, 8:30am-5pm <br />
          (323) 789-4717
        </p>
      </li>
      <li>
        <p>
          <strong>Wilmington/San Pedro Toberman Neighborhood Center</strong>
          <br />
          Lunes-Viernes, 9am-5pm
          <br />
          (310) 832-1145
        </p>
      </li>
    </ul>
    <p>
      Si tiene mas preguntas por favor llame a SAJE al 213-745-9961 de Lunes a
      Viernes 10am-6pm. SAJE le manda buenos deseos durante este tiempo.
    </p>
  </>
);

const CONTENT: SupportedLocaleMap<React.FC<ContentProps>> = {
  en: EnglishContent,
  es: SpanishContent,
};

const SUBJECT: SupportedLocaleMap<string> = {
  en: "NoRent.org: Important Information about Emergency Rental Assistance",
  es: "Información importante sobre asistencia de fondos para renta",
};

const Content: React.FC<{}> = () => {
  const { session, server } = useContext(AppContext);
  const Content = CONTENT[i18n.locale];

  return (
    <Content
      firstName={session.firstName || ""}
      ctaURL={`${server.originURL}${NorentRoutes.locale.letter.latestStep}`}
    />
  );
};

export const OneOffEmail = asEmailStaticPage(() => (
  <HtmlEmail subject={SUBJECT[i18n.locale]}>
    <Content />
  </HtmlEmail>
));
