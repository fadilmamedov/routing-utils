import _ from "lodash";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import clipboardy from "clipboardy";
import { table } from "table";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration";
import { Leg } from "@mapbox/mapbox-sdk/services/directions";

import { AUTH_TOKEN } from "./constants";
import {
  api,
  silverApi,
  login,
  fetchServiceAreas,
  fetchRoutes,
  fetchAppointments,
  fetchDirections,
  fetchRouteAnalysis,
} from "./api";

import { Route, Location, ServiceArea, RouteAnalysis } from "./types";
import { getWarehouseLocation } from "./getWarehouseLocation";
import { getAppointmentLocation } from "./utils";

dayjs.extend(dayjsDuration);

const spinner = ora();

main();

async function main() {
  let authToken: string;

  if (AUTH_TOKEN === undefined) {
    console.log("No authentication token provided in environment variables. Please sign in");
    authToken = await authenticate();
  } else {
    authToken = AUTH_TOKEN;
  }
  api.defaults.headers["Authorization"] = `Bearer ${authToken}`;
  silverApi.defaults.headers["Authorization"] = `Bearer ${authToken}`;

  const { flow } = await inquirer.prompt<{ flow: string }>([
    {
      name: "flow",
      message: "Select flow",
      type: "list",
      choices: ["GoBolt", "IKEA"],
    },
  ]);

  spinner.text = "Fetching service areas...";
  spinner.start();
  const serviceAreas = await fetchServiceAreas();
  spinner.stop();

  let { selectedServiceAreaName } = await inquirer.prompt<{ selectedServiceAreaName: string }>([
    {
      name: "selectedServiceAreaName",
      message: "Select service area",
      type: "list",
      default: "yyz",
      choices: serviceAreas.map((serviceArea) => ({
        name: getServiceAreaLabel(serviceArea),
        value: serviceArea.name,
      })),
    },
  ]);
  const selectedServiceArea = serviceAreas.find((serviceArea) => serviceArea.name === selectedServiceAreaName);
  if (!selectedServiceArea) return;

  const { selectedDate } = await inquirer.prompt<{ selectedDate: string }>([
    {
      name: "selectedDate",
      message: "Enter date",
      // FIXME
      default: "2023-01-20", // dayjs().format("YYYY-MM-DD"),
    },
  ]);

  spinner.text = "Fetching routes and appointments...";
  spinner.start();
  const [allRoutes, appointments] = await Promise.all([
    fetchRoutes(selectedDate),
    fetchAppointments(flow, selectedDate, selectedServiceArea),
  ]);
  spinner.stop();

  const appointmentsLib = _.keyBy(appointments, (appt) => appt.id);

  const routes = allRoutes.filter((route) => {
    return route.route_items.every((routeItem) => appointmentsLib[routeItem.appointment_id]);
  });

  const { selectedRouteId } = await inquirer.prompt<{ selectedRouteId: string }>([
    {
      name: "selectedRouteId",
      message: "Select route",
      type: "list",
      choices: routes.map((route) => ({
        name: `${getRouteLabel(route)} ${chalk.dim(`[${route.id}]`)}`,
        value: route.id,
      })),
    },
  ]);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId);
  if (!selectedRoute) return;

  const selectedRouteAppointments = selectedRoute.route_items.map(
    ({ appointment_id }) => appointmentsLib[appointment_id]
  );
  const selectedRouteFirstAppointment = selectedRouteAppointments[0];

  const warehouseLocation = getWarehouseLocation(selectedServiceArea.name, selectedRouteFirstAppointment.delivery_type);
  if (!warehouseLocation) {
    console.log(chalk.red("Can't find warehouse location"));
    return;
  }

  const selectedRouteLocations = selectedRoute.route_items.map((routeItem): Location => {
    const appointment = appointmentsLib[routeItem.appointment_id];
    return getAppointmentLocation(appointment);
  });

  spinner.text = "Fetching directions...";
  spinner.start();
  const directions = await fetchDirections([warehouseLocation, ...selectedRouteLocations, warehouseLocation]);
  spinner.stop();

  outputRouteSummary(selectedRoute, directions);

  spinner.text = "Fetching route analysis...";
  spinner.start();
  const routeAnalysis = await fetchRouteAnalysis(selectedRoute);
  spinner.stop();

  if (!routeAnalysis) {
    console.log(chalk.red("Can't find route analysis for the selected route"));
  } else {
    outputRouteAnalysis(selectedRoute, routeAnalysis);
  }
}

async function authenticate() {
  while (true) {
    const { email, password } = await inquirer.prompt<{ email: string; password: string }>([
      {
        name: "email",
        message: "Enter email",
      },
      {
        name: "password",
        type: "password",
        mask: "*",
        message: "Password",
      },
    ]);

    try {
      spinner.text = "Authenticating...";
      spinner.start();
      const { token, user } = await login(email, password);
      spinner.stop();

      const userNameString = `${user.first_name} ${user.last_name} (${user.email})`;
      console.log(`Logged in as ${chalk.green(userNameString)}`);

      clipboardy.writeSync(token.token);
      console.log(
        `Your authentication token has been copied to clipboard.`,
        `Save it into ${chalk.blue(".env")} file to sign in authomatically`
      );

      return token.token;
    } catch {
      spinner.stop();
      console.log(chalk.red("Invalid credentials. Try again"));
    }
  }
}

function getRouteLabel(route: Route) {
  return `R#${route.route_number} - ${route.route_name ?? "No Nickname"}`;
}

function getServiceAreaLabel(serviceArea: ServiceArea) {
  return `${serviceArea.humanized_name} ${chalk.dim(_.upperCase(serviceArea.name))}`;
}

function outputRouteSummary(route: Route, directions: Leg[]) {
  const totalDistanceMeters = _.sumBy(directions, "distance");
  const totalDistanceKm = totalDistanceMeters / 1000;

  const totalDurationSeconds = _.sumBy(directions, "duration");
  const totalDuration = dayjs.duration(totalDurationSeconds, "seconds");

  console.log(chalk.blue("Route summary"));
  const output = table(
    [
      [chalk.green("Route"), chalk.green("Total Distance (km)"), chalk.green("Total Duration")],
      [getRouteLabel(route), totalDistanceKm.toFixed(2), totalDuration.format("HH:mm:ss")],
    ],
    {
      columnDefault: {
        alignment: "center",
      },
    }
  );
  console.log(output);
}

function outputRouteAnalysis(route: Route, routeAnalysis: RouteAnalysis) {
  const totalDistanceKm = routeAnalysis.analysis.total_travel_distance_in_meters / 1000;
  const totalDuration = dayjs.duration(routeAnalysis.analysis.total_duration_in_seconds, "seconds");

  console.log(chalk.blue("Route analysis"));
  const output = table(
    [
      [chalk.green("Route"), chalk.green("Total distance (km)"), chalk.green("Total Duration")],
      [getRouteLabel(route), totalDistanceKm.toFixed(2), totalDuration.format("HH:mm:ss")],
    ],
    {
      columnDefault: {
        alignment: "center",
      },
    }
  );
  console.log(output);
}
