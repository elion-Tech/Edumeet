import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Helper to handle rate limits (429) with exponential backoff
const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delay = 4000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || 
                        error?.message?.includes('429') || 
                        error?.message?.includes('quota') ||
                        error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (retries > 0 && isRateLimit) {
      const match = error?.message?.match(/retry in ([\d.]+)s/);
      const waitTime = match ? Math.ceil(parseFloat(match[1]) * 1000) + 1000 : delay;
      console.warn(`Gemini Rate Limit. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * AI Tutor service using Gemini 3 Pro for advanced reasoning.
 */
export async function* askAiTutorStream(
  question: string,
  course: any // Passing full course object to access cache info
) {
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY
    });

    const transcript = course.modules
      .map((m: any) => m.transcript)
      .join("\n\n")
      .slice(0, 12000);

    const prompt = `
You are a professional AI tutor.

Course: ${course.title}

Transcript:
${transcript}

Student Question:
${question}
`;

    const result = await retryOperation(() => ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        temperature: 0.2,
      }, // Added closing brace and comma
    }));

    for await (const chunk of result) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error: any) {
    console.error(error);
    yield "AI tutor temporarily unavailable.";
  }
}

/**
 * Generates audio for the given text using Gemini TTS.
 */
export const speakText = async (text: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await retryOperation(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Synthesize speech for: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    }));

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    console.error("TTS generation failed:", error);
    return "";
  }
};

export const generateCourseImage = async (title: string, description: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `A professional, 3D minimal education illustration. Title: "${title}". Description: "${description}". Clean, high-fidelity, artistic. No text.`;
    // Use the same model as the cache for consistency and availability
    const response = await retryOperation(() => ai.models.generateContent({ 
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error: any) {
    console.error("Image generation failed:", error);
    return "";
  }
};

export const generateCourseContent = async (
  type: 'description' | 'transcript' | 'quiz',
  topic: string,
  courseTitle: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-2.5-flash';
    let prompt = '';
    let responseSchema: any = undefined;

    if (type === 'description') {
      prompt = `Generate a professional 2-sentence lesson summary for the topic "${topic}" in the curriculum "${courseTitle}". Plain text only.`;
    } else if (type === 'transcript') {
      prompt = `Generate a deep-dive educational transcript for a lecture on "${topic}". Cover key technical concepts. Plain text only.`;
    } else if (type === 'quiz') {
      prompt = `Generate 20 MCQ questions for "${topic}" in "${courseTitle}". 4 options each. Return valid JSON only.`;
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER }
          }
        }
      };
    }

    const response = await retryOperation(() => ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: responseSchema ? "application/json" : "text/plain",
        responseSchema: responseSchema
      }
    }));

    return response.text || "";
  } catch (error: any) {
    console.error("AI Generation Failure:", error);
    return "";
  }
};