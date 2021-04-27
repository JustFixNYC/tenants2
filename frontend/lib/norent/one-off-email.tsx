import React, { useContext } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { EmailCta, HtmlEmail } from "../static-page/html-email";
import { AppContext } from "../app-context";
import i18n, { SupportedLocaleMap } from "../i18n";
import { NorentRoutes } from "./route-info";

type ContentProps = {
  firstName: string;
  ctaURL: string;
};

const WwwNorentDotOrg: React.FC<{}> = () => (
  <a href="https://www.norent.org" data-jf-show-href-only-in-plaintext>
    www.norent.org
  </a>
);

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
          <li>Monday, April 26 from 4-7 pm</li>
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
      Recibes este mensaje porque creaste una cuenta o enviaste una carta al
      dueño o manager de tu edificio a través de nuestro sitio web{" "}
      <WwwNorentDotOrg /> para informarle que no puedes pagar la renta del mes
      que especificaste debido a razones relacionadas con el COVID-19.
    </p>
    <p>
      El 31 de agosto de 2020, el estado de California aprobó protecciones para
      inquilinos bajo el Proyecto de Ley de la Asamblea 3088. Estas protecciones
      evitan que los propietarios desalojen a los inquilinos antes del 1 de
      febrero de 2021 sin una razón válida o por renta no pagada entre el 4 de
      marzo de 2020 y el 31 de enero de 2021 debido a la pérdida de ingresos o
      mayores gastos asociados con el COVID-19. Aunque esta ley te protege de
      ser desalojado/a por no pagar la renta, no la cancela.
    </p>
    <p>
      Si debes alquiler por cualquier mes desde marzo de 2020 hasta enero de
      2021, debes enviar una carta de declaración al dueño o manager de tu
      edificio por todos los meses en que no hayas podido pagar la renta en su
      totalidad. También debes pagar un mínimo del 25% de la renta total
      adeudada, antes del 31 de enero de 2021. Para cumplir con este requisito,
      puedes pagar el 25% cada mes o puedes hacerlo en un solo pago siempre que
      pagues el 25% de la renta total antes del 31 de enero de 2021.
    </p>
    <p>
      Debes enviar esta carta de declaración cada mes al dueño o manager de tu
      edificio indicando que no puedes pagar la renta y las razones. La
      herramienta NoRent.org actualizada satisface los requisitos para que
      puedas enviar una carta de declaración al dueño o manager de tu edificio
      con éxito.
    </p>
    <EmailCta href={props.ctaURL}>
      Envía una carta de declaración al dueño o manager de tu edificio ahora
    </EmailCta>
  </>
);

const CONTENT: SupportedLocaleMap<React.FC<ContentProps>> = {
  en: EnglishContent,
  es: SpanishContent,
};

const SUBJECT: SupportedLocaleMap<string> = {
  en: "Important Updates to NoRent.org and California Eviction Protections",
  es:
    "Actualizaciones importantes de NoRent.org y las protecciones contra desalojos de California",
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
