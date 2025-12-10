import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { itineraryAPI } from '../services/chatService';
import axios from 'axios';
import config from '../config';
import './ItineraryView.css';

// Translation helper for booking buttons
const translations = {
  en: { bookOnBooking: 'Book on Booking.com', bookRestaurant: 'Reserve Table' },
  ro: { bookOnBooking: 'Rezervă pe Booking.com', bookRestaurant: 'Rezervă Masă' },
  es: { bookOnBooking: 'Reservar en Booking.com', bookRestaurant: 'Reservar Mesa' },
  fr: { bookOnBooking: 'Réserver sur Booking.com', bookRestaurant: 'Réserver une Table' }
};

const ItineraryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [destinationImages, setDestinationImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [hotelBookingLinks, setHotelBookingLinks] = useState({});
  const [restaurantBookingLinks, setRestaurantBookingLinks] = useState({});
  
  const t = translations.en; // Default to English for now

  useEffect(() => {
    fetchItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itineraryAPI.getItinerary(id, getToken);
      setItinerary(data?.itinerary || null);
      
      // Fetch destination images
      if (data?.itinerary?.destination) {
        fetchDestinationImages(data.itinerary.destination);
      }
      
      console.log('✅ Loaded itinerary:', data?.itinerary);
    } catch (err) {
      console.error('Failed to load itinerary:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinationImages = async (destination) => {
    try {
      const response = await axios.get(`${config.API_URL}/api/images/${encodeURIComponent(destination)}?count=5`);
      if (response.data.success && response.data.images) {
        setDestinationImages(response.data.images);
      }
    } catch (error) {
      console.error('Error fetching destination images:', error);
    }
  };

  // Fetch booking link for a hotel
  const fetchHotelBookingLink = useCallback(async (hotelName, location) => {
    const cacheKey = `${hotelName}-${location}`;
    
    if (hotelBookingLinks[cacheKey]) return;

    try {
      const response = await axios.post(`${config.API_URL}/api/booking/hotel`, {
        name: hotelName,
        location
      });

      if (response.data.success || response.data.bookingUrl) {
        setHotelBookingLinks(prev => ({
          ...prev,
          [cacheKey]: response.data.bookingUrl
        }));
      }
    } catch (error) {
      console.error('Error fetching hotel booking link:', error);
      setHotelBookingLinks(prev => ({
        ...prev,
        [cacheKey]: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${hotelName} ${location}`)}`
      }));
    }
  }, [hotelBookingLinks]);

  // Fetch booking link for a restaurant
  const fetchRestaurantBookingLink = useCallback(async (restaurantName, location) => {
    const cacheKey = `${restaurantName}-${location}`;
    
    if (restaurantBookingLinks[cacheKey]) return;

    try {
      const response = await axios.post(`${config.API_URL}/api/booking/restaurant`, {
        name: restaurantName,
        location
      });

      if (response.data.success || response.data.bookingUrl) {
        setRestaurantBookingLinks(prev => ({
          ...prev,
          [cacheKey]: response.data.bookingUrl
        }));
      }
    } catch (error) {
      console.error('Error fetching restaurant booking link:', error);
      setRestaurantBookingLinks(prev => ({
        ...prev,
        [cacheKey]: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${restaurantName} ${location}`)}`
      }));
    }
  }, [restaurantBookingLinks]);

  // Helper to get booking link
  const getHotelBookingLink = (hotelName, destination) => {
    const cacheKey = `${hotelName}-${destination}`;
    return hotelBookingLinks[cacheKey] || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${hotelName} ${destination}`)}`;
  };

  const getRestaurantBookingLink = (restaurantName, destination) => {
    const cacheKey = `${restaurantName}-${destination}`;
    return restaurantBookingLinks[cacheKey] || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${restaurantName} ${destination}`)}`;
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    try {
      await itineraryAPI.deleteItinerary(id, getToken);
      console.log('✅ Deleted itinerary:', id);
      navigate('/itineraries');
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
      alert('Failed to delete trip');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="itinerary-view">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="itinerary-view">
        <div className="error-container">
          <p className="error-message">{error || 'Trip not found'}</p>
          <button onClick={() => navigate('/itineraries')} className="back-btn">
            ← Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  const tripData = itinerary.itineraryData;

  return (
    <div className="itinerary-view">
      <div className="view-content">
        <div className="content-container">
          {/* Back Button at top */}
          <button onClick={() => navigate('/itineraries')} className="inline-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Trips
          </button>

          {/* Destination Images */}
          {destinationImages.length > 0 && (
            <div className="destination-gallery">
              <div className="gallery-main">
                <img 
                  src={destinationImages[selectedImageIndex]?.urlRegular || destinationImages[selectedImageIndex]?.url} 
                  alt={itinerary.destination} 
                />
                
                {destinationImages.length > 1 && (
                  <>
                    <button 
                      className="gallery-nav prev"
                      onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : destinationImages.length - 1)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      className="gallery-nav next"
                      onClick={() => setSelectedImageIndex(prev => prev < destinationImages.length - 1 ? prev + 1 : 0)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {destinationImages[selectedImageIndex]?.photographer && (
                  <div className="image-attribution">
                    Photo by <a 
                      href={`${destinationImages[selectedImageIndex].photographer.profileUrl}?utm_source=trip_ai&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {destinationImages[selectedImageIndex].photographer.name}
                    </a> on <a 
                      href="https://unsplash.com?utm_source=trip_ai&utm_medium=referral"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Unsplash
                    </a>
                  </div>
                )}
              </div>

              {destinationImages.length > 1 && (
                <div className="gallery-thumbs">
                  {destinationImages.map((image, idx) => (
                    <div 
                      key={idx} 
                      className={`gallery-thumb ${idx === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img src={image.urlThumb || image.url} alt={`View ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trip Header */}
          <div className="trip-header">
            <div className="trip-badge">📍 {itinerary.destination}</div>
            <h1 className="trip-main-title">{itinerary.title || `Trip to ${itinerary.destination}`}</h1>
            {itinerary.description && <p className="trip-desc">{itinerary.description}</p>}
            
            <div className="trip-meta">
              {itinerary.startDate && (
                <span className="meta-item">
                  📅 {formatDate(itinerary.startDate)}
                  {itinerary.endDate && ` - ${formatDate(itinerary.endDate)}`}
                </span>
              )}
              {itinerary.summary?.totalDays && (
                <span className="meta-item">🌙 {itinerary.summary.totalDays} days</span>
              )}
            </div>

            {/* Delete Button */}
            <button onClick={handleDelete} className="delete-trip-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Delete Trip
            </button>
          </div>

          {/* Itinerary Days */}
          {tripData && tripData.itinerary && tripData.itinerary.length > 0 ? (
            <div className="days-container">
              {tripData.itinerary.map((day, index) => (
                <div key={index} className="day-card">
                  <div className="day-header">
                    <span className="day-number">Day {day.day}</span>
                    <h3 className="day-title">{day.title}</h3>
                    {day.date && <span className="day-date">{day.date}</span>}
                  </div>

                  {/* Activities */}
                  {day.activities && day.activities.length > 0 && (
                    <div className="activities-section">
                      <h4 className="section-title">Activities</h4>
                      <div className="activities-list">
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="activity-item">
                            <div className="activity-header">
                              <span className="activity-name">{activity.name}</span>
                              {activity.time && <span className="activity-time">{activity.time}</span>}
                            </div>
                            {activity.description && (
                              <p className="activity-desc">{activity.description}</p>
                            )}
                            {activity.duration && (
                              <span className="activity-duration">⏱️ {activity.duration}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accommodation */}
                  {day.accommodation && (
                    <div className="place-section">
                      <h4 className="section-title">🏨 Accommodation</h4>
                      {typeof day.accommodation === 'object' && day.accommodation.name ? (
                        <div className="place-card">
                          {day.accommodation.images && day.accommodation.images.length > 0 && (
                            <div className="place-image">
                              <img src={day.accommodation.images[0]} alt={day.accommodation.name} />
                              {day.accommodation.images.length > 1 && (
                                <div className="place-image-badge">
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {day.accommodation.images.length}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="place-info">
                            <p className="place-name">{day.accommodation.name}</p>
                            <div className="place-meta">
                              {day.accommodation.rating && (
                                <span className="place-rating">
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  {day.accommodation.rating.toFixed(1)}
                                </span>
                              )}
                              {day.accommodation.address && (
                                <span className="place-address">📍 {day.accommodation.address.split(',')[0]}</span>
                              )}
                            </div>
                            {day.accommodation.googleMapsUrl && (
                              <a 
                                href={day.accommodation.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="place-link"
                              >
                                View on Google Maps →
                              </a>
                            )}
                            {/* Booking.com button */}
                            <a 
                              href={getHotelBookingLink(day.accommodation.name, itinerary.destination)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="place-link booking-link"
                              onMouseEnter={() => fetchHotelBookingLink(day.accommodation.name, itinerary.destination)}
                            >
                              {t.bookOnBooking} →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="place-text">{day.accommodation}</p>
                      )}
                    </div>
                  )}

                  {/* Dining */}
                  {day.dining && (
                    <div className="place-section">
                      <h4 className="section-title">🍽️ Dining</h4>
                      {typeof day.dining === 'object' && day.dining.name ? (
                        <div className="place-card">
                          {day.dining.images && day.dining.images.length > 0 && (
                            <div className="place-image">
                              <img src={day.dining.images[0]} alt={day.dining.name} />
                              {day.dining.images.length > 1 && (
                                <div className="place-image-badge">
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {day.dining.images.length}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="place-info">
                            <p className="place-name">{day.dining.name}</p>
                            <div className="place-meta">
                              {day.dining.rating && (
                                <span className="place-rating">
                                  <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  {day.dining.rating.toFixed(1)}
                                </span>
                              )}
                              {day.dining.address && (
                                <span className="place-address">📍 {day.dining.address.split(',')[0]}</span>
                              )}
                            </div>
                            {day.dining.googleMapsUrl && (
                              <a 
                                href={day.dining.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="place-link"
                              >
                                View on Google Maps →
                              </a>
                            )}
                            {/* Restaurant reservation button */}
                            <a 
                              href={getRestaurantBookingLink(day.dining.name, itinerary.destination)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="place-link restaurant-link"
                              onMouseEnter={() => fetchRestaurantBookingLink(day.dining.name, itinerary.destination)}
                            >
                              {t.bookRestaurant} →
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="place-text">{day.dining}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No itinerary details available</p>
            </div>
          )}

          {/* Tips */}
          {tripData && tripData.tips && tripData.tips.length > 0 && (
            <div className="tips-section">
              <h3 className="tips-title">💡 Travel Tips</h3>
              <ul className="tips-list">
                {tripData.tips.map((tip, index) => (
                  <li key={index} className="tip-item">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryView;
