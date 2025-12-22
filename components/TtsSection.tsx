
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { synthesizeSpeech, synthesizeMultiSpeakerSpeech } from '../services/gemini';
import { VOICE_PERSONAS, SUPPORTED_STYLES, LanguageConfig, VoiceConfig, StyleConfig } from '../types';

interface TtsSectionProps {
  language: LanguageConfig;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
}

export const TtsSection: React.FC<TtsSectionProps> = ({ language, text, setText }) => {
  const [ttsMode, setTtsMode] = useState<'solo' | 'scene'>('solo');
  
  // Single Speaker State
  const [selectedVoice, setSelectedVoice] = useState<VoiceConfig>(VOICE_PERSONAS[0]);
  const [selectedStyle, setSelectedStyle] = useState<StyleConfig>(SUPPORTED_STYLES[0]);
  const [genderFilter, setGenderFilter] = useState<'Male' | 'Female'>('Female');
  
  // Script to Scene State
  const [speakerA, setSpeakerA] = useState({ 
    name: 'Joe', 
    voice: VOICE_PERSONAS.find(v => v.gender === 'Male') || VOICE_PERSONAS[0],
    style: SUPPORTED_STYLES[0]
  });
  const [speakerB, setSpeakerB] = useState({ 
    name: 'Jane', 
    voice: VOICE_PERSONAS.find(v => v.gender === 'Female') || VOICE_PERSONAS[0],
    style: SUPPORTED_STYLES[0]
  });

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const filteredVoices = useMemo(() => VOICE_PERSONAS.filter(v => v.gender === genderFilter), [genderFilter]);

  useEffect(() => {
    if (ttsMode === 'solo') {
      const isStillValid = filteredVoices.some(v => v.id === selectedVoice.id && v.name === selectedVoice.name);
      if (!isStillValid && filteredVoices.length > 0) setSelectedVoice(filteredVoices[0]);
    }
  }, [filteredVoices, selectedVoice, ttsMode]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearPlayback = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setSynthesisError(null);
  };

  const handleClearText = () => {
    setText('');
    setUploadedFileName(null);
  };

  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setIsSynthesizing(true);
    setSynthesisError(null);
    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      
      let audioBuffer;
      
      if (ttsMode === 'solo') {
        const characterPrompt = `
Generate speech in ${language.name}.
Speaker Profile: ${selectedVoice.description}.
Speaking Style: ${selectedStyle.instruction}.
Text: "${text}"`;
        audioBuffer = await synthesizeSpeech(characterPrompt, selectedVoice.id, {}, language.name);
      } else {
        const speakers = [
          { name: speakerA.name, voiceId: speakerA.voice.id },
          { name: speakerB.name, voiceId: speakerB.voice.id }
        ];
        const scriptWithContext = `
Generate a conversation in ${language.name}.

Speaker Configuration:
- ${speakerA.name} (${speakerA.voice.name}): ${speakerA.voice.description}. Tone: ${speakerA.style.instruction}.
- ${speakerB.name} (${speakerB.voice.name}): ${speakerB.voice.description}. Tone: ${speakerB.style.instruction}.

Script:
${text}`;
        audioBuffer = await synthesizeMultiSpeakerSpeech(scriptWithContext, speakers, language.name);
      }
      
      const wavBlob = await (async () => {
        const numOfChan = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChan * 2 + 44;
        const outBuffer = new ArrayBuffer(length);
        const view = new DataView(outBuffer);
        const channels = [];
        let pos = 0;
        const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
        const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan); setUint32(audioBuffer.sampleRate); setUint32(audioBuffer.sampleRate * 2 * numOfChan); setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) channels.push(audioBuffer.getChannelData(i));
        let offset = 0;
        while (pos < length) {
          for (let i = 0; i < numOfChan; i++) {
            let s = Math.max(-1, Math.min(1, channels[i][offset]));
            view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            pos += 2;
          }
          offset++;
        }
        return new Blob([outBuffer], { type: 'audio/wav' });
      })();

      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (err) { 
        console.error(err);
        setSynthesisError("Failed to generate audio. Please verify your input and try again.");
    } finally { 
        setIsSynthesizing(false); 
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Synthesis Engine</h3>
            <p className="text-xs text-gray-500 font-medium">Generate lifelike speech in {language.name}</p>
          </div>
        </div>

        {/* Mode Toggles */}
        <div className="flex p-1 bg-gray-100/80 rounded-lg">
          <button 
            onClick={() => setTtsMode('solo')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${ttsMode === 'solo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Single Voice
          </button>
          <button 
            onClick={() => setTtsMode('scene')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${ttsMode === 'scene' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Script to Scene
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {ttsMode === 'solo' && (
          <div className="animate-fadeIn space-y-6">
            <div>
                <div className="flex items-center justify-between mb-3">
                   <label className="text-xs font-semibold text-gray-700">Select Persona</label>
                   <div className="flex gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                      {(['Female', 'Male'] as const).map(g => (
                        <button key={g} onClick={() => setGenderFilter(g)} className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all ${genderFilter === g ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                          {g}
                        </button>
                      ))}
                   </div>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {filteredVoices.map(v => (
                    <button 
                      key={v.name} 
                      onClick={() => setSelectedVoice(v)} 
                      className={`relative p-3 rounded-xl border text-center transition-all duration-200 group ${selectedVoice.id === v.id && selectedVoice.name === v.name ? 'border-purple-500 bg-purple-50/50 shadow-sm ring-1 ring-purple-500/20' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <span className="text-2xl block mb-2 filter drop-shadow-sm group-hover:scale-110 transition-transform">{v.emoji}</span>
                      <span className="text-[10px] font-semibold text-gray-700 truncate block">{v.name}</span>
                      {selectedVoice.id === v.id && selectedVoice.name === v.name && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-700">Speaking Style</label>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-2">
                    {SUPPORTED_STYLES.map(style => (
                        <button
                            key={style.name}
                            onClick={() => setSelectedStyle(style)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                                selectedStyle.name === style.name
                                ? 'bg-purple-50 border-purple-200 text-purple-700 ring-1 ring-purple-200'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-lg">{style.emoji}</span>
                            <span>{style.name}</span>
                        </button>
                    ))}
                </div>
            </div>
          </div>
        )}

        {ttsMode === 'scene' && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                  Scene Configuration
                </h4>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Multi-Speaker</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Speaker A Card - Male */}
              <div className="relative group bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                
                <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-2xl shadow-inner border border-blue-100 shrink-0">
                        {speakerA.voice.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h5 className="text-sm font-bold text-gray-900 leading-tight">Speaker A</h5>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">Male Role</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <input 
                                    type="text" 
                                    value={speakerA.name} 
                                    onChange={e => setSpeakerA({...speakerA, name: e.target.value})}
                                    className="w-full bg-blue-50/30 focus:bg-white border border-blue-100 focus:border-blue-400 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none transition-all placeholder-blue-300/50"
                                    placeholder="Name (e.g. Joe)"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select 
                                        value={speakerA.voice.name}
                                        onChange={e => {
                                            const v = VOICE_PERSONAS.find(p => p.name === e.target.value);
                                            if (v) setSpeakerA({...speakerA, voice: v});
                                        }}
                                        className="w-full appearance-none bg-white border border-gray-200 focus:border-blue-400 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-gray-600 outline-none transition-all cursor-pointer hover:border-blue-300"
                                    >
                                        {VOICE_PERSONAS.filter(v => v.gender === 'Male').map(v => (
                                            <option key={v.name} value={v.name}>{v.name} • {v.style}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2.5 top-2.5 pointer-events-none text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                <div className="relative flex-1">
                                    <select 
                                        value={speakerA.style.name}
                                        onChange={e => {
                                            const s = SUPPORTED_STYLES.find(st => st.name === e.target.value);
                                            if (s) setSpeakerA({...speakerA, style: s});
                                        }}
                                        className="w-full appearance-none bg-white border border-gray-200 focus:border-blue-400 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-gray-600 outline-none transition-all cursor-pointer hover:border-blue-300"
                                    >
                                        {SUPPORTED_STYLES.map(s => (
                                            <option key={s.name} value={s.name}>{s.emoji} {s.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2.5 top-2.5 pointer-events-none text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
              
              {/* Speaker B Card - Female */}
              <div className="relative group bg-white p-5 rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                
                <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center text-2xl shadow-inner border border-pink-100 shrink-0">
                        {speakerB.voice.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h5 className="text-sm font-bold text-gray-900 leading-tight">Speaker B</h5>
                                <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mt-0.5">Female Role</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <input 
                                    type="text" 
                                    value={speakerB.name} 
                                    onChange={e => setSpeakerB({...speakerB, name: e.target.value})}
                                    className="w-full bg-pink-50/30 focus:bg-white border border-pink-100 focus:border-pink-400 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none transition-all placeholder-pink-300/50"
                                    placeholder="Name (e.g. Jane)"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select 
                                        value={speakerB.voice.name}
                                        onChange={e => {
                                            const v = VOICE_PERSONAS.find(p => p.name === e.target.value);
                                            if (v) setSpeakerB({...speakerB, voice: v});
                                        }}
                                        className="w-full appearance-none bg-white border border-pink-400 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-gray-600 outline-none transition-all cursor-pointer hover:border-pink-300"
                                    >
                                        {VOICE_PERSONAS.filter(v => v.gender === 'Female').map(v => (
                                             <option key={v.name} value={v.name}>{v.name} • {v.style}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2.5 top-2.5 pointer-events-none text-gray-400">
                                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                <div className="relative flex-1">
                                    <select 
                                        value={speakerB.style.name}
                                        onChange={e => {
                                            const s = SUPPORTED_STYLES.find(st => st.name === e.target.value);
                                            if (s) setSpeakerB({...speakerB, style: s});
                                        }}
                                        className="w-full appearance-none bg-white border border-pink-400 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-gray-600 outline-none transition-all cursor-pointer hover:border-pink-300"
                                    >
                                        {SUPPORTED_STYLES.map(s => (
                                            <option key={s.name} value={s.name}>{s.emoji} {s.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2.5 top-2.5 pointer-events-none text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
           <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              {uploadedFileName ? (
                <span className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  {uploadedFileName}
                </span>
              ) : (
                ttsMode === 'scene' ? 'Dialogue Script' : 'Script Content'
              )}
            </label>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={handleClearText}
                    disabled={!text.trim()}
                    className="text-[10px] font-bold text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    title="Clear Text"
                >
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                   Clear
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-gray-500 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    title="Upload Text File"
                >
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4V4"></path></svg>
                   Upload Text
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".txt,.md,.json,.csv" 
                    className="hidden" 
                />
            </div>
           </div>
           
           {ttsMode === 'scene' && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                 <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 <div>
                    <p className="font-semibold">Use the format: <span className="font-mono bg-blue-100/50 px-1 rounded text-blue-700">Speaker Name: Dialogue</span></p>
                    <p className="mt-1 text-blue-700/80">Example: {speakerA.name}: Hello there! {speakerB.name}: Hi {speakerA.name}, how are you today?</p>
                 </div>
              </div>
            )}

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={ttsMode === 'scene' ? `${speakerA.name}: Hello!\n${speakerB.name}: Hi there, how are you?` : "Enter text for synthesis..."}
            className="w-full h-40 p-4 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all text-sm font-medium resize-none khmer-font leading-relaxed shadow-sm placeholder-gray-300"
          />
        </div>

        {synthesisError && (
            <div className="animate-fadeIn p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {synthesisError}
            </div>
        )}

        <div className="flex flex-col gap-4 pt-2">
          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing || !text.trim()}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                !text.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                isSynthesizing ? 'bg-purple-100 text-purple-700 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
            }`}
          >
            {isSynthesizing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Generate Audio
              </>
            )}
          </button>
          
          {audioUrl && (
            <div className="animate-fadeIn bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Playback Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleClearPlayback}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                      title="Clear Playback"
                    >
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                       Clear
                    </button>
                    <a href={audioUrl} download={`khmervoice-synthesis-${Date.now()}.wav`} className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-purple-50">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                       Download WAV
                    </a>
                  </div>
               </div>
               <audio controls src={audioUrl} className="w-full h-10 rounded-lg focus:outline-none" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
