export type ServiceArea = {
  name: string;
  humanized_name: string;
  timezone: string;
  timezone_iana: string;
  address: {
    country: "CA" | "US";
  };
};

export type VehicleHub = {
  id: string;
  name: string;
  city: string;
  longitude_latitude: {
    x: number;
    y: number;
  };
};

export type Vehicle = {
  id: string;
  hub: Pick<VehicleHub, "id" | "name">;
};

export type Route = {
  id: string;
  route_name: string;
  route_number: string;
  route_items: RouteItem[];
  vehicle_id: string;
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
  address: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  source: {
    customer: {
      name: string;
    };
  };
};

export type RouteAnalysis = {
  analysis: {
    appointments: {
      appointment_id: string;
      start_time: string | null;
      end_time: string | null;
    }[];
    total_duration_in_seconds: number;
    total_travel_distance_in_meters: number;
  };
};

export type Location = [number, number];
