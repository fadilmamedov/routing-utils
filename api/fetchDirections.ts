import axios from "axios";
import querystring from "query-string";
import { Leg } from "@mapbox/mapbox-sdk/services/directions";
import { Location } from "../types";
import { MAPBOX_ACCESS_TOKEN } from "../constants";

export async function fetchDirections(waypoints: Location[], departureDateTime?: string) {
  const chunks = getChunks(waypoints);

  const result = await Promise.all(chunks.map((chunk) => fetchChunkDirections(chunk, departureDateTime)));

  return result.flat();
}

async function fetchChunkDirections(waypoints: Location[], departureDateTime?: string) {
  const coordinates = waypoints.map((waypoint) => waypoint.join(",")).join(";");

  const url = querystring.stringifyUrl({
    url: `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}`,
    query: {
      geometries: "geojson",
      access_token: MAPBOX_ACCESS_TOKEN,
      depart_at: departureDateTime,
    },
  });

  const response = await axios.get(url);

  return response.data.routes[0].legs as Leg[];
}

function getChunks(route: Location[]) {
  let chunks: Location[][] = [];
  let currentChunk: Location[] = [];

  for (let i = 0; i < route.length; i += 1) {
    currentChunk.push(route[i]);

    if (currentChunk.length === 25) {
      chunks.push(currentChunk);
      currentChunk = [currentChunk.at(-1)!];
    }
  }

  chunks.push(currentChunk);

  return chunks;
}
