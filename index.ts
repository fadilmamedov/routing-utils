import _ from "lodash";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import clipboardy from "clipboardy";
import commandLineArgs from "command-line-args";
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

type Options = {
  flow: string;
  serviceArea: string;
  date: string;
  route: string;
  departureTime: string;
};
const options = commandLineArgs([
  { name: "flow", alias: "f", type: String },
  { name: "serviceArea", alias: "s", type: String },
  { name: "date", alias: "d", type: String },
  { name: "route", alias: "r", type: String },
  { name: "departureTime", alias: "t", type: String },
]) as Options;

dayjs.extend(dayjsDuration);

const spinner = ora();

let authToken: string;

if (AUTH_TOKEN === undefined) {
  console.log("No authentication token provided in environment variables. Please sign in");
  authToken = await authenticate();
} else {
  authToken = AUTH_TOKEN;
}
api.defaults.headers["Authorization"] = `Bearer ${authToken}`;
silverApi.defaults.headers["Authorization"] = `Bearer ${authToken}`;

const selectedFlow = await promptFlow();

spinner.text = "Fetching service areas...";
spinner.start();
const serviceAreas = await fetchServiceAreas();
spinner.stop();

const selectedServiceArea = await promptServiceArea();
const selectedDate = await promptDate();

spinner.text = "Fetching routes and appointments...";
spinner.start();
const [allRoutes, appointments] = await Promise.all([
  fetchRoutes(selectedDate),
  fetchAppointments(selectedFlow, selectedDate, selectedServiceArea),
]);
spinner.stop();

const appointmentsLib = _.keyBy(appointments, (appt) => appt.id);

const routes = allRoutes.filter((route) => {
  return route.route_items.every((routeItem) => appointmentsLib[routeItem.appointment_id]);
});

const selectedRoute = await promptRoute();

const selectedRouteAppointments = selectedRoute.route_items.map(
  ({ appointment_id }) => appointmentsLib[appointment_id]
);
const selectedRouteFirstAppointment = selectedRouteAppointments[0];

const warehouseLocation = getWarehouseLocation(selectedServiceArea.name, selectedRouteFirstAppointment.delivery_type);
if (!warehouseLocation) {
  console.log(chalk.red("Can't find warehouse location"));
  process.exit(1);
}

const selectedRouteLocations = selectedRoute.route_items.map((routeItem): Location => {
  const appointment = appointmentsLib[routeItem.appointment_id];
  return getAppointmentLocation(appointment);
});

const departureTime = await promptDepartureTime();
const departureDateTime = `${selectedDate}T${departureTime}`;

spinner.text = "Fetching directions...";
spinner.start();
const directions = await fetchDirections(
  [warehouseLocation, ...selectedRouteLocations, warehouseLocation],
  departureDateTime
);
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

const command = `npm run main -- -f ${selectedFlow} -s ${selectedServiceArea.name} -d ${selectedDate} -r ${selectedRoute.id} -t ${departureTime}`;
clipboardy.writeSync(command);
console.log(`Command: ${chalk.cyan(command)}. Copied to clipboard`);

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

async function promptFlow() {
  if (options.flow) {
    outputQuestionAnswer("Select flow", options.flow);
    return options.flow;
  }

  const { flow } = await inquirer.prompt<{ flow: string }>([
    {
      name: "flow",
      message: "Select flow",
      type: "list",
      choices: ["GoBolt", "IKEA"],
    },
  ]);
  return flow;
}

async function promptServiceArea() {
  if (options.serviceArea) {
    const serviceArea = getServiceAreaByName(options.serviceArea);
    outputQuestionAnswer("Select service area", getServiceAreaLabel(serviceArea));
    return serviceArea;
  }

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
  return getServiceAreaByName(selectedServiceAreaName);

  function getServiceAreaByName(name: string) {
    return serviceAreas.find((serviceArea) => serviceArea.name === name) as ServiceArea;
  }
}

async function promptDate() {
  if (options.date) {
    outputQuestionAnswer("Select date", options.date);
    return options.date;
  }

  const { selectedDate } = await inquirer.prompt<{ selectedDate: string }>([
    {
      name: "selectedDate",
      message: "Select date",
      default: dayjs().format("YYYY-MM-DD"),
    },
  ]);
  return selectedDate;
}

async function promptRoute() {
  if (options.route) {
    const route = getRouteById(options.route);
    outputQuestionAnswer("Select route", `${getRouteLabel(route)} ${chalk.dim(`[${route.id}]`)}`);
    return route;
  }

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
  return getRouteById(selectedRouteId);

  function getRouteById(id: string) {
    return routes.find((route) => route.id === id) as Route;
  }
}

async function promptDepartureTime() {
  if (options.departureTime) {
    outputQuestionAnswer("Select departure time in local timezone", options.departureTime);
    return options.departureTime;
  }

  const { departureTime } = await inquirer.prompt<{ departureTime: string }>([
    {
      name: "departureTime",
      message: "Select departure time in local timezone",
      default: "09:00",
    },
  ]);
  return departureTime;
}

function outputRouteSummary(route: Route, directions: Leg[]) {
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

function outputRouteAnalysis(route: Route, routeAnalysis: RouteAnalysis) {
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

function getRouteLabel(route: Route) {
  return `R#${route.route_number} - ${route.route_name ?? "No Nickname"}`;
}

function getServiceAreaLabel(serviceArea: ServiceArea) {
  return `${serviceArea.humanized_name} ${chalk.dim(_.upperCase(serviceArea.name))}`;
}

function outputQuestionAnswer(question: string, answer: string) {
  console.log(chalk.green("?"), question, chalk.cyan(answer));
}
