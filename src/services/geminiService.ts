"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";
export interface GeminiResponse {
  theme: string;
  culturalContext: string;
  literaryContext: string;
  christConnection: string;
  questions: string[];
}

// Ensure API key is present
// In Next.js, environment variables are exposed via process.env
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export const generateDevotionalContent = async (scripture: string): Promise<GeminiResponse> => {
  const modelId = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      theme: { type: Type.STRING, description: "A short, 2-3 word theme title for the devotional." },
      culturalContext: { type: Type.STRING, description: "Historical and cultural background of the passage." },
      literaryContext: { type: Type.STRING, description: "Where this fits in the book/chapter and literary style." },
      christConnection: { type: Type.STRING, description: "How this passage points to Jesus Christ or the Gospel." },
      questions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 specific questions for couples to discuss regarding this passage."
      }
    },
    required: ["theme", "culturalContext", "literaryContext", "christConnection", "questions"]
  };

  const prompt = `
    Atue como um conselheiro cristão sábio e experiente em casamentos.
    Crie um estudo devocional curto e profundo para um casal baseado na passagem bíblica: "${scripture}".
    
    O tom deve ser encorajador, teologicamente profundo mas acessível.
    Foque em como este texto se aplica à vida a dois.
    Responda em PORTUGUÊS (Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");
    
    return JSON.parse(text) as GeminiResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback for demo purposes if API fails or quota exceeded
    return {
      theme: "O Amor é Paciente (Fallback)",
      culturalContext: "Paulo escrevia aos Coríntios em uma época onde o amor era frequentemente visto como transacional ou puramente erótico. O conceito de ágape era revolucionário.",
      literaryContext: "Inserido no meio de instruções sobre dons espirituais, este capítulo funciona como o alicerce necessário para qualquer serviço cristão.",
      christConnection: "Jesus é a personificação perfeita deste amor. Ele foi paciente, benigno e tudo sofreu por nós na cruz.",
      questions: [
        "Em qual aspecto da descrição do amor você tem mais dificuldade hoje?",
        "Como a paciência de Cristo com você inspira sua paciência com seu cônjuge?",
        "Qual ação prática podemos tomar essa semana para demonstrar bondade um ao outro?"
      ]
    };
  }
};

export const suggestScripture = async (): Promise<string> => {
   const modelId = "gemini-2.5-flash";
   try {
    const response = await ai.models.generateContent({
        model: modelId,
        contents: "Sugira apenas uma referência bíblica (Livro Capitulo:Versiculos) excelente para um devocional de casal focado em união, perdão ou propósito. Retorne APENAS a referência em texto puro.",
    });
    return response.text?.trim() || "Efésios 4:2-3";
   } catch (e) {
       return "Colossenses 3:14";
   }
}