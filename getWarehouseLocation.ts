import { Appointment, Location } from "./types";

export function getWarehouseLocation(
  serviceArea: string,
  deliveryType: Appointment["delivery_type"]
): Location | undefined {
  if (serviceArea === "yyz") {
    if (deliveryType === "parcel") {
      return [-79.38164790169296, 43.91061779454702];
    }

    return [-79.46527945607224, 43.69990853143476];
  }

  if (serviceArea === "yow") {
    if (deliveryType === "parcel") {
      return [-75.61404927116455, 45.38342549702005];
    }

    return [-75.61404927116455, 45.38342549702005];
  }

  if (serviceArea === "yul") {
    if (deliveryType === "parcel") {
      return [-73.39733814010259, 45.57474113794657];
    }

    return [-73.39733814010259, 45.57474113794657];
  }

  if (serviceArea === "yvr") {
    if (deliveryType === "parcel") {
      return [-123.09380934387887, 49.1289820101142];
    }

    return [-123.09380934387887, 49.1289820101142];
  }

  if (serviceArea === "yyc") {
    if (deliveryType === "parcel") {
      return [-113.96804117272796, 51.01158398271341];
    }

    return [-113.96804117272796, 51.01158398271341];
  }

  if (serviceArea === "lax") {
    if (deliveryType === "parcel") {
      return [-118.0104825098946, 33.880210287872075];
    }

    return [-118.0104825098946, 33.880210287872075];
  }

  if (serviceArea === "hou") {
    if (deliveryType === "parcel") {
      return [-95.33867360625939, 29.946642486012625];
    }

    return [-95.33867360625939, 29.946642486012625];
  }

  if (serviceArea === "mia") {
    if (deliveryType === "parcel") {
      return [-80.33538185790238, 25.854738281893223];
    }

    return [-80.33538185790238, 25.854738281893223];
  }

  if (serviceArea === "nyc") {
    if (deliveryType === "parcel") {
      return [-74.08059847297928, 40.839697683204115];
    }

    return [-74.08059847297928, 40.839697683204115];
  }

  if (serviceArea === "atl") {
    if (deliveryType === "parcel") {
      return [-84.6913373596348, 33.44728133069862];
    }

    return [-84.17727574613498, 33.85633286978848];
  }
}
