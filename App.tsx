
import React, { useState, useRef } from 'react';
import { Language, AnalysisResult } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { ResultCard } from './components/ResultCard';
import { analyzeVoiceSample, AnalysisOptions } from './services/geminiService';

type AnalysisStep = 'idle' | 'encoding' | 'uploading' | 'analyzing' | 'complete';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [step, setStep] = useState<AnalysisStep>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'direct' | 'backend'>('direct');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('audio/')) {
        setError('Please upload a valid audio file (MP3, WAV, M4A).');
        return;
      }
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
      setStep('idle');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setError(null);
    setResult(null);
    
    try {
      setStep('encoding');
      const base64 = await fileToBase64(file);
      
      setStep('uploading');
      const options: AnalysisOptions = { mode, backendUrl };
      
      // Artificial slight delay for perceived speed of phases
      await new Promise(r => setTimeout(r, 400));
      
      setStep('analyzing');
      const res = await analyzeVoiceSample(base64, file.type, selectedLanguage, options);
      
      setResult(res);
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStep('idle');
    }
  };

  const reset = () => {
    setFile(null);
    setAudioUrl(null);
    setResult(null);
    setError(null);
    setStep('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isAnalyzing = step !== 'idle' && step !== 'complete';

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-indigo-700 text-white py-8 shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-indigo-800 rounded-full hover:bg-indigo-600 transition-colors"
            title="System Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight">VoxGuard</h1>
          </div>
          <p className="text-indigo-100 max-w-2xl">
            Detect AI-generated deepfake voices using advanced forensic audio analysis. 
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {showSettings && (
          <div className="mb-8 bg-slate-800 text-slate-200 p-6 rounded-3xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                System Configuration
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Analysis Engine</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMode('direct')}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${mode === 'direct' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 hover:bg-slate-700'}`}
                  >
                    Direct SDK
                  </button>
                  <button 
                    onClick={() => setMode('backend')}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${mode === 'backend' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 hover:bg-slate-700'}`}
                  >
                    FastAPI Backend
                  </button>
                </div>
              </div>
              {mode === 'backend' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-widest">Backend Endpoint</label>
                  <input 
                    type="text" 
                    value={backendUrl} 
                    onChange={(e) => setBackendUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="http://localhost:8000"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
              Select Target Language
            </h2>
            <LanguageSelector selected={selectedLanguage} onSelect={setSelectedLanguage} />
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">2</span>
              Upload Audio Sample
            </h2>
            
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 transition-colors">
                  <svg className="w-8 h-8 text-slate-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-slate-700 font-semibold mb-1">Click to upload audio</p>
                <p className="text-slate-400 text-sm">MP3, WAV, or M4A (Max 10MB)</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                      <p className="text-sm text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={reset} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {audioUrl && <audio controls src={audioUrl} className="w-full h-10 mt-2" />}
              </div>
            )}
          </section>

          <div className="sticky bottom-6 z-10">
            <button
              disabled={!file || isAnalyzing}
              onClick={handleAnalyze}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all flex flex-col items-center justify-center gap-1 ${
                !file || isAnalyzing 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{step === 'encoding' ? 'Optimizing Audio...' : step === 'uploading' ? 'Transmitting to AI Engine...' : 'Analyzing Forensic Patterns...'}</span>
                  </div>
                  <div className="w-48 h-1 bg-slate-200 mt-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: step === 'encoding' ? '20%' : step === 'uploading' ? '50%' : '85%' }}
                    ></div>
                  </div>
                </div>
              ) : (
                <span className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04zM3 9a9 9 0 0018 0V9a9 9 0 00-18 0v0z" />
                  </svg>
                  Verify Authenticity
                </span>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex gap-3 items-start animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {result && <ResultCard result={result} />}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 mt-12 text-center text-slate-400 text-sm">
        <p>&copy; 2024 VoxGuard AI Verification. Optimized Forensic Analysis.</p>
      </footer>
    </div>
  );
};

export default App;
