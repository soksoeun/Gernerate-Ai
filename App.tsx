
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES, LanguageConfig } from './types';
import { SttSection } from './components/SttSection';
import { TtsSection } from './components/TtsSection';

const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(SUPPORTED_LANGUAGES[0]);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stt' | 'tts'>('stt');
  
  // State for transcription (STT)
  const [transcription, setTranscription] = useState('');
  // State for text input (TTS)
  const [ttsText, setTtsText] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape key
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

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle language selection and reset relevant states
  const handleLanguageSelect = (lang: LanguageConfig) => {
    if (lang.code === currentLanguage.code) {
      setIsLangModalOpen(false);
      return;
    }

    if (transcription.trim() || ttsText.trim()) {
      const confirmSwitch = window.confirm(
        `You have existing content in ${currentLanguage.name}. Switching to ${lang.name} will update the context for both transcription and synthesis. Continue?`
      );
      if (!confirmSwitch) return;
    }

    setCurrentLanguage(lang);
    setIsLangModalOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen pb-20 bg-[#fbfcfd]">
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200/50">
              {currentLanguage.flag}
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-900 leading-none text-lg">Voice AI</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Gemini Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-blue-300 transition-all group shadow-sm"
            >
              <span className="text-sm rounded-full w-6 h-6 flex items-center justify-center bg-gray-50">{currentLanguage.flag}</span>
              <span className="text-sm font-bold text-gray-700">{currentLanguage.nativeName}</span>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-12 mb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>Gemini Multimodal AI</span>
          </div>
          
          <h2 className="text-4xl font-black text-gray-900 sm:text-6xl mb-4 khmer-font tracking-tight leading-tight">
            {currentLanguage.code === 'km' ? 'បច្ចេកវិទ្យាសំឡេង' : `Voice AI Toolkit`}
          </h2>
          
          <p className="text-gray-500 max-w-xl mx-auto mb-8 text-lg font-medium leading-relaxed">
            Harness the power of Gemini for seamless audio transcription and natural speech synthesis in {currentLanguage.name}.
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <button 
              onClick={() => setActiveTab('stt')}
              className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                activeTab === 'stt' 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm'
              }`}
            >
              Speech to Text
            </button>
            <button 
              onClick={() => setActiveTab('tts')}
              className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                activeTab === 'tts' 
                ? 'bg-purple-600 text-white shadow-xl shadow-purple-200 ring-4 ring-purple-50' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm'
              }`}
            >
              Text to Speech
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-[40px] blur-2xl -z-10 opacity-60"></div>
          <div className="bg-white rounded-[32px] p-2 shadow-xl shadow-blue-900/5 border border-white overflow-hidden">
            {activeTab === 'stt' ? (
              <SttSection 
                language={currentLanguage} 
                transcription={transcription} 
                setTranscription={setTranscription} 
              />
            ) : (
              <TtsSection 
                language={currentLanguage}
                text={ttsText}
                setText={setTtsText}
              />
            )}
          </div>
        </div>
      </main>

      {/* Language Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setIsLangModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-scaleIn border border-white">
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Choose Language</h3>
                  <p className="text-sm text-gray-400 font-medium">Select your preferred voice language</p>
                </div>
                <button onClick={() => setIsLangModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="relative">
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>
            <div className="px-8 pb-8 pt-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-3">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`p-4 rounded-[22px] text-left border-2 transition-all flex flex-col gap-3 group ${
                      currentLanguage.code === lang.code 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-50 bg-white hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-3xl transition-transform group-hover:scale-110 origin-left">{lang.flag}</span>
                    <div>
                      <div className={`font-black text-sm ${currentLanguage.code === lang.code ? 'text-blue-700' : 'text-gray-900'}`}>{lang.nativeName}</div>
                      <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{lang.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-t border-gray-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              Operational
            </span>
            <span>Active: {currentLanguage.name}</span>
          </div>
          <div>© 2024 Voice AI Global</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
