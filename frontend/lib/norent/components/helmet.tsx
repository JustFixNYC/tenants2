import React, { useContext } from "react";
import { Helmet } from "react-helmet-async";
import { getNorentImageSrc } from "../homepage";
import { useSiteName } from "../../ui/page";
import { AppContext } from "../../app-context";
import { li18n } from "../../i18n-lingui";
import { t } from "@lingui/macro";

const favicon16 = getNorentImageSrc("favicon-16x16", "png");
const favicon32 = getNorentImageSrc("favicon-32x32", "png");
const favicon96 = getNorentImageSrc("favicon-96x96", "png");

const TWITTER_HANDLE = "@JustFixNYC";

const description = () =>
  li18n._(
    t`Millions of Americans won’t be able to pay rent because of COVID‑19. Use our free tool to take action by writing a letter to your landlord. You're not alone.`
  );
const keywords = () =>
  li18n._(t`pay rent, rent, can't pay rent, june rent, june 1`);

export const NorentHelmet = () => {
  const { server } = useContext(AppContext);
  const siteName = useSiteName();
  const shareImageSrc = `${server.staticURL}${getNorentImageSrc(
    "social-share",
    "png"
  )}`;
  return (
    <Helmet
      link={[
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: `${server.staticURL}${favicon16}`,
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: `${server.staticURL}${favicon32}`,
        },
        {
          rel: "shortcut icon",
          type: "image/png",
          href: `${server.staticURL}${favicon96}`,
        },
        { rel: "canonical", href: `${server.originURL}` },
      ]}
    >
      <meta name="description" content={description()} />
      <meta name="keywords" content={keywords()} />
      <meta name="author" content="JustFix" />

      {server.facebookAppId && (
        <meta property="fb:app_id" content={server.facebookAppId} />
      )}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:description" content={description()} />
      <meta property="og:url" content={server.originURL} />
      <meta property="og:image" content={shareImageSrc} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:description" content={description()} />
      <meta name="twitter:url" content={server.originURL} />
      <meta name="twitter:image" content={shareImageSrc} />
      <meta name="twitter:image:alt" content={li18n._(t`Can't pay rent?`)} />
    </Helmet>
  );
};
