export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
  });
}

import { GoogleGenAI } from "@google/genai";

export async function onRequestPost(context: any) {
  const corsHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  try {
    const { request, env } = context;
    const { barcode } = await request.json();

    const API_KEY = env.GEMINI_API_KEY || env.API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const MODEL_NAME = "gemini-2.5-flash";

    const prompt = `Identify the product for Barcode (UPC/EAN): "${barcode}". Return a JSON object in a markdown block with keys: "name" (product name), "notes" (brand and specs).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: { tools: [{ googleSearch: {} }] }
    });

    const rawText = response.text?.trim() || "{}";
    const match = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    const jsonText = match ? match[2] : rawText;
    const productInfo = JSON.parse(jsonText);
    return new Response(JSON.stringify(productInfo), { headers: corsHeaders });

  } catch (error: any) {
    const msg = error?.message || String(error);
    return new Response(JSON.stringify({ error: "Product lookup failed", detail: msg }), { status: 500, headers: corsHeaders });
  }
}
