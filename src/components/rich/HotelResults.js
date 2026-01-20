import React from 'react';
import './HotelResults.css';

const HotelResults = ({ data }) => {
  if (!data || !data.hotels || data.hotels.length === 0) {
    return null;
  }

  const { destination, checkIn, checkOut, nights, hotels, searchUrl } = data;

  return (
    <div className="hotel-results">
      <div className="hotel-header">
        <span className="hotel-icon">🏨</span>
        <h3>Hotels in {destination}</h3>
        <span className="dates">{checkIn} - {checkOut}</span>
        {nights && <span className="nights">{nights} nights</span>}
      </div>

      <div className="hotels-grid">
        {hotels.slice(0, 6).map((hotel, idx) => (
          <HotelCard key={idx} hotel={hotel} />
        ))}
      </div>

      {searchUrl && (
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="view-all-link">
          View all hotels on Google →
        </a>
      )}
    </div>
  );
};

const HotelCard = ({ hotel }) => {
  const hasImage = hotel.thumbnail || (hotel.images && hotel.images.length > 0);
  const imageUrl = hotel.thumbnail || hotel.images?.[0];

  return (
    <div className="hotel-card">
      {hasImage && (
        <div className="hotel-image">
          <img
            src={imageUrl}
            alt={hotel.name}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="hotel-info">
        <h4 className="hotel-name">{hotel.name}</h4>

        {hotel.stars && (
          <div className="hotel-stars">
            {'⭐'.repeat(Math.min(hotel.stars, 5))}
          </div>
        )}

        <div className="hotel-rating">
          {hotel.rating && (
            <span className="rating">
              📊 {typeof hotel.rating === 'number' ? hotel.rating.toFixed(1) : hotel.rating}
            </span>
          )}
          {hotel.reviews && (
            <span className="reviews">({hotel.reviews} reviews)</span>
          )}
        </div>

        <div className="hotel-price">
          {hotel.priceFormatted || hotel.price || 'Price on request'}
          <span className="per-night">/night</span>
        </div>

        {hotel.location && (
          <div className="hotel-location">
            📍 {hotel.location}
          </div>
        )}

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="hotel-amenities">
            {hotel.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="amenity">{amenity}</span>
            ))}
          </div>
        )}

        {hotel.link && (
          <a href={hotel.link} target="_blank" rel="noopener noreferrer" className="book-link">
            View Details
          </a>
        )}
      </div>
    </div>
  );
};

export default HotelResults;
