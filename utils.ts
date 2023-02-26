import { Appointment, Location, Route, VehicleHub } from "./types";

export function getAppointmentLocation(appointment: Appointment): Location {
  if (appointment.location) return [appointment.location.coordinates.lng, appointment.location.coordinates.lat];

  return [appointment.address.coordinates.lng, appointment.address.coordinates.lat];
}

export function getHubLocation(hub: VehicleHub): Location {
  return [hub.longitude_latitude.x, hub.longitude_latitude.y];
}

export function getRouteLabel(route: Route) {
  return `R#${route.route_number} - ${route.route_name ?? "No Nickname"}`;
}

export function getHubLabel(hub: VehicleHub) {
  return `${hub.name} (${hub.city})`;
}
