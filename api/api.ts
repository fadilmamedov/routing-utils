import axios from "axios";
import { API, SILVER_API } from "../constants";

export const api = axios.create({
  baseURL: API,
  headers: {
    Accept: "*/*",
  },
});

export const silverApi = axios.create({
  baseURL: SILVER_API,
  headers: {
    Accept: "*/*",
  },
});
