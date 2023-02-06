import { Appointment, Location } from "./types";

export function getAppointmentLocation(appointment: Appointment): Location {
  return [appointment.location.coordinates.lng, appointment.location.coordinates.lat];
}
