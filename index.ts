import _ from "lodash";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import clipboardy from "clipboardy";

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

import { Location } from "./types";
import { getWarehouseLocation } from "./getWarehouseLocation";
import { getAppointmentLocation } from "./utils";

import { promptFlow, promptServiceArea, promptDate, promptRoute, promptDepartureTime } from "./prompts";
import { outputRouteSummary, outputRouteAnalysis, outputRouteStatistics } from "./output";

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

const selectedServiceArea = await promptServiceArea(serviceAreas);
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

const selectedRoute = await promptRoute(routes);

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
outputRouteStatistics(selectedRoute, directions);

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
