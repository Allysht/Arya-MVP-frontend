import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import './Chat.css';
import Message from './Message';
import TravelCard from './TravelCard';
import TripPanel from './TripPanel';
import config from '../config';
import { useTranslations } from '../translations';
import { chatAPI, itineraryAPI, extractItinerarySummary, generateChatTitle } from '../services/chatService';

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
    en: 'Hey there! I\'m Arya, your AI travel companion. 🌍 Excited to help you plan your next adventure! What\'s on your mind? Whether it\'s a dream destination or just browsing ideas, I\'m here to make it happen. ✈️',
    ro: 'Salut! Sunt Arya, companion-ul tău de călătorie AI. 🌍 Super încântată să te ajut să îți planifici următoarea aventură! La ce te gândești? Fie că e o destinație de vis sau doar cauți idei, sunt aici să fac totul realitate. ✈️',
    es: '¡Hola! Soy Arya, tu compañera de viajes AI. 🌍 ¡Emocionada de ayudarte a planear tu próxima aventura! ¿Qué tienes en mente? Ya sea un destino soñado o solo ideas, estoy aquí para hacerlo realidad. ✈️',
    fr: 'Salut! Je suis Arya, votre compagnon de voyage IA. 🌍 Ravie de vous aider à planifier votre prochaine aventure! Qu\'avez-vous en tête? Destination de rêve ou juste des idées, je suis là pour réaliser tout ça. ✈️',
    de: 'Hey! Ich bin Arya, deine KI-Reisebegleiterin. 🌍 Begeistert, dir bei deinem nächsten Abenteuer zu helfen! Was hast du im Kopf? Traumziel oder nur Ideen sammeln, ich bin hier um es wahr zu machen. ✈️',
    it: 'Ciao! Sono Arya, la tua compagna di viaggio AI. 🌍 Entusiasta di aiutarti a pianificare la tua prossima avventura! Cosa hai in mente? Destinazione dei sogni o solo idee, sono qui per realizzarlo. ✈️',
    pt: 'Olá! Sou Arya, sua companheira de viagem IA. 🌍 Animada para te ajudar a planejar sua próxima aventura! O que você tem em mente? Destino dos sonhos ou apenas ideias, estou aqui para tornar realidade. ✈️',
    ja: 'こんにちは！Aryaです、あなたのAI旅行コンパニオン。🌍次の冒険を計画するのを手伝えることに興奮しています！何か考えていますか？夢の目的地でも、アイデアを探しているだけでも、実現するためにここにいます。✈️',
    zh: '嘿！我是Arya，你的AI旅行伙伴。🌍很高兴帮你计划下一次冒险！你在想什么？无论是梦想目的地还是只是浏览想法，我都在这里实现它。✈️',
    ar: 'مرحبا! أنا آريا، رفيقة سفرك بالذكاء الاصطناعي. 🌍 متحمسة لمساعدتك في التخطيط لمغامرتك القادمة! ما الذي تفكر فيه؟ سواء كانت وجهة أحلامك أو مجرد تصفح الأفكار، أنا هنا لتحقيقها. ✈️'
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

