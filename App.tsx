
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES, LanguageConfig } from './types';
import { SttSection } from './components/SttSection';
import { TtsSection } from './components/TtsSection';

const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(SUPPORTED_LANGUAGES[0]);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<'stt' | 'tts'>('stt');
  
  const [transcription, setTranscription] = useState('');
  const [ttsText, setTtsText] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLangModalOpen) {
        setIsLangModalOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLangModalOpen]);

  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleLanguageSelect = (lang: LanguageConfig) => {
    if (lang.code === currentLanguage.code) {
      setIsLangModalOpen(false);
      return;
    }

    if (transcription.trim() || ttsText.trim()) {
      const confirmSwitch = window.confirm(
        `Switching to ${lang.name} will reset current progress. Continue?`
      );
      if (!confirmSwitch) return;
    }

    setCurrentLanguage(lang);
    setTranscription('');
    setTtsText('');
    setIsLangModalOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50/50">
      {/* Professional Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight text-sm tracking-tight">KhmerVoice AI</h1>
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 <p className="text-[10px] text-gray-500 font-medium">Gemini 2.5 Active</p>
              </div>
            </div>
          </div>
          
          {/* Details Style Language Button */}
          <button 
            onClick={() => setIsLangModalOpen(true)}
            className="group flex items-center gap-3 pl-4 pr-3 py-2 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col items-end mr-1">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">Language</span>
              <span className="text-xs font-semibold text-gray-800 mt-0.5">{currentLanguage.nativeName}</span>
            </div>
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
              {currentLanguage.flag}
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10 mb-20">
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 khmer-font text-center">
            {currentLanguage.code === 'km' ? 'បច្ចេកវិទ្យាសំឡេងឆ្លាតវៃ' : `Professional Voice Studio`}
          </h2>
          <p className="text-gray-500 text-sm font-medium mb-8 text-center max-w-lg">
            High-fidelity transcription and synthesis powered by Google's Gemini 2.5 Flash model.
          </p>

          {/* Elegant Segmented Control */}
          <div className="inline-flex p-1.5 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveMode('stt')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeMode === 'stt'
                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              Speech to Text
            </button>
            <button
              onClick={() => setActiveMode('tts')}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeMode === 'tts'
                ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
              Text to Speech
            </button>
          </div>
        </div>

        <div className="relative">
          {activeMode === 'stt' ? (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                <SttSection 
                  language={currentLanguage} 
                  setCurrentLanguage={setCurrentLanguage}
                  transcription={transcription} 
                  setTranscription={setTranscription} 
                />
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                <TtsSection 
                  language={currentLanguage}
                  text={ttsText}
                  setText={setTtsText}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Language Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsLangModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scaleIn ring-1 ring-gray-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select Language</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Choose your preferred input/output language</p>
                </div>
                <button onClick={() => setIsLangModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 group ${
                      currentLanguage.code === lang.code 
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20' 
                      : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-3xl mb-3 filter drop-shadow-sm group-hover:scale-110 transition-transform duration-200">{lang.flag}</span>
                    <div className={`font-semibold text-sm truncate w-full text-center ${currentLanguage.code === lang.code ? 'text-blue-700' : 'text-gray-700'}`}>{lang.nativeName}</div>
                    <div className="text-xs text-gray-400 font-medium mt-0.5">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
         <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">Powered by Gemini 2.5 • KhmerVoice AI</p>
      </footer>
    </div>
  );
};

export default App;
