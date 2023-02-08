import inquirer from "inquirer";

import { options } from "../options";
import { outputQuestionAnswer } from "../output";

export async function promptDepartureTime() {
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
