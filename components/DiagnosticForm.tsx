
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
    <div className="max-w-xl mx-auto w-full">
      <div className="glass-morphism rounded-[2.5rem] p-10 md:p-14 shadow-[0_20px_60px_rgba(128,0,32,0.05)] border border-white/60">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-2">
              <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">Step 01</span>
              <h2 className="font-serif text-3xl text-gray-900">今の気分は？</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setSelections({ ...selections, type: t.value }); nextStep(); }}
                  className="group relative h-28 flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-100 hover:border-[#800020] hover:bg-[#800020]/5 transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-gray-800 font-medium group-hover:text-[#800020] transition-colors">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-2">
              <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">Step 02</span>
              <h2 className="font-serif text-3xl text-gray-900">どんなシーンで？</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {occasions.map((o) => (
                <button
                  key={o}
                  onClick={() => { setSelections({ ...selections, occasion: o }); nextStep(); }}
                  className="py-5 px-8 text-center rounded-2xl bg-white border border-gray-100 hover:border-[#800020] hover:bg-[#800020]/5 transition-all text-gray-700 shadow-sm"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-2">
              <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">Step 03</span>
              <h2 className="font-serif text-3xl text-gray-900">味わいの好みは？</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {trends.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSelections({ ...selections, trend: t }); nextStep(); }}
                  className="py-5 px-8 text-center rounded-2xl bg-white border border-gray-100 hover:border-[#800020] hover:bg-[#800020]/5 transition-all text-gray-700 shadow-sm"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-2">
              <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">Step 04</span>
              <h2 className="font-serif text-3xl text-gray-900">AIソムリエへ伝言</h2>
            </div>
            <p className="text-gray-400 text-xs text-center">
              合わせたい料理や、今の感情を自由にお書きください。
            </p>
            <textarea
              className="w-full h-36 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-sm focus:border-[#800020] focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
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
              className="w-full bg-[#800020] hover:bg-[#a00028] py-5 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] hover:shadow-[0_10px_30px_rgba(128,0,32,0.2)]"
            >
              ソムリエの提案を受け取る
            </button>
          </div>
        )}

        <div className="mt-12 flex justify-center items-center gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-[#800020]' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
