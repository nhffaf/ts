import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../constants";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("API_KEY not found in environment variables. Gemini features disabled.");
}

export const generateGrannyTaunt = async (): Promise<string> => {
  if (!ai) return "I see you...";

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "You are a terrifying humanoid monster granny hunting a player in a dark basement. Give me a very short, scary, 3-5 word sentence to whisper to the player. Do not use quotes.",
      config: {
        maxOutputTokens: 20,
        temperature: 1.2, 
      }
    });
    
    // Safety check: response.text can be undefined if blocked or error
    if (response.text) {
        return response.text.trim();
    }
    return "I see you...";
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Where are you going?";
  }
};

export const generateGameOverMessage = async (): Promise<string> => {
    if (!ai) return "Granny caught you. You will never leave.";
  
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: "The player has been caught by the monster granny in the basement. Write a 1 sentence chilling game over message.",
        config: {
            maxOutputTokens: 50,
        }
      });
      
      if (response.text) {
          return response.text.trim();
      }
      return "Granny caught you. You will never leave.";
      
    } catch (error) {
      console.error("Gemini Error (Game Over):", error);
      return "Granny caught you. You will never leave.";
    }
};