import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TripPanel.css';
import pdfGenerator from '../utils/pdfGenerator';
import config from '../config';

const TripPanel = ({ tripData, onClose, showTripPanel, setShowTripPanel }) => {
  const [expandedDays, setExpandedDays] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [destinationImages, setDestinationImages] = useState([]);
  const [imageCache, setImageCache] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [flightUrl, setFlightUrl] = useState(null);
  const [flightRouting, setFlightRouting] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [priceEstimate, setPriceEstimate] = useState(null);

  // Debug log itinerary data
  useEffect(() => {
    if (tripData?.itinerary) {
      console.log(`📋 TripPanel received itinerary with ${tripData.itinerary.length} days:`, 
        tripData.itinerary.map((d, i) => `Day ${d.day || i+1}: ${d.title}`));
    }
  }, [tripData]);

  // Fetch images for destination when trip data changes
  useEffect(() => {
    const fetchDestinationImages = async () => {
      if (tripData && tripData.destination) {
        try {
          const response = await axios.get(`${config.API_URL}/api/images/${encodeURIComponent(tripData.destination)}?count=5`);
          if (response.data.success && response.data.images) {
            setDestinationImages(response.data.images);
            
            // Track the first image view (Unsplash requirement)
            if (response.data.images[0]?.downloadLocation) {
              axios.post(`${config.API_URL}/api/images/track`, {
                downloadLocation: response.data.images[0].downloadLocation
              }).catch(() => {}); // Silent fail
            }
          }
        } catch (error) {
          console.error('Error fetching destination images:', error);
        }
      }
    };

    fetchDestinationImages();
  }, [tripData?.destination]);

  // Generate flight search URL with routing info
  useEffect(() => {
    const generateFlightUrl = async () => {
      if (tripData && tripData.origin && tripData.destination) {
        try {
          console.log('Generating flight route...');
          const response = await axios.post(`${config.API_URL}/api/flights/search-url`, {
            origin: tripData.origin,
            destination: tripData.destination,
            departureDate: tripData.dates,
            adults: parseInt(tripData.travelers) || 1,
            cabinClass: 'economy'
          });

          if (response.data.success) {
            setFlightUrl(response.data.url);
            setFlightRouting(response.data.routingInfo);
            console.log('Flight routing:', response.data.routingInfo);
          } else {
            // Even if no URL, we might have routing info
            setFlightRouting(response.data.routingInfo);
          }
        } catch (error) {
          console.error('Error generating flight URL:', error);
        }
      }
    };

    generateFlightUrl();
  }, [tripData?.origin, tripData?.destination, tripData?.dates, tripData?.travelers]);

  // Fetch hotels and restaurants from tripData or API
  useEffect(() => {
    const fetchAccommodations = async () => {
      if (!tripData || !tripData.destination) {
        return;
      }

      // Check if hotels and restaurants are already in tripData
      const hasHotels = tripData.hotels && tripData.hotels.length > 0;
      const hasRestaurants = tripData.restaurants && tripData.restaurants.length > 0;

      if (hasHotels) {
        console.log('Using hotels from tripData:', tripData.hotels.length);
        setHotels(tripData.hotels);
      }

      if (hasRestaurants) {
        console.log('Using restaurants from tripData:', tripData.restaurants.length);
        setRestaurants(tripData.restaurants);
      }

      // If we have both, no need to fetch
      if (hasHotels && hasRestaurants) {
        return;
      }

      // Otherwise, fetch comprehensive accommodations data from API
      try {
        console.log('Fetching accommodations for:', tripData.destination);
        const response = await axios.get(
          `${config.API_URL}/api/accommodations/${encodeURIComponent(tripData.destination)}?hotelLimit=8&restaurantLimit=8`
        );
        
        if (response.data.success) {
          if (!hasHotels && response.data.hotels) {
            console.log(`✅ Fetched ${response.data.hotels.length} hotels`);
            setHotels(response.data.hotels);
          }
          
          if (!hasRestaurants && response.data.restaurants) {
            console.log(`✅ Fetched ${response.data.restaurants.length} restaurants`);
            setRestaurants(response.data.restaurants);
          }
        }
      } catch (error) {
        console.error('Error fetching accommodations:', error);
      }
    };

    fetchAccommodations();
  }, [tripData?.destination, tripData?.hotels, tripData?.restaurants]);

  // Fetch weather data for the trip
  useEffect(() => {
    const fetchWeather = async () => {
      if (!tripData || !tripData.destination) {
        return;
      }

      try {
        console.log('Fetching weather for:', tripData.destination);
        
        // Parse dates from trip data if available
        let startDate, endDate;
        if (tripData.itinerary && tripData.itinerary.length > 0) {
          // Try to get dates from first and last day
          const firstDay = tripData.itinerary[0];
          const lastDay = tripData.itinerary[tripData.itinerary.length - 1];
          
          if (firstDay.date) startDate = firstDay.date;
          if (lastDay.date) endDate = lastDay.date;
        }

        // Build query string
        let queryString = '';
        if (startDate && endDate) {
          queryString = `?startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await axios.get(
          `${config.API_URL}/api/weather/${encodeURIComponent(tripData.destination)}${queryString}`
        );
        
        if (response.data.success && response.data.forecast) {
          console.log(`✅ Fetched weather: ${response.data.forecast.length} days`);
          setWeatherData(response.data);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
  }, [tripData?.destination, tripData?.itinerary]);

  // Calculate price estimate based on trip data
  useEffect(() => {
    if (!tripData) {
      setPriceEstimate(null);
      return;
    }

    const calculatePrice = () => {
      // Create min and max breakdowns for price range
      const breakdownMin = {
        accommodation: 0,
        dining: 0,
        activities: 0,
        transportation: 0
      };
      const breakdownMax = {
        accommodation: 0,
        dining: 0,
        activities: 0,
        transportation: 0
      };

      // Get number of days
      const numDays = tripData.itinerary?.length || parseInt(tripData.duration?.match(/\d+/)?.[0]) || 5;

      // Calculate accommodation costs (per night) - Budget vs Comfort
      if (tripData.itinerary) {
        tripData.itinerary.forEach(day => {
          if (day.accommodation) {
            if (typeof day.accommodation === 'object' && day.accommodation.rating) {
              const rating = day.accommodation.rating;
              if (rating >= 4.5) {
                breakdownMin.accommodation += 120;
                breakdownMax.accommodation += 200;
              } else if (rating >= 4.0) {
                breakdownMin.accommodation += 80;
                breakdownMax.accommodation += 140;
              } else if (rating >= 3.5) {
                breakdownMin.accommodation += 50;
                breakdownMax.accommodation += 100;
              } else {
                breakdownMin.accommodation += 35;
                breakdownMax.accommodation += 70;
              }
            } else {
              breakdownMin.accommodation += 50;
              breakdownMax.accommodation += 90;
            }
          }
        });
      } else {
        if (hotels && hotels.length > 0) {
          const avgRating = hotels.reduce((sum, h) => sum + (h.rating || 4), 0) / hotels.length;
          if (avgRating >= 4.5) {
            breakdownMin.accommodation = 120 * numDays;
            breakdownMax.accommodation = 200 * numDays;
          } else if (avgRating >= 4.0) {
            breakdownMin.accommodation = 80 * numDays;
            breakdownMax.accommodation = 140 * numDays;
          } else {
            breakdownMin.accommodation = 50 * numDays;
            breakdownMax.accommodation = 100 * numDays;
          }
        } else {
          breakdownMin.accommodation = 50 * numDays;
          breakdownMax.accommodation = 90 * numDays;
        }
      }

      // Calculate dining costs (3 meals per day) - Budget vs Comfort
      if (tripData.itinerary) {
        tripData.itinerary.forEach(day => {
          // Budget: Simple meals (€20-25/day), Comfort: Nice restaurants (€40-60/day)
          if (day.dining) {
            if (typeof day.dining === 'object' && day.dining.rating) {
              const rating = day.dining.rating;
              if (rating >= 4.5) {
                breakdownMin.dining += 30;
                breakdownMax.dining += 50;
              } else if (rating >= 4.0) {
                breakdownMin.dining += 25;
                breakdownMax.dining += 40;
              } else {
                breakdownMin.dining += 20;
                breakdownMax.dining += 30;
              }
            } else {
              breakdownMin.dining += 20;
              breakdownMax.dining += 35;
            }
          }
          // Add breakfast + lunch
          breakdownMin.dining += 15; // €15 for budget meals
          breakdownMax.dining += 25; // €25 for nicer meals
        });
      } else {
        breakdownMin.dining = 30 * numDays; // Budget: €30/day
        breakdownMax.dining = 60 * numDays; // Comfort: €60/day
      }

      // Calculate activities costs - Budget vs Comfort
      if (tripData.itinerary) {
        tripData.itinerary.forEach(day => {
          if (day.activities && day.activities.length > 0) {
            breakdownMin.activities += day.activities.length * 10; // Budget: €10 per activity
            breakdownMax.activities += day.activities.length * 30; // Comfort: €30 per activity
          }
        });
      } else {
        breakdownMin.activities = numDays * 2 * 10; // Budget: 2 activities/day at €10
        breakdownMax.activities = numDays * 2 * 30; // Comfort: 2 activities/day at €30
      }

      // Transportation estimate (local transport)
      breakdownMin.transportation = numDays * 8; // Budget: €8/day (public transport)
      breakdownMax.transportation = numDays * 20; // Comfort: €20/day (taxis, etc)

      // Calculate totals
      const totalMin = breakdownMin.accommodation + breakdownMin.dining + breakdownMin.activities + breakdownMin.transportation;
      const totalMax = breakdownMax.accommodation + breakdownMax.dining + breakdownMax.activities + breakdownMax.transportation;

      setPriceEstimate({
        min: Math.round(totalMin),
        max: Math.round(totalMax),
        breakdownMin,
        breakdownMax,
        currency: '€',
        travelers: parseInt(tripData.travelers?.match(/\d+/)?.[0]) || 1
      });
    };

    calculatePrice();
  }, [tripData, hotels, restaurants]);

  const toggleDay = (dayNum) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      console.log('Generating PDF...');
      await pdfGenerator.generateItineraryPDF(
        tripData,
        priceEstimate,
        weatherData,
        hotels,
        restaurants
      );
      console.log('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const getImageForLocation = (location, index = 0) => {
    // Use cached image if available
    if (imageCache[location]) {
      return imageCache[location];
    }

    // Use destination images if available
    if (destinationImages.length > index) {
      return destinationImages[index].url;
    }

    // Fallback to a default image
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
  };

  // Get weather data for a specific day
  const getWeather = (dayIndex) => {
    if (!weatherData || !weatherData.forecast || weatherData.forecast.length === 0) {
      // Fallback to mock data if weather not available
      const temps = [19, 14, 13, 10, 8, 6];
      return {
        temperature: temps[dayIndex] || 15,
        emoji: '☁️',
        description: 'Cloudy'
      };
    }

    // Get weather for this day (if available)
    const dayWeather = weatherData.forecast[dayIndex];
    if (dayWeather) {
      return {
        temperature: dayWeather.temperatureMax,
        temperatureMin: dayWeather.temperatureMin,
        emoji: dayWeather.weatherEmoji,
        description: dayWeather.weatherDescription,
        precipitation: dayWeather.precipitation
      };
    }

    // Fallback
    return {
      temperature: 15,
      emoji: '☁️',
      description: 'Cloudy'
    };
  };

  if (!tripData) {
    return (
      <div className="trip-panel empty">
        <div className="empty-state">
          <svg className="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Your Itinerary Will Appear Here</h3>
          <p>Start a conversation in the chat to create your personalized travel plan.</p>
          <div className="empty-features">
            <div className="empty-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Day-by-day itineraries</span>
            </div>
            <div className="empty-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Personalized recommendations</span>
            </div>
            <div className="empty-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Real-time travel insights</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle close for mobile
  const handleClose = () => {
    if (setShowTripPanel) {
      setShowTripPanel(false);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`trip-panel ${showTripPanel ? 'mobile-visible' : ''}`}>
      {/* Header Actions */}
      <div className="trip-panel-actions">
        <button className="mobile-back-btn" onClick={handleClose} title="Back to chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="desktop-actions">
          <button className="action-icon-btn" title="Download PDF" onClick={handleDownloadPDF}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="action-icon-btn" title="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button className="review-book-btn">Review & Book</button>
        </div>
      </div>

      <div className="trip-panel-content">
        {/* Image Gallery */}
        <div className="trip-gallery">
          <div className="gallery-main">
            {destinationImages.length > 0 ? (
              <>
                <img 
                  src={destinationImages[selectedImageIndex]?.url || getImageForLocation(tripData.destination, 0)} 
                  alt={destinationImages[selectedImageIndex]?.description || tripData.destination}
                  loading="lazy"
                />
                
                {/* Navigation Arrows */}
                {destinationImages.length > 1 && (
                  <>
                    <button 
                      className="gallery-nav gallery-nav-prev"
                      onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : destinationImages.length - 1)}
                      aria-label="Previous image"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      className="gallery-nav gallery-nav-next"
                      onClick={() => setSelectedImageIndex(prev => prev < destinationImages.length - 1 ? prev + 1 : 0)}
                      aria-label="Next image"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Attribution */}
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
              </>
            ) : (
              <img 
                src={getImageForLocation(tripData.destination, 0)} 
                alt={tripData.destination}
                loading="lazy"
              />
            )}
          </div>

          {/* Thumbnail Strip */}
          {destinationImages.length > 1 && (
            <div className="gallery-thumbs">
              {destinationImages.map((image, idx) => (
                <div 
                  key={idx} 
                  className={`gallery-thumb ${idx === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  <img src={image.urlThumb} alt={`${tripData.destination} view ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Header */}
        <div className="trip-header">
          <h1>{tripData.duration} {tripData.purpose || 'Trip'} to {tripData.destination}</h1>
          <div className="trip-meta">
            <span>{tripData.dates}</span>
            <span>•</span>
            <span>{tripData.travelers}</span>
          </div>
        </div>

        {/* Flight Search Card with AI Routing */}
        {flightRouting && tripData.origin && (
          <div className="flight-search-card">
            <div className="flight-search-header">
              <div className="flight-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div className="flight-info">
                <h3>Flight Route</h3>
                <div className="flight-route-details">
                  <div className="flight-endpoint">
                    <span className="endpoint-city">{flightRouting.origin.city}</span>
                    {flightRouting.origin.hasAirport ? (
                      <span className="endpoint-airport">
                        ✓ {flightRouting.origin.airportName} ({flightRouting.origin.airportCode})
                      </span>
                    ) : (
                      <span className="endpoint-airport warning">
                        ⚠ No direct airport - Via {flightRouting.origin.nearestAirport}
                      </span>
                    )}
                  </div>
                  <svg className="flight-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="flight-endpoint">
                    <span className="endpoint-city">{flightRouting.destination.city}</span>
                    {flightRouting.destination.hasAirport ? (
                      <span className="endpoint-airport">
                        ✓ {flightRouting.destination.airportName} ({flightRouting.destination.airportCode})
                      </span>
                    ) : (
                      <span className="endpoint-airport warning">
                        ⚠ No direct airport - Via {flightRouting.destination.nearestAirport}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {flightRouting.recommendation && (
              <div className="flight-recommendation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{flightRouting.recommendation}</p>
              </div>
            )}

            {flightUrl && (
              <a 
                href={flightUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flight-search-btn"
              >
                <span>Search Flights on Skyscanner</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="trip-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'accommodations' ? 'active' : ''}`}
            onClick={() => setActiveTab('accommodations')}
          >
            Accommodations
          </button>
          <button 
            className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h2 className="section-title">Trip Overview</h2>
            
            {/* Quick View Button */}
            <button className="quick-view-btn">👁 Quick View</button>

            {/* Itinerary Days */}
            {tripData.itinerary && tripData.itinerary.length > 0 && (
              <div className="trip-itinerary">
                {tripData.itinerary.map((day, index) => (
                  <div key={index} className={`day-card ${expandedDays[index] ? 'expanded' : ''}`}>
                    <div 
                      className="day-card-header"
                      onClick={() => toggleDay(index)}
                    >
                      <div className="day-header-left">
                        <span className="day-date">{day.date || `Day ${day.day}`}:</span>
                        <span className="day-title">{day.title}</span>
                      </div>
                      <div className="day-header-right">
                        {(() => {
                          const weather = getWeather(index);
                          return (
                            <span className="day-weather" title={weather.description}>
                              {weather.emoji} {weather.temperature}°C
                            </span>
                          );
                        })()}
                        <span className="expand-arrow">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    
                    {expandedDays[index] && (
                      <div className="day-card-content">
                        {/* Flight/Transportation */}
                        {day.transportation && (
                          <div className="activity-item">
                            <div className="activity-icon-badge">✈️</div>
                            <div className="activity-info">
                              <h4>Flight</h4>
                              <p className="activity-title">{day.transportation}</p>
                              {day.transportationDetails && (
                                <div className="activity-meta">
                                  <span>Estimated</span>
                                  <span>{day.transportationDetails}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Activities */}
                        {day.activities && day.activities.map((activity, idx) => (
                          <div key={idx} className="activity-item">
                            <div className="activity-icon-badge">📍</div>
                            <div className="activity-info">
                              <h4>{activity.type || 'Activity'}</h4>
                              {activity.place && typeof activity.place === 'object' ? (
                                /* Real place data with compact display */
                                <div className="activity-place-compact">
                                  {activity.place.images && activity.place.images.length > 0 && (
                                    <div className="activity-place-image">
                                      <img src={activity.place.images[0]} alt={activity.place.name} loading="lazy" />
                                      {activity.place.images.length > 1 && (
                                        <div className="activity-place-image-badge">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {activity.place.images.length}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="activity-place-details">
                                    <p className="activity-place-name">{activity.name || activity.place.name}</p>
                                    {activity.description && (
                                      <p style={{fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem'}}>
                                        {activity.description}
                                      </p>
                                    )}
                                    <div className="activity-place-meta">
                                      {activity.place.rating && (
                                        <span className="activity-place-rating">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                          </svg>
                                          {activity.place.rating.toFixed(1)}
                                        </span>
                                      )}
                                      {activity.duration && (
                                        <span>⏱️ {activity.duration}</span>
                                      )}
                                    </div>
                                    {activity.place.googleMapsUrl && (
                                      <a 
                                        href={activity.place.googleMapsUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="activity-place-link"
                                      >
                                        View on Maps
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Simple activity description */
                                <>
                                  <p className="activity-title">{activity.name}</p>
                                  {activity.description && (
                                    <p>{activity.description}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Accommodation */}
                        {day.accommodation && (
                          <div className="activity-item">
                            <div className="activity-icon-badge">🏨</div>
                            <div className="activity-info">
                              <h4>Accommodation</h4>
                              {typeof day.accommodation === 'object' && day.accommodation.name ? (
                                /* Real hotel data with compact display */
                                <div className="activity-place-compact">
                                  {day.accommodation.images && day.accommodation.images.length > 0 && (
                                    <div className="activity-place-image">
                                      <img src={day.accommodation.images[0]} alt={day.accommodation.name} loading="lazy" />
                                      {day.accommodation.images.length > 1 && (
                                        <div className="activity-place-image-badge">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {day.accommodation.images.length}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="activity-place-details">
                                    <p className="activity-place-name">{day.accommodation.name}</p>
                                    <div className="activity-place-meta">
                                      {day.accommodation.rating && (
                                        <span className="activity-place-rating">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                          </svg>
                                          {day.accommodation.rating.toFixed(1)}
                                        </span>
                                      )}
                                      {day.accommodation.address && (
                                        <span>📍 {day.accommodation.address.split(',')[0]}</span>
                                      )}
                                    </div>
                                    {day.accommodation.googleMapsUrl && (
                                      <a 
                                        href={day.accommodation.googleMapsUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="activity-place-link"
                                      >
                                        View on Google Maps
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Simple text description */
                                <p className="activity-title">{day.accommodation}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Dining */}
                        {day.dining && (
                          <div className="activity-item">
                            <div className="activity-icon-badge">🍽️</div>
                            <div className="activity-info">
                              <h4>Dining</h4>
                              {typeof day.dining === 'object' && day.dining.name ? (
                                /* Real restaurant data with compact display */
                                <div className="activity-place-compact">
                                  {day.dining.images && day.dining.images.length > 0 && (
                                    <div className="activity-place-image">
                                      <img src={day.dining.images[0]} alt={day.dining.name} loading="lazy" />
                                      {day.dining.images.length > 1 && (
                                        <div className="activity-place-image-badge">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {day.dining.images.length}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="activity-place-details">
                                    <p className="activity-place-name">{day.dining.name}</p>
                                    <div className="activity-place-meta">
                                      {day.dining.rating && (
                                        <span className="activity-place-rating">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                          </svg>
                                          {day.dining.rating.toFixed(1)}
                                        </span>
                                      )}
                                      {day.dining.address && (
                                        <span>📍 {day.dining.address.split(',')[0]}</span>
                                      )}
                                    </div>
                                    {day.dining.googleMapsUrl && (
                                      <a 
                                        href={day.dining.googleMapsUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="activity-place-link"
                                      >
                                        View on Maps
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Simple text description */
                                <p className="activity-title">{day.dining}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Expand All Button */}
            <button className="expand-all-btn">Expand All</button>
          </div>
        )}

        {activeTab === 'accommodations' && (
          <div className="tab-content">
            {/* Hotels Section */}
            <h2 className="section-title">🏨 Recommended Hotels in {tripData.destination}</h2>
            <p className="accommodations-subtitle">
              {hotels.length > 0 ? `${hotels.length} hotels found via Google Maps` : 'Loading hotel options...'}
            </p>
            
            {hotels.length > 0 ? (
              <div className="hotels-grid">
                {hotels.map((hotel, index) => (
                  <div key={hotel.id || index} className="hotel-card">
                    {hotel.images && hotel.images.length > 0 ? (
                      <div className="hotel-image">
                        <img src={hotel.images[0]} alt={hotel.name} loading="lazy" />
                        <div className="hotel-rating-badge">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{hotel.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="hotel-image hotel-image-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    <div className="hotel-info">
                      <h3 className="hotel-name">{hotel.name}</h3>
                      <p className="hotel-address">{hotel.address}</p>
                      <div className="hotel-actions">
                        <a 
                          href={hotel.googleMapsUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hotel-action-btn google-maps-btn-full"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>View on Google Maps</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-accommodations">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p>Loading hotels from Google Maps...</p>
              </div>
            )}

            {/* Restaurants Section */}
            <h2 className="section-title" style={{marginTop: '3rem'}}>🍽️ Recommended Restaurants in {tripData.destination}</h2>
            <p className="accommodations-subtitle">
              {restaurants.length > 0 ? `${restaurants.length} restaurants found via Google Maps` : 'Loading restaurant options...'}
            </p>
            
            {restaurants.length > 0 ? (
              <div className="hotels-grid">
                {restaurants.map((restaurant, index) => (
                  <div key={restaurant.id || index} className="hotel-card">
                    {restaurant.images && restaurant.images.length > 0 ? (
                      <div className="hotel-image">
                        <img src={restaurant.images[0]} alt={restaurant.name} loading="lazy" />
                        <div className="hotel-rating-badge">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{restaurant.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="hotel-image hotel-image-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2 2m0 0l2 2m-2-2v6m0 0l-2-2m2 2l2-2M3 12h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
                        </svg>
                      </div>
                    )}
                    <div className="hotel-info">
                      <h3 className="hotel-name">{restaurant.name}</h3>
                      <p className="hotel-address">{restaurant.address}</p>
                      <div className="hotel-actions">
                        <a 
                          href={restaurant.googleMapsUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hotel-action-btn google-maps-btn-full"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>View on Google Maps</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-accommodations">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2 2m0 0l2 2m-2-2v6m0 0l-2-2m2 2l2-2M3 12h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
                </svg>
                <p>Loading restaurants from Google Maps...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="tab-content">
            <h2>Comments</h2>
            <p>No comments yet.</p>
          </div>
        )}

      </div>

      {/* Footer with Price and Actions */}
      <div className="trip-panel-footer">
        <div className="trip-footer-info">
          <h3>{tripData.duration} {tripData.purpose || 'Solo'} {tripData.destination} Trip</h3>
          <div className="trip-footer-details">
            {priceEstimate ? (
              <>
                <div className="price-estimate">
                  <span className="price-label">Estimated Total</span>
                  <span className="price-amount">
                    {priceEstimate.currency}{priceEstimate.min.toLocaleString()} - {priceEstimate.currency}{priceEstimate.max.toLocaleString()}
                  </span>
                  {priceEstimate.travelers > 1 && (
                    <span className="price-per-person">
                      ({priceEstimate.currency}{Math.round(priceEstimate.min / priceEstimate.travelers).toLocaleString()} - {priceEstimate.currency}{Math.round(priceEstimate.max / priceEstimate.travelers).toLocaleString()} per person)
                    </span>
                  )}
                </div>
                <span>•</span>
                <div className="price-breakdown-trigger" title="View breakdown">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="price-breakdown-tooltip">
                    <div className="breakdown-header">Cost Breakdown</div>
                    <div className="breakdown-item">
                      <span>🏨 Accommodation</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.accommodation.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.accommodation.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>🍽️ Dining</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.dining.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.dining.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>🎭 Activities</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.activities.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.activities.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>🚇 Transportation</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.transportation.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.transportation.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-total">
                      <span>Total Range</span>
                      <span>{priceEstimate.currency}{priceEstimate.min.toLocaleString()} - {priceEstimate.currency}{priceEstimate.max.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-note">
                      *Budget to Comfort range estimates
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <span>Calculating price...</span>
            )}
            <span>•</span>
            <span>{tripData.dates}</span>
          </div>
        </div>
        <div className="trip-footer-actions">
          <button className="footer-btn secondary" onClick={handleDownloadPDF}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{width: '16px', height: '16px', marginRight: '6px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          <button className="footer-btn secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{width: '16px', height: '16px', marginRight: '6px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button className="footer-btn primary">
            Review & Book {priceEstimate ? `(${priceEstimate.currency}${priceEstimate.min.toLocaleString()}-${priceEstimate.max.toLocaleString()})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripPanel;

