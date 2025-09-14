import { rateLimit } from "../../lib/rateLimit.js";

// Map Dodo product IDs to plan names (same as activate.js)
function mapProductToPlan(dodoProduct) {
  const productMapping = {
    'pdt_Ni7SwibBUuuQnadJhzO3o': 'pro',
    'pdt_nQi6U5moTaqhmWalAayrl': 'pro',
  };
  return productMapping[dodoProduct?.id] || 'pro';
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!rateLimit(req, 20, 60_000)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  try {
    // Parse JSON body safely
    let body = {};
    try {
      body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    } catch {
      body = {};
    }

    const { licenseKey, licenseKeyInstanceId } = body;
    if (!licenseKey) {
      return res.status(400).json({ error: "licenseKey required" });
    }

    console.log("Check license:", { licenseKey, licenseKeyInstanceId });

    const r = await fetch(`${process.env.DODO_API_BASE}/licenses/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DODO_SECRET}`,
      },
      body: JSON.stringify({
        license_key: licenseKey,
        license_key_instance_id: licenseKeyInstanceId || null,
      }),
    });

    const data = await r.json();

    return res.status(r.status).json({
      valid: data.valid,
      plan: data.product ? mapProductToPlan(data.product) : 'pro',
      expiresAt: data.expiresAt || null,
      raw: data, // helpful for debugging
    });
  } catch (err) {
    console.error("Check error:", err);
    return res.status(500).json({ error: "validation_failed" });
  }
}
