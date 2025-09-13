import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { licenseKey, deviceId } = req.body;
  if (!licenseKey) return res.status(400).json({ error: "licenseKey required" });

  try {
    const r = await fetch(`${process.env.DODO_API_BASE}/licenses/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DODO_SECRET}`,
      },
      body: JSON.stringify({ license: licenseKey, device: deviceId })
    });

    const data = await r.json();
    return res.status(r.status).json({
      valid: data.valid,
      plan: data.plan,
      expiresAt: data.expiresAt
    });
  } catch (err) {
    console.error("Activate error:", err);
    return res.status(500).json({ error: "activation_failed" });
  }
}
