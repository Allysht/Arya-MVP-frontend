import React from 'react';
import './AttractionResults.css';

const AttractionResults = ({ data }) => {
  if (!data || !data.attractions || data.attractions.length === 0) {
    return null;
  }

  const { destination, attractions } = data;

  return (
    <div className="attraction-results">
      <div className="attraction-header">
        <span className="attraction-icon">🎯</span>
        <h3>Top Attractions in {destination}</h3>
      </div>

      <div className="attractions-list">
        {attractions.map((attraction, idx) => (
          <AttractionCard key={idx} attraction={attraction} index={idx + 1} />
        ))}
      </div>

      <a
        href={`https://www.google.com/maps/search/attractions+in+${encodeURIComponent(destination)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="view-all-link"
      >
        Explore on Google Maps →
      </a>
    </div>
  );
};

const AttractionCard = ({ attraction, index }) => {
  return (
    <div className="attraction-card">
      <div className="attraction-number">{index}</div>
      <div className="attraction-content">
        <h4 className="attraction-name">{attraction.name}</h4>
        {attraction.description && (
          <p className="attraction-description">{attraction.description}</p>
        )}
        <div className="attraction-meta">
          {attraction.duration && (
            <span className="duration">
              ⏱️ {attraction.duration}
            </span>
          )}
          {attraction.bestTime && (
            <span className="best-time">
              🌤️ {attraction.bestTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttractionResults;
