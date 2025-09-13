import { rateLimit } from "../../lib/rateLimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!rateLimit(req, 10, 60_000)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  try {
    // Parse JSON body safely (Vercel doesn't auto-parse)
    let body = {};
    try {
      body =
        req.body && typeof req.body === "object"
          ? req.body
          : JSON.parse(req.body || "{}");
    } catch {
      body = {};
    }

    const { licenseKey, name } = body;
    if (!licenseKey || !name) {
      return res
        .status(400)
        .json({ error: "licenseKey and name are required" });
    }

    console.log("Activate license:", { licenseKey, name });

    const r = await fetch(`${process.env.DODO_API_BASE}/licenses/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DODO_SECRET}`,
      },
      body: JSON.stringify({
        license_key: licenseKey,
        name,
      }),
    });

    const data = await r.json();

    return res.status(r.status).json({
      success: r.ok,
      ...data,
    });
  } catch (err) {
    console.error("Activate error:", err);
    return res.status(500).json({ error: "activation_failed" });
  }
}