const Chat = ({ userPreferences, onChatCreated }) => {
  const t = useTranslations(userPreferences?.language || 'en');
  const { getToken } = useAuth();
  
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
  const [currentSlot, setCurrentSlot] = useState('destination'); // Track current slot being filled
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false); // Track confirmation state
  const [offeredSuggestions, setOfferedSuggestions] = useState(false); // Track if we offered suggestions
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSavingChat, setIsSavingChat] = useState(false);
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
    
    // Extract dates - handle date ranges across months
    if (!updated.dates) {
      // Pattern for "from X to Y" where months are different
      const rangePattern = /from\s+(\d{1,2})(?:st|nd|rd|th)?\s*(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|august|september|october|november|december)\s+to\s+(\d{1,2})(?:st|nd|rd|th)?\s*(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|august|september|october|november|december)/i;
      const rangeMatch = message.match(rangePattern);
      if (rangeMatch) {
        const startDay = rangeMatch[1];
        const startMonth = rangeMatch[2];
        const endDay = rangeMatch[3];
        const endMonth = rangeMatch[4];
        updated.dates = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      } else {
        // Single date pattern (with day number)
        const datePattern = /(\d{1,2})(?:st|nd|rd|th)?\s*(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|august|september|october|november|december)/i;
        const dateMatch = message.match(datePattern);
        if (dateMatch) {
          updated.dates = dateMatch[0];
        } else {
          // Month-only pattern (no specific day mentioned) - default to 1st
          const monthOnlyPattern = /\b(in|în|during|pentru)\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
          const monthOnlyMatch = message.match(monthOnlyPattern);
          if (monthOnlyMatch) {
            const month = monthOnlyMatch[2];
            // Default to 1st of the month
            updated.dates = `1 ${month}`;
            console.log(`📅 Month-only detected: "${month}" → Defaulting to 1st ${month}`);
          } else {
            // Try to detect standalone month mentions (e.g., "March", "martie")
            const standaloneMonthPattern = /\b(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
            const standaloneMatch = message.match(standaloneMonthPattern);
            if (standaloneMatch) {
              const month = standaloneMatch[1];
              updated.dates = `1 ${month}`;
              console.log(`📅 Standalone month detected: "${month}" → Defaulting to 1st ${month}`);
            }
          }
        }
      }
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

  // Create a new chat and save it
  const createNewChat = async (firstMessage) => {
    if (!getToken) return null;
    
    try {
      setIsSavingChat(true);
      
      // Generate smart title based on trip details
      const smartTitle = generateChatTitle(
        firstMessage,
        collectedInfo.destination,
        collectedInfo.duration
      );
      
      const result = await chatAPI.createChat(
        smartTitle,
        firstMessage,
        getToken
      );
      
      const chatId = result.chat._id;
      setCurrentChatId(chatId);
      console.log('✅ Created new chat:', chatId, 'Title:', smartTitle);
      
      // Notify parent component
      if (onChatCreated) {
        onChatCreated(chatId);
      }
      
      // Refresh sidebar
      if (window.refreshChatHistory) {
        setTimeout(() => window.refreshChatHistory(), 300);
      }
      
      return chatId;
    } catch (error) {
      console.error('Failed to create chat:', error);
      return null;
    } finally {
      setIsSavingChat(false);
    }
  };

  // Save messages to the current chat
  const saveMessagesToChat = async (userMsg, assistantMsg) => {
    if (!currentChatId || !getToken) return;

    try {
      // Save user message
      await chatAPI.addMessage(
        currentChatId,
        'user',
        userMsg,
        getToken
      );
      
      // Save assistant message
      await chatAPI.addMessage(
        currentChatId,
        'assistant',
        assistantMsg,
        getToken
      );
      
      console.log('✅ Saved messages to chat');
      
      // Refresh sidebar to update message count and preview
      if (window.refreshChatHistory) {
        setTimeout(() => window.refreshChatHistory(), 200);
      }
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  // Load an existing chat
  const loadChat = async (chatId) => {
    if (!getToken) return;
    
    try {
      setIsLoading(true);
      const result = await chatAPI.getChat(chatId, getToken);
      
      if (result.chat) {
        // Convert chat messages to component format
        const loadedMessages = result.chat.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(loadedMessages);
        setCurrentChatId(chatId);
        console.log('✅ Loaded chat:', chatId);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a brand new chat
  const startNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: getGreeting(userPreferences?.language || 'en'),
        timestamp: new Date()
      }
    ]);
    setCurrentChatId(null);
    setCurrentTrip(null);
    setShowTripPanel(false);
    setCollectedInfo({
      destination: null,
      origin: null,
      travelers: null,
      dates: null,
      duration: null,
      purpose: null
    });
    setCurrentSlot('destination'); // Reset to first slot
    setAwaitingConfirmation(false); // Reset confirmation state
    setOfferedSuggestions(false); // Reset suggestions state
  };

  // Expose functions to parent
  useEffect(() => {
    if (window.chatComponent) {
      window.chatComponent.loadChat = loadChat;
      window.chatComponent.startNewChat = startNewChat;
    } else {
      window.chatComponent = { loadChat, startNewChat };
    }
  }, []);

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
      console.log('📤 Sending message with preferences:', userPreferences);
      console.log('📤 Sending with collected info:', collectedInfo);
      
      // Get auth token
      const token = await getToken();
      
      console.log('🎯 Sending current slot:', currentSlot);
      console.log('⏳ Sending awaiting confirmation:', awaitingConfirmation);
      console.log('💡 Sending offered suggestions:', offeredSuggestions);
      
      const response = await axios.post(`${config.API_URL}/api/chat`, {
        message: textToSend,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        userPreferences: userPreferences || { language: 'en', currency: 'USD', temperatureUnit: 'C' },
        collectedInfo: collectedInfo,
        currentSlot: currentSlot,
        awaitingConfirmation: awaitingConfirmation,
        offeredSuggestions: offeredSuggestions
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const responseContent = response.data.message;
        
        // Update collectedInfo from backend response (LangGraph tracks state!)
        if (response.data.collectedInfo) {
          console.log('📥 Updating collected info from backend:', response.data.collectedInfo);
          setCollectedInfo(response.data.collectedInfo);
        }
        
        // Update slot tracking state from backend
        if (response.data.currentSlot) {
          console.log('🎯 Updating current slot from backend:', response.data.currentSlot);
          setCurrentSlot(response.data.currentSlot);
        }
        if (response.data.awaitingConfirmation !== undefined) {
          console.log('⏳ Updating awaiting confirmation from backend:', response.data.awaitingConfirmation);
          setAwaitingConfirmation(response.data.awaitingConfirmation);
        }
        if (response.data.offeredSuggestions !== undefined) {
          console.log('💡 Updating offered suggestions from backend:', response.data.offeredSuggestions);
          setOfferedSuggestions(response.data.offeredSuggestions);
        }
        
        // Check if itinerary was generated (new LangGraph format)
        console.log('🔍 Checking if itinerary was generated...');
        console.log('itineraryGenerated:', response.data.itineraryGenerated);
        console.log('itinerary:', response.data.itinerary);
        
        if (response.data.itineraryGenerated && response.data.itinerary) {
          console.log('✅ Itinerary generated! Displaying in Trip Panel...');
          
          // Add the AI's friendly message to chat with itinerary button
          const aiMessage = {
            role: 'assistant',
            content: responseContent, // The friendly message from backend
            timestamp: new Date(),
            hasItineraryButton: true // Show "View Full Itinerary" button
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // The itinerary is already complete - no need to generate again
          const fullItinerary = response.data.itinerary;
          console.log('📋 Full itinerary received:', fullItinerary);
          
          // Enrich with travel data if available
          const enrichedItinerary = response.data.travelData 
            ? enrichItineraryWithRealData(fullItinerary.itinerary, response.data.travelData)
            : fullItinerary.itinerary;
          
          const enrichedTrip = {
            ...fullItinerary,
            itinerary: enrichedItinerary
          };
          
          // Set the trip and show panel
          setCurrentTrip(enrichedTrip);
          setShowTripPanel(true);
          setIsGeneratingTrip(false);
          
          // Save to database
          try {
            const token = await getToken();
            
            // Ensure we have a chatId (create one if needed)
            let chatIdToUse = currentChatId;
            if (!chatIdToUse) {
              console.log('📝 No chat exists yet, creating one for the itinerary...');
              const destination = enrichedTrip.destination || collectedInfo.destination || 'Unknown';
              const tripMessage = `Trip to ${destination}`;
              const chatResult = await createNewChat(tripMessage);
              chatIdToUse = chatResult;
            }
            
            // Extract summary data
            const summary = extractItinerarySummary(enrichedTrip);
            
            const saveResult = await itineraryAPI.createItinerary({
              chatId: chatIdToUse,
              destination: enrichedTrip.destination || collectedInfo.destination || 'Unknown',
              startDate: enrichedTrip.dates?.split(' - ')[0] || collectedInfo.dates,
              endDate: enrichedTrip.dates?.split(' - ')[1],
              title: `Trip to ${enrichedTrip.destination || collectedInfo.destination || 'Unknown'}`,
              description: `${enrichedTrip.duration || collectedInfo.duration || ''} ${enrichedTrip.purpose || collectedInfo.purpose || 'trip'}`.trim(),
              itineraryData: enrichedTrip,
              summary: summary
            }, token);
            console.log('✅ Itinerary saved to database:', saveResult);
          } catch (saveError) {
            console.error('❌ Error saving itinerary:', saveError);
          }
          
          // Skip the old TRIP_READY flow
          return;
        }
        
        // Fallback: Check if response contains old TRIP_READY format
        console.log('🔍 Checking response for old TRIP_READY format...');
        
        if (responseContent.includes('TRIP_READY:') || responseContent.includes('TRIP_READY')) {
          console.log('✅ Old TRIP_READY format detected!');
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
          
          // Save to database: Create chat on first message, then save messages
          if (!currentChatId && messages.length === 1) {
            // First user message - create new chat
            const chatId = await createNewChat(textToSend);
            if (chatId) {
              // Save the assistant response
              await chatAPI.addMessage(chatId, 'assistant', responseContent, getToken);
            }
          } else if (currentChatId) {
            // Existing chat - save both messages
            await saveMessagesToChat(textToSend, responseContent);
          }
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
    // Note: Month-only dates (e.g., "March") are converted to "1 March" by extractInfoFromMessage
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
      // Handle weeks conversion: "2 săptămâni" = 14 days, "2 weeks" = 14 days
      let numDays = 5; // Default
      
      const weekPattern = /([\d]+)\s*(săptămân|săptămâni|week|weeks|semana|semanas)/i;
      const monthPattern = /([\d]+)\s*(lun|lună|luni|month|months|mes|meses)/i;
      const dayPattern = /([\d]+)\s*(day|days|zi|zile|zil|día|días)/i;
      
      const weekMatch = duration.match(weekPattern);
      if (weekMatch) {
        const weeks = parseInt(weekMatch[1]);
        numDays = Math.min(weeks * 7, 7); // Cap at 7 days (MVP limit)
        console.log(`📅 Converted ${weeks} weeks to ${numDays} days (MVP limit: 7 days max)`);
      } else {
        const monthMatch = duration.match(monthPattern);
        if (monthMatch) {
          const months = parseInt(monthMatch[1]);
          numDays = 7; // Cap at 7 days (MVP limit)
          console.log(`📅 Requested ${months} months, capped to ${numDays} days (MVP limit)`);
        } else {
          const dayMatch = duration.match(dayPattern);
          if (dayMatch) {
            numDays = Math.min(parseInt(dayMatch[1]), 7); // Cap at 7 days (MVP limit)
            console.log(`📅 Extracted ${numDays} days (MVP limit: 7 days max)`);
          } else {
            // Fallback: try to extract any number
            const numberMatch = duration.match(/(\d+)/);
            if (numberMatch) {
              const num = parseInt(numberMatch[1]);
              // If number is small (< 5), assume it's weeks
              if (num <= 4) {
                numDays = Math.min(num * 7, 7); // Cap at 7 days
                console.log(`📅 Assuming ${num} is weeks, capped to ${numDays} days (MVP limit)`);
              } else {
                numDays = Math.min(num, 7); // Cap at 7 days
                console.log(`📅 Capped to ${numDays} days (MVP limit: 7 days max)`);
              }
            }
          }
        }
      }
      
      // Smart optimization: adjust detail level based on trip length
      const isLongTrip = numDays >= 14; // 2+ weeks
      const isVeryLongTrip = numDays >= 21; // 3+ weeks
      
      const detailInstructions = isVeryLongTrip 
        ? `
🔹 FOR LONG TRIPS (${numDays} days), use CONCISE format to fit in token limit:
- Accommodation: Use format "Hotel Name" only (no long descriptions)
- Dining: Use format "Restaurant Name" only (no long descriptions)
- Activity descriptions: Keep under 50 characters each
- 2 activities per day (not 3-4)`
        : isLongTrip
        ? `
🔹 FOR MEDIUM TRIPS (${numDays} days), use BALANCED format:
- Accommodation: "Hotel Name: Brief description (max 50 chars)"
- Dining: "Restaurant Name: Brief description (max 50 chars)"
- Activity descriptions: Keep under 80 characters each
- 2-3 activities per day`
        : `
🔹 FOR SHORT TRIPS (${numDays} days), use DETAILED format:
- Accommodation: "Hotel Name: Detailed description"
- Dining: "Restaurant Name: Detailed description"
- Activity descriptions: Can be detailed
- 3-4 activities per day`;
      
      const prompt = `You are a JSON API that generates travel itineraries. You MUST respond with ONLY valid, parseable JSON. No explanations, no markdown, no extra text.
${detailInstructions}

REQUIRED OUTPUT FORMAT - COPY EXACTLY:
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
      "date": "specific date if known",
      "activities": [
        {
          "name": "Activity in ${userLanguage}",
          "description": "Brief description in ${userLanguage}",
          "duration": "2 hours",
          "time": "Morning"
        }
      ],
      "accommodation": "${isVeryLongTrip ? 'Hotel Name' : 'Hotel Name: Description'}",
      "dining": "${isVeryLongTrip ? 'Restaurant Name' : 'Restaurant Name: Description'}"
    }
  ],
  "tips": ["Tip 1 in ${userLanguage}", "Tip 2 in ${userLanguage}", "Tip 3 in ${userLanguage}"]
}

🚨 STRICT RULES:
1. Generate EXACTLY ${numDays} day objects in the itinerary array
2. Each day MUST have ALL fields: day, title, date, activities (array), accommodation, dining
3. Each activity MUST have: name, description, duration, time
4. ALL text MUST be in ${userLanguage}
5. The response MUST start with { and end with }
6. NO text before or after the JSON
7. NO markdown code blocks (no \`\`\`json)
8. NO comments in JSON
9. Ensure ALL brackets, braces, and quotes are properly closed
10. Use double quotes for strings, not single quotes
11. ${isVeryLongTrip ? 'KEEP DESCRIPTIONS SHORT - token limit!' : 'Provide good detail'}

VALIDATE before responding:
- Count your days: you must have ${numDays} objects in the itinerary array
- Check all brackets are closed: { }, [ ]
- Check all quotes are closed: " "
- Verify the JSON is parseable

Start your response with { and end with }`;

      console.log('📤 Sending itinerary generation request...');
      console.log('📦 Sending with tripInfo:', tripInfo);
      
      // Get auth token
      const token = await getToken();
      
      const response = await axios.post(`${config.API_URL}/api/chat`, {
        message: prompt,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        userPreferences: userPreferences || { language: 'en', currency: 'USD', temperatureUnit: 'C' },
        collectedInfo: tripInfo
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('📥 Got response:', response.data);

      if (response.data.success) {
        console.log('✅ Response successful, parsing...');
        
        // Check if response was validated by backend
        if (response.data.validated) {
          console.log('✅ Response was validated by backend validator');
        }
        
        // Check if data was prepared by Data Preparation Agent
        if (response.data.dataPrepared && response.data.preparedData) {
          console.log('🤖 Data was prepared by Data Preparation Agent:');
          console.log('  - Original duration:', duration);
          console.log('  - Corrected duration:', response.data.preparedData.duration);
          console.log('  - Duration in days:', response.data.preparedData.durationInDays);
        }
        
        // Check if fallback itinerary was used
        if (response.data.fallback) {
          console.log('🆘 Fallback itinerary was generated (validation failed but system recovered)');
        }
        
        try {
          // Try to parse JSON response
          const jsonMatch = response.data.message.match(/\{[\s\S]*\}/);
          console.log('🔍 JSON match found:', !!jsonMatch);
          if (!jsonMatch) {
            console.error('❌ No JSON found in response. AI said:', response.data.message);
            throw new Error('No valid JSON found in response');
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
            
            // Validate itinerary structure
            if (!itineraryData.itinerary || !Array.isArray(itineraryData.itinerary) || itineraryData.itinerary.length === 0) {
              throw new Error('Invalid itinerary: missing or empty itinerary array');
            }

            // Normalize itinerary days - ensure each day has a proper day number
            itineraryData.itinerary = itineraryData.itinerary.map((day, index) => {
              // Validate each day has required fields
              if (!day.activities || !Array.isArray(day.activities)) {
                console.warn(`⚠️ Day ${index + 1} missing activities array`);
                day.activities = [];
              }
              
              return {
                ...day,
                day: day.day || (index + 1), // Ensure sequential day numbers
                title: day.title || `Day ${index + 1}`, // Ensure title exists
                activities: day.activities,
                accommodation: day.accommodation || '',
                dining: day.dining || ''
              };
            });
            
            console.log(`✅ Itinerary validated and normalized: ${itineraryData.itinerary.length} days`);

            // Validate we have the expected number of days
            if (itineraryData.itinerary.length < numDays * 0.8) {
              console.warn(`⚠️ Generated ${itineraryData.itinerary.length} days but expected ${numDays}`);
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
            
            // Save itinerary to database
            try {
              // Ensure we have a chatId (create one if needed)
              let chatIdToUse = currentChatId;
              if (!chatIdToUse && getToken) {
                console.log('📝 No chat exists yet, creating one for the itinerary...');
                const tripMessage = `Trip to ${destination}`;
                const chatResult = await createNewChat(tripMessage);
                chatIdToUse = chatResult;
              }
              
              if (chatIdToUse && getToken) {
                const summary = extractItinerarySummary(itineraryData);
                await itineraryAPI.createItinerary(
                  {
                    chatId: chatIdToUse,
                    destination: destination,
                    startDate: dates?.split(' - ')[0],
                    endDate: dates?.split(' - ')[1],
                    title: `Trip to ${destination}`,
                    description: `${duration} ${purpose} trip`,
                    itineraryData: itineraryData,
                    summary: summary
                  },
                  getToken
                );
                console.log('✅ Saved itinerary to database');
              } else {
                console.warn('⚠️ Cannot save itinerary: no chatId available');
              }
            } catch (error) {
              console.error('Failed to save itinerary:', error);
            }
          }
        } catch (e) {
          console.error('❌ Failed to parse itinerary JSON:', e);
          console.error('❌ Malformed response:', response.data.message);
          
          // Show error message to user
          const errorMessage = {
            role: 'assistant',
            content: '❌ Sorry, I encountered an error generating your itinerary. The response format was invalid. Please try again.',
            timestamp: new Date(),
            isError: true
          };
          setMessages(prev => [...prev, errorMessage]);
          
          // DO NOT show trip panel with empty data
          // User can retry the request
        }
      } else {
        // Handle validation failure from backend
        console.error('❌ Response unsuccessful:', response.data);
        
        let errorContent = '❌ Sorry, I encountered an error generating your itinerary.';
        
        if (response.data.validationErrors && response.data.validationErrors.length > 0) {
          console.error('Validation errors:', response.data.validationErrors);
          errorContent += ' The AI response had formatting issues. Please try again.';
        } else if (response.data.error) {
          errorContent += ` ${response.data.error}`;
        } else {
          errorContent += ' Please try again.';
        }
        
        const errorMessage = {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
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

      {/* Chat Box - Main Chat Area */}
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

