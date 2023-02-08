import inquirer from "inquirer";
import dayjs from "dayjs";

import { options } from "../options";
import { outputQuestionAnswer } from "../output";

export async function promptDate() {
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
