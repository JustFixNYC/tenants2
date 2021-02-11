import { Link, Route } from "react-router-dom";
import React from "react";
import {
  EvictionFreeUnsupportedLocaleChoice,
  EvictionFreeUnsupportedLocaleChoices,
  getEvictionFreeUnsupportedLocaleChoiceLabels,
} from "../../../common-data/evictionfree-unsupported-locale-choices";
import {
  EvictionFreeRoutes,
  useEvictionFreeUnsupportedLocale,
} from "./route-info";
import Page from "../ui/page";
import { OutboundLink } from "../ui/outbound-link";
import classnames from "classnames";

const LocalePage: React.FC<{
  title: string;
  message: string | JSX.Element;
  yes: string;
  no: string;
  /** URL for external Housing Justice for All tool that the "yes" button links to */
  url: string;
  /** Whether the language of the page is right-to-left oriented (i.e. Arabic) */
  isRightToLeft?: boolean;
  locale: EvictionFreeUnsupportedLocaleChoice;
}> = ({ title, message, yes, no, url, isRightToLeft, locale }) => (
  <Page title={title} className="content">
    <section className="hero" lang={locale}>
      <div className="hero-body">
        <div
          className={classnames(
            "container is-tight",
            isRightToLeft && "has-text-right"
          )}
        >
          <h2
            className={classnames(
              "title is-size-3 is-spaced jf-has-text-centered-tablet",
              isRightToLeft && "has-text-right-mobile"
            )}
          >
            {title}
          </h2>
          <br />
          <p className="subtitle is-size-5">{message}</p>
          <br />
          <div className="buttons jf-two-buttons">
            <Link
              to={EvictionFreeRoutes.locale.home}
              className="button is-light is-medium"
            >
              {no}
            </Link>
            <OutboundLink
              href={url}
              className="button jf-is-next-button is-primary is-medium"
            >
              {yes}
            </OutboundLink>
          </div>
        </div>
      </div>
    </section>
  </Page>
);

