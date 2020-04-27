import React from "react";
import { Helmet } from "react-helmet-async";
import { getImageSrc } from "../homepage";

const favicon16 = getImageSrc("favicon-16x16", "png");
const favicon32 = getImageSrc("favicon-32x32", "png");
const favicon96 = getImageSrc("favicon-96x96", "png");

const SITE_MAIN_URL = "https://www.norent.org";
const TWITTER_HANDLE = "@JustFixNYC";
// The public-facing FB App ID associated with the JustFixNYC Facebook organization
const FB_APP_ID = "247990609143668";

const title = "NoRent.org";
const description =
  "Millions of Americans won’t be able to pay rent because of COVID‑19. Use our free tool to take action by writing a letter to your landlord. You're not alone.";
const keywords = "pay rent, rent, can't pay rent, may rent, may 1";
const shareImageSrc = getImageSrc("social-share", "png");

export const NorentHelmet = () => (
  <Helmet
    link={[
      { rel: "icon", type: "image/png", sizes: "16x16", href: `${favicon16}` },
      { rel: "icon", type: "image/png", sizes: "32x32", href: `${favicon32}` },
      { rel: "shortcut icon", type: "image/png", href: `${favicon96}` },
      { rel: "canonical", href: `${SITE_MAIN_URL}` },
    ]}
  >
    <meta name="description" content={description} />
    <meta name="keywords" content={keywords} />
    <meta name="author" content="JustFix.nyc" />

    <meta property="fb:app_id" content={FB_APP_ID} />
    <meta property="og:site_name" content={title} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={SITE_MAIN_URL} />
    <meta property="og:image" content={encodeURI(shareImageSrc)} />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content={TWITTER_HANDLE} />
    <meta name="twitter:creator" content={TWITTER_HANDLE} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:url" content={SITE_MAIN_URL} />
    <meta name="twitter:image" content={encodeURI(shareImageSrc)} />
    <meta name="twitter:image:alt" content={title} />
  </Helmet>
);
