import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Chat.css';
import Message from './Message';
import TravelCard from './TravelCard';
import TripPanel from './TripPanel';
import config from '../config';
import { useTranslations } from '../translations';

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

const getGreeting = (langCode) => {
  const greetings = {
    en: 'Hi! I\'m Arya, your travel agent. Where would you like to go? ✈️',
    ro: 'Bună! Sunt Arya, agentul tău de turism. Unde ai dori să călătorești? ✈️',
    es: '¡Hola! Soy Arya, tu agente de viajes. ¿A dónde te gustaría ir? ✈️',
    fr: 'Salut ! Je suis Arya, votre agent de voyage. Où aimeriez-vous aller ? ✈️',
    de: 'Hallo! Ich bin Arya, dein Reiseberater. Wohin möchtest du reisen? ✈️',
    it: 'Ciao! Sono Arya, il tuo agente di viaggio. Dove vorresti andare? ✈️',
    pt: 'Olá! Sou Arya, seu agente de viagens. Para onde gostaria de ir? ✈️',
    ja: 'こんにちは！私はアリヤ、あなたの旅行エージェントです。どこに行きたいですか？✈️',
    zh: '你好！我是Arya，你的旅行顾问。你想去哪里？✈️',
    ar: 'مرحبا! أنا آريا، وكيل السفر الخاص بك. أين تريد أن تذهب؟ ✈️'
  };
  return greetings[langCode] || greetings.en;
};

const getConfirmationMessage = (langCode, duration, destination) => {
  const messages = {
    en: `Perfect! I've got all the details. Let me create your ${duration} trip to ${destination}! 🎉`,
    ro: `Perfect! Am toate detaliile. Îți creez călătoria de ${duration} spre ${destination}! 🎉`,
    es: `¡Perfecto! Tengo todos los detalles. ¡Déjame crear tu viaje de ${duration} a ${destination}! 🎉`,
    fr: `Parfait ! J'ai tous les détails. Laissez-moi créer votre voyage de ${duration} à ${destination} ! 🎉`,
    de: `Perfekt! Ich habe alle Details. Lass mich deine ${duration} Reise nach ${destination} erstellen! 🎉`,
    it: `Perfetto! Ho tutti i dettagli. Lasciami creare il tuo viaggio di ${duration} a ${destination}! 🎉`,
    pt: `Perfeito! Tenho todos os detalhes. Deixe-me criar sua viagem de ${duration} para ${destination}! 🎉`,
    ja: `完璧です！すべての詳細が揃いました。${destination}への${duration}の旅行を作成します！🎉`,
    zh: `完美！我已经掌握了所有细节。让我为您创建${duration}的${destination}之旅！🎉`,
    ar: `مثالي! لديّ كل التفاصيل. دعني أُنشئ رحلتك لمدة ${duration} إلى ${destination}! 🎉`
  };
  return messages[langCode] || messages.en;
};

const getItineraryReadyMessage = (langCode) => {
  const messages = {
    en: '✨ Your personalized itinerary is ready!',
    ro: '✨ Itinerariul tău personalizat este gata!',
    es: '✨ ¡Tu itinerario personalizado está listo!',
    fr: '✨ Votre itinéraire personnalisé est prêt !',
    de: '✨ Deine personalisierte Reiseroute ist fertig!',
    it: '✨ Il tuo itinerario personalizzato è pronto!',
    pt: '✨ Seu itinerário personalizado está pronto!',
    ja: '✨ あなたのパーソナライズされた旅程が完成しました！',
    zh: '✨ 您的个性化行程已准备好！',
    ar: '✨ خط سير رحلتك الشخصي جاهز!'
  };
  return messages[langCode] || messages.en;
};

