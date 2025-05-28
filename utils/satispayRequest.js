import { createSatispaySignature } from "./satispayAuth.js";
import fetch from "node-fetch";

const API_URL = "https://authservices.satispay.com/g_business/v1";

export async function satispayRequest(path, method = "GET", body = null) {
  const { headers } = await createSatispaySignature(path, method, body);
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return data;
}
