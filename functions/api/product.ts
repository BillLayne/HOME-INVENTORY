
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

import { GoogleGenAI } from "@google/genai";

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const { barcode } = await request.json();
    
    const API_KEY = env.GEMINI_API_KEY || env.API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API_KEY environment variable not set" }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const MODEL_NAME = "gemini-3.1-flash-preview";

    const prompt = `You are a Product Identification Specialist.
    **Task**: Identify the commercial product associated with Barcode (UPC/EAN): "${barcode}".
    **Action**: Use Google Search to find the exact manufacturer, product name, and key specifications.
    **Output**: A single JSON object in a markdown block with keys: 
    - "name": The official product name.
    - "notes": A brief, professional description including brand and specs.
    If the product cannot be definitively identified, return empty strings.`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const rawText = response.text?.trim() || "{}";
    const match = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    const jsonText = match ? match[2] : rawText;

    const productInfo = JSON.parse(jsonText);
    return new Response(JSON.stringify(productInfo), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });

  } catch (error) {
    console.error("Error getting product info:", error);
    return new Response(JSON.stringify({ error: "Failed to get product info" }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
