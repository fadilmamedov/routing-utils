import { Leg } from "@mapbox/mapbox-sdk/services/directions";
import chalk from "chalk";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import _ from "lodash";
import { table } from "table";

dayjs.extend(dayjsDuration);

export function outputRouteSummary(directions: Leg[]) {
  const totalDistanceMeters = _.sumBy(directions, "distance");
  const totalDistanceKm = totalDistanceMeters / 1000;

  const totalTravelDurationSeconds = _.sumBy(directions, "duration");
  const totalTravelDuration = dayjs.duration(totalTravelDurationSeconds, "seconds");

  const output = table(
    [
      [chalk.green("Total Distance (km)"), chalk.green("Total Travel Duration")],
      [totalDistanceKm.toFixed(2), totalTravelDuration.format("HH:mm:ss")],
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
