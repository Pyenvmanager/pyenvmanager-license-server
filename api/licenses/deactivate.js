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

    const { licenseKey, licenseKeyInstanceId } = body;
    if (!licenseKey || !licenseKeyInstanceId) {
      return res.status(400).json({
        error: "licenseKey and licenseKeyInstanceId are required",
      });
    }

    console.log("Deactivate license:", { licenseKey, licenseKeyInstanceId });

    const r = await fetch(`${process.env.DODO_API_BASE}/licenses/deactivate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DODO_SECRET}`,
      },
      body: JSON.stringify({
        license_key: licenseKey,
        license_key_instance_id: licenseKeyInstanceId,
      }),
    });

    const data = await r.json().catch(() => ({}));

    return res.status(r.status).json({
      success: r.ok,
      ...data,
    });
  } catch (err) {
    console.error("Deactivate error:", err);
    return res.status(500).json({ error: "deactivation_failed" });
  }
}
