import _ from "lodash";
import chalk from "chalk";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import { table } from "table";

import { Leg } from "@mapbox/mapbox-sdk/services/directions";

import { Route } from "../types";
import { getRouteLabel } from "../utils";

dayjs.extend(dayjsDuration);

export function outputRouteSummary(route: Route, directions: Leg[]) {
  const totalDistanceMeters = _.sumBy(directions, "distance");
  const totalDistanceKm = totalDistanceMeters / 1000;

  const totalDurationSeconds = _.sumBy(directions, "duration");
  const totalDuration = dayjs.duration(totalDurationSeconds, "seconds");

  const output = table(
    [
      [chalk.green("Route"), chalk.green("Total Distance (km)"), chalk.green("Total Duration")],
      [getRouteLabel(route), totalDistanceKm.toFixed(2), totalDuration.format("HH:mm:ss")],
    ],
    {
      columnDefault: {
        alignment: "center",
      },
      header: {
        alignment: "center",
        content: "Route summary",
      },
    }
  );
  console.log(output);
}
