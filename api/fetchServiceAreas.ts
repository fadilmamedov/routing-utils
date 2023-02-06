import { api } from "./api";
import { ServiceArea } from "../types";

export async function fetchServiceAreas() {
  const response = await api.get<ServiceArea[]>("logistics/api/v1/service_areas");
  return response.data;
}
