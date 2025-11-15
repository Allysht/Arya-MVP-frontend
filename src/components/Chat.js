import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Chat.css';
import Message from './Message';
import TravelCard from './TravelCard';
import TripPanel from './TripPanel';
import config from '../config';

/**
 * Enrich itinerary with real hotel and restaurant data
 */
const enrichItineraryWithRealData = (itinerary, travelData) => {
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
    return itinerary;
  }

  const hotels = travelData.hotels || [];
  const restaurants = travelData.restaurants || [];

  if (hotels.length === 0 && restaurants.length === 0) {
    return itinerary;
  }

  // Create enriched copy of itinerary
  const enriched = itinerary.map((day, index) => {
    const enrichedDay = { ...day };

    // Add a real hotel to accommodation if we have hotels
    // Use first hotel for all days, or cycle through if multiple
    if (hotels.length > 0 && !enrichedDay.accommodation?.name) {
      const hotel = hotels[index % hotels.length];
      enrichedDay.accommodation = {
        name: hotel.name,
        rating: hotel.rating,
        address: hotel.address,
        images: hotel.images || [],
        googleMapsUrl: hotel.googleMapsUrl,
        place_id: hotel.place_id
      };
    }

    // Add a real restaurant to dining if we have restaurants
    // Cycle through restaurants for variety
    if (restaurants.length > 0 && !enrichedDay.dining?.name) {
      const restaurant = restaurants[index % restaurants.length];
      enrichedDay.dining = {
        name: restaurant.name,
        rating: restaurant.rating,
        address: restaurant.address,
        images: restaurant.images || [],
        googleMapsUrl: restaurant.googleMapsUrl,
        place_id: restaurant.place_id
      };
    }

    return enrichedDay;
  });

  return enriched;
};

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hey there, Arya here! Excited to help you with anything travel related.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [travelData, setTravelData] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [showTripPanel, setShowTripPanel] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const lastMessageTimestamp = useRef(null);

  const scrollToLastMessage = useCallback(() => {
    setTimeout(() => {
      // Scroll to the invisible anchor at the start of the last message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        const anchor = document.getElementById(`message-${lastMessage.timestamp}`);
        if (anchor) {
          const messagesArea = anchor.closest('.messages-area');
          if (messagesArea) {
            // Get the actual position relative to the scrollable container
            const messageElement = anchor.parentElement;
            if (messageElement) {
              const containerRect = messagesArea.getBoundingClientRect();
              const messageRect = messageElement.getBoundingClientRect();
              const scrollTop = messagesArea.scrollTop;
              const relativeTop = messageRect.top - containerRect.top + scrollTop;
              
              messagesArea.scrollTo({
                top: relativeTop - 20, // 20px padding from top
                behavior: 'smooth'
              });
            }
          }
        }
        // Mark this message as scrolled to
        lastMessageTimestamp.current = lastMessage.timestamp;
      }
    }, 150); // Slightly longer delay to ensure DOM is ready
  }, [messages]);

  // Auto-resize textarea as user types
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = newHeight + 'px';
      
      // Add scrollbar only if content exceeds max height
      if (textareaRef.current.scrollHeight > 150) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  useEffect(() => {
    // Only scroll if this is a new message we haven't scrolled to yet
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessageTimestamp.current !== lastMessage.timestamp) {
        scrollToLastMessage();
      }
    }
  }, [messages, scrollToLastMessage]);


  const quickSuggestions = [
    'Plan a trip to Paris',
    'Create a Bali itinerary',
    'Trip to Italy',
    'Japan vacation'
  ];

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim();
    
    if (!textToSend || isLoading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Reset textarea height and overflow
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
    
    setIsLoading(true);

    try {
      const response = await axios.post(`${config.API_URL}/api/chat`, {
        message: textToSend,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      if (response.data.success) {
        const responseContent = response.data.message;
        
        // Check if response contains TRIP_READY
        if (responseContent.includes('TRIP_READY:')) {
          // Parse trip data
          const tripInfo = parseTripReady(responseContent);
          console.log('📋 Parsed trip info:', tripInfo);
          
          // Validate required fields
          const destination = tripInfo.destination || tripInfo.location || 'your destination';
          const duration = tripInfo.duration || tripInfo.days || 'amazing';
          
          // Only show confirmation if we have valid data
          if (destination !== 'your destination' && duration !== 'amazing') {
            const confirmMessage = {
              role: 'assistant',
              content: `Perfect! I've got all the details. Let me create your ${duration} trip to ${destination}! 🎉`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, confirmMessage]);
          } else {
            console.warn('⚠️ Missing trip data - destination or duration undefined');
          }
          
          // Generate full itinerary
          await generateFullItinerary(tripInfo);
          
          // Add a permanent button in chat to view itinerary
          const itineraryButtonMessage = {
            role: 'assistant',
            content: '✨ Your personalized itinerary is ready!',
            hasItineraryButton: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, itineraryButtonMessage]);
        } else {
          // Regular message
          const assistantMessage = {
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }

        // Update travel data if available
        if (response.data.travelData) {
          setTravelData(response.data.travelData);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseTripReady = (content) => {
    const lines = content.split('\n');
    const tripData = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim(); // Handle cases where value contains ':'
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove special chars
        
        if (cleanKey && value && !value.includes('TRIP_READY')) {
          tripData[cleanKey] = value;
        }
      }
    });
    
    return tripData;
  };

  const generateFullItinerary = async (tripInfo) => {
    setIsGeneratingTrip(true);
    
    try {
      // Ensure all required fields have values
      const destination = tripInfo.destination || 'the destination';
      const origin = tripInfo.origin || 'your location';
      const duration = tripInfo.duration || '5 days';
      const travelers = tripInfo.travelers || '1 person';
      const purpose = tripInfo.purpose || 'leisure';
      const dates = tripInfo.dates || 'flexible dates';
      
      const prompt = `Create a detailed ${duration} itinerary for ${destination}.
Traveling from: ${origin}
Travelers: ${travelers}
Focus: ${purpose}
Dates: ${dates}

Provide a day-by-day breakdown with specific activities, restaurants, and accommodations.
Format it as JSON with this structure:
{
  "destination": "${destination}",
  "origin": "${origin}",
  "duration": "${duration}",
  "travelers": "${travelers}",
  "purpose": "${purpose}",
  "dates": "${dates}",
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival & First Impressions",
      "activities": [
        {"name": "Activity Name", "description": "Description"}
      ],
      "accommodation": "Hotel name and details",
      "dining": "Restaurant recommendations"
    }
  ],
  "tips": ["tip 1", "tip 2"]
}`;

      const response = await axios.post(`${config.API_URL}/api/chat`, {
        message: prompt,
        conversationHistory: []
      });

      if (response.data.success) {
        try {
          // Try to parse JSON response
          const jsonMatch = response.data.message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const itineraryData = JSON.parse(jsonMatch[0]);
            
            // Ensure all required fields exist in the parsed data
            itineraryData.destination = itineraryData.destination || destination;
            itineraryData.origin = itineraryData.origin || origin;
            itineraryData.duration = itineraryData.duration || duration;
            itineraryData.travelers = itineraryData.travelers || travelers;
            itineraryData.purpose = itineraryData.purpose || purpose;
            itineraryData.dates = itineraryData.dates || dates;
            
            // Normalize itinerary days - ensure each day has a proper day number
            if (itineraryData.itinerary && Array.isArray(itineraryData.itinerary)) {
              itineraryData.itinerary = itineraryData.itinerary.map((day, index) => ({
                ...day,
                day: day.day || (index + 1), // Ensure sequential day numbers
                title: day.title || `Day ${index + 1}` // Ensure title exists
              }));
              console.log(`✅ Itinerary normalized: ${itineraryData.itinerary.length} days`);
            } else {
              console.warn('⚠️ No itinerary found in AI response');
            }
            
            // Include hotels and restaurants from travelData if available
            if (response.data.travelData) {
              if (response.data.travelData.hotels) {
                itineraryData.hotels = response.data.travelData.hotels;
              }
              if (response.data.travelData.restaurants) {
                itineraryData.restaurants = response.data.travelData.restaurants;
              }
              
              // Inject real hotel and restaurant data into itinerary days
              itineraryData.itinerary = enrichItineraryWithRealData(
                itineraryData.itinerary, 
                response.data.travelData
              );
            }
            
            setCurrentTrip(itineraryData);
          }
        } catch (e) {
          console.error('Failed to parse itinerary JSON:', e);
          // If JSON parsing fails, create a basic structure with validated fields
          const tripData = {
            destination: destination,
            origin: origin,
            duration: duration,
            travelers: travelers,
            purpose: purpose,
            dates: dates,
            itinerary: [],
            tips: []
          };
          // Include hotels and restaurants from travelData if available
          if (response.data.travelData) {
            if (response.data.travelData.hotels) {
              tripData.hotels = response.data.travelData.hotels;
            }
            if (response.data.travelData.restaurants) {
              tripData.restaurants = response.data.travelData.restaurants;
            }
          }
          setCurrentTrip(tripData);
          setShowTripPanel(true); // Auto-show on mobile when trip is created
        }
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  return (
    <div className="chat-main-container">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="popup-overlay" onClick={() => setShowWelcomePopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setShowWelcomePopup(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="popup-header">
              <h2>🚀 Welcome to ARYA MVP</h2>
              <span className="popup-badge">Testing Phase</span>
            </div>
            
            <div className="popup-body">
              <div className="popup-section">
                <h3>⚠️ MVP Notice</h3>
                <p>This is an early version with some limitations. You may encounter minor issues as some fallback features are currently disabled for testing purposes.</p>
              </div>
              
              <div className="popup-section">
                <h3>💡 How to Use ARYA</h3>
                <ul className="help-list">
                  <li>
                    <strong>Provide Details:</strong> Share your destination, dates, number of travelers, and purpose
                  </li>
                  <li>
                    <strong>Get a Full Itinerary:</strong> Explicitly ask "create a trip" or "create an itinerary" after sharing your details
                  </li>
                  <li>
                    <strong>Be Specific:</strong> The more information you provide, the better your personalized itinerary will be
                  </li>
                </ul>
              </div>
              
              <div className="popup-example">
                <strong>Example:</strong> "I want to visit Paris from December 1st to 5th with my family. Create a trip for me."
              </div>
            </div>
            
            <button className="popup-btn" onClick={() => setShowWelcomePopup(false)}>
              Got it, let's start!
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="chat-sidebar">
        <button className="new-chat-btn">
          <span>New Chat</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </button>
      </div>


      {/* Chat Box - Middle Column */}
      <div className="chat-box">
        {/* Messages Area */}
        <div className="messages-area">
          {messages.map((message, index) => (
            <Message 
              key={index} 
              message={message} 
              onViewItinerary={() => setShowTripPanel(true)}
            />
          ))}
          
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          {/* Input */}
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="message-input"
              placeholder="Ask me anything about travel..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="input-footer">
            <span>We'd love any suggestions. Click to give </span>
            <a href="#feedback">feedback</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Inspirational or Trip Details */}
      <div className="trip-panel-container">
        {isGeneratingTrip ? (
          <div className="trip-panel loading">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Creating your perfect itinerary...</p>
            </div>
          </div>
        ) : currentTrip ? (
          <TripPanel 
            tripData={currentTrip} 
            onClose={() => {
              // Don't clear currentTrip - keep it so user can reopen
              setShowTripPanel(false);
            }}
            showTripPanel={showTripPanel}
            setShowTripPanel={setShowTripPanel}
          />
        ) : (
          <div className="inspirational-panel">
            <div className="inspirational-header">
              <h2 className="inspirational-title">✨ Start Your Journey</h2>
              <p className="inspirational-subtitle">Let me help you plan your perfect trip</p>
            </div>
            
            <div className="destination-cards">
              <div className="destination-card">
                <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop" alt="Paris" />
                <div className="destination-info">
                  <h3>Paris</h3>
                  <p>City of Light</p>
                </div>
              </div>
              <div className="destination-card">
                <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop" alt="Santorini" />
                <div className="destination-info">
                  <h3>Santorini</h3>
                  <p>Greek Islands</p>
                </div>
              </div>
              <div className="destination-card">
                <img src="https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&h=300&fit=crop" alt="Bali" />
                <div className="destination-info">
                  <h3>Bali</h3>
                  <p>Tropical Paradise</p>
                </div>
              </div>
              <div className="destination-card">
                <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop" alt="Tokyo" />
                <div className="destination-info">
                  <h3>Tokyo</h3>
                  <p>Modern Meets Traditional</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <div className="action-card">
                <div className="action-icon">🗺️</div>
                <h4>Plan Itinerary</h4>
                <p>Get day-by-day plans</p>
              </div>
              <div className="action-card">
                <div className="action-icon">✈️</div>
                <h4>Find Flights</h4>
                <p>Best deals & routes</p>
              </div>
              <div className="action-card">
                <div className="action-icon">🏨</div>
                <h4>Book Hotels</h4>
                <p>Perfect accommodations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

