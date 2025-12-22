
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { transcribeAndDetectLanguage } from '../services/gemini';
import { blobToBase64, createPcmBlob } from '../services/audio';
import { Visualizer } from './Visualizer';
import { LanguageConfig, SUPPORTED_LANGUAGES } from '../types';

interface SttSectionProps {
  language: LanguageConfig;
  setCurrentLanguage: React.Dispatch<React.SetStateAction<LanguageConfig>>;
  transcription: string;
  setTranscription: React.Dispatch<React.SetStateAction<string>>;
}

export const SttSection: React.FC<SttSectionProps> = ({ 
  language, 
  setCurrentLanguage,
  transcription, 
  setTranscription 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [interimText, setInterimText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription, interimText]);

  const handleTranscriptionUpdate = (text: string) => {
    setInterimText(text);
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      setIsRecording(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: `Transcribe audio to ${language.name}. Only output the words spoken. No AI chatter.`,
        },
        callbacks: {
          onopen: () => {
            const source = audioContext.createMediaStreamSource(mediaStream);
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              handleTranscriptionUpdate(text);
            }
          },
          onerror: (e) => console.error(e),
          onclose: () => {},
        },
      });

      liveSessionRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (interimText) {
        setTranscription(prev => {
          const base = prev.trim();
          return base ? base + ' ' + interimText : interimText;
        });
        setInterimText('');
      }
      audioContextRef.current?.close();
      audioContextRef.current = null;
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
      if (liveSessionRef.current) {
        liveSessionRef.current.then((session: any) => session.close());
        liveSessionRef.current = null;
      }
    }
  };

  const handleCopy = () => {
    if (!transcription.trim()) return;
    navigator.clipboard.writeText(transcription).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!transcription.trim()) return;
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stt-${language.code}-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearTranscription = () => {
    if (isRecording) stopRecording();
    setTranscription('');
    setInterimText('');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Transcription Hub</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <p className="text-xs text-gray-500 font-medium">{isRecording ? 'Live Recording Active' : 'Ready to Capture'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={!transcription.trim()}
            className="p-2.5 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Download Transcript"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          </button>
          <button
            onClick={handleCopy}
            disabled={!transcription.trim()}
            className="p-2.5 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Copy to Clipboard"
          >
            {isCopied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            )}
          </button>
          <button
            onClick={clearTranscription}
            disabled={!transcription.trim() && !interimText.trim()}
            className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Clear Text"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={scrollRef}
          className="min-h-[320px] p-6 bg-white rounded-2xl border border-gray-200 text-gray-800 khmer-font text-sm leading-7 whitespace-pre-wrap overflow-y-auto max-h-[500px] shadow-inner scroll-smooth"
        >
          {transcription}
          {interimText && <span className="text-blue-500 font-medium italic animate-pulse ml-1">{interimText}</span>}
          {!transcription.trim() && !interimText.trim() && (
            <div className="h-[280px] flex flex-col items-center justify-center gap-3 opacity-30 select-none">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Waiting for audio input...</p>
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                 <div className="flex gap-1.5">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                 </div>
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Processing</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-full sm:flex-[4] py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${
            isRecording 
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
          }`}
        >
          {isRecording ? (
            <><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Stop Recording</>
          ) : (
            <>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
               Start Transcription
            </>
          )}
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isRecording}
          className="w-full sm:flex-1 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4V4"></path></svg>
          Upload
        </button>
        <input type="file" ref={fileInputRef} onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            setIsProcessing(true);
            try {
              const base64 = await blobToBase64(file);
              const { transcription: res, detectedLanguageCode } = await transcribeAndDetectLanguage(base64, file.type);
              setTranscription(prev => prev + (prev ? '\n' : '') + res);
              const matched = SUPPORTED_LANGUAGES.find(l => l.code === detectedLanguageCode);
              if (matched && matched.code !== language.code) setCurrentLanguage(matched);
            } catch (err) { console.error(err); } finally { setIsProcessing(false); }
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
        }} accept="audio/*" className="hidden" />
      </div>

      {(isRecording || interimText) && (
        <div className="animate-fadeIn mt-2">
          <Visualizer stream={stream} isRecording={isRecording} />
        </div>
      )}
    </div>
  );
};
