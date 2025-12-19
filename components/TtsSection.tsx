
import React, { useState, useEffect } from 'react';
import { synthesizeSpeech } from '../services/gemini';
import { KHMER_VOICES, LanguageConfig } from '../types';

interface TtsSectionProps {
  language: LanguageConfig;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
}

export const TtsSection: React.FC<TtsSectionProps> = ({ language, text, setText }) => {
  const [selectedVoice, setSelectedVoice] = useState(KHMER_VOICES[0].id);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSynthesize = async () => {
    if (!text.trim()) return;

    setIsSynthesizing(true);
    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const audioBuffer = await synthesizeSpeech(text, selectedVoice, { pitch: 0, rate: 1.0, intensity: 5 }, language.name);
      const wavBlob = await audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("Synthesis error:", error);
      alert("Failed to synthesize speech.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const downloadTextFile = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${language.code}-text-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  };

  return (
    <div className="space-y-8 animate-fadeIn p-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="p-2 bg-purple-50 text-purple-600 rounded-lg shadow-sm">🔊</span>
          {language.name} Voice Synthesis
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Select Voice Persona</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KHMER_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 group ${
                    selectedVoice === voice.id 
                    ? 'border-purple-600 bg-purple-50/50 shadow-lg shadow-purple-500/10 ring-4 ring-purple-100' 
                    : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-3xl transition-transform duration-300 ${selectedVoice === voice.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {voice.emoji}
                  </span>
                  <div>
                    <div className={`font-black text-sm ${selectedVoice === voice.id ? 'text-purple-700' : 'text-gray-900'}`}>
                      {voice.name}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      {voice.gender}
                    </div>
                  </div>
                  {selectedVoice === voice.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-purple-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Input Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Type something in ${language.name}...`}
              className="w-full h-44 p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 focus:bg-white outline-none transition-all text-gray-800 font-medium text-lg leading-relaxed placeholder:text-gray-300"
            />
            {text && (
              <button
                onClick={downloadTextFile}
                className="absolute bottom-6 right-6 p-3 bg-white/90 hover:bg-white text-gray-500 hover:text-purple-600 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center gap-2"
                title="Save as Text"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">TXT</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !text.trim()}
              className="group relative overflow-hidden w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98]"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isSynthesizing ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                    <span>GENERATE {language.code.toUpperCase()} VOICE</span>
                  </>
                )}
              </div>
            </button>

            {audioUrl && (
              <div className="animate-fadeIn pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={playAudio}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-black rounded-xl border border-gray-200 transition-all shadow-sm active:bg-gray-100"
                >
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 3a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-1zm3 0a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-1zm3 0a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-1zm3 0a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-1z"></path></svg>
                  REPLAY
                </button>
                <a 
                  href={audioUrl} 
                  download={`${language.code}-${selectedVoice}-voice.wav`}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black rounded-xl border border-purple-100 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  DOWNLOAD .WAV
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
