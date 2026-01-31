
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";

export interface AnalysisOptions {
  mode: 'direct' | 'backend';
  backendUrl?: string;
}

export const analyzeVoiceSample = async (
  audioBase64: string,
  mimeType: string,
  selectedLanguage: Language,
  options: AnalysisOptions = { mode: 'direct' }
): Promise<AnalysisResult> => {
  if (options.mode === 'backend') {
    return analyzeViaBackend(audioBase64, mimeType, selectedLanguage, options.backendUrl || 'http://localhost:8000');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this audio file and determine if the voice is AI-generated (synthetic/TTS/deepfake) or a real human recording.
    The expected language is ${selectedLanguage}. 
    Focus on:
    1. Spectral consistency and unnatural rhythm.
    2. Lack of natural breath pauses or emotional variance.
    3. Artifacts common in neural speech synthesis for ${selectedLanguage}.
    4. Phonetic nuances specific to ${selectedLanguage} that AI often struggles with.
    
    Return the response strictly as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.STRING,
              description: "Must be 'HUMAN', 'AI_GENERATED', or 'INCONCLUSIVE'",
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "Score from 0 to 1 representing the certainty of the classification",
            },
            explanation: {
              type: Type.STRING,
              description: "Detailed analysis explaining why this classification was chosen.",
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "The language detected in the audio.",
            },
            artifacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific technical artifacts or anomalies found.",
            },
          },
          required: ["classification", "confidenceScore", "explanation", "detectedLanguage"],
        },
      },
    });

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze voice sample. Please ensure the file is a valid audio format.");
  }
};

async function analyzeViaBackend(
  audioBase64: string,
  mimeType: string,
  language: string,
  url: string
): Promise<AnalysisResult> {
  const response = await fetch(`${url}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_base64: audioBase64,
      mime_type: mimeType,
      language: language
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Backend analysis failed');
  }

  return response.json();
}
