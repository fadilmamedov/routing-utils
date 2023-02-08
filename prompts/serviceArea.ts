import _ from "lodash";
import chalk from "chalk";
import inquirer from "inquirer";

import { ServiceArea } from "../types";
import { options } from "../options";
import { outputQuestionAnswer } from "../output";

export async function promptServiceArea(serviceAreas: ServiceArea[]) {
  if (options.serviceArea) {
    const serviceArea = getServiceAreaByName(options.serviceArea, serviceAreas);
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
  return getServiceAreaByName(selectedServiceAreaName, serviceAreas);
}

function getServiceAreaByName(name: string, serviceAreas: ServiceArea[]) {
  return serviceAreas.find((serviceArea) => serviceArea.name === name) as ServiceArea;
}

function getServiceAreaLabel(serviceArea: ServiceArea) {
  return `${serviceArea.humanized_name} ${chalk.dim(_.upperCase(serviceArea.name))}`;
}