const LOCALE_PAGES: {
  [key in EvictionFreeUnsupportedLocaleChoice]: JSX.Element;
} = {
  fr: (
    <LocalePage
      title="Ce site Web n'est actuellement pas disponible en français."
      message="Pour remplir le formulaire de déclaration de difficultés en français, vous pouvez utiliser un autre site Web créé par Housing Justice for All. Souhaitez-vous y être redirigé?"
      yes="Oui"
      no="Non"
      url="https://form.123formbuilder.com/5812941/form"
      locale="fr"
    />
  ),
  ht: (
    <LocalePage
      title="Zouti sa a pa disponib kounye a an kreyòl ayisyen."
      message="Pou ranpli fòm deklarasyon difikilte a an kreyòl ayisyen, ou ka itilize yon zouti diferan ki fèt pa Lojman Jistis pou tout moun. Èske ou ta renmen reyorante resous la?"
      yes="Wi"
      no="Non"
      url="https://form.123formbuilder.com/5812941/form"
      locale="ht"
    />
  ),
  pl: (
    <LocalePage
      title="To narzędzie nie jest obecnie dostępne w języku polskim."
      message="Aby wypełnić formularz oświadczenia o trudnej sytuacji w języku polskim, możesz skorzystać z innego narzędzia stworzonego przez Housing Justice for All. Czy chciałbyś zostać tam przekierowany?"
      yes="Tak"
      no="Nie"
      url="https://form.123formbuilder.com/5812941/form"
      locale="pl"
    />
  ),
  ru: (
    <LocalePage
      title="Этот инструмент в настоящее время недоступен на русском языке."
      message="Чтобы заполнить форму декларации о нуждах на русском языке, вы можете использовать другой инструмент, созданный Housing Justice for All. Хотите, чтобы вас перенаправили туда?"
      yes="да"
      no="Нет"
      url="https://form.123formbuilder.com/5812941/form"
      locale="ru"
    />
  ),
  ar: (
    <LocalePage
      isRightToLeft
      title="هذه الموقع لا توجد حاليًا باللغة العربية"
      message={
        <>
          <span dir="rtl">
            لي املئ استمرار"نموذج إقرار التعسر" باللغة العربية, تستطيع استخدام
            الموقع من{" "}
            <span dir="ltr" className="jf-word-glue">
              Housing Justice for All
            </span>
            . تريد توجيهك إلى هذا الموقع؟
          </span>
        </>
      }
      yes="نعم"
      no="لا"
      url="https://form.123formbuilder.com/5812941/form"
      locale="ar"
    />
  ),
  ne: (
    <LocalePage
      title="यो उपकरण हाल नेपालीमा उपलब्ध छैन।"
      message="नेपालीमा कठिनाइ घोषणा फारम भर्न, तपाई हाउजिंग जस्टिस फर अलका लागि बनेको फरक उपकरण प्रयोग गर्न सक्नुहुनेछ। के तपाइँ त्यहाँ पुनःनिर्देशित हुन चाहानुहुन्छ?"
      yes="हो"
      no="होईन"
      url="https://form.123formbuilder.com/5812941/form"
      locale="ne"
    />
  ),
  bn: (
    <LocalePage
      title="এই সরঞ্জামটি বর্তমানে বেনগলায় উপলভ্য নয়।"
      message="বেংলায় কষ্টের ঘোষণার ফর্মটি পূরণ করতে, আপনি সবার জন্য আবাসন জাস্টিসের তৈরি একটি আলাদা সরঞ্জাম ব্যবহার করতে পারেন। আপনি কি সেখানে পুনঃনির্দেশিত হতে চান?"
      yes="হ্যাঁ"
      no="না"
      url="https://form.123formbuilder.com/5812941/form"
      locale="bn"
    />
  ),
  zh: (
    <LocalePage
      title="這個網站沒有中文 。"
      message="要用中文填寫艱苦生活宣言表，您可以使用“Housing Justice for All”提供的其他工具。您要重定向到那裡嗎？"
      yes="是"
      no="不要"
      url="https://form.123formbuilder.com/5812941/form"
      locale="zh"
    />
  ),
  ko: (
    <LocalePage
      title="이 웹사이트는 현재 한국어 서비스가 지원 되지 않습니다."
      message="이 온라인 Hardship Declaration Form을 (Covid로 인한 경제적 어려움을 겪는 입주민들위한 법원에 보내는 진정서) 작성하시려면 Housing Justice for All 에서 제공하는 다른 웹사이트를 사용해주시길 바랍니다. 해당 사이트로 바로 이동하시겠습니까?"
      yes="예"
      no="아니요"
      url="https://form.123formbuilder.com/5812941/form"
      locale="ko"
    />
  ),
};

const UnsupportedLocalePage: React.FC<{
  locale: EvictionFreeUnsupportedLocaleChoice;
}> = ({ locale }) => LOCALE_PAGES[locale];

export function createEvictionFreeUnsupportedLocaleRoutes(): JSX.Element[] {
  return EvictionFreeUnsupportedLocaleChoices.map((locale) => {
    return (
      <Route
        key={`unsupported_locale_${locale}`}
        path={EvictionFreeRoutes.unsupportedLocale[locale]}
        render={() => <UnsupportedLocalePage locale={locale} />}
      />
    );
  });
}

export const SwitchToUnsupportedLanguage: React.FC<{
  locale: EvictionFreeUnsupportedLocaleChoice;
  className?: string;
}> = ({ locale, className }) => {
  const unsupportedLocale = useEvictionFreeUnsupportedLocale();
  const language = getEvictionFreeUnsupportedLocaleChoiceLabels()[locale];

  if (unsupportedLocale === locale) {
    return <>{language}</>;
  }

  // Note that we want to use an <a> rather than a <Link> here
  // because we want the rest of the page (navbar etc) to reset to
  // the default of English if we're currently in a different locale.
  return (
    <a
      href={EvictionFreeRoutes.unsupportedLocale[locale]}
      className={className}
    >
      {language}
    </a>
  );
};
