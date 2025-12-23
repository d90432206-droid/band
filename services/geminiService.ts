
import { GoogleGenAI, Type } from "@google/genai";
import { EditProject, VideoFile, EditPlan } from "../types";

export const generateEditPlan = async (
  project: EditProject,
  videos: VideoFile[]
): Promise<EditPlan> => {
  const videoDetails = videos.map(v => ({
    id: v.id,
    name: v.file.name,
    inferredEnergy: v.energyLevel,
    duration: v.duration
  }));

  const systemInstruction = `You are a world-class AI Video Editor specialized in high-energy music concert promotion. 
Your task is to analyze video metadata and create a frame-accurate edit plan.
Output MUST be valid JSON adhering to the provided schema.
Focus on ${project.musicalFocus} and ensure a build-up in energy.`;

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Start failure: API Key not found. Please check your .env.local file.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional edit plan for:
      - Title: ${project.title}
      - Format: ${project.resolution} @ ${project.aspectRatio}
      - Target Length: ${project.targetDuration}s
      - Footages: ${JSON.stringify(videoDetails)}
      
      Requirements:
      1. Use "Jump Cuts" for high energy.
      2. Use "Cross Dissolves" for low energy/vocals.
      3. Total duration of scenes must equal roughly ${project.targetDuration}s.
      4. Ensure the logo is highlighted at the end.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clipId: { type: Type.STRING },
                  startTime: { type: Type.NUMBER, description: "Start time within the source clip" },
                  duration: { type: Type.NUMBER, description: "Length of this scene in the final edit" },
                  transition: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["clipId", "startTime", "duration", "transition", "description"]
              }
            },
            soundtrackEnhancement: { type: Type.STRING }
          },
          required: ["scenes", "soundtrackEnhancement"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI response was empty.");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback logic for production resilience
    return {
      scenes: videos.map((v, i) => ({
        clipId: v.id,
        startTime: 0,
        duration: project.targetDuration / videos.length,
        transition: "hard-cut",
        description: `Automatic scene selection from ${v.file.name}`
      })),
      soundtrackEnhancement: "Balanced audio mix with slight bass boost for live feel."
    };
  }
};
