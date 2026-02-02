
import React from 'react';
import { Wine } from '../types';

interface WineCardProps {
  wine: Wine;
}

export const WineCard: React.FC<WineCardProps> = ({ wine }) => {
  const handleMapSearch = () => {
    const query = encodeURIComponent(`${wine.name} ワイン 販売店`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(128,0,32,0.1)] border border-gray-100">
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={wine.image_url} 
          alt={wine.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40" />
        <div className="absolute top-4 left-4 bg-[#800020] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] shadow-lg">
          {wine.type.toUpperCase()}
        </div>
      </div>
      
      <div className="p-8">
        <div className="mb-4">
          <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.3em] uppercase">{wine.region}</span>
          <h3 className="font-serif text-2xl font-bold mt-1 text-gray-900 leading-tight h-16 line-clamp-2">{wine.name}</h3>
        </div>
        
        <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-2">
          {wine.description}
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-[1px] bg-gray-100" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${i < wine.flavor_profile.body ? 'bg-[#800020]' : 'bg-gray-200'}`} 
              />
            ))}
          </div>
          <div className="flex-1 h-[1px] bg-gray-100" />
        </div>

        <div className="space-y-3">
          <a 
            href={wine.affiliate_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#800020] hover:bg-[#a00028] text-white py-4 rounded-2xl text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            この一本を取り寄せる
          </a>
          <button 
            onClick={handleMapSearch}
            className="block w-full text-center border border-gray-200 hover:border-[#800020] text-gray-600 hover:text-[#800020] py-4 rounded-2xl text-sm font-bold transition-all bg-gray-50/50 hover:bg-white"
          >
            近くの取扱店を探す
          </button>
        </div>
      </div>
    </div>
  );
};
