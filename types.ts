
export interface TranscriptionResult {
  text: string;
  confidence?: number;
}

export interface LanguageConfig {
  name: string;
  nativeName: string;
  code: string;
  flag: string;
}

// Interface for TTS voice configuration
export interface VoiceConfig {
  id: string;
  name: string;
  emoji: string;
  gender: string;
}

// Prebuilt voices available in Gemini TTS
export const KHMER_VOICES: VoiceConfig[] = [
  { id: 'Kore', name: 'Kore', emoji: '👦', gender: 'Male' },
  { id: 'Puck', name: 'Puck', emoji: '👨', gender: 'Male' },
  { id: 'Charon', name: 'Charon', emoji: '🧔', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir', emoji: '🐺', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr', emoji: '👧', gender: 'Female' },
];

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { name: 'Khmer', nativeName: 'ភាសាខ្មែរ', code: 'km', flag: '🇰🇭' },
  { name: 'English', nativeName: 'English', code: 'en', flag: '🇺🇸' },
  { name: 'Thai', nativeName: 'ไทย', code: 'th', flag: '🇹🇭' },
  { name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'vi', flag: '🇻🇳' },
  { name: 'French', nativeName: 'Français', code: 'fr', flag: '🇫🇷' },
  { name: 'Spanish', nativeName: 'Español', code: 'es', flag: '🇪🇸' },
  { name: 'Japanese', nativeName: '日本語', code: 'ja', flag: '🇯🇵' },
  { name: 'Chinese', nativeName: '中文', code: 'zh', flag: '🇨🇳' },
];
