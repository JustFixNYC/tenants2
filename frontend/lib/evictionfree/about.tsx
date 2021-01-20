import React from "react";
import Page from "../ui/page";

export const EvictionFreeAboutPage: React.FC<{}> = () => (
  <Page title="About" className="content">
    <section className="hero">
      <div className="hero-body">
        <div className="container">
          <h2 className="title is-spaced jf-has-text-centered-tablet">About</h2>
          <br />
          <p className="subtitle is-size-5">
            A new State law, passed in late 2020, allows tenants impacted by
            COVID-19 to stop any eviction cases against them until May 1st,
            2021, if they fill out a “Hardship Declaration” form. However, this
            law puts the responsibility on tenants to figure out how to do that
            and doesn’t provide easy access to exercise their rights.
          </p>
          <br />
          <p className="subtitle is-size-5">
            Our tool
            helps tenants submit this declaration with peace of mind— sending it
            out via free USPS Certified Mail and email to all of the appropriate
            parties (your landlord and the courts) to ensure protection. And
            since the law doesn’t go far enough to protect folks beyond May 1st,
            our tool connects tenants to the larger tenant movement so we can
            #cancelrent.
          </p>
          <br />
        </div>
      </div>
    </section>

    <section className="hero has-background-white-ter">
      <div className="hero-body">
        <div className="container">
          <h2 className="title is-spaced jf-has-text-centered-tablet">Who we are</h2>
          <br />
          <p className="subtitle is-size-5">
            The Right to Counsel NYC Coalition is a tenant-led, broad-based
            coalition that formed in 2014 to disrupt Housing Court as a center
            of displacement and stop the eviction crisis that has threatened our
            families, our neighborhoods and our homes for too long. Made up of
            tenants, organizers, advocates, legal services organizations and
            more, we are building campaigns for an eviction-free NYC and
            ultimately for a right to housing
          </p>
          <br />
          <p className="subtitle is-size-5">
            Housing Justice For All is a coalition of over 70 organizations that
            represents tenants, homeless New Yorkers, and public housing
            residents from Brooklyn to Buffalo. We are united in our belief that
            housing is a human right; that no person should live in fear of an
            eviction; and that we can end the homelessness crisis in our State.
          </p>
          <br />
          <p className="subtitle is-size-5">
            JustFix.nyc co-designs and builds tools for tenants, housing
            organizers, and legal advocates fighting displacement in New York
            City. Our mission is to galvanize a 21st century tenant movement
            working towards housing for all — and we think the power of data and
            technology should be accessible to those fighting this fight.
          </p>
        </div>
      </div>
    </section>
  </Page>
);
