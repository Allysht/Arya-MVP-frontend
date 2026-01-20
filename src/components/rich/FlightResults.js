import React from 'react';
import './FlightResults.css';

const FlightResults = ({ data }) => {
  if (!data || !data.flights || data.flights.length === 0) {
    return null;
  }

  const { origin, destination, date, flights, searchUrl, priceInsights } = data;

  // Separate direct and connecting flights
  const directFlights = flights.filter(f => f.stops === 0);
  const connectingFlights = flights.filter(f => f.stops > 0);

  return (
    <div className="flight-results">
      <div className="flight-header">
        <span className="flight-icon">✈️</span>
        <h3>{origin?.code || origin} → {destination?.code || destination}</h3>
        <span className="flight-date">{date}</span>
      </div>

      {directFlights.length > 0 && (
        <div className="flight-section">
          <h4 className="section-title">🎯 Direct Flights</h4>
          <div className="flights-grid">
            {directFlights.slice(0, 3).map((flight, idx) => (
              <FlightCard key={`direct-${idx}`} flight={flight} />
            ))}
          </div>
        </div>
      )}

      {connectingFlights.length > 0 && (
        <div className="flight-section">
          <h4 className="section-title">🔄 With Layover</h4>
          <div className="flights-grid">
            {connectingFlights.slice(0, 3).map((flight, idx) => (
              <FlightCard key={`connecting-${idx}`} flight={flight} />
            ))}
          </div>
        </div>
      )}

      {priceInsights?.lowest_price && (
        <div className="price-insight">
          💡 Lowest price found: <strong>{priceInsights.lowest_price} RON</strong>
        </div>
      )}

      {searchUrl && (
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="view-all-link">
          View all options on Google Flights →
        </a>
      )}
    </div>
  );
};

const FlightCard = ({ flight }) => {
  return (
    <div className="flight-card">
      <div className="airline">
        {flight.airlineLogo && (
          <img src={flight.airlineLogo} alt="" className="airline-logo" />
        )}
        <span className="airline-name">{flight.airline}</span>
      </div>

      <div className="times">
        <span className="departure-time">{flight.departure?.time || '--:--'}</span>
        <span className="arrow">→</span>
        <span className="arrival-time">{flight.arrival?.time || '--:--'}</span>
      </div>

      <div className="route">
        <span>{flight.departure?.code}</span>
        <span className="route-line"></span>
        <span>{flight.arrival?.code}</span>
      </div>

      <div className="meta">
        <span className="duration">⏱️ {flight.totalDurationFormatted || `${flight.totalDuration}m`}</span>
        <span className="stops">{flight.stopsText || (flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`)}</span>
      </div>

      <div className="price">
        💰 {flight.priceFormatted || `${flight.price} RON`}
      </div>
    </div>
  );
};

export default FlightResults;
