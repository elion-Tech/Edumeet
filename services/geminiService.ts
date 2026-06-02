import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Helper to handle rate limits (429) with exponential backoff
const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delay = 4000, signal?: AbortSignal): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || 
                        error?.message?.includes('429') || 
                        error?.message?.includes('quota') ||
                        error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (signal?.aborted) throw new Error('Operation aborted');

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
 * Lightweight JS post-processor for localization and compression.
 * Prevents unnecessary second AI calls for formatting.
 */
export function localizeAndCompress(text: string, options: { useAfricanTone?: boolean, forTts?: boolean } = {}): string {
  let processed = text;

  // 1. Remove/Simplify Formal Phrases & Redundancy
  const formalMap: Record<string, string> = {
    "Furthermore": "",
    "In addition": "",
    "Moreover": "",
    "It is important to note that": "Note that",
    "It should be mentioned that": "Also,",
    "the process by which": "how",
    "in order to": "to",
    "actually": "",
    "basically": "",
    "really": "",
    "very": ""
  };

  // 2. Localization Swaps
  const localMap: Record<string, string> = {
    "For example": "Like this",
    "For instance": "Like this",
    "You should": "You can",
    "Students are advised to": "Students should"
  };

  // Apply replacements
  [formalMap, localMap].forEach(map => {
    Object.entries(map).forEach(([key, val]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      processed = processed.replace(regex, val);
    });
  });

  // 3. Strip leftover markdown artifacts
  processed = processed.replace(/\*\*|\-\s/g, "");

  // 4. Compression & Hard Sentence Cap
  // Split by sentence endings, filter empty, and cap at 5 sentences for TTS/conciseness
  let sentences = processed.split(/[.!?]+\s+/).filter(s => s.trim().length > 5);
  
  const maxSentences = options.forTts ? 4 : 6;
  if (sentences.length > maxSentences) {
    sentences = sentences.slice(0, maxSentences);
  }

  return sentences.join(". ").trim() + (sentences.length > 0 ? "." : "");
}

/**
 * AI Tutor service using Gemini 3 Pro for advanced reasoning.
 */
export async function* askAiTutorStream(
  question: string,
  course: any,
  history: { role: string; text: string }[] = [],
  signal?: AbortSignal
) {
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY
    });

    const transcript = course.modules
      .map((m: any) => m.transcript)
      .join("\n\n")
      .slice(0, 12000);

    const historyText = history.map(h => `${h.role === 'user' ? 'Student' : 'AI'}: ${h.text}`).join("\n");

    const prompt = `You are a professional and supportive AI Tutor. 

Guidelines:
1. Role & Style: Maintain a professional yet encouraging tone. Use clear, simple language suitable for education, but avoid slang or overly casual speech.
2. Contextual Boundary: Strictly adhere to the lesson transcript provided below. Do not discuss topics outside the scope of this course. If the student asks an off-topic or non-educational question, politely decline and steer them back to the lesson.
2. Formatting (STRICT):
   - Do NOT use markdown bold formatting (**).
   - Do NOT use bullet points beginning with "-". Use numbered lists (1. 2.) if needed.
   - Use short paragraphs and clear spacing.
3. Continuity: Use the transcript as the primary source and the conversation history to build upon prior explanations. Avoid repetition.
4. Length: 2-4 short, punchy paragraphs. Always end with a gentle, relevant follow-up question.

Course: ${course.title}
Transcript: ${transcript}
History:
${historyText}

Student Question: ${question}`;

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
      generationConfig: {
        temperature: 0.2,
      }
    }, { signal }), 3, 4000, signal);

    for await (const chunk of result) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error: any) {
    if (error.message === 'Operation aborted' || error.name === 'AbortError') return;
    console.error(error);
    yield "AI tutor temporarily unavailable.";
  }
}

/**
 * Generates audio for the given text using Gemini TTS.
 */
export const speakText = async (text: string, signal?: AbortSignal): Promise<string> => {
  try {
    // Pre-process text to save TTS tokens and reduce latency
    const optimizedText = localizeAndCompress(text, { forTts: true });
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await retryOperation(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Synthesize speech for: ${optimizedText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    }, { signal }), 5, 5000, signal); 

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    if ((error as any).message === 'Operation aborted' || (error as any).name === 'AbortError') return "";
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