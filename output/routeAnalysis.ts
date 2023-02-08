import chalk from "chalk";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import { table } from "table";

import { Route, RouteAnalysis } from "../types";
import { getRouteLabel } from "../utils";

dayjs.extend(dayjsDuration);

export function outputRouteAnalysis(route: Route, routeAnalysis: RouteAnalysis) {
  const totalDistanceKm = routeAnalysis.analysis.total_travel_distance_in_meters / 1000;
  const totalDuration = dayjs.duration(routeAnalysis.analysis.total_duration_in_seconds, "seconds");

  const output = table(
    [
      [chalk.green("Route"), chalk.green("Total distance (km)"), chalk.green("Total Duration")],
      [getRouteLabel(route), totalDistanceKm.toFixed(2), totalDuration.format("HH:mm:ss")],
    ],
    {
      columnDefault: {
        alignment: "center",
      },
      header: {
        alignment: "center",
        content: "Route analysis",
      },
    }
  );
  console.log(output);
}
