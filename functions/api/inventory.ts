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
    const { images, roomName } = await request.json();

    const API_KEY = env.GEMINI_API_KEY || env.API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const MODEL_NAME = "gemini-2.5-flash";

    const imageParts = images.map((imageData: string) => {
      let mimeType = 'image/jpeg';
      let base64Data = imageData;
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) { mimeType = matches[1]; base64Data = matches[2]; }
      }
      return { inlineData: { mimeType, data: base64Data } };
    });

    const prompt = `You are a Senior Personal Property Appraiser. Analyze the image(s) of a "${roomName}". Identify all items, estimate Replacement Cost Value in USD using current market data. Return ONLY a JSON array in a markdown code block. Schema: [{"name":"string","estimatedValue":number,"isSpecialty":boolean,"quantity":number,"notes":"string","valuationRationale":"string"}]`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [...imageParts, { text: prompt }] },
      config: { tools: [{ googleSearch: {} }] }
    });

    const rawText = response.text?.trim() || "[]";
    const match = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    const jsonText = match ? match[2] : rawText;
    const inventory = JSON.parse(jsonText);
    return new Response(JSON.stringify(inventory), { headers: corsHeaders });

  } catch (error: any) {
    const msg = error?.message || String(error);
    return new Response(JSON.stringify({ error: "Inventory failed", detail: msg }), { status: 500, headers: corsHeaders });
  }
}
