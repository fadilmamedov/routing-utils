import axios from "axios";
import { API } from "../constants";

export const api = axios.create({
  baseURL: API,
  headers: {
    Accept: "*/*",
  },
});
