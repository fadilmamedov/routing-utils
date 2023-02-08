import { Appointment, Location, Route } from "./types";

export function getAppointmentLocation(appointment: Appointment): Location {
  return [appointment.location.coordinates.lng, appointment.location.coordinates.lat];
}

export function getRouteLabel(route: Route) {
  return `R#${route.route_number} - ${route.route_name ?? "No Nickname"}`;
}
