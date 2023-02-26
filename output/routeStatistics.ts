import { Leg } from "@mapbox/mapbox-sdk/services/directions";
import chalk from "chalk";
import dayjs, { Dayjs } from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import dayjsTimezone from "dayjs/plugin/timezone";
import dayjsUtc from "dayjs/plugin/utc";
import _ from "lodash";
import { table } from "table";
import { getHubLabel } from "../utils";

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsDuration);
dayjs.extend(dayjsTimezone);

import { Appointment, Route, RouteAnalysis, ServiceArea, VehicleHub } from "../types";

type OutputRouteStatisticsOptions = {
  route: Route;
  appointments: Appointment[];
  departureDateTimeLocal: Dayjs;
  directions: Leg[];
  routeAnalysis: RouteAnalysis | undefined;
  serviceArea: ServiceArea;
  hub: VehicleHub;
};

export async function outputRouteStatistics(options: OutputRouteStatisticsOptions) {
  const { route, appointments, directions, departureDateTimeLocal, routeAnalysis, serviceArea, hub } = options;
  const { timezone_iana: timezone } = serviceArea;

  const appointmentsLib = _.keyBy(appointments, (appt) => appt.id);

  let currentDateTimeLocal = departureDateTimeLocal;

  const output = table(
    [
      [
        chalk.green("Sequence"),
        chalk.green("Title"),
        chalk.green("Travel duration"),
        chalk.green("Stop duration\nplanned / actual"),
        chalk.green("Arrival time\nestimated / actual"),
        chalk.green("Departure time\nestimated / actual"),
      ],

      [0, getHubLabel(hub), "—", "—", "—", departureDateTimeLocal.format("HH:mm")],

      ...route.route_items.map(({ sequence, appointment_id }, index) => {
        const appt = appointmentsLib[appointment_id];
        const stopDurationSeconds = getStopDurationSeconds(appt);
        const { duration: travelDurationSeconds } = directions[index];
        const apptAnalysis = routeAnalysis?.analysis.appointments.find(
          ({ appointment_id }) => appointment_id === appt.id
        );

        const actualStartDateTimeLocal = apptAnalysis?.start_time
          ? dayjs.utc(apptAnalysis.start_time).tz(timezone)
          : undefined;
        const actualEndDateTimeLocal = apptAnalysis?.end_time
          ? dayjs.utc(apptAnalysis.end_time).tz(timezone)
          : undefined;

        const stopDurationPlanned = dayjs.duration(stopDurationSeconds, "seconds");
        const stopDurationActual =
          actualStartDateTimeLocal &&
          actualEndDateTimeLocal &&
          dayjs.duration(actualEndDateTimeLocal.diff(actualStartDateTimeLocal));

        currentDateTimeLocal = currentDateTimeLocal.add(travelDurationSeconds, "seconds");

        const estimatedStartDateTimeLocal = currentDateTimeLocal;
        const estimatedEndDateTimeLocal = estimatedStartDateTimeLocal.add(stopDurationPlanned);

        currentDateTimeLocal = actualEndDateTimeLocal ?? estimatedEndDateTimeLocal;

        return [
          sequence,
          appt.source.customer.name,
          dayjs.duration(travelDurationSeconds, "seconds").format("HH:mm:ss"),
          `${stopDurationPlanned.format("HH:mm:ss")} / ${stopDurationActual?.format("HH:mm:ss") ?? "—"}`,
          `${estimatedStartDateTimeLocal.format("HH:mm:ss")} / ${actualStartDateTimeLocal?.format("HH:mm:ss") ?? "—"}`,
          `${estimatedEndDateTimeLocal.format("HH:mm:ss")} / ${actualEndDateTimeLocal?.format("HH:mm:ss") ?? "—"}`,
        ];
      }),

      [
        route.route_items.at(-1)!.sequence + 1,
        getHubLabel(hub),
        dayjs.duration(directions.at(-1)!.duration, "seconds").format("HH:mm:ss"),
        "-",
        "-",
        "-",
      ],
    ],
    {
      columnDefault: {
        alignment: "center",
      },
      header: {
        alignment: "center",
        content: "Route statistics",
      },
    }
  );

  console.log(output);
}

function getStopDurationSeconds(appointment: Appointment) {
  const { delivery_type, delivery_service_level } = appointment;

  if (delivery_type === "parcel") {
    return 120;
  }

  if (
    delivery_service_level === "second_closet_to_the_door" ||
    delivery_service_level === "second_closet_to_the_door_1_person"
  )
    return 300;

  if (
    delivery_service_level === "second_closet_standard" ||
    delivery_service_level === "second_closet_standard_1_person"
  )
    return 900;

  if (
    delivery_service_level === "second_closet_room_of_choice" ||
    delivery_service_level === "second_closet_room_of_choice_1_person" ||
    delivery_service_level === "second_closet_white_glove"
  ) {
    return 1500;
  }

  return 900;
}
