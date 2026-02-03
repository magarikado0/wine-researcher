
import React, { useState, useEffect } from 'react';
import { DiagnosticForm } from './components/DiagnosticForm';
import { WineCard } from './components/WineCard';
import { Wine, RecommendationRequest } from './types';
import { GeminiSommelier } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'loading' | 'results'>('landing');
  const [results, setResults] = useState<{ wines: Wine[]; commentary: string } | null>(null);
  const [allWines, setAllWines] = useState<Wine[]>([]);

  // D1からワインデータを取得
  useEffect(() => {
    const fetchWines = async () => {
      try {
        const response = await fetch('/api/wines');
        if (response.ok) {
          const wines = await response.json();
          setAllWines(wines);
        }
      } catch (error) {
        console.error('Failed to fetch wines:', error);
      }
    };
    fetchWines();
  }, []);

  const handleDiagnosis = async (data: any) => {
    setView('loading');
    
    try {
      // 診断データからセマンティック検索クエリを構築
      const searchQuery = buildSearchQuery(data);

      // API URL（本番では環境変数から、開発では相対パス）
      const apiUrl = import.meta.env.VITE_API_URL || '/api/wines';

      // Vectorizeでセマンティック検索
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wines');
      }

      const matchedWines = await response.json();

      if (matchedWines.length === 0) {
        throw new Error('No wines found');
      }

      const sommelier = new GeminiSommelier();
      const commentary = await sommelier.generateCommentary(
        data as RecommendationRequest,
        matchedWines
      );

      setResults({ wines: matchedWines, commentary });

      // Simulate somatic processing for better UX
      setTimeout(() => setView('results'), 1800);
    } catch (error) {
      console.error('Diagnosis failed', error);
      setView('landing');
      alert('通信に失敗しました。もう一度お試しください。');
    }
  };

  // 診断データからセマンティック検索クエリを構築
  const buildSearchQuery = (data: any): string => {
    const parts: string[] = [];

    if (data.type) parts.push(`${data.type}ワイン`);
    if (data.flavor) parts.push(`${data.flavor}な味わい`);
    if (data.body) parts.push(`${data.body}のボディ`);
    if (data.region) parts.push(`${data.region}産`);
    if (data.occasion) parts.push(`${data.occasion}向き`);
    if (data.price) {
      const priceMap: { [key: string]: string } = {
        low: 'リーズナブルな価格',
        medium: '手頃な価格',
        high: 'プレミアムな',
      };
      parts.push(priceMap[data.price] || '');
    }

    return parts.filter(Boolean).join('、');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <div className="logo-inner" />
          </div>
          <h1 className="logo-text font-serif">ぴったりわいん</h1>
        </div>
        <button style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--wine-red)',
          border: '1px solid rgba(128, 0, 32, 0.2)',
          padding: '8px 24px',
          borderRadius: '100px',
          background: 'transparent',
          cursor: 'pointer'
        }}>
          MEMBERS
        </button>
      </nav>

      <main className="container section-padding" style={{ flex: 1 }}>
        {view === 'landing' && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '64px' }}>
              <span style={{ color: 'var(--wine-gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5em', textTransform: 'uppercase' }}>Your Perfect Match</span>
              <h2 className="font-serif" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', margin: '24px 0', lineHeight: 1.1 }}>
                10秒で運命の<br /><span style={{ color: 'var(--wine-red)' }}>一本</span>に出会う
              </h2>
              <div style={{ width: '80px', height: '1px', background: '#ddd', margin: '0 auto 32px' }} />
              <p style={{ color: '#888', maxWidth: '500px', margin: '0 auto', fontWeight: 300 }}>
                ワイン選びをもっと楽しく、もっと自由に。<br />
                AIソムリエが、今のあなたに「ぴったり」な一杯をセレクトします。
              </p>
            </div>
            
            <DiagnosticForm onComplete={handleDiagnosis} />
          </div>
        )}

        {view === 'loading' && (
          <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
            <div className="loader"></div>
            <div style={{ textAlign: 'center' }}>
              <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>あなたに合う一本を探しています</h3>
              <p style={{ color: 'var(--wine-gold)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3em' }}>WAIT A MOMENT</p>
            </div>
          </div>
        )}

        {view === 'results' && results && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <span style={{ border: '1px solid #eee', padding: '4px 16px', borderRadius: '100px', fontSize: '10px', color: '#aaa', letterSpacing: '0.4em', fontWeight: 700 }}>BEST MATCHES</span>
              <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '32px 0' }}>今のあなたに、<br />ぴったりの三選。</h2>
              
              <div style={{
                background: 'white',
                border: '1px solid #f0f0f0',
                padding: '40px',
                borderRadius: '32px',
                position: 'relative',
                maxWidth: '700px',
                margin: '0 auto',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '32px',
                  background: 'var(--wine-red)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'serif',
                  fontSize: '24px'
                }}>“</div>
                <p style={{ color: '#555', fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.8 }}>
                  {results.commentary}
                </p>
              </div>
            </div>

            <div className="grid-3">
              {results.wines.map(wine => (
                <WineCard key={wine.id} wine={wine} />
              ))}
            </div>

            <div style={{ marginTop: '80px', textAlign: 'center' }}>
              <button 
                onClick={() => setView('landing')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  margin: '0 auto'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ccc',
                  fontSize: '24px'
                }}>↺</div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.4em', color: '#aaa', textTransform: 'uppercase' }}>Retry Diagnosis</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: '64px 0', borderTop: '1px solid #f0f0f0', textAlign: 'center', background: 'rgba(255,255,255,0.5)' }}>
        <h4 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '12px' }}>ぴったりわいん</h4>
        <p style={{ fontSize: '9px', color: '#aaa', letterSpacing: '0.5em', textTransform: 'uppercase' }}>Find your destiny in a bottle.</p>
      </footer>
    </div>
  );
};

export default App;
