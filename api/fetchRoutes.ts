import querystring from "query-string";
import { api } from "./api";
import { Route } from "../types";

export async function fetchRoutes(date: string) {
  const url = querystring.stringifyUrl({
    url: "bvr/api/v1/routes",
    query: {
      date,
    },
  });
  const response = await api.get<{ routes: Route[] }>(url);

  return response.data.routes;
}
