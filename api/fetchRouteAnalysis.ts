import { Route, RouteAnalysis } from "../types";
import { silverApi } from "./api";

export async function fetchRouteAnalysis(route: Route) {
  const response = await silverApi.post<RouteAnalysis[]>("routing/route-analysis", {
    route_ids: [route.id],
  });
  return response.data[0];
}
