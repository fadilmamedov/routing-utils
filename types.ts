export type ServiceArea = {
  name: string;
  humanized_name: string;
  timezone: string;
  timezone_iana: string;
  address: {
    country: "CA" | "US";
  };
};

export type Route = {
  id: string;
  route_name: string;
  route_number: string;
  route_items: RouteItem[];
};

export type RouteItem = {
  appointment_id: string;
  sequence: number;
};

export type Appointment = {
  id: string;
  timerange: string;
  status: string;
  job_type: string;
  delivery_type: "heavy" | "parcel";
  delivery_service_level: string;
  user_firstname: string;
  user_lastname: string;
  location: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
};

export type Location = [number, number];
