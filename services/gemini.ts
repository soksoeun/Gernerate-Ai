
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData, decode } from "./audio";

// Transcribe audio using Gemini 3 Flash
export const transcribeKhmerAudio = async (base64Audio: string, mimeType: string = 'audio/webm', languageName: string = "Khmer"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: `Please transcribe this audio accurately. The expected language is ${languageName}. Only return the text transcription. If the audio is not in ${languageName}, translate it to ${languageName} text.`
          }
        ],
      }
    ],
  });

  return response.text || "Transcription failed.";
};

/**
 * Synthesizes text to speech using Gemini's TTS model.
 * @param text The text to convert to speech.
 * @param voiceName The prebuilt voice name (e.g., 'Kore', 'Zephyr').
 * @param _options Additional options like pitch/rate (currently unused).
 * @param languageName The name of the language for context.
 * @returns Promise<AudioBuffer>
 */
export const synthesizeSpeech = async (
  text: string, 
  voiceName: string, 
  _options: any, 
  languageName: string
): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this in ${languageName}: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned from the model.");
  }

  // Audio bytes returned by the API is raw PCM data. 
  // We use a sample rate of 24000 for Gemini TTS decoding.
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
};
