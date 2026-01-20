import React from 'react';
import './RestaurantResults.css';

const RestaurantResults = ({ data }) => {
  if (!data || !data.restaurants || data.restaurants.length === 0) {
    return null;
  }

  const { destination, restaurants, tips, searchUrl } = data;

  return (
    <div className="restaurant-results">
      <div className="restaurant-header">
        <span className="restaurant-icon">🍽️</span>
        <h3>Restaurants in {destination}</h3>
      </div>

      {tips && tips.length > 0 && (
        <div className="restaurant-tips">
          {tips.map((tip, idx) => (
            <span key={idx} className="tip">💡 {tip}</span>
          ))}
        </div>
      )}

      <div className="restaurants-grid">
        {restaurants.slice(0, 6).map((restaurant, idx) => (
          <RestaurantCard key={idx} restaurant={restaurant} />
        ))}
      </div>

      {searchUrl && (
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="view-all-link">
          View all on Google Maps →
        </a>
      )}
    </div>
  );
};

const RestaurantCard = ({ restaurant }) => {
  const hasImage = restaurant.images && restaurant.images.length > 0;

  return (
    <div className="restaurant-card">
      {hasImage && (
        <div className="restaurant-image">
          <img
            src={restaurant.images[0]}
            alt={restaurant.name}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="restaurant-info">
        <h4 className="restaurant-name">{restaurant.name}</h4>

        {restaurant.cuisine && (
          <div className="restaurant-cuisine">{restaurant.cuisine}</div>
        )}

        <div className="restaurant-meta">
          {restaurant.rating && (
            <span className="rating">
              ⭐ {typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : restaurant.rating}
            </span>
          )}
          {restaurant.priceRange && (
            <span className="price-range">{restaurant.priceRange}</span>
          )}
        </div>

        {restaurant.description && (
          <p className="restaurant-description">{restaurant.description}</p>
        )}

        {restaurant.address && (
          <div className="restaurant-address">
            📍 {restaurant.address}
          </div>
        )}

        {restaurant.googleMapsUrl && (
          <a
            href={restaurant.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="maps-link"
          >
            View on Maps
          </a>
        )}
      </div>
    </div>
  );
};

export default RestaurantResults;
