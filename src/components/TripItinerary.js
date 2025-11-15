import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TripItinerary.css';
import config from '../config';

const TripItinerary = ({ content }) => {
  const [expandedDays, setExpandedDays] = useState({});
  const [imageCache, setImageCache] = useState({});

  // Preload destination images when component mounts
  useEffect(() => {
    const itinerary = parseItinerary(content);
    if (itinerary.title) {
      fetchLocationImage(itinerary.title);
    }
    // Also preload day location images
    itinerary.days.forEach(day => {
      if (day.location) {
        fetchLocationImage(day.location);
      }
    });
  }, [content]);

  // Parse the AI response into structured data
  const parseItinerary = (text) => {
    const lines = text.split('\n');
    const itinerary = {
      title: '',
      country: '',
      days: [],
      travelTips: []
    };

    let currentDay = null;
    let currentSection = null;
    let inTravelTips = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Extract country emoji and name (match any emoji at start)
      if (trimmed.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u)) {
        const match = trimmed.match(/^([\u{1F1E6}-\u{1F1FF}]{2})\s+(.+?)(?:\s+is|\s+offers)/u);
        if (match) {
          itinerary.country = match[1];
          itinerary.title = match[2];
        }
      }

      // Detect day headers (### Day X:)
      if (trimmed.match(/^###\s+Day\s+\d+:/i)) {
        if (currentDay) {
          itinerary.days.push(currentDay);
        }
        const dayMatch = trimmed.match(/Day\s+(\d+):\s*(.+)/i);
        currentDay = {
          dayNumber: dayMatch ? dayMatch[1] : itinerary.days.length + 1,
          location: dayMatch ? dayMatch[2] : 'Unknown',
          attractions: [],
          accommodation: null,
          dining: null
        };
        currentSection = null;
      }

      // Detect sections
      if (trimmed.match(/^Must-Visit Attractions?:/i)) {
        currentSection = 'attractions';
      } else if (trimmed.match(/^Accommodation:/i)) {
        currentSection = 'accommodation';
      } else if (trimmed.match(/^Dining:/i)) {
        currentSection = 'dining';
      } else if (trimmed.match(/^###\s+Travel Tips?:/i)) {
        inTravelTips = true;
        if (currentDay) {
          itinerary.days.push(currentDay);
          currentDay = null;
        }
      }

      // Parse content
      if (currentDay && currentSection) {
        if (trimmed.match(/^-\s+/)) {
          const content = trimmed.substring(2);
          if (currentSection === 'attractions') {
            const attractionMatch = content.match(/^(.+?):\s*(.+)/);
            if (attractionMatch) {
              currentDay.attractions.push({
                name: attractionMatch[1].trim(),
                description: attractionMatch[2].trim()
              });
            }
          } else if (currentSection === 'accommodation') {
            const match = content.match(/^(.+?):\s*(.+?)(?:starting at|from)\s*€?(\d+)/);
            if (match) {
              currentDay.accommodation = {
                name: match[1].trim(),
                description: match[2].trim(),
                price: match[3]
              };
            }
          } else if (currentSection === 'dining') {
            const match = content.match(/^(.+?):\s*(.+?)(?:around|starting at|dishes starting at|with)\s*[€$]?(\d+)/);
            if (match) {
              currentDay.dining = {
                name: match[1].trim(),
                description: match[2].trim(),
                price: match[3]
              };
            }
          }
        }
      }

      // Parse travel tips
      if (inTravelTips && trimmed.match(/^-\s+/)) {
        const content = trimmed.substring(2);
        const tipMatch = content.match(/^(.+?):\s*(.+)/);
        if (tipMatch) {
          itinerary.travelTips.push({
            title: tipMatch[1].trim(),
            description: tipMatch[2].trim()
          });
        }
      }
    });

    // Add last day if exists
    if (currentDay) {
      itinerary.days.push(currentDay);
    }

    return itinerary;
  };

  const toggleDay = (dayNumber) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNumber]: !prev[dayNumber]
    }));
  };

  const fetchLocationImage = async (location) => {
    // Check cache first
    if (imageCache[location]) {
      return imageCache[location];
    }

    try {
      const response = await axios.get(`${config.API_URL}/api/images/${encodeURIComponent(location)}?count=1`);
      if (response.data.success && response.data.images && response.data.images.length > 0) {
        const imageUrl = response.data.images[0].url;
        setImageCache(prev => ({ ...prev, [location]: imageUrl }));
        
        // Track photo view
        if (response.data.images[0].downloadLocation) {
          axios.post(`${config.API_URL}/api/images/track`, {
            downloadLocation: response.data.images[0].downloadLocation
          }).catch(() => {});
        }
        
        return imageUrl;
      }
    } catch (error) {
      console.error('Error fetching image for', location, error);
    }

    // Fallback image
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
  };

  const getUnsplashImage = (location) => {
    // Return cached image or fallback
    if (imageCache[location]) {
      return imageCache[location];
    }
    
    // Fetch image asynchronously
    fetchLocationImage(location);
    
    // Return fallback while loading
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
  };

  const getGoogleMapsLink = (location) => {
    const query = encodeURIComponent(location);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const itinerary = parseItinerary(content);

  // If parsing failed or no days found, return null to fall back to regular message
  if (!itinerary.days || itinerary.days.length === 0) {
    return null;
  }

  return (
    <div className="trip-itinerary">
      {/* Header */}
      <div className="itinerary-header">
        <div className="header-background">
          <img 
            src={getUnsplashImage(itinerary.title || 'travel')} 
            alt={itinerary.title}
            className="header-image"
          />
          <div className="header-overlay"></div>
        </div>
        <div className="header-content">
          <h2 className="itinerary-country">{itinerary.country} {itinerary.title}</h2>
          <p className="itinerary-duration">
            ✈️ {itinerary.days.length}-Day Adventure
          </p>
        </div>
      </div>

      {/* Days */}
      <div className="itinerary-days">
        {itinerary.days.map((day, index) => (
          <div 
            key={index} 
            className={`day-card ${expandedDays[day.dayNumber] ? 'expanded' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div 
              className="day-header"
              onClick={() => toggleDay(day.dayNumber)}
            >
              <div className="day-number-badge">
                <span className="day-number">{day.dayNumber}</span>
              </div>
              <div className="day-header-content">
                <h3 className="day-location">📍 {day.location}</h3>
                <p className="day-summary">
                  {day.attractions.length} attractions · Accommodation · Dining
                </p>
              </div>
              <div className="expand-icon">
                {expandedDays[day.dayNumber] ? '▼' : '▶'}
              </div>
            </div>

            {expandedDays[day.dayNumber] && (
              <div className="day-content">
                {/* Location Image */}
                <div className="day-image-container">
                  <img 
                    src={getUnsplashImage(day.location)} 
                    alt={day.location}
                    className="day-image"
                  />
                  <a 
                    href={getGoogleMapsLink(day.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="maps-button"
                  >
                    🗺️ Open in Google Maps
                  </a>
                </div>

                {/* Attractions */}
                {day.attractions && day.attractions.length > 0 && (
                  <div className="day-section">
                    <h4 className="section-title">🎯 Must-Visit Attractions</h4>
                    <div className="attractions-list">
                      {day.attractions.map((attraction, idx) => (
                        <div key={idx} className="attraction-item">
                          <div className="attraction-icon">✨</div>
                          <div className="attraction-content">
                            <h5 className="attraction-name">{attraction.name}</h5>
                            <p className="attraction-description">{attraction.description}</p>
                            <a 
                              href={getGoogleMapsLink(`${attraction.name} ${day.location}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attraction-link"
                            >
                              View on Map →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="day-section">
                    <h4 className="section-title">🏨 Accommodation</h4>
                    <div className="info-card accommodation-card">
                      <div className="info-header">
                        <h5 className="info-name">{day.accommodation.name}</h5>
                        {day.accommodation.price && (
                          <span className="info-price">€{day.accommodation.price}/night</span>
                        )}
                      </div>
                      <p className="info-description">{day.accommodation.description}</p>
                      <a 
                        href={getGoogleMapsLink(`${day.accommodation.name} ${day.location}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="info-link"
                      >
                        Find & Book →
                      </a>
                    </div>
                  </div>
                )}

                {/* Dining */}
                {day.dining && (
                  <div className="day-section">
                    <h4 className="section-title">🍽️ Dining</h4>
                    <div className="info-card dining-card">
                      <div className="info-header">
                        <h5 className="info-name">{day.dining.name}</h5>
                        {day.dining.price && (
                          <span className="info-price">€{day.dining.price}</span>
                        )}
                      </div>
                      <p className="info-description">{day.dining.description}</p>
                      <a 
                        href={getGoogleMapsLink(`${day.dining.name} ${day.location}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="info-link"
                      >
                        Find Location →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Travel Tips */}
      {itinerary.travelTips && itinerary.travelTips.length > 0 && (
        <div className="travel-tips-section">
          <h3 className="tips-title">💡 Travel Tips</h3>
          <div className="tips-grid">
            {itinerary.travelTips.map((tip, index) => (
              <div key={index} className="tip-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="tip-icon">💫</div>
                <h4 className="tip-title">{tip.title}</h4>
                <p className="tip-description">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default TripItinerary;

