import { VehicleHub } from "../types";
import { api } from "./api";

export async function fetchVehicleHubs() {
  const response = await api.get<VehicleHub[]>("logistics/api/v1/hubs");
  return response.data;
}
