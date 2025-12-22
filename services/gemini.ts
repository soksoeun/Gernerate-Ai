
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decode, decodeAudioData } from "./audio";

/**
 * Transcribes audio and automatically detects the language.
 * Returns both the transcription and the detected language code.
 */
export const transcribeAndDetectLanguage = async (
  base64Audio: string, 
  mimeType: string = 'audio/webm'
): Promise<{ transcription: string; detectedLanguageCode: string }> => {
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
            text: `Transcribe the following audio. Identify the language being spoken and return it as a ISO 639-1 language code (e.g., 'km', 'en', 'th', 'vi', 'ja', 'ko', 'zh', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'ar', 'hi').`
          }
        ],
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: {
            type: Type.STRING,
            description: "The verbatim transcription of the audio."
          },
          detectedLanguageCode: {
            type: Type.STRING,
            description: "The ISO 639-1 language code of the detected language."
          }
        },
        required: ["transcription", "detectedLanguageCode"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return {
      transcription: result.transcription || "Transcription failed.",
      detectedLanguageCode: result.detectedLanguageCode || "en"
    };
  } catch (e) {
    console.error("JSON parsing error in transcription:", e);
    return {
      transcription: response.text || "Transcription failed.",
      detectedLanguageCode: "en"
    };
  }
};

/**
 * Synthesize speech using Gemini 2.5 Flash TTS model.
 * Returns an AudioBuffer which can be played back or converted to other formats.
 */
export const synthesizeSpeech = async (
  text: string, 
  voiceName: string, 
  _config: any, 
  _languageName: string
): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
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

/**
 * Synthesize multi-speaker speech using Gemini 2.5 Flash TTS model.
 */
export const synthesizeMultiSpeakerSpeech = async (
  prompt: string,
  speakers: { name: string; voiceId: string }[],
  languageName: string
): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Generate a conversation in ${languageName} based on this script: ${prompt}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map(s => ({
            speaker: s.name,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s.voiceId },
            },
          }))
        }
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Synthesis failed.");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
};
