
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
    <article className="wine-card">
      <div className="wine-image-container">
        <img 
          src={wine.image_url} 
          alt={wine.name} 
          className="wine-image"
        />
        <div className="wine-badge">
          {wine.type.toUpperCase()}
        </div>
      </div>
      
      <div className="wine-content">
        <header>
          <span className="wine-region">{wine.region}</span>
          <h3 className="wine-title font-serif">{wine.name}</h3>
        </header>
        
        <p className="wine-desc">
          {wine.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: i < wine.flavor_profile.body ? 'var(--wine-red)' : '#eee'
                }}
              />
            ))}
          </div>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a 
            href={wine.affiliate_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
          >
            この一本を取り寄せる
          </a>
          <button 
            onClick={handleMapSearch}
            className="btn-secondary"
          >
            近くの取扱店を探す
          </button>
        </div>
      </div>
    </article>
  );
};
