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

  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("Invalid JSON from Satispay:", responseText);
    throw new Error("Invalid response from Satispay");
  }

  if (!response.ok) {
    console.error("Satispay API Error:", {
      status: response.status,
      data,
    });
    throw new Error(data.message || "Satispay API request failed");
  }

  return data;
}
