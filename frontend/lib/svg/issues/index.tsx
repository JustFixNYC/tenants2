const ISSUE_AREA_SVGS: { [area: string]: JSX.Element | undefined } = {
  BATHROOMS: require("./bathrooms.svg") as JSX.Element,
  BEDROOMS: require("./bedrooms.svg") as JSX.Element,
  HOME: require("./home.svg") as JSX.Element,
  KITCHEN: require("./kitchen.svg") as JSX.Element,
  LANDLORD: require("./landlord.svg") as JSX.Element,
  LIVING_ROOM: require("./living-room.svg") as JSX.Element,
  PUBLIC_AREAS: require("./public-areas.svg") as JSX.Element,
};

export default ISSUE_AREA_SVGS;
