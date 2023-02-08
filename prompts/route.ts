import chalk from "chalk";
import inquirer from "inquirer";

import { Route } from "../types";
import { options } from "../options";
import { outputQuestionAnswer } from "../output";
import { getRouteLabel } from "../utils";

export async function promptRoute(routes: Route[]) {
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
