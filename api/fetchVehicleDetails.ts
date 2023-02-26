import { Vehicle } from "../types";
import { api } from "./api";

export async function fetchVehicleDetails(vehicleId: string, date: string) {
  const response = await api.get<Vehicle>(`api/v1/vehicles/${vehicleId}?date=${date}`);
  return response.data;
}
