// Vercel Serverless Function — Secure OpenRouter Proxy
// Reads OPENROUTER_API_KEY from Vercel environment variables (never exposed to browser)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Server configuration error: OPENROUTER_API_KEY is not set in environment variables."
    });
  }

  const { model, foodName, portionSize } = req.body;

  if (!foodName || !portionSize) {
    return res.status(400).json({ error: "Missing required fields: foodName and portionSize." });
  }

  const selectedModel = model || "google/gemini-2.5-flash";

  const payload = {
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: `You are an expert nutritionist AI. Your task is to calculate the nutritional information for the food entered.\nYou must respond with ONLY a valid, single JSON block, without code fences or extra text.\nThe JSON must have this exact shape:\n{\n  "foodName": "Normalized name of food",\n  "portionAnalyzed": "Brief serving size description (e.g. 150g, 1 slice)",\n  "calories": 150,\n  "protein": 5.5,\n  "carbs": 24.2,\n  "fat": 4.1\n}\nOnly output raw JSON. Estimate based on standard nutritional profiles if the portion size is slightly generic.`
      },
      {
        role: "user",
        content: `Analyze this food: "${foodName}", portion: "${portionSize}".`
      }
    ],
    temperature: 0.1,
    max_tokens: 300
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://glowcal.vercel.app",
        "X-Title": "GlowCal Calories Calculator"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `OpenRouter API error (HTTP ${response.status}): ${errText || "Unknown error"}`
      });
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: "Invalid response format received from OpenRouter API." });
    }

    let resultText = data.choices[0].message.content.trim();
    resultText = resultText.replace(/^\s*```(json)?/i, "").replace(/```\s*$/, "").trim();

    let parsedData;
    try {
      parsedData = JSON.parse(resultText);
    } catch (parseError) {
      return res.status(500).json({
        error: "Could not parse nutrition data from AI response.",
        raw: resultText
      });
    }

    parsedData.calories = typeof parsedData.calories === "number" ? parsedData.calories : parseFloat(parsedData.calories) || 0;
    parsedData.protein  = typeof parsedData.protein  === "number" ? parsedData.protein  : parseFloat(parsedData.protein)  || 0;
    parsedData.carbs    = typeof parsedData.carbs    === "number" ? parsedData.carbs    : parseFloat(parsedData.carbs)    || 0;
    parsedData.fat      = typeof parsedData.fat      === "number" ? parsedData.fat      : parseFloat(parsedData.fat)      || 0;

    return res.status(200).json(parsedData);

  } catch (err) {
    console.error("Serverless function error:", err);
    return res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}
