import React, { useContext } from "react";
import { asEmailStaticPage } from "../static-page/email-static-page";
import { EmailCta, HtmlEmail } from "../static-page/html-email";
import { AppContext } from "../app-context";
import i18n, { SupportedLocaleMap } from "../i18n";
import { NorentRoutes } from "./routes";

type ContentProps = {
  firstName: string;
  ctaURL: string;
};

const WwwNorentDotOrg: React.FC<{}> = () => (
  <a href="https://www.norent.org" data-jf-show-href-only-in-plaintext>
    www.norent.org
  </a>
);

const EnglishContent: React.FC<ContentProps> = (props) => (
  <>
    <p>Dear {props.firstName},</p>
    <p>
      You are receiving this message because you have created an account or sent
      a letter to your landlord via our website <WwwNorentDotOrg /> to inform
      them that you are unable to pay rent for the month you specified due to
      COVID-19 related reasons.
    </p>
    <p>
      On August 31, 2020, the State of California passed tenant protections
      under Assembly Bill 3088. These protections prevent landlords from
      evicting tenants before February 1, 2021 without a valid reason or for any
      rent not paid between March 4, 2020 - January 31, 2021 due to loss of
      income or increased expenses associated with COVID-19. Although this law
      protects you from being evicted for not paying rent, it does not cancel
      rent.
    </p>
    <p>
      If you owe rent for any months from March 2020 to January 2021, you must
      submit a declaration letter to your landlord for any months you cannot pay
      in full. You must also pay a minimum of 25% of the total rent owed, by
      January 31, 2021. To satisfy this requirement, you can either pay 25% each
      month, or you can make one payment as long as you pay the 25% of the total
      rent before January 31, 2021.
    </p>
    <p>
      You must submit the declaration letter each month to your landlord stating
      that you are unable to pay rent and the reasons why. The updated
      NoRent.org tool satisfies the requirements for you to be able to
      successfully mail a declaration letter to your landlord.
    </p>

    <EmailCta href={props.ctaURL}>
      Send a declaration letter to your landlord now
    </EmailCta>
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
