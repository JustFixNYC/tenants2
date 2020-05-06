import React, { useContext } from "react";
import { Helmet } from "react-helmet-async";
import { getImageSrc } from "../homepage";
import { useSiteName } from "../../ui/page";
import { AppContext } from "../../app-context";

const favicon16 = getImageSrc("favicon-16x16", "png");
const favicon32 = getImageSrc("favicon-32x32", "png");
const favicon96 = getImageSrc("favicon-96x96", "png");

const TWITTER_HANDLE = "@JustFixNYC";

const description =
  "Millions of Americans won’t be able to pay rent because of COVID‑19. Use our free tool to take action by writing a letter to your landlord. You're not alone.";
const keywords = "pay rent, rent, can't pay rent, may rent, may 1";

export const NorentHelmet = () => {
  const { server } = useContext(AppContext);
  const siteName = useSiteName();
  const shareImageSrc = `${server.staticURL}${getImageSrc(
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
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="JustFix.nyc" />

      {server.facebookAppId && (
        <meta property="fb:app_id" content={server.facebookAppId} />
      )}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={server.originURL} />
      <meta property="og:image" content={shareImageSrc} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={server.originURL} />
      <meta name="twitter:image" content={shareImageSrc} />
      <meta name="twitter:image:alt" content="Can't pay rent?" />
    </Helmet>
  );
};
