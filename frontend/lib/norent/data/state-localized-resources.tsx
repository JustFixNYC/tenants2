import { USStateChoice } from "../../../../common-data/us-state-choices";
import { t } from "@lingui/macro";
import { LocalizedOutboundLinkProps } from "../../ui/localized-outbound-link";

export type StateLocalizedResources = Partial<
  {
    [k in USStateChoice]: LocalizedOutboundLinkProps[];
  }
>;

export const STATE_LOCALIZED_RESOURCES: StateLocalizedResources = {
  NY: [
    {
      text: t`Eviction Moratorium updates`,
      urls: {
        en:
          "https://d3n8a8pro7vhmx.cloudfront.net/righttocounselnyc/pages/191/attachments/original/1590431823/Impact_of_May_7_Order_on_the_Eviction_Moratorium__Last_Updated_5_23_.pdf?1590431823",
        es:
          "https://docs.google.com/document/d/1uzT1lduZAzNLpy_WxSOU1oSOTOPs0YrWekzLd8o6tAs/edit",
      },
    },
    {
      text: t`Cancel Rent Campaign`,
      urls: {
        en: "https://actionnetwork.org/forms/mayday-cantpay",
        es:
          "https://docs.google.com/document/d/1hPPq5AQJvn-HwaBvg2Rl2kRb0BiNWtpXgT_-PN5tdgw/edit",
      },
    },
    {
      text: t`Rent Strike Organizing`,
      urls: {
        en:
          "https://d3n8a8pro7vhmx.cloudfront.net/righttocounselnyc/pages/100/attachments/original/1585739362/RTCNYC.COVID19.4.pdf?1585739362",
        es:
          "https://d3n8a8pro7vhmx.cloudfront.net/righttocounselnyc/pages/100/attachments/original/1586436761/Huelga_de_Renta_.pdf?1586436761",
      },
    },
  ],
};
