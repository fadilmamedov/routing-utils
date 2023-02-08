import commandLineArgs from "command-line-args";

export type Options = {
  flow: string;
  serviceArea: string;
  date: string;
  route: string;
  departureTime: string;
};

export const options = commandLineArgs([
  { name: "flow", alias: "f", type: String },
  { name: "serviceArea", alias: "s", type: String },
  { name: "date", alias: "d", type: String },
  { name: "route", alias: "r", type: String },
  { name: "departureTime", alias: "t", type: String },
]) as Options;
