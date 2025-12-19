
import React, { useState, useRef } from 'react';
import { transcribeKhmerAudio } from '../services/gemini';
import { blobToBase64 } from '../services/audio';
import { Visualizer } from './Visualizer';
import { LanguageConfig } from '../types';

interface SttSectionProps {
  language: LanguageConfig;
  transcription: string;
  setTranscription: React.Dispatch<React.SetStateAction<string>>;
}

export const SttSection: React.FC<SttSectionProps> = ({ language, transcription, setTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const base64 = await blobToBase64(audioBlob);
          const result = await transcribeKhmerAudio(base64, 'audio/webm', language.name);
          setTranscription(prev => (prev ? prev + ' ' + result : result));
        } catch (error) {
          console.error("Transcription error:", error);
          alert("Failed to transcribe audio. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert("Please upload a valid audio file.");
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = await blobToBase64(file);
      const result = await transcribeKhmerAudio(base64, file.type, language.name);
      setTranscription(prev => (prev ? prev + '\n' + result : result));
    } catch (error) {
      console.error("File transcription error:", error);
      alert("Failed to transcribe the uploaded file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const downloadTranscription = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${language.code}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">🎙️</span>
            {language.name} Dictation
          </h2>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="audio/*" 
            className="hidden" 
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="min-h-[160px] p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 khmer-font leading-relaxed whitespace-pre-wrap relative">
            {transcription || `Your transcribed ${language.name} text will appear here...`}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-gray-100 rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <span className="text-blue-500 font-medium text-sm">Transcribing...</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-stretch sm:items-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className="flex-[2] min-w-[140px] py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-[2] min-w-[140px] py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 animate-pulse"
              >
                Stop Recording
              </button>
            )}

            <button
              onClick={triggerFileUpload}
              disabled={isProcessing || isRecording}
              className="flex-1 min-w-[120px] py-4 bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-50 text-indigo-600 font-semibold rounded-xl border border-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <span>📁</span> Upload
            </button>
            
            {transcription && (
              <button
                onClick={downloadTranscription}
                className="px-6 py-4 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl border border-green-100 transition-all flex items-center gap-2"
                title="Download as .txt"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            <button
              onClick={() => setTranscription('')}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-all"
            >
              Clear
            </button>
          </div>

          {isRecording && <Visualizer stream={stream} isRecording={isRecording} />}
        </div>
      </div>
    </div>
  );
};
