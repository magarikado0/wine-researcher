
import React, { useState } from 'react';
import { WineType } from '../types';

interface DiagnosticFormProps {
  onComplete: (data: { type?: WineType; occasion: string; trend: string; prompt: string }) => void;
}

export const DiagnosticForm: React.FC<DiagnosticFormProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    type: '' as WineType | '',
    occasion: '',
    trend: '',
    prompt: ''
  });

  const types: { label: string; value: WineType }[] = [
    { label: '情熱の赤', value: 'Red' },
    { label: '清廉な白', value: 'White' },
    { label: '優美なロゼ', value: 'Rose' },
    { label: '祝祭の泡', value: 'Sparkling' }
  ];

  const occasions = ['大切な人とのディナー', '自分へのご褒美', '友人との賑やかな会', '静かな読書のお供'];
  const trends = ['軽やかで華やか', '重厚で力強い', 'スッキリとドライ', '芳醇でスウィート'];

  const nextStep = () => setStep(s => s + 1);

  return (
    <div className="diag-form-container glass-panel">
      {step === 1 && (
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--wine-gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em' }}>STEP 01</span>
          <h2 className="font-serif" style={{ fontSize: '2rem', margin: '16px 0 32px' }}>今の気分は？</h2>
          <div className="option-grid">
            {types.map((t) => (
              <button
                key={t.value}
                onClick={() => { setSelections({ ...selections, type: t.value }); nextStep(); }}
                className="option-button"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--wine-gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em' }}>STEP 02</span>
          <h2 className="font-serif" style={{ fontSize: '2rem', margin: '16px 0 32px' }}>どんなシーンで？</h2>
          <div>
            {occasions.map((o) => (
              <button
                key={o}
                onClick={() => { setSelections({ ...selections, occasion: o }); nextStep(); }}
                className="list-button"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--wine-gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em' }}>STEP 03</span>
          <h2 className="font-serif" style={{ fontSize: '2rem', margin: '16px 0 32px' }}>味わいの好みは？</h2>
          <div>
            {trends.map((t) => (
              <button
                key={t}
                onClick={() => { setSelections({ ...selections, trend: t }); nextStep(); }}
                className="list-button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--wine-gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em' }}>STEP 04</span>
          <h2 className="font-serif" style={{ fontSize: '2rem', margin: '16px 0 32px' }}>AIソムリエへ伝言</h2>
          <textarea
            style={{
              width: '100%',
              height: '150px',
              padding: '20px',
              borderRadius: '20px',
              border: '1px solid #eee',
              backgroundColor: 'rgba(0,0,0,0.02)',
              marginBottom: '24px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
            placeholder="例：今日はお祝いなので、少し贅沢で果実味豊かなものを。"
            value={selections.prompt}
            onChange={(e) => setSelections({ ...selections, prompt: e.target.value })}
          />
          <button
            onClick={() => onComplete({ 
              type: selections.type || undefined, 
              occasion: selections.occasion, 
              trend: selections.trend, 
              prompt: selections.prompt 
            })}
            className="btn-primary"
          >
            ソムリエの提案を受け取る
          </button>
        </div>
      )}

      <div className="step-indicator">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`step-dot ${i === step ? 'active' : 'inactive'}`} />
        ))}
      </div>
    </div>
  );
};
