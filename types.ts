
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
  style: string;
  gender: string;
  emoji: string;
  description: string;
}

export interface StyleConfig {
  name: string;
  emoji: string;
  instruction: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { name: 'Khmer', nativeName: 'ភាសាខ្មែរ', code: 'km', flag: '🇰🇭' },
  { name: 'English', nativeName: 'English', code: 'en', flag: '🇺🇸' },
  { name: 'Thai', nativeName: 'ไทย', code: 'th', flag: '🇹🇭' },
  { name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'vi', flag: '🇻🇳' },
  { name: 'Chinese', nativeName: '中文', code: 'zh', flag: '🇨🇳' },
  { name: 'Japanese', nativeName: '日本語', code: 'ja', flag: '🇯🇵' },
  { name: 'Korean', nativeName: '한국어', code: 'ko', flag: '🇰🇷' },
  { name: 'French', nativeName: 'Français', code: 'fr', flag: '🇫🇷' },
  { name: 'German', nativeName: 'Deutsch', code: 'de', flag: '🇩🇪' },
  { name: 'Spanish', nativeName: 'Español', code: 'es', flag: '🇪🇸' },
  { name: 'Italian', nativeName: 'Italiano', code: 'it', flag: '🇮🇹' },
  { name: 'Portuguese', nativeName: 'Português', code: 'pt', flag: '🇵🇹' },
  { name: 'Russian', nativeName: 'Русский', code: 'ru', flag: '🇷🇺' },
  { name: 'Arabic', nativeName: 'العربية', code: 'ar', flag: '🇸🇦' },
  { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi', flag: '🇮🇳' },
];

/**
 * Available voice personas mapped to Gemini's prebuilt voices
 */
export const VOICE_PERSONAS: VoiceConfig[] = [
  { 
    id: 'Fenrir', 
    name: 'Man', 
    style: 'Strong Adult Male', 
    gender: 'Male', 
    emoji: '👨',
    description: 'A strong adult male voice with deep, resonant, and confident tones.'
  },
  { 
    id: 'Charon', 
    name: 'Old Man', 
    style: 'Wise Mature Male', 
    gender: 'Male', 
    emoji: '👴',
    description: 'An elderly male voice that is deep, gravelly, slower-paced, and conveys wisdom.'
  },
  { 
    id: 'Kore', 
    name: 'Boy', 
    style: 'Energetic Young Male', 
    gender: 'Male', 
    emoji: '👦',
    description: 'A young boy\'s voice that is higher-pitched, energetic, and enthusiastic.'
  },
  { 
    id: 'Puck', 
    name: 'Guy', 
    style: 'Energetic Young Male', 
    gender: 'Male', 
    emoji: '👱‍♂️',
    description: 'A young adult male voice with a casual, mid-range pitch and energetic delivery.'
  },
  { 
    id: 'Zephyr', 
    name: 'Woman', 
    style: 'Clear Adult Female', 
    gender: 'Female', 
    emoji: '👩',
    description: 'A clear and professional adult female voice with a standard pitch and moderate speaking rate. The tone is confident, warm, and articulate.'
  },
  { 
    id: 'Zephyr', 
    name: 'Old Woman', 
    style: 'Wise Mature Female', 
    gender: 'Female', 
    emoji: '👵',
    description: 'An elderly female voice with a lower pitch, slower speaking pace, and a softer, slightly breathy or trembling texture conveying age and wisdom.'
  },
  { 
    id: 'Zephyr', 
    name: 'Girl', 
    style: 'Playful Young Female', 
    gender: 'Female', 
    emoji: '👧',
    description: 'A young girl\'s voice with a high pitch and lighter vocal weight. The speaking rate is energetic and slightly faster, with a bright and playful tone.'
  },
];

/**
 * Emotional styles for the TTS output
 */
export const SUPPORTED_STYLES: StyleConfig[] = [
  { name: 'Neutral', emoji: '😐', instruction: 'natural and neutral' },
  { name: 'Cheerful', emoji: '😊', instruction: 'happy and cheerful' },
  { name: 'Sad', emoji: '😢', instruction: 'sad and soft' },
  { name: 'Professional', emoji: '💼', instruction: 'professional and clear' },
  { name: 'Excited', emoji: '🤩', instruction: 'very excited and high energy' },
  { name: 'Whisper', emoji: '🤫', instruction: 'whispering and quiet' },
  { name: 'Storytelling', emoji: '📖', instruction: 'engaging, warm, and narrative storytelling' },
  { name: 'Promote Product', emoji: '📣', instruction: 'persuasive, energetic, and promotional marketing tone' },
];
