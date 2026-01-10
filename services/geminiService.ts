import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = 'AIzaSyB4UDXMtuGXXBDLC8w-od-EaELA6k-zsXg';

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
 * Manages Context Caching for Course Transcripts.
 * If a cache exists and is valid, it returns the cache name.
 * If not, it uploads the transcript, creates a cache, and returns the new name.
 */
async function getOrCreateCache(course: any, fullTranscript: string): Promise<string> {
  try {
    // 1. Check if existing cache is still valid (if we have a name)
    if (course.geminiCacheName) {
      return course.geminiCacheName;
    }

    console.log("Creating new Gemini Context Cache for course:", course.title);
    const cacheManager = (new GoogleGenAI({ apiKey: API_KEY }) as any).cachedContents;

    const cache = await cacheManager.create({
      model: 'models/gemini-1.5-flash-001', // Flash is cheaper/faster for caching
      displayName: `course_cache_${course._id}`,
      systemInstruction: "You are a helpful AI Tutor. Use the provided course context to answer questions.",
      contents: [{ role: 'user', parts: [{ text: fullTranscript }] }],
      ttlSeconds: 3000, // 50 minutes
    });

    console.log("Cache created successfully:", cache.name);
    
    // Mutate the local course object so we don't re-create it this session
    course.geminiCacheName = cache.name;
    
    return cache.name;
  } catch (error) {
    console.error("Cache creation failed, falling back to standard context:", error);
    return "";
  }
}

/**
 * AI Tutor service using Gemini 3 Pro for advanced reasoning.
 */
export async function* askAiTutorStream(
  question: string,
  course: any // Passing full course object to access cache info
) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemInstruction = `You are a professional, grounded AI Tutor for "edumeet". 
Your core mission is to help students synthesize and understand the lesson material.
Grounded Principle: You must ONLY use the provided LESSON TRANSCRIPT for factual details. 
If the information is not in the transcript, acknowledge it and provide general academic guidance.
Constraints: 
- Use PLAIN TEXT ONLY. 
- No bolding, italics, or complex markdown. 
- Use simple, direct, academic yet friendly language.`;

    // 1. Aggregate all module transcripts
    const fullTranscript = course.modules.map((m: any) => m.transcript).join('\n\n');
    
    // 2. Get Cache Reference
    const cacheName = await getOrCreateCache(course, fullTranscript);

    let requestConfig: any = {
      systemInstruction: systemInstruction,
      temperature: 0.2,
    };

    let contents: any[] = [];
    let model = 'gemini-2.0-flash-exp';

    if (cacheName) {
      // CACHED PATH: Send only the question + cache reference
      requestConfig.cachedContent = cacheName;
      contents = [{ role: 'user', parts: [{ text: `STUDENT QUERY: ${question}` }] }];
      model = 'models/gemini-1.5-flash-001'; // Must match the model used to create the cache
    } else {
      // FALLBACK PATH: Send full transcript (Expensive)
      const prompt = `
      COURSE: ${course.title}
      AVAILABLE KNOWLEDGE: ${fullTranscript.substring(0, 30000)}
      STUDENT QUERY: ${question}
      Provide a clear, pedagogical response:`;
      contents = [{ role: 'user', parts: [{ text: prompt }] }];
    }

    const result = await retryOperation(() => ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: requestConfig
    }));

    for await (const chunk of result) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error: any) {
    console.error("AI Tutor Stream Error:", error);
    yield "The central knowledge base is currently busy. Please pause and try your query again in a few seconds.";
  }
}

/**
 * Generates audio for the given text using Gemini TTS.
 */
export const speakText = async (text: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await retryOperation(() => ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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

    const response = await retryOperation(() => ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
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
    const model = 'gemini-2.0-flash-exp';
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