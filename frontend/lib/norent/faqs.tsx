import React from "react";
import { Accordian } from "./components/accordian";

export const NorentFaqsPreview = () => {
  const headerClasses = "jf-accordian-item has-text-left";
  const contentClasses = "title is-spaced is-size-5";
  return (
    <div className="jf-space-below-2rem">
      <Accordian
        header="I'm scared. What happens if my landlord retaliates?"
        headerClasses={headerClasses}
        contentClasses={contentClasses}
      >
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </Accordian>
      <div className="is-divider" />
      <Accordian
        header="Is this free?"
        headerClasses={headerClasses}
        contentClasses={contentClasses}
      >
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </Accordian>
      <div className="is-divider" />
      <Accordian
        header="Do I have to go to the post office to mail it?"
        headerClasses={headerClasses}
        contentClasses={contentClasses}
      >
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </Accordian>
      <div className="is-divider" />
      <Accordian
        header="Is there someone I can connect with after this to get help?"
        headerClasses={headerClasses}
        contentClasses={contentClasses}
      >
        It’s normal to feel anxious or scared that your landlord will retaliate.
        Remember: it is illegal for your landlord to evict you at this time due
        to reasons of non payment related to COVID-19. It is also illegal for
        your landlord to harass you or deny you repairs. If your landlord
        engages in any of this behavior, contact your local housing rights
        organization.
      </Accordian>
    </div>
  );
};
