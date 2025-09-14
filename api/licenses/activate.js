import { rateLimit } from "../../lib/rateLimit.js";

// Map Dodo product IDs to plan names
function mapProductToPlan(dodoProduct) {
  const productMapping = {
    'pdt_Ni7SwibBUuuQnadJhzO3o': 'pro',           // Your Pro plan
    'pdt_nQi6U5moTaqhmWalAayrl': 'pro',           // Pro Monthly
    // Add other product IDs as needed
    // 'pdt_your_pro_plus_id': 'pro+',
    // 'pdt_your_enterprise_id': 'enterprise',
  };
  
  return productMapping[dodoProduct?.id] || 'pro'; // Default to pro
}

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

    if (r.ok) {
      // Format response to match client expectations
      return res.status(201).json({
        success: true,
        id: data.id,
        product: { 
          ...data.product,
          name: mapProductToPlan(data.product) // Map to your plan names
        },
        ...data,
      });
    } else {
      // Handle Dodo API errors gracefully
      let errorMessage = "License activation failed";
      switch (r.status) {
        case 403:
          errorMessage = "License key is inactive";
          break;
        case 404:
          errorMessage = "License key not found";
          break;
        case 422:
          errorMessage = "License activation limit reached";
          break;
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  } catch (err) {
    console.error("Activate error:", err);
    return res.status(500).json({ error: "activation_failed" });
  }
}
