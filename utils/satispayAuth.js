import { readFile } from "fs/promises";
import { createSign } from "crypto";

const keyId = process.env.SATISPAY_KEY_ID;
const privateKeyPath = process.env.SATISPAY_PRIVATE_KEY_PATH;

export async function createSatispaySignature(path, method, body = null) {
  const privateKey = await readFile(privateKeyPath, "utf-8");
  const date = new Date().toUTCString();
  const jsonBody = body ? JSON.stringify(body) : "";
  const digest = body
    ? `SHA-256=${Buffer.from(
        await crypto.subtle.digest("SHA-256", Buffer.from(jsonBody))
      ).toString("base64")}`
    : null;

  const lines = [
    `(request-target): ${method.toLowerCase()} ${path}`,
    `date: ${date}`,
  ];
  if (digest) lines.push(`digest: ${digest}`);
  const signatureString = lines.join("\n");

  const signer = createSign("RSA-SHA256");
  signer.update(signatureString);
  signer.end();
  const signature = signer.sign(privateKey, "base64");

  const headers = {
    Date: date,
    Authorization: `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) date${
      digest ? " digest" : ""
    }",signature="${signature}"`,
  };

  if (digest) headers["Digest"] = digest;
  if (body) headers["Content-Type"] = "application/json";

  return { headers };
}
