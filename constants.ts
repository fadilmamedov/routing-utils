import * as dotenv from "dotenv";

dotenv.config();

assertEnv("MAPBOX_ACCESS_TOKEN", process.env.MAPBOX_ACCESS_TOKEN);
assertEnv("API", process.env.API);

export const API = process.env.API;
export const AUTH_TOKEN = process.env.AUTH_TOKEN;
export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export function assertEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) throw new Error(`Environment variable ${name} is not defined`);
}