const Chat = ({ userPreferences }) => {
  const t = useTranslations(userPreferences?.language || 'en');
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getGreeting(userPreferences?.language || 'en'),
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [travelData, setTravelData] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [showTripPanel, setShowTripPanel] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false); // Changed to false, preferences popup shows first
  const [collectedInfo, setCollectedInfo] = useState({
    destination: null,
    origin: null,
    travelers: null,
    dates: null,
    duration: null,
    purpose: null
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const lastMessageTimestamp = useRef(null);

  // Update greeting when language preference changes
  useEffect(() => {
    if (userPreferences?.language) {
      setMessages([{
        role: 'assistant',
        content: getGreeting(userPreferences.language),
        timestamp: new Date()
      }]);
    }
  }, [userPreferences?.language]);

  // Debug: Log when currentTrip or showTripPanel changes
  useEffect(() => {
    console.log('🔍 currentTrip state:', currentTrip);
    console.log('🔍 showTripPanel state:', showTripPanel);
  }, [currentTrip, showTripPanel]);

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

  // Extract travel info from user message and update collectedInfo
  const extractInfoFromMessage = (message) => {
    const lower = message.toLowerCase();
    const updated = { ...collectedInfo };
    
    // Extract destination - look for common patterns
    if (!updated.destination) {
      // Pattern 1: "to [place]" or "in [place]" or "în [place]"
      const destPattern = /(?:to|in|în)\s+([A-Z][a-zăâîșț]+(?:\s+[A-Z][a-zăâîșț]+)*)/i;
      const destMatch = message.match(destPattern);
      if (destMatch) {
        updated.destination = destMatch[1].trim();
      }
      
      // Pattern 2: Common city names (as fallback)
      const cities = [
        'stockholm', 'paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona', 
        'amsterdam', 'berlin', 'vienna', 'prague', 'budapest', 'göteborg', 
        'gothenburg', 'copenhagen', 'copenhaga', 'madrid', 'lisbon', 'athens',
        'dublin', 'edinburgh', 'brussels', 'zürich', 'oslo', 'helsinki', 'abuja',
        'nigeria', 'lagos', 'cairo', 'nairobi', 'johannesburg', 'cape town',
        'marrakech', 'casablanca', 'tunis', 'algiers', 'accra', 'dakar'
      ];
      const foundCity = cities.find(city => lower.includes(city));
      if (foundCity && !updated.destination) {
        updated.destination = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
        if (foundCity === 'copenhaga') updated.destination = 'Copenhagen';
        if (foundCity === 'göteborg') updated.destination = 'Gothenburg';
      }
    }
    
    // Extract origin (look for "from [city]" or "din [city]")
    const originMatch = lower.match(/(?:from|din)\s+([a-z\s]+?)(?:\s|$|,)/i);
    if (originMatch && !updated.origin) {
      updated.origin = originMatch[1].trim();
    }
    
    // Extract travelers
    if (!updated.travelers) {
      if (lower.includes('partner') || lower.includes('partenera') || lower.includes('partenerul') ||
          lower.includes('wife') || lower.includes('husband') || lower.includes('soția') || 
          lower.includes('soțul') || lower.includes('girlfriend') || lower.includes('boyfriend')) {
        updated.travelers = '2 people (couple)';
      } else if (lower.includes('solo') || lower.includes('singur') || lower.includes('alone')) {
        updated.travelers = '1 person (solo)';
      } else if (lower.includes('family') || lower.includes('familia')) {
        updated.travelers = 'family';
      }
    }
    
    // Extract dates
    const datePattern = /(\d{1,2})\s*(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|august|september|october|november|december)/i;
    const dateMatch = message.match(datePattern);
    if (dateMatch && !updated.dates) {
      updated.dates = dateMatch[0];
    }
    
    // Extract duration
    const durationPattern = /(\d+)\s*(day|days|zile|zi)/i;
    const durationMatch = message.match(durationPattern);
    if (durationMatch && !updated.duration) {
      updated.duration = `${durationMatch[1]} days`;
    }
    
    // Extract purpose
    if (!updated.purpose) {
      if (lower.includes('cultur') || lower.includes('museum')) {
        updated.purpose = 'culture';
      } else if (lower.includes('food') || lower.includes('gastronomie') || lower.includes('restaurant')) {
        updated.purpose = 'gastronomy';
      } else if (lower.includes('explor')) {
        updated.purpose = 'exploring';
      } else if (lower.includes('aventur')) {
        updated.purpose = 'adventure';
      }
    }
    
    return updated;
  };

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim();
    
    if (!textToSend || isLoading) return;

    // Extract info from this message
    const updatedInfo = extractInfoFromMessage(textToSend);
    setCollectedInfo(updatedInfo);
    console.log('📋 Collected info so far:', updatedInfo);

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
      console.log('📤 Sending message with preferences:', userPreferences);
      console.log('📤 Sending with collected info:', updatedInfo);
      const response = await axios.post(`${config.API_URL}/api/chat`, {
        message: textToSend,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        userPreferences: userPreferences || { language: 'en', currency: 'USD', temperatureUnit: 'C' },
        collectedInfo: updatedInfo
      });

      if (response.data.success) {
        const responseContent = response.data.message;
        
        // Extract destination from AI response if it mentions a city
        if (!collectedInfo.destination && !responseContent.includes('TRIP_READY')) {
          const cityMentionPattern = /(?:în|in|to|deci, în)\s+([A-Z][a-zăâîșț]+(?:\s*,?\s*[A-Z][a-zăâîșț]+)*)/;
          const cityMatch = responseContent.match(cityMentionPattern);
          if (cityMatch) {
            const extractedDest = cityMatch[1].trim();
            // Update collectedInfo with extracted destination
            setCollectedInfo(prev => ({ ...prev, destination: extractedDest }));
            console.log('✅ Extracted destination from AI response:', extractedDest);
          }
        }
        
        // Check if response contains TRIP_READY
        console.log('🔍 Checking response for TRIP_READY...');
        console.log('Response content:', responseContent);
        
        if (responseContent.includes('TRIP_READY:') || responseContent.includes('TRIP_READY')) {
          console.log('✅ TRIP_READY detected!');
          // Parse trip data
          let tripInfo = parseTripReady(responseContent);
          console.log('📋 Parsed trip info:', tripInfo);
          
          // Smart fallback: If parsing failed, extract from conversation history
          if (!tripInfo.destination || !tripInfo.duration || !tripInfo.travelers) {
            console.log('⚠️ Incomplete trip data, extracting from conversation...');
            const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
            
            // Use collectedInfo first, then fallback to conversation extraction
            if (!tripInfo.destination && collectedInfo.destination) {
              tripInfo.destination = collectedInfo.destination;
            }
            if (!tripInfo.origin && collectedInfo.origin) {
              tripInfo.origin = collectedInfo.origin;
            }
            if (!tripInfo.travelers && collectedInfo.travelers) {
              tripInfo.travelers = collectedInfo.travelers;
            }
            if (!tripInfo.dates && collectedInfo.dates) {
              tripInfo.dates = collectedInfo.dates;
            }
            if (!tripInfo.duration && collectedInfo.duration) {
              tripInfo.duration = collectedInfo.duration;
            }
            if (!tripInfo.purpose && collectedInfo.purpose) {
              tripInfo.purpose = collectedInfo.purpose;
            }
            
            // Extract destination (common city names) as final fallback
            const cities = ['stockholm', 'paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona', 'amsterdam', 'berlin', 'vienna', 'prague', 'budapest', 'göteborg', 'gothenburg', 'copenhagen', 'copenhaga'];
            const foundCity = cities.find(city => conversationText.includes(city));
            if (foundCity && !tripInfo.destination) {
              tripInfo.destination = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
              if (foundCity === 'copenhaga') tripInfo.destination = 'Copenhagen';
              if (foundCity === 'stockholm') tripInfo.destination = 'Stockholm';
            }
            
            // Extract duration (look for numbers followed by day/days/zile/zi)
            const durationMatch = conversationText.match(/(\d+)\s*(day|days|zile|zi|zil)/i);
            if (durationMatch && !tripInfo.duration) {
              tripInfo.duration = `${durationMatch[1]} days`;
            }
            
            // Extract travelers if not found
            if (!tripInfo.travelers) {
              if (conversationText.includes('partner') || conversationText.includes('partenera') || 
                  conversationText.includes('partenerul') || conversationText.includes('wife') || 
                  conversationText.includes('husband') || conversationText.includes('girlfriend') || 
                  conversationText.includes('boyfriend')) {
                tripInfo.travelers = '2 people (couple)';
              } else if (conversationText.includes('solo') || conversationText.includes('singur') || conversationText.includes('alone')) {
                tripInfo.travelers = '1 person (solo)';
              }
            }
            
            console.log('📋 Enhanced trip info:', tripInfo);
          }
          
          // Validate required fields
          const destination = tripInfo.destination || 'your destination';
          const duration = tripInfo.duration || 'amazing';
          
          // Only show confirmation if we have valid data
          if (destination !== 'your destination' && duration !== 'amazing') {
            const langCode = userPreferences?.language || 'en';
            const confirmMessage = {
              role: 'assistant',
              content: getConfirmationMessage(langCode, duration, destination),
              timestamp: new Date()
            };
            setMessages(prev => [...prev, confirmMessage]);
          } else {
            console.warn('⚠️ Missing trip data - destination or duration undefined');
          }
          
          // Generate full itinerary
          console.log('🚀 Calling generateFullItinerary with:', tripInfo);
          await generateFullItinerary(tripInfo);
          console.log('✅ generateFullItinerary completed');
          
          // Add a permanent button in chat to view itinerary
          const langCode = userPreferences?.language || 'en';
          const itineraryButtonMessage = {
            role: 'assistant',
            content: getItineraryReadyMessage(langCode),
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
    console.log('🔍 Parsing TRIP_READY from content:', content);
    const lines = content.split('\n');
    const tripData = {};
    
    lines.forEach(line => {
      if (line.includes(':') && !line.includes('TRIP_READY')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim(); // Handle cases where value contains ':'
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove special chars
        
        if (cleanKey && value) {
          tripData[cleanKey] = value;
          console.log(`✅ Parsed field: ${cleanKey} = ${value}`);
        }
      }
    });
    
    console.log('📋 Final parsed tripData:', tripData);
    return tripData;
  };

  const calculateDateRange = (dates, duration) => {
    // If dates already contain a range (e.g., "December 12-24"), return as is
    if (dates && (dates.includes('-') || dates.includes('to') || dates.includes('till'))) {
      return dates;
    }
    
    // If we have a start date and duration, calculate end date
    if (dates && duration) {
      try {
        // Extract number of days from duration
        const daysMatch = duration.match(/(\d+)/);
        if (!daysMatch) return dates;
        
        const numDays = parseInt(daysMatch[1]);
        
        // Try to parse the start date
        const datePatterns = [
          /(\d{1,2})\s*(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i,
          /(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)/i,
          /(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s*(\d{1,2})/i,
          /(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})/i
        ];
        
        for (const pattern of datePatterns) {
          const match = dates.match(pattern);
          if (match) {
            const day = parseInt(match[1]) || parseInt(match[2]);
            const endDay = day + numDays;
            return `${dates} - ${endDay}`;
          }
        }
      } catch (e) {
        console.log('Could not calculate date range:', e);
      }
    }
    
    return dates;
  };

  const generateFullItinerary = async (tripInfo) => {
    console.log('🔧 generateFullItinerary called with:', tripInfo);
    setIsGeneratingTrip(true);
    
    try {
      // Ensure all required fields have values
      const destination = tripInfo.destination || 'the destination';
      const origin = tripInfo.origin || 'your location';
      const duration = tripInfo.duration || '5 days';
      const travelers = tripInfo.travelers || '1 person';
      const purpose = tripInfo.purpose || 'leisure';
      let dates = tripInfo.dates || 'flexible dates';
      
      // Calculate date range if needed
      dates = calculateDateRange(dates, duration);
      
      // Get language names for instructions
      const languageNames = {
        'en': 'English',
        'ro': 'Romanian',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ar': 'Arabic'
      };
      const userLanguage = languageNames[userPreferences?.language] || 'English';
      
      // Extract number of days from duration
      const daysMatch = duration.match(/(\d+)/);
      const numDays = daysMatch ? parseInt(daysMatch[1]) : 5;
      
      const prompt = `You MUST respond with ONLY valid JSON. No other text before or after.

Create a complete ${numDays}-day itinerary for ${destination}.
From: ${origin}
Travelers: ${travelers}
Purpose: ${purpose}
Dates: ${dates}

CRITICAL: Generate exactly ${numDays} days of itinerary. Do NOT skip any days!

IMPORTANT: The user speaks ${userLanguage}. Generate ALL content (day titles, activity names, descriptions, accommodation names, dining suggestions, and tips) in ${userLanguage}.

OUTPUT ONLY THIS JSON (copy the format exactly):
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
      "title": "Day 1 title in ${userLanguage}",
      "activities": [
        {"name": "Activity in ${userLanguage}", "description": "What to do in ${userLanguage}"}
      ],
      "accommodation": "Hotel suggestion in ${userLanguage}",
      "dining": "Restaurant suggestion in ${userLanguage}"
    },
    {
      "day": 2,
      "title": "Day 2 title in ${userLanguage}",
      "activities": [
        {"name": "Activity in ${userLanguage}", "description": "What to do in ${userLanguage}"}
      ],
      "accommodation": "Hotel suggestion in ${userLanguage}",
      "dining": "Restaurant suggestion in ${userLanguage}"
    }
    ... continue for ALL ${numDays} days
  ],
  "tips": ["Tip 1 in ${userLanguage}", "Tip 2 in ${userLanguage}", "Tip 3 in ${userLanguage}"]
}

🚨 ABSOLUTE REQUIREMENTS:
- Output ONLY valid JSON
- Generate EXACTLY ${numDays} complete day objects in the itinerary array
- Each day MUST have: day number, title, activities array, accommodation, dining
- ALL text content MUST be in ${userLanguage}
- Day titles like "Arrival Day" should be translated to ${userLanguage}
- No explanations, no markdown, just pure JSON starting with { and ending with }.`;

      console.log('📤 Sending itinerary generation request...');
      const response = await axios.post(`${config.API_URL}/api/chat`, {
        message: prompt,
        conversationHistory: [],
        userPreferences: userPreferences || { language: 'en', currency: 'USD', temperatureUnit: 'C' }
      });
      console.log('📥 Got response:', response.data);

      if (response.data.success) {
        console.log('✅ Response successful, parsing...');
        try {
          // Try to parse JSON response
          const jsonMatch = response.data.message.match(/\{[\s\S]*\}/);
          console.log('🔍 JSON match found:', !!jsonMatch);
          if (!jsonMatch) {
            console.error('❌ No JSON found in response. AI said:', response.data.message);
          }
          if (jsonMatch) {
            console.log('📝 Parsing JSON...');
            const itineraryData = JSON.parse(jsonMatch[0]);
            console.log('✅ Parsed itinerary data:', itineraryData);
            
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
            
            console.log('🎯 Setting currentTrip:', itineraryData);
            console.log('🎯 Setting showTripPanel to true');
            setCurrentTrip(itineraryData);
            setShowTripPanel(true); // Show Trip Panel when itinerary is created
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
          console.log('🎯 Setting currentTrip:', tripData);
          console.log('🎯 Setting showTripPanel to true');
          setCurrentTrip(tripData);
          setShowTripPanel(true); // Auto-show on mobile when trip is created
        }
      } else {
        console.error('❌ Response unsuccessful:', response.data);
      }
    } catch (error) {
      console.error('❌ Error generating itinerary:', error);
      console.error('Error details:', error.message, error.stack);
    } finally {
      console.log('🏁 generateFullItinerary finished');
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
                    <strong>Natural Conversation:</strong> Chat with Arya like you would with a real travel agent - she'll ask questions to understand your needs
                  </li>
                  <li>
                    <strong>Multiple Languages:</strong> Speak in any language you're comfortable with - Arya will respond in your language
                  </li>
                  <li>
                    <strong>Share Your Preferences:</strong> Tell Arya about your travel style, interests, and any special requirements
                  </li>
                  <li>
                    <strong>Get Your Itinerary:</strong> Once Arya has all the details, she'll ask if you're ready to create your personalized trip
                  </li>
                </ul>
              </div>
              
              <div className="popup-example">
                <strong>Example:</strong> "I'm thinking about visiting Japan in spring with my family. We love food and culture!"
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
          <span>{t.newChat}</span>
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
              placeholder={t.messagePlaceholder}
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
            <span>{t.feedbackText} </span>
            <a href="#feedback">{t.feedback}</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Inspirational or Trip Details */}
      <div className="trip-panel-container">
        {isGeneratingTrip ? (
          <div className="trip-panel loading">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t.loading}</p>
            </div>
          </div>
        ) : currentTrip ? (
          <>
            {console.log('🎨 Rendering TripPanel with tripData:', currentTrip)}
            {console.log('🎨 showTripPanel:', showTripPanel)}
            <TripPanel 
              tripData={currentTrip} 
              onClose={() => {
                // Don't clear currentTrip - keep it so user can reopen
                setShowTripPanel(false);
              }}
              showTripPanel={showTripPanel}
              setShowTripPanel={setShowTripPanel}
              userPreferences={userPreferences}
            />
          </>
        ) : (
          <div className="inspirational-panel">
            <div className="inspirational-header">
              <h2 className="inspirational-title">✨ {t.startJourney}</h2>
              <p className="inspirational-subtitle">{t.startJourneySubtitle}</p>
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
                <h4>{t.planItinerary}</h4>
                <p>{t.planItineraryDesc}</p>
              </div>
              <div className="action-card">
                <div className="action-icon">✈️</div>
                <h4>{t.findFlights}</h4>
                <p>{t.findFlightsDesc}</p>
              </div>
              <div className="action-card">
                <div className="action-icon">🏨</div>
                <h4>{t.bookHotels}</h4>
                <p>{t.bookHotelsDesc}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

