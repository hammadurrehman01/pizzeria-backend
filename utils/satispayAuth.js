import { readFile } from "fs/promises";
import { createSign, createHash } from "crypto";
import path from "path";
const keyId =
  "rdq6r3vro94uhs9hoi31n8rie4urt0uj3krchg2adsq5slqtbuja3t8vrk4qhc9d1omdf604c8k2pjfi2f389bbpd0v5pfeofdjaggcamenig4h0qgccsr39j0je98865mcb0bm095bfq3lk246denldmqtsgqpa41fjogdme2c22cvqsmooc7t267ad1pmmjtotm28n";
const privateKeyPath = path.resolve("./user/secrets/private.pem");

export async function createSatispaySignature(path, method, body = null) {
  const privateKey = await readFile(privateKeyPath, "utf-8");
  const date = new Date().toUTCString();
  const jsonBody = body ? JSON.stringify(body) : "";

  const digest = body
    ? `SHA-256=${createHash("sha256").update(jsonBody).digest("base64")}`
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

  console.log("🔐 Signature String:\n", signatureString);
  console.log("📤 Headers:", headers);
  console.log("📦 Body:", jsonBody);

  if (digest) headers["Digest"] = digest;
  if (body) headers["Content-Type"] = "application/json";

  return { headers };
}
