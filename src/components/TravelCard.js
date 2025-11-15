import React from 'react';
import './TravelCard.css';

const TravelCard = ({ data, type }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`star-${i}`} className="star">⭐</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half-star" className="star">⭐</span>);
    }

    return stars;
  };

  const icon = type === 'hotel' ? '🏨' : '🍽️';
  const hasImages = data.images && data.images.length > 0;

  return (
    <div className="travel-card">
      {hasImages && (
        <div className="card-image-container">
          <img
            src={data.images[0]}
            alt={data.name}
            className="card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="card-content">
        <div className="card-header">
          <span className="card-icon">{icon}</span>
          <h4 className="card-title">{data.name}</h4>
        </div>
        
        <div className="card-rating">
          {renderStars(data.rating)}
          <span className="rating-text">{data.rating.toFixed(1)}</span>
        </div>
        
        <p className="card-address">📍 {data.address}</p>
        
        {data.googleMapsUrl && (
          <a
            href={data.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
          >
            View on Google Maps 🗺️
          </a>
        )}
      </div>
    </div>
  );
};

export default TravelCard;

