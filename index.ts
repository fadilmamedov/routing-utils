import chalk from "chalk";
import clipboardy from "clipboardy";
import dayjs from "dayjs";
import dayjsTimezone from "dayjs/plugin/timezone";
import dayjsUtc from "dayjs/plugin/utc";
import inquirer from "inquirer";
import _ from "lodash";
import ora from "ora";
import {
  api,
  fetchAppointments,
  fetchDirections,
  fetchRouteAnalysis,
  fetchRoutes,
  fetchServiceAreas,
  fetchVehicleDetails,
  fetchVehicleHubs,
  login,
  silverApi,
} from "./api";
import { AUTH_TOKEN } from "./constants";
import { outputQuestionAnswer, outputRouteStatistics, outputRouteSummary } from "./output";
import { promptDate, promptDepartureTime, promptFlow, promptRoute, promptServiceArea } from "./prompts";
import { VehicleHub } from "./types";
import { getAppointmentLocation, getHubLabel, getHubLocation } from "./utils";

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTimezone);

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
const selectedDateString = await promptDate();

spinner.text = "Fetching routes and appointments...";
spinner.start();
const [allRoutes, appointments] = await Promise.all([
  fetchRoutes(selectedDateString),
  fetchAppointments(selectedFlow, selectedDateString, selectedServiceArea),
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

spinner.text = "Fetching selected route vehicle hub...";
spinner.start();
const selectedRouteVehicleHub = await getVehicleHub(selectedRoute.vehicle_id, selectedDateString);
spinner.stop();
outputQuestionAnswer("Selected route vehicle hub on the selected date", getHubLabel(selectedRouteVehicleHub));

const selectedRouteVehicleHubLocation = getHubLocation(selectedRouteVehicleHub);
const selectedRouteAppointmentsLocations = selectedRoute.route_items.map((routeItem) =>
  getAppointmentLocation(appointmentsLib[routeItem.appointment_id])
);

const departureTimeString = await promptDepartureTime();
const departureDateTimeLocal = dayjs.tz(
  `${selectedDateString}T${departureTimeString}`,
  selectedServiceArea.timezone_iana
);

spinner.text = "Fetching directions...";
spinner.start();
const selectedRouteDirections = await fetchDirections(
  [selectedRouteVehicleHubLocation, ...selectedRouteAppointmentsLocations, selectedRouteVehicleHubLocation],
  departureDateTimeLocal.format("YYYY-MM-DD[T]HH:mm")
);
spinner.stop();

spinner.text = "Fetching route analysis...";
spinner.start();
const selectedRouteAnalysis = await fetchRouteAnalysis(selectedRoute);
spinner.stop();

outputRouteSummary(selectedRouteDirections);

if (!selectedRouteAnalysis) {
  console.log(chalk.red("Can't find route analysis for the selected route"));
} else {
  outputRouteStatistics({
    route: selectedRoute,
    appointments: selectedRouteAppointments,
    directions: selectedRouteDirections,
    departureDateTimeLocal,
    routeAnalysis: selectedRouteAnalysis,
    serviceArea: selectedServiceArea,
    hub: selectedRouteVehicleHub,
  });
}

const command = `npm run main -- -f ${selectedFlow} -s ${selectedServiceArea.name} -d ${selectedDateString} -r ${selectedRoute.id} -t ${departureTimeString}`;
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

async function getVehicleHub(vehicleId: string, date: string) {
  const vehicle = await fetchVehicleDetails(vehicleId, date);
  const hubs = await fetchVehicleHubs();

  return hubs.find((hub) => hub.id === vehicle.hub.id) as VehicleHub;
}
