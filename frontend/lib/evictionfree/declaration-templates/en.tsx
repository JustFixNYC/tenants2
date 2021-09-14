import React from "react";
import {
  HardshipDeclarationCheckbox,
  HardshipDeclarationFC,
  HardshipDeclarationFilledField as FilledField,
} from ".";

const HardshipDeclarationEnglish: HardshipDeclarationFC = (props) => (
  <>
    <p>
      Index Number (if known/applicable):{" "}
      <FilledField>{props.indexNumber || ""}</FilledField>
    </p>
    <p>
      County and Court (if known/applicable):{" "}
      <FilledField>{props.countyAndCourt || ""}</FilledField>
    </p>
    <h2>Tenant’s Declaration Of Hardship During The Covid-19 Pandemic</h2>
    <p>
      I am a tenant, lawful occupant, or other person responsible for paying
      rent, use and occupancy, or any other financial obligation under a lease
      or tenancy agreement at (address of dwelling unit):
    </p>
    <p>
      <FilledField>{props.address}</FilledField>
    </p>
    <p>
      <strong>
        You must indicate below your qualification for eviction protection by
        selecting option “A” or “B”, or both.
      </strong>
    </p>

    <p>
      <HardshipDeclarationCheckbox checked={props.hasFinancialHardship} />
      A. I am experiencing financial hardship, and I am unable to pay my rent or
      other financial obligations under the lease in full or obtain alternative
      suitable permanent housing because of one or more of the following:
    </p>
    <ol>
      <li>
        Significant loss of household income during the COVID-19 pandemic.
      </li>
      <li>
        Increase in necessary out-of-pocket expenses related to performing
        essential work or related to health impacts during the COVID-19
        pandemic.
      </li>
      <li>
        Childcare responsibilities or responsibilities to care for an elderly,
        disabled, or sick family member during the COVID-19 pandemic have
        negatively affected my ability or the ability of someone in my household
        to obtain meaningful employment or earn income or increased my necessary
        out-of-pocket expenses.
      </li>
      <li>
        Moving expenses and difficulty I have securing alternative housing make
        it a hardship for me to relocate to another residence during the
        COVID-19 pandemic.
      </li>

      <li>
        Other circumstances related to the COVID-19 pandemic have negatively
        affected my ability to obtain meaningful employment or earn income or
        have significantly reduced my household income or significantly
        increased my expenses.
      </li>
    </ol>
    <p>
      To the extent that I have lost household income or had increased expenses,
      any public assistance, including unemployment insurance, pandemic
      unemployment assistance, disability insurance, or paid family leave, that
      I have received since the start of the COVID-19 pandemic does not fully
      make up for my loss of household income or increased expenses.
    </p>
    <p>
      <HardshipDeclarationCheckbox checked={props.hasHealthRisk} />
      B. Vacating the premises and moving into new permanent housing would pose
      a significant health risk because I or one or more members of my household
      have an increased risk for severe illness or death from COVID-19 due to
      being over the age of sixty-five, having a disability or having an
      underlying medical condition, which may include but is not limited to
      being immunocompromised.
    </p>
    <p>
      I understand that I must comply with all other lawful terms under my
      tenancy, lease agreement or similar contract. I further understand that
      lawful fees, penalties or interest for not having paid rent in full or met
      other financial obligations as required by my tenancy, lease agreement or
      similar contract may still be charged or collected and may result in a
      monetary judgment against me. I further understand that my landlord may
      request a hearing to challenge the certification of hardship made herein,
      and that I will have the opportunity to participate in any proceedings
      regarding my tenancy. I further understand that my landlord may be able to
      seek eviction after January 15, 2022, and that the law may provide certain
      protections at that time that are separate from those available through
      this declaration.
    </p>
    <p>
      Signed: <FilledField>{props.name}</FilledField>
    </p>
    <p>
      Printed name: <FilledField>{props.name}</FilledField>
    </p>
    <p>Date signed: {props.date}</p>
    <p>
      NOTICE: You are signing and submitting this form under penalty of law.
      That means it is against the law to make a statement on this form that you
      know is false.
    </p>
  </>
);

export default HardshipDeclarationEnglish;
