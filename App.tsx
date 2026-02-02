
import React, { useState, useEffect, useCallback } from 'react';
import { DiagnosticForm } from './components/DiagnosticForm';
import { WineCard } from './components/WineCard';
import { Wine, RecommendationRequest } from './types';
import { MOCK_WINES } from './constants';
import { GeminiSommelier } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'loading' | 'results'>('landing');
  const [results, setResults] = useState<{ wines: Wine[]; commentary: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pittari_wine_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleDiagnosis = async (data: any) => {
    setView('loading');
    
    try {
      const sommelier = new GeminiSommelier();
      const filtered = MOCK_WINES.filter(w => {
        if (data.type && w.type !== data.type) return false;
        return true;
      });

      const commentary = await sommelier.generateCommentary(data as RecommendationRequest, filtered);

      const resultPayload = { wines: filtered, commentary };
      setResults(resultPayload);
      
      const updatedHistory = [resultPayload, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('pittari_wine_history', JSON.stringify(updatedHistory));

      setTimeout(() => setView('results'), 1800);
    } catch (error) {
      console.error("Diagnosis failed", error);
      setView('landing');
      alert("通信に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-gray-800">
      {/* Elegant Floating Header */}
      <nav className="fixed top-0 left-0 right-0 h-20 px-8 flex justify-between items-center z-50 bg-white/70 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#800020] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-full opacity-50" />
          </div>
          <h1 className="font-serif text-xl font-bold tracking-[0.1em] text-gray-900">
            ぴったりわいん
          </h1>
        </div>
        <button className="text-[10px] font-bold tracking-[0.2em] text-[#800020] border border-[#800020]/30 px-6 py-2 rounded-full hover:bg-[#800020] hover:text-white transition-all">
          MEMBERS
        </button>
      </nav>

      <main className="flex-1 flex flex-col pt-32 pb-20 px-6">
        {view === 'landing' && (
          <div className="container mx-auto max-w-5xl text-center space-y-16">
            <div className="space-y-6 animate-in fade-in zoom-in duration-1000">
              <span className="text-[#D4AF37] text-xs tracking-[0.6em] uppercase font-bold">Your Perfect Match</span>
              <h2 className="font-serif text-5xl md:text-7xl font-bold leading-tight text-gray-900">
                10秒で運命の<br /><span className="text-[#800020]">一本</span>に出会う
              </h2>
              <div className="w-20 h-[1px] bg-gray-200 mx-auto" />
              <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
                ワイン選びをもっと楽しく、もっと自由に。<br />
                AIソムリエが、今のあなたに「ぴったり」な一杯をセレクトします。
              </p>
            </div>
            
            <div className="pb-10">
              <DiagnosticForm onComplete={handleDiagnosis} />
            </div>
          </div>
        )}

        {view === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-[#800020]/10" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#800020] animate-spin" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-serif text-2xl text-gray-900">あなたに合う一本を探しています</h3>
              <p className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Wait a moment</p>
            </div>
          </div>
        )}

        {view === 'results' && results && (
          <div className="container mx-auto max-w-6xl space-y-24 animate-in fade-in duration-1000">
            <div className="text-center max-w-3xl mx-auto space-y-8">
              <div className="inline-block py-1 px-4 border border-gray-200 rounded-full text-[10px] text-gray-400 tracking-[0.4em] font-bold uppercase">
                Best Matches
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-gray-900 leading-tight">
                今のあなたに、<br />ぴったりの三選。
              </h2>
              <div className="bg-white/50 border border-gray-100 p-8 md:p-12 rounded-[2rem] shadow-sm relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#800020] rounded-full flex items-center justify-center text-white text-xl font-serif">“</div>
                <p className="text-gray-600 italic text-lg leading-loose">
                  {results.commentary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {results.wines.map(wine => (
                <WineCard key={wine.id} wine={wine} />
              ))}
            </div>

            <div className="text-center">
              <button 
                onClick={() => setView('landing')}
                className="group flex flex-col items-center mx-auto space-y-4"
              >
                <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#800020] transition-all">
                  <span className="text-xl text-gray-300 group-hover:text-[#800020]">↺</span>
                </div>
                <span className="text-[10px] font-bold tracking-[0.4em] text-gray-400 group-hover:text-gray-900 uppercase transition-all">Retry Diagnosis</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="p-12 border-t border-gray-100 text-center space-y-4 bg-white/50">
        <h4 className="font-serif text-lg font-bold tracking-widest text-gray-900">ぴったりわいん</h4>
        <p className="text-[9px] text-gray-400 tracking-[0.5em] uppercase">
          Find your destiny in a bottle.
        </p>
      </footer>
    </div>
  );
};

export default App;
