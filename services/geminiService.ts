import { GoogleGenAI, Type } from "@google/genai";
import { TestResult, AdulterantStatus, OverallStatus } from "../types";

export const analyzeTestCards = async (beforeImageBase64: string, afterImageBase64: string): Promise<TestResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are the MilQ Milk Adulterant Analyzer. Your goal is to perform a pixel-to-pixel baseline comparison between a BEFORE image (dry card) and an AFTER image (reacted card).

FORENSIC CHECKLIST:
1. Baseline Extraction: Identify the original color of the dry reagent pads in the BEFORE image.
2. Noise Cancellation: Ignore external glares, shadows, or physical droppers.
3. Zone-by-Zone Analysis:
   - ZONE A (Water): Compare trail opacity. SAFE = Opaque white masking paper texture. ADULTERATED = Translucent streak showing paper grain.
   - ZONE B (Detergent): Look for a 'Warm Spectrum' shift. SAFE = Neutral. ADULTERATED = Reddish-Brown shift.
   - ZONE C (Starch): Detect high-contrast spots. SAFE = Cream/White. ADULTERATED = Dark Blue, Black, or deep Purple spots.
   - ZONE D (Formalin): Scan for hue-specific shifts. SAFE = Neutral. ADULTERATED = Pink or light Violet tint.
   - ZONE E (Hydrogen Peroxide): Perform Morphological Analysis. Look for texture changes rather than just color. SAFE = Smooth liquid. ADULTERATED = Whitish micro-bubbles, effervescence, or spotted white texture (Specular Highlights).

VERDICT LOGIC:
- If any zone exceeds the threshold of change, set status to 'UNSAFE'.
- Provide a confidence percentage based on the clarity of the visual markers described above.`;

  const response = await ai.models.generateContent({
    // Upgraded to gemini-3-pro-preview as this is a complex image analysis task requiring advanced reasoning
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: "Analyze these two images. Image 1 is BEFORE. Image 2 is AFTER. Perform the specific zone-by-zone forensic check." },
        { inlineData: { mimeType: 'image/jpeg', data: beforeImageBase64 } },
        { inlineData: { mimeType: 'image/jpeg', data: afterImageBase64 } }
      ]
    },
    config: {
      // Correctly set systemInstruction within the config object
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall_score: { type: Type.INTEGER, description: "1-5 safety rating where 5 is perfectly safe" },
          status: { type: Type.STRING, enum: ['SAFE', 'UNSAFE', 'INCONCLUSIVE'] },
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                adulterant: { type: Type.STRING, description: "Water, Formalin, Detergent, Hydrogen Peroxide, or Starch" },
                status: { type: Type.STRING, enum: ['PASS', 'DETECTED', 'BORDERLINE'] },
                confidence: { type: Type.INTEGER, description: "Percentage of certainty" },
                action: { type: Type.STRING, description: "Brief action like 'Reject' or 'Accept'" },
                colorChange: { type: Type.STRING, description: "Description of the shift seen (e.g. 'Reddish-Brown shift detected')" },
                severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                recommendation: { type: Type.STRING, description: "Specific consumer advice" },
                healthRisk: { type: Type.STRING, description: "Potential risk if consumed" }
              },
              required: ['adulterant', 'status', 'confidence', 'action', 'colorChange', 'severity', 'recommendation']
            }
          }
        },
        required: ['overall_score', 'status', 'results']
      }
    }
  });

  const rawJson = JSON.parse(response.text || '{}');
  
  return {
    id: `MIL-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    timestamp: new Date().toISOString(),
    overallScore: rawJson.overall_score,
    status: rawJson.status as OverallStatus,
    results: rawJson.results,
    beforeImage: `data:image/jpeg;base64,${beforeImageBase64}`,
    afterImage: `data:image/jpeg;base64,${afterImageBase64}`
  };
};