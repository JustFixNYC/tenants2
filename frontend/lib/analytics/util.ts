import { AmplitudeEvent, logAmplitudeEvent } from "./amplitude";
// import { ga } from "./google-analytics";

export function logEvent(name: AmplitudeEvent, data?: any): void {
  logAmplitudeEvent(name, data);
  // ga("send", "event", data);
}
