import fetch from "node-fetch";
import { rateLimit } from "../../lib/rateLimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!rateLimit(req, 20, 60_000)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ error: "licenseKey required" });

  console.log("Check license:", { licenseKey });

  try {
    const r = await fetch(`${process.env.DODO_API_BASE}/licenses/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DODO_SECRET}`,
      },
      body: JSON.stringify({ license: licenseKey })
    });

    const data = await r.json();
    return res.status(r.status).json({
      valid: data.valid,
      plan: data.plan,
      expiresAt: data.expiresAt
    });
  } catch (err) {
    console.error("Check error:", err);
    return res.status(500).json({ error: "validation_failed" });
  }
}
