import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TripPanel.css';
import pdfGenerator from '../utils/pdfGenerator';
import config from '../config';
import { useTranslations } from '../translations';

const TripPanel = ({ tripData, onClose, showTripPanel, setShowTripPanel, userPreferences }) => {
  const t = useTranslations(userPreferences?.language || 'en');
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
  const [hotelBookingLinks, setHotelBookingLinks] = useState({});
  const [restaurantBookingLinks, setRestaurantBookingLinks] = useState({});
  const [loadingBookingLinks, setLoadingBookingLinks] = useState({});

  // Currency conversion helper
  const convertCurrency = (amount, fromCurrency = 'EUR') => {
    const rates = {
      'EUR': { 'USD': 1.1, 'GBP': 0.86, 'JPY': 161.5, 'CAD': 1.49, 'AUD': 1.67, 'CHF': 0.97, 'CNY': 7.84, 'INR': 91.5, 'BRL': 5.43 },
      'USD': { 'EUR': 0.91, 'GBP': 0.78, 'JPY': 146.8, 'CAD': 1.35, 'AUD': 1.52, 'CHF': 0.88, 'CNY': 7.13, 'INR': 83.2, 'BRL': 4.94 },
      'GBP': { 'EUR': 1.16, 'USD': 1.28, 'JPY': 188.0, 'CAD': 1.73, 'AUD': 1.95, 'CHF': 1.13, 'CNY': 9.13, 'INR': 106.5, 'BRL': 6.32 },
      'JPY': { 'EUR': 0.0062, 'USD': 0.0068, 'GBP': 0.0053, 'CAD': 0.0092, 'AUD': 0.0104, 'CHF': 0.006, 'CNY': 0.0485, 'INR': 0.567, 'BRL': 0.0336 }
    };
    
    const userCurrency = userPreferences?.currency || 'EUR';
    if (fromCurrency === userCurrency) return amount;
    
    const rate = rates[fromCurrency]?.[userCurrency] || 1;
    return Math.round(amount * rate);
  };
  
  // Get currency symbol
  const getCurrencySymbol = () => {
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹',
      'BRL': 'R$'
    };
    return symbols[userPreferences?.currency || 'EUR'] || '€';
  };
  
  // Temperature conversion helper
  const convertTemperature = (celsius) => {
    if (userPreferences?.temperature === 'fahrenheit') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  };
  
  // Get temperature unit
  const getTemperatureUnit = () => {
    return userPreferences?.temperature === 'fahrenheit' ? '°F' : '°C';
  };

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
          
          // Extract departure date from tripData
          let departureDate = null;
          
          // Try to get date from itinerary first day
          if (tripData.itinerary && tripData.itinerary.length > 0 && tripData.itinerary[0].date) {
            departureDate = tripData.itinerary[0].date;
          } else if (tripData.dates) {
            // Parse date from dates string (e.g., "5 December - 15 December" or "5 Decembrie - 15")
            const dateStr = tripData.dates;
            
            // Try various date parsing strategies
            // Strategy 1: Look for ISO format date (YYYY-MM-DD)
            const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
            if (isoMatch) {
              departureDate = isoMatch[1];
            } else {
              // Strategy 2: Parse natural language dates
              // Extract first date-like pattern (day + month name)
              const monthNames = {
                'january': 0, 'ianuarie': 0,
                'february': 1, 'februarie': 1,
                'march': 2, 'martie': 2,
                'april': 3, 'aprilie': 3,
                'may': 4, 'mai': 4,
                'june': 5, 'iunie': 5,
                'july': 6, 'iulie': 6,
                'august': 7, 'august': 7,
                'september': 8, 'septembrie': 8,
                'october': 9, 'octombrie': 9,
                'november': 10, 'noiembrie': 10,
                'december': 11, 'decembrie': 11
              };
              
              // Match patterns like "5 December" or "5 Decembrie"
              const dateMatch = dateStr.match(/(\d{1,2})\s+([a-zA-Z]+)/i);
              if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                const monthStr = dateMatch[2].toLowerCase();
                const month = monthNames[monthStr];
                
                if (month !== undefined) {
                  const year = new Date().getFullYear();
                  const date = new Date(year, month, day);
                  
                  // If the date is in the past, assume next year
                  if (date < new Date()) {
                    date.setFullYear(year + 1);
                  }
                  
                  departureDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                }
              }
            }
          }
          
          // If still no date, use 7 days from now as default
          if (!departureDate) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            departureDate = futureDate.toISOString().split('T')[0];
          }
          
          console.log('📅 Using departure date:', departureDate);
          
          const response = await axios.post(`${config.API_URL}/api/flights/search-url`, {
            origin: tripData.origin,
            destination: tripData.destination,
            departureDate: departureDate,
            adults: parseInt(tripData.travelers) || 1,
            cabinClass: 'economy',
            language: userPreferences?.language || 'en'
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
  }, [tripData?.origin, tripData?.destination, tripData?.dates, tripData?.travelers, tripData?.itinerary, userPreferences?.language]);

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
        min: convertCurrency(Math.round(totalMin)),
        max: convertCurrency(Math.round(totalMax)),
        breakdownMin: {
          accommodation: convertCurrency(breakdownMin.accommodation),
          dining: convertCurrency(breakdownMin.dining),
          activities: convertCurrency(breakdownMin.activities),
          transportation: convertCurrency(breakdownMin.transportation)
        },
        breakdownMax: {
          accommodation: convertCurrency(breakdownMax.accommodation),
          dining: convertCurrency(breakdownMax.dining),
          activities: convertCurrency(breakdownMax.activities),
          transportation: convertCurrency(breakdownMax.transportation)
        },
        currency: getCurrencySymbol(),
        travelers: parseInt(tripData.travelers?.match(/\d+/)?.[0]) || 1
      });
    };

    calculatePrice();
  }, [tripData, hotels, restaurants, userPreferences?.currency]);

  const toggleDay = (dayNum) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  // Fetch booking link for a hotel
  const fetchHotelBookingLink = async (hotelName, location) => {
    const cacheKey = `${hotelName}-${location}`;
    
    // Check if already loaded or loading
    if (hotelBookingLinks[cacheKey] || loadingBookingLinks[cacheKey]) {
      return;
    }

    setLoadingBookingLinks(prev => ({ ...prev, [cacheKey]: true }));

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
      // Set a fallback Booking.com search URL
      setHotelBookingLinks(prev => ({
        ...prev,
        [cacheKey]: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${hotelName} ${location}`)}`
      }));
    } finally {
      setLoadingBookingLinks(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  // Fetch booking link for a restaurant
  const fetchRestaurantBookingLink = async (restaurantName, location) => {
    const cacheKey = `${restaurantName}-${location}`;
    
    // Check if already loaded or loading
    if (restaurantBookingLinks[cacheKey] || loadingBookingLinks[cacheKey]) {
      return;
    }

    setLoadingBookingLinks(prev => ({ ...prev, [cacheKey]: true }));

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
      // Set a fallback TripAdvisor search URL
      setRestaurantBookingLinks(prev => ({
        ...prev,
        [cacheKey]: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${restaurantName} ${location}`)}`
      }));
    } finally {
      setLoadingBookingLinks(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  // Helper to get booking link for hotel
  const getHotelBookingLink = (hotelName) => {
    if (!tripData?.destination) return null;
    const cacheKey = `${hotelName}-${tripData.destination}`;
    return hotelBookingLinks[cacheKey];
  };

  // Helper to get booking link for restaurant
  const getRestaurantBookingLink = (restaurantName) => {
    if (!tripData?.destination) return null;
    const cacheKey = `${restaurantName}-${tripData.destination}`;
    return restaurantBookingLinks[cacheKey];
  };

  // Check if loading booking link
  const isLoadingBookingLink = (name) => {
    if (!tripData?.destination) return false;
    const cacheKey = `${name}-${tripData.destination}`;
    return loadingBookingLinks[cacheKey];
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
          <button className="action-icon-btn" title="Coming soon" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="action-icon-btn" title="Coming soon" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button className="review-book-btn">{t.reviewAndBook}</button>
        </div>
      </div>

      <div className="trip-panel-content">
        {/* Image Gallery */}
        <div className="trip-gallery">
          <div className="gallery-main">
            {destinationImages.length > 0 ? (
              <>
                {destinationImages[selectedImageIndex]?.url ? (
                  <img 
                    src={destinationImages[selectedImageIndex].url} 
                    alt={destinationImages[selectedImageIndex]?.description || tripData.destination}
                    loading="lazy"
                  />
                ) : (
                  <div className="gallery-placeholder">
                    <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
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
              <div className="gallery-placeholder">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
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
                  {image.urlThumb ? (
                    <img src={image.urlThumb} alt={`${tripData.destination} view ${idx + 1}`} loading="lazy" />
                  ) : (
                    <div className="gallery-thumb-placeholder">
                      <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
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
                <h3>{t.flightRoute}</h3>
                <div className="flight-route-details">
                  <div className="flight-endpoint">
                    <span className="endpoint-city">{flightRouting.origin.city}</span>
                    {flightRouting.origin.hasAirport ? (
                      <span className="endpoint-airport">
                        ✓ {flightRouting.origin.airportName}
                        {flightRouting.origin.airportCode && ` (${flightRouting.origin.airportCode})`}
                      </span>
                    ) : (
                      <span className="endpoint-airport warning">
                        ⚠ {t.noDirectAirport} {flightRouting.origin.nearestAirport}
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
                        ✓ {flightRouting.destination.airportName}
                        {flightRouting.destination.airportCode && ` (${flightRouting.destination.airportCode})`}
                      </span>
                    ) : (
                      <span className="endpoint-airport warning">
                        ⚠ {t.noDirectAirport} {flightRouting.destination.nearestAirport}
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
                <span>{t.searchFlights}</span>
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
            {t.tripOverview}
          </button>
          <button 
            className={`tab ${activeTab === 'accommodations' ? 'active' : ''}`}
            onClick={() => setActiveTab('accommodations')}
          >
            {t.accommodations}
          </button>
          <button 
            className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            {t.comments}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h2 className="section-title">{t.tripOverview}</h2>
            
            {/* Quick View Button */}
            <button className="quick-view-btn">👁 {t.quickView}</button>

            {/* Itinerary Days Counter */}
            {tripData.itinerary && tripData.itinerary.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9375rem',
                fontWeight: '500',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                <span>{tripData.itinerary.length} {tripData.itinerary.length === 1 ? 'Day' : 'Days'} Itinerary</span>
              </div>
            )}

            {/* Itinerary Days - Displaying all days */}
            {tripData.itinerary && tripData.itinerary.length > 0 && (
              <div className="trip-itinerary">
                {tripData.itinerary.map((day, index) => (
                  <div key={`day-${day.day || index}`} className={`day-card ${expandedDays[index] ? 'expanded' : ''}`}>
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
                              {weather.emoji} {convertTemperature(weather.temperature)}{getTemperatureUnit()}
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
                              <h4>{t.flight}</h4>
                              <p className="activity-title">{day.transportation}</p>
                              {day.transportationDetails && (
                                <div className="activity-meta">
                                  <span>{t.estimated}</span>
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
                              <h4>{activity.type || t.activity}</h4>
                              {activity.place && typeof activity.place === 'object' ? (
                                /* Real place data with compact display */
                                <div className="activity-place-compact">
                                  {activity.place.images && activity.place.images.length > 0 ? (
                                    <div className="activity-place-image">
                                      {activity.place.images[0] ? (
                                        <img src={activity.place.images[0]} alt={activity.place.name} loading="lazy" />
                                      ) : (
                                        <div className="activity-placeholder">
                                          <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                        </div>
                                      )}
                                      {activity.place.images.length > 1 && (
                                        <div className="activity-place-image-badge">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {activity.place.images.length}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="activity-place-image">
                                      <div className="activity-placeholder">
                                        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                      </div>
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
                                        {t.viewOnMap}
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
                              <h4>{t.accommodation}</h4>
                              {typeof day.accommodation === 'object' && day.accommodation.name ? (
                                /* Real hotel data with compact display */
                                <div className="activity-place-compact">
                                  {day.accommodation.images && day.accommodation.images.length > 0 ? (
                                    <div className="activity-place-image">
                                      {day.accommodation.images[0] ? (
                                        <img src={day.accommodation.images[0]} alt={day.accommodation.name} loading="lazy" />
                                      ) : (
                                        <div className="activity-placeholder">
                                          <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                          </svg>
                                        </div>
                                      )}
                                      {day.accommodation.images.length > 1 && (
                                        <div className="activity-place-image-badge">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {day.accommodation.images.length}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="activity-place-image">
                                      <div className="activity-placeholder">
                                        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                      </div>
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
                                                        {t.viewOnMap}
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                      </a>
                                                    )}
                                                    {/* Booking.com button for accommodation */}
                                                    <a 
                                                      href={getHotelBookingLink(day.accommodation.name) || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${day.accommodation.name} ${tripData.destination}`)}`}
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="activity-place-link booking-link"
                                                      onMouseEnter={() => fetchHotelBookingLink(day.accommodation.name, tripData.destination)}
                                                    >
                                                      {t.bookOnBooking}
                                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                      </svg>
                                                    </a>
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
                              <h4>{t.dining}</h4>
                              {typeof day.dining === 'object' && day.dining.name ? (
                                /* Real restaurant data with compact display */
                                <div className="activity-place-compact">
                                  {day.dining.images && day.dining.images.length > 0 ? (
                                    <div className="activity-place-image">
                                      {day.dining.images[0] ? (
                                        <img src={day.dining.images[0]} alt={day.dining.name} loading="lazy" />
                                      ) : (
                                        <div className="activity-placeholder">
                                          <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path d="M12 2l2 4 4 .67L16 9l.67 4L12 11l-4.67 2L9 9 7 6.67 11 6z" />
                                            <circle cx="12" cy="16" r="1" />
                                          </svg>
                                        </div>
                                      )}
                                      {day.dining.images.length > 1 && (
                                        <div className="activity-place-image-badge">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {day.dining.images.length}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="activity-place-image">
                                      <div className="activity-placeholder">
                                        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                          <path d="M12 2l2 4 4 .67L16 9l.67 4L12 11l-4.67 2L9 9 7 6.67 11 6z" />
                                          <circle cx="12" cy="16" r="1" />
                                        </svg>
                                      </div>
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
                                                        {t.viewOnMap}
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                      </a>
                                                    )}
                                                    {/* Restaurant reservation button */}
                                                    <a 
                                                      href={getRestaurantBookingLink(day.dining.name) || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${day.dining.name} ${tripData.destination}`)}`}
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="activity-place-link restaurant-link"
                                                      onMouseEnter={() => fetchRestaurantBookingLink(day.dining.name, tripData.destination)}
                                                    >
                                                      {t.bookRestaurant}
                                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                      </svg>
                                                    </a>
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
            <button className="expand-all-btn">{t.expandAll}</button>
          </div>
        )}

        {activeTab === 'accommodations' && (
          <div className="tab-content">
            {/* Hotels Section */}
            <h2 className="section-title">🏨 {t.recommendedHotels} {tripData.destination}</h2>
            <p className="accommodations-subtitle">
              {hotels.length > 0 ? `${hotels.length} ${t.hotelsFound}` : t.loadingHotelOptions}
            </p>
            
            {hotels.length > 0 ? (
              <div className="hotels-grid">
                {hotels.map((hotel, index) => (
                  <div key={hotel.id || index} className="hotel-card" onMouseEnter={() => fetchHotelBookingLink(hotel.name, tripData.destination)}>
                    {hotel.images && hotel.images.length > 0 && hotel.images[0] ? (
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
                      <div className="accommodation-placeholder">
                        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                          <span>{t.viewOnMap}</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        {/* Booking.com Button */}
                        <a 
                          href={getHotelBookingLink(hotel.name) || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${hotel.name} ${tripData.destination}`)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hotel-action-btn booking-btn"
                          onClick={() => !getHotelBookingLink(hotel.name) && fetchHotelBookingLink(hotel.name, tripData.destination)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="booking-icon">
                            <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 2v8h3a4 4 0 100-8H6zm2 2h1a2 2 0 110 4H8v-4zm8-2v8h2v-3h1l2 3h2.5l-2.5-3.5A2.5 2.5 0 0018 8h-4zm2 2h2a.5.5 0 010 1h-2v-1z"/>
                          </svg>
                          <span>{isLoadingBookingLink(hotel.name) ? t.loadingBooking : t.bookOnBooking}</span>
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
                <p>{t.loadingHotels}</p>
              </div>
            )}

            {/* Restaurants Section */}
            <h2 className="section-title" style={{marginTop: '3rem'}}>🍽️ {t.recommendedRestaurants} {tripData.destination}</h2>
            <p className="accommodations-subtitle">
              {restaurants.length > 0 ? `${restaurants.length} ${t.restaurantsFound}` : t.loadingRestaurantOptions}
            </p>
            
            {restaurants.length > 0 ? (
              <div className="hotels-grid">
                {restaurants.map((restaurant, index) => (
                  <div key={restaurant.id || index} className="hotel-card" onMouseEnter={() => fetchRestaurantBookingLink(restaurant.name, tripData.destination)}>
                    {restaurant.images && restaurant.images.length > 0 && restaurant.images[0] ? (
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
                      <div className="accommodation-placeholder">
                        <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M12 2l2 4 4 .67L16 9l.67 4L12 11l-4.67 2L9 9 7 6.67 11 6z" />
                          <circle cx="12" cy="16" r="1" />
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
                          <span>{t.viewOnMap}</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        {/* Restaurant Reservation Button */}
                        <a 
                          href={getRestaurantBookingLink(restaurant.name) || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${restaurant.name} ${tripData.destination}`)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hotel-action-btn restaurant-booking-btn"
                          onClick={() => !getRestaurantBookingLink(restaurant.name) && fetchRestaurantBookingLink(restaurant.name, tripData.destination)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{isLoadingBookingLink(restaurant.name) ? t.loadingBooking : t.bookRestaurant}</span>
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
                <p>{t.loadingRestaurants}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="tab-content">
            <h2>{t.comments}</h2>
            <p>{t.noCommentsYet}</p>
          </div>
        )}

      </div>

      {/* Footer with Price and Actions */}
      <div className="trip-panel-footer">
        <div className="trip-footer-info">
          <h3>{tripData.duration} {tripData.purpose || 'Solo'} {tripData.destination} {t.trip}</h3>
          <div className="trip-footer-details">
            {priceEstimate ? (
              <>
                <div className="price-estimate">
                  <span className="price-label">{t.estimatedTotal}</span>
                  <span className="price-amount">
                    {priceEstimate.currency}{priceEstimate.min.toLocaleString()} - {priceEstimate.currency}{priceEstimate.max.toLocaleString()}
                  </span>
                  {priceEstimate.travelers > 1 && (
                    <span className="price-per-person">
                      ({priceEstimate.currency}{Math.round(priceEstimate.min / priceEstimate.travelers).toLocaleString()} - {priceEstimate.currency}{Math.round(priceEstimate.max / priceEstimate.travelers).toLocaleString()} {t.perPerson})
                    </span>
                  )}
                </div>
                <span>•</span>
                <div className="price-breakdown-trigger" title="View breakdown">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="price-breakdown-tooltip">
                    <div className="breakdown-header">{t.costBreakdown}</div>
                    <div className="breakdown-item">
                      <span>🏨 {t.accommodations}</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.accommodation.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.accommodation.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>🍽️ {t.dining}</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.dining.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.dining.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>🎭 {t.activities}</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.activities.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.activities.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>🚇 {t.transportation}</span>
                      <span>{priceEstimate.currency}{priceEstimate.breakdownMin.transportation.toLocaleString()} - {priceEstimate.currency}{priceEstimate.breakdownMax.transportation.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-total">
                      <span>{t.totalRange}</span>
                      <span>{priceEstimate.currency}{priceEstimate.min.toLocaleString()} - {priceEstimate.currency}{priceEstimate.max.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-note">
                      {t.budgetToComfort}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <span>{t.calculatingPrice}</span>
            )}
            <span>•</span>
            <span>{tripData.dates}</span>
          </div>
        </div>
        <div className="trip-footer-actions">
          <button className="footer-btn secondary" disabled title="Coming soon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{width: '16px', height: '16px', marginRight: '6px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t.downloadPDF}
          </button>
          <button className="footer-btn secondary" disabled title="Coming soon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{width: '16px', height: '16px', marginRight: '6px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t.share}
          </button>
          <button className="footer-btn primary">
            {t.reviewAndBook} {priceEstimate ? `(${priceEstimate.currency}${priceEstimate.min.toLocaleString()}-${priceEstimate.max.toLocaleString()})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripPanel;

