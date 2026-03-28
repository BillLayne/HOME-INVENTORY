import { GoogleGenAI } from "@google/genai";

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const { itemName, condition, originalRationale } = await request.json();
    
    const API_KEY = env.GEMINI_API_KEY || env.API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API_KEY environment variable not set" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const MODEL_NAME = "gemini-3.1-flash-preview";

    const prompt = `You are a Valuation Expert.
    **Task**: Re-appraise the item "${itemName}" for an insurance schedule.
    **Condition**: "${condition}".
    **Context**: The original valuation rationale was: "${originalRationale || 'N/A'}".
    **Action**: 
    1. Search for current market listings for this specific item.
    2. Adjust the Replacement Cost Value (RCV) based on the specified condition (e.g., apply depreciation for 'Fair' or 'Poor' condition vs 'New').
    **Output**: A single JSON object in a markdown block with keys: 
    - "estimatedValue": number (The updated value in USD).
    - "valuationRationale": string (A professional explanation for the adjustment based on market data and condition).`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [{ text: prompt }] },
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const rawText = response.text?.trim() || "{}";
    const match = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    const jsonText = match ? match[2] : rawText;
    
    const result = JSON.parse(jsonText);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error re-evaluating item:", error);
    return new Response(JSON.stringify({ error: "Failed to re-evaluate item" }), { status: 500 });
  }
}
