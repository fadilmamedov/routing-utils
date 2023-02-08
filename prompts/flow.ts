import inquirer from "inquirer";

import { options } from "../options";
import { outputQuestionAnswer } from "../output";

export async function promptFlow() {
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
