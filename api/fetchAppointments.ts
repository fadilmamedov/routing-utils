import querystring, { StringifiableRecord } from "query-string";
import { api } from "./api";
import { Appointment, ServiceArea } from "../types";

const IKEA_ORG_IDS = {
  CA: ["1cc0c40a-43a2-11ea-94b5-df8fd7904ab8", "473ef1d0-2f9e-11ed-ad4a-9b0587508af9"],
  US: "20fa4746-1cdd-11ed-bf7c-bb6eddd7f817",
};

export async function fetchAppointments(flow: string, date: string, serviceArea: ServiceArea) {
  const requests = [fetchRegularAppointments(flow, date, serviceArea)];
  if (flow === "IKEA") {
    requests.push(fetchInventoryOnHandAppointments(date, serviceArea));
  }

  const [appointments, inventoryOnHandAppointments = []] = await Promise.all(requests);
  return [...appointments, ...inventoryOnHandAppointments];
}

async function fetchRegularAppointments(flow: string, date: string, serviceArea: ServiceArea) {
  const query: StringifiableRecord = {
    service_area: serviceArea.name,
    date_from: date,
    date_to: date,
    per_page: "ALL",
  };
  if (flow === "IKEA") {
    query.organization_id = IKEA_ORG_IDS[serviceArea.address.country];
  }
  if (flow === "GoBolt") {
    query.excluded_organization_id = IKEA_ORG_IDS[serviceArea.address.country];
  }

  const url = querystring.stringifyUrl(
    {
      url: "bvr/api/v1/appointments",
      query,
    },
    {
      arrayFormat: "bracket",
    }
  );

  const response = await api.get<Appointment[]>(url);
  return response.data;
}

async function fetchInventoryOnHandAppointments(date: string, serviceArea: ServiceArea) {
  const query: StringifiableRecord = {
    service_area: serviceArea.name,
    date: date,
    job_types: ["delivery", "cross_dock_delivery"],
    organization_id: IKEA_ORG_IDS[serviceArea.address.country],
    standalone_appointments_only: true,
    per_page: "ALL",
  };

  const url = querystring.stringifyUrl(
    {
      url: "bvr/api/v1/appointments",
      query,
    },
    {
      arrayFormat: "bracket",
    }
  );

  const response = await api.get<Appointment[]>(url);
  return response.data;
}
