
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
    const { images, roomName } = await request.json();
    
    const API_KEY = env.GEMINI_API_KEY || env.API_KEY;
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API_KEY environment variable not set" }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const MODEL_NAME = "gemini-3.1-flash-preview";

    const imageParts = images.map((imageData: string) => {
      let mimeType = 'image/jpeg';
      let base64Data = imageData;
      
      if (imageData.startsWith('data:')) {
          const matches = imageData.match(/^data:(.+);base64,(.+)$/);
          if (matches && matches.length === 3) {
              mimeType = matches[1];
              base64Data = matches[2];
          }
      }

      return {
          inlineData: {
              mimeType: mimeType,
              data: base64Data,
          },
      };
    });

    const prompt = `You are a Senior Personal Property Appraiser and Adjuster for a top-tier insurance carrier.
    
    **MISSION**: Conduct a forensic-level inventory analysis of the provided image(s) depicting a "${roomName}". Your output must be accurate enough for formal insurance underwriting and claims processing.

    **EXECUTION STEPS**:
    1.  **Visual Forensics**: Scan the room methodically. Identify furniture, electronics, art, textiles, and decor. Look for visual cues of quality (e.g., joinery on wood, brand logos on electronics, designer signatures).
    2.  **Market Valuation**: You MUST use the Google Search tool to find current Replacement Cost Value (RCV) in USD for the specific items identified. Do not guess; verify. Distinguish between mass-market items (IKEA, Wayfair) and high-end/designer items based on visual evidence.
    3.  **Categorization**: 
        - Group identical items (e.g., "Set of 6 Dining Chairs").
        - Flag "Specialty" items aggressively. These include: Antiques, Fine Art, Firearms, Jewelry, Furs, Silverware, Business Equipment, and High-End Electronics (> $2,000).
    4.  **Data Extraction**:
        - **name**: Be specific. "Sony Bravia 65-inch OLED TV" is better than "TV".
        - **notes**: Include Brand, Model, Material, Era (if vintage), and Condition (New/Good/Fair).
        - **valuationRationale**: Cite your source logic (e.g., "Current retail listing for [Brand] [Model]").

    **OUTPUT PROTOCOL**:
    - Return ONLY a valid JSON array of objects inside a markdown code block (\`\`\`json ... \`\`\`).
    - Do not include conversational text or your internal thinking trace in the final output.

    **JSON SCHEMA**:
    [
      {
        "name": "string",
        "estimatedValue": number,
        "isSpecialty": boolean,
        "quantity": number,
        "notes": "string",
        "valuationRationale": "string"
      }
    ]`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
            parts: [
                ...imageParts,
                { text: prompt }
            ],
        },
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    const rawText = response.text?.trim() || "[]";
    const match = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    const jsonText = match ? match[2] : rawText;

    const inventory = JSON.parse(jsonText);
    return new Response(JSON.stringify(inventory), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });

  } catch (error) {
    console.error("Error processing inventory:", error);
    return new Response(JSON.stringify({ error: "Failed to process inventory" }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
