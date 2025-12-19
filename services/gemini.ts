
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from "./audio";

// Transcribe audio using Gemini 3 Flash
export const transcribeKhmerAudio = async (base64Audio: string, mimeType: string = 'audio/webm', languageName: string = "Khmer"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
 * Synthesize speech using Gemini 2.5 Flash TTS model.
 * Returns an AudioBuffer which can be played back or converted to other formats.
 */
export const synthesizeSpeech = async (
  text: string, 
  voiceName: string, 
  _config: any, 
  languageName: string
): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this clearly in ${languageName}: ${text}` }] }],
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
    throw new Error("Failed to generate audio content from Gemini API.");
  }

  // Gemini TTS returns raw PCM at 24kHz
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(
    decode(base64Audio),
    audioContext,
    24000,
    1
  );
};
