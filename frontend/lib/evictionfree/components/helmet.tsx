import React, { useContext } from "react";
import { Helmet } from "react-helmet-async";
import { getEFImageSrc } from "../homepage";
import { useSiteName } from "../../ui/page";
import { AppContext } from "../../app-context";

const favicon16 = getEFImageSrc("favicon-16x16", "png");
const favicon32 = getEFImageSrc("favicon-32x32", "png");
const favicon96 = getEFImageSrc("favicon-96x96", "png");

const TWITTER_HANDLE = "@JustFixNYC";

const description = () =>
  `Use this website to send a hardship declaration form to your landlord and your local courts to put your eviction case on hold until May 1st, 2021.`;
const keywords = () =>
  `eviction free nyc, eviction free, hardship, declaration, declare hardship, new york, new york city, nyc, lawyer, legal aid, housing, tenants, tenants rights, help, assistance, legal services, eviction, evicted`;

export const EvictionFreeHelmet = () => {
  const { server } = useContext(AppContext);
  const siteName = useSiteName();
  const shareImageSrc = `${server.staticURL}${getEFImageSrc(
    // TODO: Update this link with actual social share image
    "forms",
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
      <meta name="author" content="JustFix.nyc" />

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
      {/* TODO: Update this with actual alt text*/}
      <meta name="twitter:image:alt" content="" />
    </Helmet>
  );
};
