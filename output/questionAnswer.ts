import chalk from "chalk";

export function outputQuestionAnswer(question: string, answer: string) {
  console.log(chalk.green("?"), question, chalk.cyan(answer));
}
