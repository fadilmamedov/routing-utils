import { ServiceArea } from "../types";
import { api } from "./api";

export async function fetchServiceAreas() {
  const response = await api.get<ServiceArea[]>("logistics/api/v1/service_areas");
  return response.data;
}
