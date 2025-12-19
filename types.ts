
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

export interface VoiceConfig {
  id: string;
  name: string;
  gender: string;
  emoji: string;
}

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

/**
 * Available voices for Gemini TTS
 * Options include: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
 */
export const KHMER_VOICES: VoiceConfig[] = [
  { id: 'Kore', name: 'Kore', gender: 'Male', emoji: '👨' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female', emoji: '👩' },
  { id: 'Puck', name: 'Puck', gender: 'Male', emoji: '👦' },
  { id: 'Charon', name: 'Charon', gender: 'Male', emoji: '🧔' },
];
